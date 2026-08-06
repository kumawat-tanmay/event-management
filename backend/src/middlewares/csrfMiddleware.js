const crypto = require('crypto');

/**
 * 🔒 Single Unified CSRF Cookie Generator
 * Generates and sets a 30-day HTTP-only 'csrf-secret' cookie on response, returning the secret.
 */
const generateAndSetCsrfCookie = (res) => {
  const secret = crypto.randomBytes(32).toString('hex');
  res.cookie('csrf-secret', secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });
  return secret;
};


/**
 * Helper to clear CSRF cookie on logout
 */
const clearCsrfCookie = (res) => {
  res.clearCookie('csrf-secret', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
};

/**
 * Express Middleware to verify x-csrf-token header against csrf-secret cookie
 */
const verifyCsrfToken = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const headerToken = req.headers['x-csrf-token'] || req.headers['csrf-token'] || req.headers['x-xsrf-token'];
  const stateToken = req.cookies?.['csrf-secret'];

  // Enforce CSRF token matching when in production OR when csrf header is provided
  if (process.env.NODE_ENV === 'production' || (headerToken && stateToken)) {
    if (!headerToken || !stateToken || headerToken !== stateToken) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or missing CSRF token',
      });
    }
  }

  next();
};

module.exports = {
  generateAndSetCsrfCookie,
  verifyCsrfToken,
  clearCsrfCookie
};
