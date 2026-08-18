const Order = require('../models/Order');
const { cache } = require('../config/redis');

// ============================================
// CONTROLLER FUNCTIONS
// ============================================

// Create payment intent
exports.createPaymentIntent = async (req, res) => {
    try {
        const userId = req.userId;
        const { orderId, paymentMethod } = req.body;

        // Validate order
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        // Check if order belongs to user
        if (order.user_id !== userId) {
            return res.status(403).json({
                success: false,
                error: 'Access denied'
            });
        }

        // Check if order is already paid
        if (order.payment_status === 'paid') {
            return res.status(400).json({
                success: false,
                error: 'Order already paid'
            });
        }

        // TODO: Integrate with Stripe/PayPal
        // For now, return mock payment intent
        const paymentIntent = {
            id: `pi_${Date.now()}`,
            amount: order.total_price,
            currency: 'usd',
            status: 'requires_payment_method',
            clientSecret: `secret_${Date.now()}`,
            orderId: order.id,
            orderNumber: order.order_number
        };

        res.json({
            success: true,
            data: paymentIntent
        });
    } catch (error) {
        console.error('Create payment intent error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Confirm payment
exports.confirmPayment = async (req, res) => {
    try {
        const userId = req.userId;
        const { paymentIntentId, orderId } = req.body;

        // Validate order
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        if (order.user_id !== userId) {
            return res.status(403).json({
                success: false,
                error: 'Access denied'
            });
        }

        // TODO: Verify payment with Stripe/PayPal
        // For now, mark as paid
        await Order.updatePaymentStatus(orderId, 'paid', paymentIntentId);
        await Order.updateStatus(orderId, 'processing');

        // Clear cache
        await cache.delete(`order:${orderId}`);
        await cache.delete('orders:admin:*');

        res.json({
            success: true,
            message: 'Payment confirmed successfully',
            data: {
                orderId: order.id,
                orderNumber: order.order_number,
                status: 'paid'
            }
        });
    } catch (error) {
        console.error('Confirm payment error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get payment status
exports.getPaymentStatus = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const userId = req.userId;

        // TODO: Get payment status from payment provider
        // For now, return mock status
        const status = {
            id: paymentId,
            status: 'succeeded',
            amount: 100,
            currency: 'usd',
            createdAt: new Date().toISOString()
        };

        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        console.error('Get payment status error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get payment methods
exports.getPaymentMethods = async (req, res) => {
    try {
        const userId = req.userId;

        // TODO: Get saved payment methods from database
        const methods = [
            {
                id: 'pm_1',
                type: 'card',
                brand: 'visa',
                last4: '4242',
                expiryMonth: 12,
                expiryYear: 2025,
                isDefault: true
            }
        ];

        res.json({
            success: true,
            data: methods
        });
    } catch (error) {
        console.error('Get payment methods error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Save payment method
exports.savePaymentMethod = async (req, res) => {
    try {
        const userId = req.userId;
        const { paymentMethodId, isDefault } = req.body;

        // TODO: Save payment method to database
        // await PaymentMethod.create({ userId, paymentMethodId, isDefault });

        res.json({
            success: true,
            message: 'Payment method saved successfully'
        });
    } catch (error) {
        console.error('Save payment method error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Delete payment method
exports.deletePaymentMethod = async (req, res) => {
    try {
        const userId = req.userId;
        const methodId = parseInt(req.params.id);

        // TODO: Delete payment method from database
        // await PaymentMethod.delete(methodId, userId);

        res.json({
            success: true,
            message: 'Payment method deleted successfully'
        });
    } catch (error) {
        console.error('Delete payment method error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get payment history
exports.getPaymentHistory = async (req, res) => {
    try {
        const userId = req.userId;
        const { limit = 50, offset = 0 } = req.query;

        // TODO: Get payment history from database
        const payments = [];

        res.json({
            success: true,
            data: payments,
            pagination: {
                total: 0,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });
    } catch (error) {
        console.error('Get payment history error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Request refund
exports.requestRefund = async (req, res) => {
    try {
        const userId = req.userId;
        const orderId = parseInt(req.params.orderId);
        const { reason } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        if (order.user_id !== userId) {
            return res.status(403).json({
                success: false,
                error: 'Access denied'
            });
        }

        if (order.payment_status !== 'paid') {
            return res.status(400).json({
                success: false,
                error: 'Order is not paid'
            });
        }

        // TODO: Process refund with payment provider
        // await processRefund(order.transaction_id, order.total_price);

        // Update order status
        await Order.updateStatus(orderId, 'refunded');
        await Order.updatePaymentStatus(orderId, 'refunded');

        // Clear cache
        await cache.delete(`order:${orderId}`);

        res.json({
            success: true,
            message: 'Refund requested successfully',
            data: {
                orderId: order.id,
                orderNumber: order.order_number,
                amount: order.total_price,
                status: 'refunded'
            }
        });
    } catch (error) {
        console.error('Request refund error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// ============================================
// ADMIN ONLY FUNCTIONS
// ============================================

// Get all transactions (admin)
exports.getAllTransactions = async (req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;

        // TODO: Get transactions from database
        const transactions = [];

        res.json({
            success: true,
            data: transactions,
            pagination: {
                total: 0,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });
    } catch (error) {
        console.error('Get all transactions error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get transaction details (admin)
exports.getTransactionDetails = async (req, res) => {
    try {
        const transactionId = parseInt(req.params.id);

        // TODO: Get transaction from database
        const transaction = {
            id: transactionId,
            amount: 100,
            currency: 'usd',
            status: 'succeeded',
            orderId: 1,
            userId: 1,
            createdAt: new Date().toISOString()
        };

        res.json({
            success: true,
            data: transaction
        });
    } catch (error) {
        console.error('Get transaction details error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Process refund (admin)
exports.processRefund = async (req, res) => {
    try {
        const transactionId = parseInt(req.params.id);
        const { amount, reason } = req.body;

        // TODO: Process refund with payment provider
        // await processRefund(transactionId, amount, reason);

        // Update order
        const order = await Order.findByTransactionId(transactionId);
        if (order) {
            await Order.updateStatus(order.id, 'refunded');
            await Order.updatePaymentStatus(order.id, 'refunded');
        }

        res.json({
            success: true,
            message: 'Refund processed successfully',
            data: {
                transactionId,
                amount,
                status: 'refunded'
            }
        });
    } catch (error) {
        console.error('Process refund error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get payment statistics (admin)
exports.getPaymentStats = async (req, res) => {
    try {
        const stats = {
            totalRevenue: 0,
            totalTransactions: 0,
            averageTransaction: 0,
            successfulPayments: 0,
            failedPayments: 0,
            refunds: 0,
            revenueByPaymentMethod: {},
            revenueByDay: []
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Get payment stats error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get payouts (admin)
exports.getPayouts = async (req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;

        // TODO: Get payouts from database
        const payouts = [];

        res.json({
            success: true,
            data: payouts,
            pagination: {
                total: 0,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });
    } catch (error) {
        console.error('Get payouts error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Create payout (admin)
exports.createPayout = async (req, res) => {
    try {
        const { amount, method, accountDetails } = req.body;

        // TODO: Create payout with payment provider
        // const payout = await createPayout(amount, method, accountDetails);

        res.json({
            success: true,
            message: 'Payout created successfully',
            data: {
                id: `po_${Date.now()}`,
                amount,
                method,
                status: 'pending'
            }
        });
    } catch (error) {
        console.error('Create payout error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Update payout status (admin)
exports.updatePayoutStatus = async (req, res) => {
    try {
        const payoutId = parseInt(req.params.id);
        const { status } = req.body;

        // TODO: Update payout status in database
        // await Payout.updateStatus(payoutId, status);

        res.json({
            success: true,
            message: 'Payout status updated successfully'
        });
    } catch (error) {
        console.error('Update payout status error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Handle webhook (public)
exports.handleWebhook = async (req, res) => {
    try {
        const signature = req.headers['stripe-signature'] || req.headers['paypal-signature'];
        const payload = req.body;

        // TODO: Verify webhook signature
        // const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

        // Process webhook event
        // switch (event.type) {
        //     case 'payment_intent.succeeded':
        //         await handlePaymentSuccess(event.data.object);
        //         break;
        //     case 'payment_intent.payment_failed':
        //         await handlePaymentFailed(event.data.object);
        //         break;
        //     default:
        //         console.log(`Unhandled event type: ${event.type}`);
        // }

        res.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};