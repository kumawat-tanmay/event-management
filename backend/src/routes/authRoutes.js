const express = require('express');
const router = express.Router();
const { 
  loginUser, 
  getMe, 
  googleAuth, 
  forgotPassword, 
  resetPassword 
} = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const { 
  loginLimiter, 
  googleAuthLimiter, 
  forgotPasswordLimiter, 
  resetPasswordLimiter, 
  generalAuthLimiter 
} = require('../middlewares/rateLimiter');
const validate = require('../middlewares/validate');
const { loginSchema, googleAuthSchema, forgotPasswordSchema, resetPasswordSchema } = require('../validators/authValidator');

// General rate limiter for all auth routes
router.use(generalAuthLimiter);

// Specific rate limiters for individual auth actions
router.post('/login', loginLimiter, validate(loginSchema), loginUser);
router.post('/google', googleAuthLimiter, validate(googleAuthSchema), googleAuth);
router.post('/forgotpassword', forgotPasswordLimiter, validate(forgotPasswordSchema), forgotPassword);
router.put('/resetpassword/:resettoken', resetPasswordLimiter, validate(resetPasswordSchema), resetPassword);
router.get('/me', protect, getMe);

module.exports = router;
