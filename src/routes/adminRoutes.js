const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware } = require('../middleware/auth');
const { adminMiddleware, superAdminMiddleware } = require('../middleware/admin');

// ============================================
// ALL ROUTES REQUIRE ADMIN AUTHENTICATION
// ============================================

// Dashboard statistics
router.get('/dashboard/stats', authMiddleware, adminMiddleware, adminController.getDashboardStats);

// ============================================
// USER MANAGEMENT
// ============================================

// Get all users with details
router.get('/users', authMiddleware, adminMiddleware, adminController.getAllUsers);

// Get user details with orders
router.get('/users/:id', authMiddleware, adminMiddleware, adminController.getUserDetails);

// Update user role
router.put('/users/:id/role', authMiddleware, adminMiddleware, adminController.updateUserRole);

// Suspend user
router.put('/users/:id/suspend', authMiddleware, adminMiddleware, adminController.suspendUser);

// Activate user
router.put('/users/:id/activate', authMiddleware, adminMiddleware, adminController.activateUser);

// Delete user (with reason)
router.delete('/users/:id', authMiddleware, superAdminMiddleware, adminController.deleteUser);

// ============================================
// ORDER MANAGEMENT
// ============================================

// Get all orders with filters
router.get('/orders', authMiddleware, adminMiddleware, adminController.getAllOrders);

// Get order details
router.get('/orders/:id', authMiddleware, adminMiddleware, adminController.getOrderDetails);

// Update order status (with notification)
router.put('/orders/:id/status', authMiddleware, adminMiddleware, adminController.updateOrderStatus);

// Update order payment status
router.put('/orders/:id/payment', authMiddleware, adminMiddleware, adminController.updateOrderPayment);

// ============================================
// PRODUCT MANAGEMENT
// ============================================

// Get all products (admin view)
router.get('/products', authMiddleware, adminMiddleware, adminController.getAllProducts);

// Get low stock products
router.get('/products/low-stock', authMiddleware, adminMiddleware, adminController.getLowStockProducts);

// Bulk update products
router.post('/products/bulk-update', authMiddleware, adminMiddleware, adminController.bulkUpdateProducts);

// ============================================
// REPORTS & ANALYTICS
// ============================================

// Get sales report
router.get('/reports/sales', authMiddleware, adminMiddleware, adminController.getSalesReport);

// Get revenue report
router.get('/reports/revenue', authMiddleware, adminMiddleware, adminController.getRevenueReport);

// Get product performance
router.get('/reports/products', authMiddleware, adminMiddleware, adminController.getProductPerformance);

// Get user activity report
router.get('/reports/users', authMiddleware, adminMiddleware, adminController.getUserActivityReport);

// Export report as CSV
router.get('/reports/export/:type', authMiddleware, adminMiddleware, adminController.exportReport);

// ============================================
// SYSTEM SETTINGS (Super Admin Only)
// ============================================

// Get system settings
router.get('/settings', authMiddleware, superAdminMiddleware, adminController.getSettings);

// Update system settings
router.put('/settings', authMiddleware, superAdminMiddleware, adminController.updateSettings);

// Get system health
router.get('/health', authMiddleware, adminMiddleware, adminController.getSystemHealth);

// Clear cache
router.post('/clear-cache', authMiddleware, superAdminMiddleware, adminController.clearCache);

// ============================================
// NOTIFICATIONS
// ============================================

// Send notification to users
router.post('/notify/users', authMiddleware, adminMiddleware, adminController.sendUserNotification);

// Get notification history
router.get('/notifications', authMiddleware, adminMiddleware, adminController.getNotifications);

// Mark notification as read
router.put('/notifications/:id', authMiddleware, adminMiddleware, adminController.markNotificationRead);

module.exports = router;