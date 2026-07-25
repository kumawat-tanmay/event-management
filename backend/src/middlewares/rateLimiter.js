const rateLimit = require('express-rate-limit');

/**
 * ⚡ Auth Rate Limiting Middleware
 * Scoped specifically to Krishna Event ERP Auth Controller endpoints (Invite-Only System).
 */
const createLimiter = (max, messageStr) => rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max, // Limit each user / IP to 'max' requests per window
  skipSuccessfulRequests: true, // Only count failed attempts (like wrong password)
  keyGenerator: (req) => {
    // Identify client IP
    const clientIp = req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown-ip';
    // Scope rate limit per user + IP combo if email or user ID exists
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const userId = req.user?._id ? String(req.user._id) : '';
    const identifier = email || userId;
    return identifier ? `${clientIp}_${identifier}` : clientIp;
  },
  message: {
    success: false,
    statusCode: 429,
    message: messageStr,
    data: null
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
});

// Specific limiters matching Krishna ERP Auth routes
const loginLimiter = createLimiter(5, 'Too many login attempts, please try again after 15 minutes');
const googleAuthLimiter = createLimiter(10, 'Too many Google authentication attempts, please try again after 15 minutes');
const forgotPasswordLimiter = createLimiter(5, 'Too many forgot password requests, please try again after 15 minutes');
const resetPasswordLimiter = createLimiter(5, 'Too many password reset attempts, please try again after 15 minutes');
const generalAuthLimiter = createLimiter(20, 'Too many authentication requests, please try again after 15 minutes');

module.exports = {
  createLimiter,
  loginLimiter,
  googleAuthLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  generalAuthLimiter,
};
