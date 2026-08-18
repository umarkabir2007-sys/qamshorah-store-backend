const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware, refreshTokenMiddleware } = require('../middleware/auth');
const { validateRegister, validateLogin, validatePasswordReset } = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimit');

// ============================================
// PUBLIC ROUTES (With rate limiting for security)
// ============================================

// Register a new user
router.post('/register', authLimiter, validateRegister, authController.register);

// Login user
router.post('/login', authLimiter, validateLogin, authController.login);

// Logout user
router.post('/logout', authController.logout);

// Forgot password - Request reset link
router.post('/forgot-password', authLimiter, authController.forgotPassword);

// Reset password - With token
router.post('/reset-password/:token', authLimiter, validatePasswordReset, authController.resetPassword);

// Verify email
router.get('/verify-email/:token', authController.verifyEmail);

// Refresh token
router.post('/refresh-token', refreshTokenMiddleware, authController.refreshToken);

// ============================================
// PROTECTED ROUTES (Require authentication)
// ============================================

// Get current user profile
router.get('/me', authMiddleware, authController.getCurrentUser);

// Update current user profile
router.put('/me', authMiddleware, authController.updateProfile);

// Change password
router.put('/change-password', authMiddleware, authController.changePassword);

// Request email verification
router.post('/send-verification', authMiddleware, authController.sendVerificationEmail);

// Check if email exists
router.post('/check-email', authLimiter, authController.checkEmailExists);

module.exports = router;