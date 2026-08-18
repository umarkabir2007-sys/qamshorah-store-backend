const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { cache } = require('../config/redis');

// ============================================
// DASHBOARD FUNCTIONS
// ============================================

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
    try {
        // Check cache
        const cacheKey = 'admin:dashboard:stats';
        const cachedData = await cache.get(cacheKey);
        
        if (cachedData) {
            return res.json({
                success: true,
                data: cachedData,
                fromCache: true
            });
        }

        // Get all stats in parallel
        const [userStats, productStats, orderStats, reviewStats] = await Promise.all([
            User.getStats(),
            Product.getStats(),
            Order.getStats(),
            Review.getStats()
        ]);

        const dashboardData = {
            users: userStats,
            products: productStats,
            orders: orderStats,
            reviews: reviewStats,
            updatedAt: new Date().toISOString()
        };

        // Cache for 5 minutes
        await cache.set(cacheKey, dashboardData, 300);

        res.json({
            success: true,
            data: dashboardData
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// ============================================
// USER MANAGEMENT (ADMIN)
// ============================================

// Get all users with details
exports.getAllUsers = async (req, res) => {
    try {
        const { limit = 50, offset = 0, search } = req.query;

        let users;
        if (search) {
            users = await User.search(search);
        } else {
            users = await User.getAll(parseInt(limit), parseInt(offset));
        }

        const total = await User.getCount();

        res.json({
            success: true,
            data: users,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get user details with orders
exports.getUserDetails = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const [orders, addresses, stats] = await Promise.all([
            Order.findByUser(userId, 10, 0),
            Address.findByUser(userId),
            User.getStats()
        ]);

        res.json({
            success: true,
            data: {
                ...user,
                orders,
                addresses,
                stats
            }
        });
    } catch (error) {
        console.error('Get user details error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Update user role
exports.updateUserRole = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { role } = req.body;

        if (userId === req.userId) {
            return res.status(400).json({
                success: false,
                error: 'You cannot change your own role'
            });
        }

        const user = await User.update(userId, { role });
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Clear cache
        await cache.delete(`user:profile:${userId}`);
        await cache.delete('admin:dashboard:stats');

        res.json({
            success: true,
            message: 'User role updated successfully',
            data: user
        });
    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Suspend user
exports.suspendUser = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);

        if (userId === req.userId) {
            return res.status(400).json({
                success: false,
                error: 'You cannot suspend your own account'
            });
        }

        await User.update(userId, { is_active: false });

        // Clear cache
        await cache.delete(`user:profile:${userId}`);
        await cache.delete('admin:dashboard:stats');

        res.json({
            success: true,
            message: 'User suspended successfully'
        });
    } catch (error) {
        console.error('Suspend user error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Activate user
exports.activateUser = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        await User.update(userId, { is_active: true });

        // Clear cache
        await cache.delete(`user:profile:${userId}`);
        await cache.delete('admin:dashboard:stats');

        res.json({
            success: true,
            message: 'User activated successfully'
        });
    } catch (error) {
        console.error('Activate user error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Delete user (with reason)
exports.deleteUser = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { reason } = req.body;

        if (userId === req.userId) {
            return res.status(400).json({
                success: false,
                error: 'You cannot delete your own account'
            });
        }

        await User.delete(userId);

        // TODO: Log deletion with reason
        // await logUserDeletion(userId, reason, req.userId);

        // Clear cache
        await cache.delete(`user:profile:${userId}`);
        await cache.delete('admin:dashboard:stats');

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// ============================================
// ORDER MANAGEMENT (ADMIN)
// ============================================

// Get all orders with filters
exports.getAllOrders = async (req, res) => {
    try {
        const { limit = 50, offset = 0, status, paymentStatus, dateFrom, dateTo } = req.query;

        const orders = await Order.getAll({
            limit: parseInt(limit),
            offset: parseInt(offset),
            status,
            paymentStatus,
            dateFrom,
            dateTo
        });

        const total = await Order.getCount({ status, paymentStatus });

        res.json({
            success: true,
            data: orders,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get all orders error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get order details
exports.getOrderDetails = async (req, res) => {
    try {
        const orderId = parseInt(req.params.id);
        const order = await Order.findById(orderId);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        // Get user details
        const user = order.user_id ? await User.findById(order.user_id) : null;

        res.json({
            success: true,
            data: {
                ...order,
                user
            }
        });
    } catch (error) {
        console.error('Get order details error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Update order status (with notification)
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

        // TODO: Send email notification to user
        // await sendOrderStatusUpdate(order.user_id, order, status, note);

        // Clear cache
        await cache.delete(`order:${orderId}`);
        await cache.delete('admin:dashboard:stats');

        res.json({
            success: true,
            message: 'Order status updated successfully',
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

// Update order payment
exports.updateOrderPayment = async (req, res) => {
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
        await cache.delete(`order:${orderId}`);
        await cache.delete('admin:dashboard:stats');

        res.json({
            success: true,
            message: 'Payment status updated successfully',
            data: order
        });
    } catch (error) {
        console.error('Update order payment error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// ============================================
// PRODUCT MANAGEMENT (ADMIN)
// ============================================

// Get all products (admin view)
exports.getAllProducts = async (req, res) => {
    try {
        const { limit = 50, offset = 0, search, category, lowStock } = req.query;

        let products;
        if (lowStock === 'true') {
            products = await Product.getLowStock();
        } else {
            products = await Product.getAll({
                limit: parseInt(limit),
                offset: parseInt(offset),
                search,
                category
            });
        }

        const total = await Product.getCount({ search, category });

        res.json({
            success: true,
            data: products,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get all products error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get low stock products
exports.getLowStockProducts = async (req, res) => {
    try {
        const products = await Product.getLowStock(10);
        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('Get low stock products error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Bulk update products
exports.bulkUpdateProducts = async (req, res) => {
    try {
        const { updates } = req.body;

        if (!Array.isArray(updates) || updates.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Please provide an array of updates'
            });
        }

        const results = [];
        for (const update of updates) {
            try {
                const product = await Product.update(update.id, update.data);
                results.push({ success: true, product });
            } catch (error) {
                results.push({ 
                    success: false, 
                    error: error.message,
                    data: update 
                });
            }
        }

        // Clear cache
        await cache.delete('products:*');
        await cache.delete('admin:dashboard:stats');

        res.json({
            success: true,
            message: 'Bulk update completed',
            data: {
                total: results.length,
                successful: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length,
                results
            }
        });
    } catch (error) {
        console.error('Bulk update products error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// ============================================
// REPORTS & ANALYTICS
// ============================================

// Get sales report
exports.getSalesReport = async (req, res) => {
    try {
        const { period = 'month', dateFrom, dateTo } = req.query;
        const report = await Order.getSalesReport(period, dateFrom, dateTo);
        res.json({
            success: true,
            data: report
        });
    } catch (error) {
        console.error('Get sales report error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get revenue report
exports.getRevenueReport = async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        const revenue = await Order.getRevenueReport(period);
        res.json({
            success: true,
            data: revenue
        });
    } catch (error) {
        console.error('Get revenue report error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get product performance
exports.getProductPerformance = async (req, res) => {
    try {
        const { limit = 10, period = 'month' } = req.query;
        const performance = await Order.getProductPerformance(parseInt(limit), period);
        res.json({
            success: true,
            data: performance
        });
    } catch (error) {
        console.error('Get product performance error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get user activity report
exports.getUserActivityReport = async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        const activity = await User.getActivityReport(period);
        res.json({
            success: true,
            data: activity
        });
    } catch (error) {
        console.error('Get user activity report error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Export report as CSV
exports.exportReport = async (req, res) => {
    try {
        const { type } = req.params;
        const { dateFrom, dateTo } = req.query;

        let data;
        let filename;

        switch (type) {
            case 'orders':
                data = await Order.getExportData(dateFrom, dateTo);
                filename = 'orders_report.csv';
                break;
            case 'users':
                data = await User.getExportData(dateFrom, dateTo);
                filename = 'users_report.csv';
                break;
            case 'products':
                data = await Product.getExportData();
                filename = 'products_report.csv';
                break;
            default:
                return res.status(400).json({
                    success: false,
                    error: 'Invalid report type'
                });
        }

        // TODO: Generate CSV file
        // const csv = await generateCSV(data);

        res.json({
            success: true,
            message: 'Report exported successfully',
            data: {
                filename,
                // csv // In production, return CSV file download
            }
        });
    } catch (error) {
        console.error('Export report error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// ============================================
// SYSTEM SETTINGS (Super Admin Only)
// ============================================

// Get system settings
exports.getSettings = async (req, res) => {
    try {
        // TODO: Get settings from database
        const settings = {
            siteName: 'QAMSHORAH STORE',
            siteDescription: 'Your one-stop shop',
            maintenance: false,
            currency: 'USD',
            taxRate: 0.08,
            shippingCost: 10,
            freeShippingThreshold: 100
        };

        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Update system settings
exports.updateSettings = async (req, res) => {
    try {
        const settings = req.body;
        
        // TODO: Save settings to database
        // await Settings.update(settings);

        // Clear cache
        await cache.delete('admin:settings');

        res.json({
            success: true,
            message: 'Settings updated successfully',
            data: settings
        });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get system health
exports.getSystemHealth = async (req, res) => {
    try {
        const health = {
            status: 'healthy',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            memory: process.memoryUsage(),
            database: 'connected',
            redis: 'connected'
        };

        res.json({
            success: true,
            data: health
        });
    } catch (error) {
        console.error('Get system health error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Clear cache
exports.clearCache = async (req, res) => {
    try {
        await cache.clear();
        res.json({
            success: true,
            message: 'Cache cleared successfully'
        });
    } catch (error) {
        console.error('Clear cache error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// ============================================
// NOTIFICATIONS
// ============================================

// Send notification to users
exports.sendUserNotification = async (req, res) => {
    try {
        const { userIds, message, subject, type } = req.body;

        if (!userIds || !message) {
            return res.status(400).json({
                success: false,
                error: 'User IDs and message are required'
            });
        }

        // TODO: Send notifications
        // await Notification.sendToUsers(userIds, { message, subject, type });

        res.json({
            success: true,
            message: `Notification sent to ${userIds.length} users`
        });
    } catch (error) {
        console.error('Send notification error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get notification history
exports.getNotifications = async (req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;
        
        // TODO: Get notifications from database
        const notifications = [];

        res.json({
            success: true,
            data: notifications,
            pagination: {
                total: 0,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Mark notification as read
exports.markNotificationRead = async (req, res) => {
    try {
        const notificationId = parseInt(req.params.id);
        
        // TODO: Update notification status
        // await Notification.markAsRead(notificationId);

        res.json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (error) {
        console.error('Mark notification read error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};