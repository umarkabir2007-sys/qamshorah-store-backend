const pool = require('../config/database');

class Order {
    // Create order
    static async create(orderData) {
        const {
            userId, orderNumber, totalPrice, subtotal, tax = 0,
            shippingCost = 0, discount = 0, shippingAddress, billingAddress,
            paymentMethod, notes = ''
        } = orderData;

        const result = await pool.query(
            `INSERT INTO orders (
                order_number, user_id, total_price, subtotal, tax,
                shipping_cost, discount, shipping_address, billing_address,
                payment_method, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *`,
            [
                orderNumber, userId, totalPrice, subtotal, tax,
                shippingCost, discount, shippingAddress, billingAddress,
                paymentMethod, notes
            ]
        );
        return result.rows[0];
    }

    // Add order items
    static async addOrderItems(orderId, items) {
        const values = items.map((item, index) => 
            `($1, $${index * 4 + 2}, $${index * 4 + 3}, $${index * 4 + 4}, $${index * 4 + 5}, $${index * 4 + 6})`
        ).join(', ');

        const params = [orderId];
        items.forEach(item => {
            params.push(item.productId, item.productName, item.productPrice, item.quantity, item.total);
        });

        const query = `
            INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, total)
            VALUES ${values}
            RETURNING *
        `;

        const result = await pool.query(query, params);
        return result.rows;
    }

    // Get order by ID with items
    static async findById(id) {
        const orderResult = await pool.query(
            'SELECT * FROM orders WHERE id = $1',
            [id]
        );
        if (orderResult.rows.length === 0) return null;

        const itemsResult = await pool.query(
            'SELECT * FROM order_items WHERE order_id = $1',
            [id]
        );

        return {
            ...orderResult.rows[0],
            items: itemsResult.rows
        };
    }

    // Get order items
    static async getOrderItems(orderId) {
        const result = await pool.query(
            'SELECT * FROM order_items WHERE order_id = $1',
            [orderId]
        );
        return result.rows;
    }

    // Get orders by user ID
    static async findByUser(userId, limit = 50, offset = 0) {
        const result = await pool.query(
            'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
            [userId, limit, offset]
        );
        return result.rows;
    }

    // Get all orders (admin)
    static async getAll({ limit = 50, offset = 0, status = null } = {}) {
        let query = 'SELECT * FROM orders';
        const params = [];
        let paramCount = 1;

        if (status) {
            query += ` WHERE status = $${paramCount}`;
            params.push(status);
            paramCount++;
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);
        return result.rows;
    }

    // Update order status
    static async updateStatus(id, status) {
        const result = await pool.query(
            'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [status, id]
        );
        return result.rows[0];
    }

    // Update payment status
    static async updatePaymentStatus(id, paymentStatus, transactionId = null) {
        const result = await pool.query(
            'UPDATE orders SET payment_status = $1, transaction_id = COALESCE($2, transaction_id), updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
            [paymentStatus, transactionId, id]
        );
        return result.rows[0];
    }

    // Get order statistics (admin)
    static async getStats() {
        const result = await pool.query(`
            SELECT 
                COUNT(*) as total_orders,
                SUM(total_price) as total_revenue,
                AVG(total_price) as average_order_value,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
                COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_orders,
                COUNT(CASE WHEN status = 'shipped' THEN 1 END) as shipped_orders,
                COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
                COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
                COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_orders,
                COUNT(CASE WHEN payment_status = 'unpaid' THEN 1 END) as unpaid_orders,
                SUM(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN total_price ELSE 0 END) as revenue_this_week,
                SUM(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN total_price ELSE 0 END) as revenue_this_month
            FROM orders
        `);
        return result.rows[0];
    }

    // Get daily sales for chart
    static async getDailySales(days = 7) {
        const result = await pool.query(
            `SELECT 
                DATE(created_at) as date,
                COUNT(*) as orders,
                SUM(total_price) as revenue
            FROM orders
            WHERE created_at >= NOW() - INTERVAL '${days} days'
            GROUP BY DATE(created_at)
            ORDER BY date DESC`
        );
        return result.rows;
    }

    // Search orders by order number
    static async searchByOrderNumber(orderNumber) {
        const result = await pool.query(
            'SELECT * FROM orders WHERE order_number ILIKE $1 ORDER BY created_at DESC',
            [`%${orderNumber}%`]
        );
        return result.rows;
    }

    // Get orders by status count
    static async getStatusCount() {
        const result = await pool.query(`
            SELECT 
                status,
                COUNT(*) as count
            FROM orders
            GROUP BY status
        `);
        return result.rows;
    }
}

module.exports = Order;