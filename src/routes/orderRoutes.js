const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authMiddleware } = require('../middleware/auth');
const { adminMiddleware } = require('../middleware/admin');
const { validateOrder, validateIdParam, validatePagination } = require('../middleware/validation');
const { checkoutLimiter } = require('../middleware/rateLimit');

// ============================================
// PROTECTED ROUTES (User must be logged in)
// ============================================

// Create new order
router.post('/', authMiddleware, checkoutLimiter, validateOrder, orderController.createOrder);

// Get user's orders
router.get('/my-orders', authMiddleware, validatePagination, orderController.getMyOrders);

// Get single order by ID
router.get('/:id', authMiddleware, validateIdParam, orderController.getOrder);

// Cancel order
router.put('/:id/cancel', authMiddleware, validateIdParam, orderController.cancelOrder);

// Request order cancellation (with reason)
router.post('/:id/request-cancel', authMiddleware, validateIdParam, orderController.requestCancellation);

// ============================================
// ADMIN ONLY ROUTES
// ============================================

// Get all orders (admin)
router.get('/admin/all', authMiddleware, adminMiddleware, validatePagination, orderController.getAllOrders);

// Get orders by status (admin)
router.get('/admin/status/:status', authMiddleware, adminMiddleware, orderController.getOrdersByStatus);

// Update order status (admin)
router.put('/:id/status', authMiddleware, adminMiddleware, validateIdParam, orderController.updateOrderStatus);

// Update payment status (admin)
router.put('/:id/payment', authMiddleware, adminMiddleware, validateIdParam, orderController.updatePaymentStatus);

// Generate invoice (admin)
router.get('/:id/invoice', authMiddleware, adminMiddleware, validateIdParam, orderController.generateInvoice);

// Get order statistics (admin)
router.get('/admin/stats', authMiddleware, adminMiddleware, orderController.getOrderStats);

// Get daily sales chart data (admin)
router.get('/admin/sales-chart', authMiddleware, adminMiddleware, orderController.getDailySalesChart);

// Get order status count (admin)
router.get('/admin/status-count', authMiddleware, adminMiddleware, orderController.getStatusCount);

// Search orders by order number (admin)
router.get('/admin/search/:orderNumber', authMiddleware, adminMiddleware, orderController.searchOrders);

module.exports = router;