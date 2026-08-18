const pool = require('../config/database');

class Wishlist {
    // Add item to wishlist
    static async addItem(userId, productId) {
        // Check if already in wishlist
        const existing = await pool.query(
            'SELECT * FROM wishlists WHERE user_id = $1 AND product_id = $2',
            [userId, productId]
        );

        if (existing.rows.length > 0) {
            return existing.rows[0];
        }

        const result = await pool.query(
            'INSERT INTO wishlists (user_id, product_id) VALUES ($1, $2) RETURNING *',
            [userId, productId]
        );
        return result.rows[0];
    }

    // Remove item from wishlist
    static async removeItem(userId, productId) {
        await pool.query(
            'DELETE FROM wishlists WHERE user_id = $1 AND product_id = $2',
            [userId, productId]
        );
        return true;
    }

    // Get user's wishlist with product details
    static async getUserWishlist(userId, limit = 50, offset = 0) {
        const result = await pool.query(
            `SELECT 
                w.*,
                p.name as product_name,
                p.description as product_description,
                p.price as product_price,
                p.compare_price as product_compare_price,
                p.image_url as product_image,
                p.stock as product_stock,
                p.sku as product_sku,
                p.category as product_category,
                p.is_active as product_is_active
            FROM wishlists w
            JOIN products p ON w.product_id = p.id
            WHERE w.user_id = $1 AND p.is_active = true
            ORDER BY w.created_at DESC
            LIMIT $2 OFFSET $3`,
            [userId, limit, offset]
        );
        return result.rows;
    }

    // Check if product is in wishlist
    static async isInWishlist(userId, productId) {
        const result = await pool.query(
            'SELECT * FROM wishlists WHERE user_id = $1 AND product_id = $2',
            [userId, productId]
        );
        return result.rows.length > 0;
    }

    // Get wishlist count
    static async getWishlistCount(userId) {
        const result = await pool.query(
            'SELECT COUNT(*) FROM wishlists WHERE user_id = $1',
            [userId]
        );
        return parseInt(result.rows[0].count);
    }

    // Clear wishlist
    static async clearWishlist(userId) {
        await pool.query(
            'DELETE FROM wishlists WHERE user_id = $1',
            [userId]
        );
        return true;
    }

    // Move wishlist items to cart (all or selected)
    static async moveToCart(userId, productIds = null) {
        let query = 'SELECT product_id FROM wishlists WHERE user_id = $1';
        const params = [userId];

        if (productIds && productIds.length > 0) {
            const placeholders = productIds.map((_, index) => `$${index + 2}`).join(', ');
            query += ` AND product_id IN (${placeholders})`;
            params.push(...productIds);
        }

        const result = await pool.query(query, params);
        const products = result.rows;

        // Add each product to cart
        const cart = require('./Cart');
        for (const product of products) {
            await cart.addItem(userId, product.product_id, 1);
        }

        // Remove from wishlist
        if (productIds && productIds.length > 0) {
            const placeholders = productIds.map((_, index) => `$${index + 1}`).join(', ');
            await pool.query(
                `DELETE FROM wishlists WHERE user_id = $1 AND product_id IN (${placeholders})`,
                [userId, ...productIds]
            );
        } else {
            await this.clearWishlist(userId);
        }

        return true;
    }

    // Get wishlist statistics
    static async getStats() {
        const result = await pool.query(`
            SELECT 
                COUNT(*) as total_wishlist_items,
                COUNT(DISTINCT user_id) as unique_users,
                COUNT(DISTINCT product_id) as unique_products,
                AVG(product_count) as average_items_per_user
            FROM (
                SELECT user_id, COUNT(*) as product_count
                FROM wishlists
                GROUP BY user_id
            ) as user_counts
        `);
        return result.rows[0];
    }

    // Get most wishlisted products
    static async getMostWishlisted(limit = 10) {
        const result = await pool.query(
            `SELECT 
                p.id,
                p.name,
                p.price,
                p.image_url,
                COUNT(w.product_id) as wishlist_count
            FROM products p
            JOIN wishlists w ON p.id = w.product_id
            WHERE p.is_active = true
            GROUP BY p.id, p.name, p.price, p.image_url
            ORDER BY wishlist_count DESC
            LIMIT $1`,
            [limit]
        );
        return result.rows;
    }

    // Get user's wishlist with pagination and filters
    static async getWishlistWithFilters(userId, {
        limit = 20,
        offset = 0,
        category = null,
        minPrice = null,
        maxPrice = null,
        sort = 'w.created_at',
        order = 'DESC'
    } = {}) {
        let query = `
            SELECT 
                w.*,
                p.name as product_name,
                p.description as product_description,
                p.price as product_price,
                p.compare_price as product_compare_price,
                p.image_url as product_image,
                p.stock as product_stock,
                p.sku as product_sku,
                p.category as product_category,
                p.is_active as product_is_active,
                p.created_at as product_created_at
            FROM wishlists w
            JOIN products p ON w.product_id = p.id
            WHERE w.user_id = $1 AND p.is_active = true
        `;
        const params = [userId];
        let paramCount = 2;

        if (category) {
            query += ` AND p.category = $${paramCount}`;
            params.push(category);
            paramCount++;
        }

        if (minPrice !== null) {
            query += ` AND p.price >= $${paramCount}`;
            params.push(minPrice);
            paramCount++;
        }

        if (maxPrice !== null) {
            query += ` AND p.price <= $${paramCount}`;
            params.push(maxPrice);
            paramCount++;
        }

        query += ` ORDER BY ${sort} ${order} LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);
        return result.rows;
    }
}

module.exports = Wishlist;