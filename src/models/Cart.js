const pool = require('../config/database');

class Cart {
    // Add item to cart
    static async addItem(userId, productId, quantity = 1) {
        // Check if item already exists in cart
        const existing = await pool.query(
            'SELECT * FROM carts WHERE user_id = $1 AND product_id = $2',
            [userId, productId]
        );

        if (existing.rows.length > 0) {
            // Update quantity
            const result = await pool.query(
                'UPDATE carts SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 AND product_id = $3 RETURNING *',
                [quantity, userId, productId]
            );
            return result.rows[0];
        } else {
            // Add new item
            const result = await pool.query(
                'INSERT INTO carts (user_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *',
                [userId, productId, quantity]
            );
            return result.rows[0];
        }
    }

    // Get user's cart with product details
    static async getUserCart(userId) {
        const result = await pool.query(
            `SELECT 
                c.*,
                p.name as product_name,
                p.price as product_price,
                p.image_url as product_image,
                p.stock as product_stock,
                p.sku as product_sku,
                (c.quantity * p.price) as total_price
            FROM carts c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id = $1
            ORDER BY c.created_at DESC`,
            [userId]
        );
        return result.rows;
    }

    // Get cart count
    static async getCartCount(userId) {
        const result = await pool.query(
            'SELECT SUM(quantity) as total_items FROM carts WHERE user_id = $1',
            [userId]
        );
        return parseInt(result.rows[0]?.total_items) || 0;
    }

    // Get cart total
    static async getCartTotal(userId) {
        const result = await pool.query(
            `SELECT SUM(c.quantity * p.price) as total
            FROM carts c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id = $1`,
            [userId]
        );
        return parseFloat(result.rows[0]?.total) || 0;
    }

    // Update cart item quantity
    static async updateItemQuantity(userId, productId, quantity) {
        if (quantity <= 0) {
            return await this.removeItem(userId, productId);
        }

        const result = await pool.query(
            'UPDATE carts SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 AND product_id = $3 RETURNING *',
            [quantity, userId, productId]
        );
        return result.rows[0];
    }

    // Remove item from cart
    static async removeItem(userId, productId) {
        await pool.query(
            'DELETE FROM carts WHERE user_id = $1 AND product_id = $2',
            [userId, productId]
        );
        return true;
    }

    // Clear cart
    static async clearCart(userId) {
        await pool.query('DELETE FROM carts WHERE user_id = $1', [userId]);
        return true;
    }

    // Check if item exists in cart
    static async itemExists(userId, productId) {
        const result = await pool.query(
            'SELECT * FROM carts WHERE user_id = $1 AND product_id = $2',
            [userId, productId]
        );
        return result.rows.length > 0;
    }

    // Get cart items count for a specific product
    static async getProductQuantity(userId, productId) {
        const result = await pool.query(
            'SELECT quantity FROM carts WHERE user_id = $1 AND product_id = $2',
            [userId, productId]
        );
        return result.rows[0]?.quantity || 0;
    }

    // Move cart items to order (checkout)
    static async checkout(userId) {
        const items = await this.getUserCart(userId);
        if (items.length === 0) {
            return { success: false, message: 'Cart is empty' };
        }

        // Clear cart after checkout
        await this.clearCart(userId);
        return { success: true, items };
    }
}

module.exports = Cart;