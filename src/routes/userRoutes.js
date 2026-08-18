const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware } = require('../middleware/auth');
const { adminMiddleware, ownerOrAdminMiddleware } = require('../middleware/admin');
const { validateAddress, validateIdParam, validatePagination } = require('../middleware/validation');

// ============================================
// PROTECTED ROUTES (User must be logged in)
// ============================================

// Get user profile
router.get('/profile', authMiddleware, userController.getProfile);

// Update user profile
router.put('/profile', authMiddleware, userController.updateProfile);

// Change password
router.put('/change-password', authMiddleware, userController.changePassword);

// ============================================
// ADDRESS ROUTES
// ============================================

// Get all addresses
router.get('/addresses', authMiddleware, userController.getAddresses);

// Get default address
router.get('/addresses/default', authMiddleware, userController.getDefaultAddress);

// Add new address
router.post('/addresses', authMiddleware, validateAddress, userController.addAddress);

// Update address
router.put('/addresses/:id', authMiddleware, validateIdParam, validateAddress, userController.updateAddress);

// Set address as default
router.put('/addresses/:id/default', authMiddleware, validateIdParam, userController.setDefaultAddress);

// Delete address
router.delete('/addresses/:id', authMiddleware, validateIdParam, userController.deleteAddress);

// ============================================
// ADMIN ONLY ROUTES
// ============================================

// Get all users (admin)
router.get('/admin/all', authMiddleware, adminMiddleware, validatePagination, userController.getAllUsers);

// Get user by ID (admin)
router.get('/admin/:id', authMiddleware, adminMiddleware, validateIdParam, userController.getUserById);

// Update user role (admin)
router.put('/admin/:id/role', authMiddleware, adminMiddleware, validateIdParam, userController.updateUserRole);

// Update user status (admin)
router.put('/admin/:id/status', authMiddleware, adminMiddleware, validateIdParam, userController.updateUserStatus);

// Delete user (admin)
router.delete('/admin/:id', authMiddleware, adminMiddleware, validateIdParam, userController.deleteUser);

// Get user statistics (admin)
router.get('/admin/stats', authMiddleware, adminMiddleware, userController.getUserStats);

// Search users (admin)
router.get('/admin/search/:query', authMiddleware, adminMiddleware, userController.searchUsers);

module.exports = router;