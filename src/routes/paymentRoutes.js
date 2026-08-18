const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authMiddleware } = require('../middleware/auth');
const { adminMiddleware } = require('../middleware/admin');
const { validateIdParam } = require('../middleware/validation');

// ============================================
// PUBLIC ROUTES (Webhooks - No authentication)
// ============================================

// Webhook endpoint for Stripe/PayPal
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);

// ============================================
// PROTECTED ROUTES (User must be logged in)
// ============================================

// Create payment intent
router.post('/create-payment', authMiddleware, paymentController.createPaymentIntent);

// Confirm payment
router.post('/confirm', authMiddleware, paymentController.confirmPayment);

// Get payment status
router.get('/status/:paymentId', authMiddleware, paymentController.getPaymentStatus);

// Get payment methods
router.get('/methods', authMiddleware, paymentController.getPaymentMethods);

// Save payment method
router.post('/methods', authMiddleware, paymentController.savePaymentMethod);

// Delete payment method
router.delete('/methods/:id', authMiddleware, paymentController.deletePaymentMethod);

// Get user's payment history
router.get('/history', authMiddleware, paymentController.getPaymentHistory);

// Request refund
router.post('/refund/:orderId', authMiddleware, validateIdParam, paymentController.requestRefund);

// ============================================
// ADMIN ONLY ROUTES
// ============================================

// Get all transactions (admin)
router.get('/admin/transactions', authMiddleware, adminMiddleware, paymentController.getAllTransactions);

// Get transaction details (admin)
router.get('/admin/transactions/:id', authMiddleware, adminMiddleware, paymentController.getTransactionDetails);

// Process refund (admin)
router.post('/admin/refund/:transactionId', authMiddleware, adminMiddleware, paymentController.processRefund);

// Get payment statistics (admin)
router.get('/admin/stats', authMiddleware, adminMiddleware, paymentController.getPaymentStats);

// Get payout list (admin)
router.get('/admin/payouts', authMiddleware, adminMiddleware, paymentController.getPayouts);

// Create payout (admin)
router.post('/admin/payouts', authMiddleware, adminMiddleware, paymentController.createPayout);

// Update payout status (admin)
router.put('/admin/payouts/:id', authMiddleware, adminMiddleware, paymentController.updatePayoutStatus);

module.exports = router;