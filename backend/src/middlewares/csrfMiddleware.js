const crypto = require('crypto');

/**
 * 🔒 CSRF Protection Middleware
 * Cookie-secret + request-header validation matching reference pattern.
 */
const csrfTokenHandler = (req, res, next) => {
  let secret = req.cookies?.['csrf-secret'];
  if (!secret) {
    secret = crypto.randomBytes(32).toString('hex');
    res.cookie('csrf-secret', secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });
  }
  next();
};

const verifyCsrfToken = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const headerToken = req.headers['x-csrf-token'] || req.headers['csrf-token'] || req.headers['x-xsrf-token'];
  const stateToken = req.cookies?.['csrf-secret'];

  if (process.env.NODE_ENV === 'production' && (!headerToken || !stateToken || headerToken !== stateToken)) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or missing CSRF token',
    });
  }

  next();
};

const generateToken = (res) => {
  const token = crypto.randomBytes(32).toString('hex');
  res.cookie('csrf-secret', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000
  });
  return token;
};

module.exports = {
  csrfTokenHandler,
  verifyCsrfToken,
  csrfSynchronisedProtection: verifyCsrfToken,
  generateToken,
  getTokenFromRequest: (req) => req.headers['x-csrf-token'] || req.headers['csrf-token'],
  getTokenFromState: (req) => req.cookies?.['csrf-secret'],
};
