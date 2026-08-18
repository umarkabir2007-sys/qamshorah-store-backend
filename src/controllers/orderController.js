const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const { cache } = require('../config/redis');

// ============================================
// HELPER FUNCTIONS
// ============================================

// Generate unique order number
const generateOrderNumber = () => {
    const prefix = 'QAM';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
};

// ============================================
// CONTROLLER FUNCTIONS
// ============================================

// Create order
exports.createOrder = async (req, res) => {
    try {
        const userId = req.userId;
        const { shippingAddress, billingAddress, paymentMethod, notes } = req.body;

        // Get cart items
        const cartItems = await Cart.getUserCart(userId);
        if (cartItems.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Cart is empty'
            });
        }

        // Calculate totals
        let subtotal = 0;
        const orderItems = [];
        
        for (const item of cartItems) {
            const product = await Product.findById(item.product_id);
            if (!product) {
                return res.status(400).json({
                    success: false,
                    error: `Product not found: ${item.product_id}`
                });
            }

            // Check stock
            if (product.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    error: `Insufficient stock for: ${product.name} (Available: ${product.stock})`
                });
            }

            const total = product.price * item.quantity;
            subtotal += total;
            
            orderItems.push({
                productId: product.id,
                productName: product.name,
                productPrice: product.price,
                quantity: item.quantity,
                total: total
            });
        }

        // Calculate taxes and shipping
        const tax = subtotal * 0.08; // 8% tax
        const shippingCost = subtotal > 100 ? 0 : 10; // Free shipping over $100
        const discount = 0; // Add discount logic if needed
        const totalPrice = subtotal + tax + shippingCost - discount;

        // Generate order number
        const orderNumber = generateOrderNumber();

        // Create order
        const order = await Order.create({
            userId,
            orderNumber,
            totalPrice,
            subtotal,
            tax,
            shippingCost,
            discount,
            shippingAddress: shippingAddress || {},
            billingAddress: billingAddress || shippingAddress || {},
            paymentMethod,
            notes: notes || ''
        });

        // Add order items
        await Order.addOrderItems(order.id, orderItems);

        // Update product stock
        for (const item of orderItems) {
            await Product.updateStock(item.productId, item.quantity);
        }

        // Clear cart
        await Cart.clearCart(userId);

        // Clear cache
        await cache.delete(`orders:user:${userId}`);
        await cache.delete('orders:admin:*');

        // TODO: Send order confirmation email
        // await sendOrderConfirmation(userId, order, orderItems);

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: {
                orderId: order.id,
                orderNumber: order.order_number,
                totalPrice: order.total_price,
                items: orderItems,
                tax,
                shippingCost,
                discount
            }
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get user's orders
exports.getMyOrders = async (req, res) => {
    try {
        const userId = req.userId;
        const { limit = 50, offset = 0 } = req.query;

        // Check cache
        const cacheKey = `orders:user:${userId}:${limit}:${offset}`;
        const cachedData = await cache.get(cacheKey);
        
        if (cachedData) {
            return res.json({
                success: true,
                data: cachedData,
                fromCache: true
            });
        }

        const orders = await Order.findByUser(userId, parseInt(limit), parseInt(offset));
        
        // Cache for 5 minutes
        await cache.set(cacheKey, orders, 300);

        res.json({
            success: true,
            data: orders
        });
    } catch (error) {
        console.error('Get my orders error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get single order
exports.getOrder = async (req, res) => {
    try {
        const orderId = parseInt(req.params.id);
        const userId = req.userId;
        const isAdmin = req.user?.role === 'admin';

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        // Check permission (user owns order OR is admin)
        if (!isAdmin && order.user_id !== userId) {
            return res.status(403).json({
                success: false,
                error: 'Access denied'
            });
        }

        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Cancel order
exports.cancelOrder = async (req, res) => {
    try {
        const orderId = parseInt(req.params.id);
        const userId = req.userId;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        // Check permission
        if (order.user_id !== userId) {
            return res.status(403).json({
                success: false,
                error: 'Access denied'
            });
        }

        // Check if order can be cancelled
        if (order.status !== 'pending' && order.status !== 'processing') {
            return res.status(400).json({
                success: false,
                error: `Order cannot be cancelled. Current status: ${order.status}`
            });
        }

        // Update order status
        await Order.updateStatus(orderId, 'cancelled');

        // Restore stock
        const items = await Order.getOrderItems(orderId);
        for (const item of items) {
            await Product.updateStock(item.product_id, -item.quantity);
        }

        // Clear cache
        await cache.delete(`orders:user:${userId}*`);
        await cache.delete('orders:admin:*');

        res.json({
            success: true,
            message: 'Order cancelled successfully'
        });
    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Request order cancellation (with reason)
exports.requestCancellation = async (req, res) => {
    try {
        const orderId = parseInt(req.params.id);
        const userId = req.userId;
        const { reason } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        // Check permission
        if (order.user_id !== userId) {
            return res.status(403).json({
                success: false,
                error: 'Access denied'
            });
        }

        // Check if order can be cancelled
        if (order.status !== 'pending' && order.status !== 'processing') {
            return res.status(400).json({
                success: false,
                error: 'Order cannot be cancelled at this stage'
            });
        }

        // TODO: Send cancellation request to admin
        // await sendCancellationRequest(orderId, reason);

        res.json({
            success: true,
            message: 'Cancellation request sent to admin'
        });
    } catch (error) {
        console.error('Request cancellation error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// ============================================
// ADMIN ONLY FUNCTIONS
// ============================================

// Get all orders (admin)
exports.getAllOrders = async (req, res) => {
    try {
        const { limit = 50, offset = 0, status } = req.query;

        const cacheKey = `orders:admin:${status}:${limit}:${offset}`;
        const cachedData = await cache.get(cacheKey);
        
        if (cachedData) {
            return res.json({
                success: true,
                data: cachedData,
                fromCache: true
            });
        }

        const orders = await Order.getAll({
            limit: parseInt(limit),
            offset: parseInt(offset),
            status
        });

        // Cache for 3 minutes
        await cache.set(cacheKey, orders, 180);

        res.json({
            success: true,
            data: orders
        });
    } catch (error) {
        console.error('Get all orders error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get orders by status (admin)
exports.getOrdersByStatus = async (req, res) => {
    try {
        const { status } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        const orders = await Order.getAll({
            limit: parseInt(limit),
            offset: parseInt(offset),
            status
        });

        res.json({
            success: true,
            data: orders
        });
    } catch (error) {
        console.error('Get orders by status error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Update order status (admin)
exports.updateOrderStatus = async (req, res) => {
    try {
        const orderId = parseInt(req.params.id);
        const { status, note } = req.body;

        const order = await Order.updateStatus(orderId, status);
        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        // Clear cache
        await cache.delete(`orders:user:*`);
        await cache.delete('orders:admin:*');

        // TODO: Send status update notification to user
        // await sendOrderStatusUpdate(order.user_id, order, status);

        res.json({
            success: true,
            message: 'Order status updated',
            data: order
        });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Update payment status (admin)
exports.updatePaymentStatus = async (req, res) => {
    try {
        const orderId = parseInt(req.params.id);
        const { paymentStatus, transactionId } = req.body;

        const order = await Order.updatePaymentStatus(orderId, paymentStatus, transactionId);
        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        // Clear cache
        await cache.delete('orders:admin:*');

        res.json({
            success: true,
            message: 'Payment status updated',
            data: order
        });
    } catch (error) {
        console.error('Update payment status error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Generate invoice (admin)
exports.generateInvoice = async (req, res) => {
    try {
        const orderId = parseInt(req.params.id);
        const order = await Order.findById(orderId);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        // TODO: Generate PDF invoice
        // const pdf = await generateInvoicePDF(order);

        res.json({
            success: true,
            message: 'Invoice generated',
            data: {
                invoiceNumber: `INV-${order.order_number}`,
                order: order,
                generatedAt: new Date().toISOString(),
                // pdfUrl: pdf.url // In production, return PDF URL
            }
        });
    } catch (error) {
        console.error('Generate invoice error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get order statistics (admin)
exports.getOrderStats = async (req, res) => {
    try {
        const stats = await Order.getStats();
        
        // Cache for 10 minutes
        await cache.set('orders:stats', stats, 600);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Get order stats error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get daily sales chart (admin)
exports.getDailySalesChart = async (req, res) => {
    try {
        const { days = 7 } = req.query;
        const data = await Order.getDailySales(parseInt(days));
        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Get daily sales chart error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get order status count (admin)
exports.getStatusCount = async (req, res) => {
    try {
        const data = await Order.getStatusCount();
        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Get status count error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Search orders (admin)
exports.searchOrders = async (req, res) => {
    try {
        const { orderNumber } = req.params;
        const orders = await Order.searchByOrderNumber(orderNumber);
        res.json({
            success: true,
            data: orders
        });
    } catch (error) {
        console.error('Search orders error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};yes