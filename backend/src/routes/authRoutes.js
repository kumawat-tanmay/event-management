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

// General rate limiter for all auth routes
router.use(generalAuthLimiter);

// Specific rate limiters for individual auth actions
router.post('/login', loginLimiter, loginUser);
router.post('/google', googleAuthLimiter, googleAuth);
router.post('/forgotpassword', forgotPasswordLimiter, forgotPassword);
router.put('/resetpassword/:resettoken', resetPasswordLimiter, resetPassword);
router.get('/me', protect, getMe);

module.exports = router;
