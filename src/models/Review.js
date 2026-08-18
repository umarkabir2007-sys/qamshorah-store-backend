const pool = require('../config/database');

class Review {
    // Create new review
    static async create(reviewData) {
        const { userId, productId, rating, title, comment } = reviewData;

        // Check if user already reviewed this product
        const existing = await pool.query(
            'SELECT * FROM reviews WHERE user_id = $1 AND product_id = $2',
            [userId, productId]
        );

        if (existing.rows.length > 0) {
            // Update existing review
            const result = await pool.query(
                `UPDATE reviews 
                 SET rating = $1, title = $2, comment = $3, updated_at = CURRENT_TIMESTAMP 
                 WHERE user_id = $4 AND product_id = $5 
                 RETURNING *`,
                [rating, title, comment, userId, productId]
            );
            return result.rows[0];
        } else {
            // Create new review
            const result = await pool.query(
                `INSERT INTO reviews (user_id, product_id, rating, title, comment)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING *`,
                [userId, productId, rating, title, comment]
            );
            return result.rows[0];
        }
    }

    // Get review by ID
    static async findById(id) {
        const result = await pool.query(
            `SELECT r.*, u.full_name, u.email 
             FROM reviews r
             JOIN users u ON r.user_id = u.id
             WHERE r.id = $1`,
            [id]
        );
        return result.rows[0];
    }

    // Get all reviews for a product
    static async findByProduct(productId, limit = 50, offset = 0) {
        const result = await pool.query(
            `SELECT r.*, u.full_name, u.email 
             FROM reviews r
             JOIN users u ON r.user_id = u.id
             WHERE r.product_id = $1
             ORDER BY r.created_at DESC
             LIMIT $2 OFFSET $3`,
            [productId, limit, offset]
        );
        return result.rows;
    }

    // Get all reviews by a user
    static async findByUser(userId, limit = 50, offset = 0) {
        const result = await pool.query(
            `SELECT r.*, p.name as product_name, p.image_url as product_image
             FROM reviews r
             JOIN products p ON r.product_id = p.id
             WHERE r.user_id = $1
             ORDER BY r.created_at DESC
             LIMIT $2 OFFSET $3`,
            [userId, limit, offset]
        );
        return result.rows;
    }

    // Get product rating summary
    static async getProductRatingSummary(productId) {
        const result = await pool.query(`
            SELECT 
                COUNT(*) as total_reviews,
                AVG(rating) as average_rating,
                COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
                COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
                COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
                COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
                COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
            FROM reviews
            WHERE product_id = $1
        `, [productId]);
        return result.rows[0];
    }

    // Update review
    static async update(id, userId, updateData) {
        const { rating, title, comment } = updateData;
        const result = await pool.query(
            `UPDATE reviews 
             SET rating = $1, title = $2, comment = $3, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $4 AND user_id = $5 
             RETURNING *`,
            [rating, title, comment, id, userId]
        );
        return result.rows[0];
    }

    // Delete review
    static async delete(id, userId) {
        await pool.query(
            'DELETE FROM reviews WHERE id = $1 AND user_id = $2',
            [id, userId]
        );
        return true;
    }

    // Delete all reviews for a product (admin)
    static async deleteByProduct(productId) {
        await pool.query(
            'DELETE FROM reviews WHERE product_id = $1',
            [productId]
        );
        return true;
    }

    // Delete all reviews by a user (admin)
    static async deleteByUser(userId) {
        await pool.query(
            'DELETE FROM reviews WHERE user_id = $1',
            [userId]
        );
        return true;
    }

    // Get review count for a product
    static async getCountByProduct(productId) {
        const result = await pool.query(
            'SELECT COUNT(*) FROM reviews WHERE product_id = $1',
            [productId]
        );
        return parseInt(result.rows[0].count);
    }

    // Check if user has reviewed a product
    static async hasUserReviewed(userId, productId) {
        const result = await pool.query(
            'SELECT * FROM reviews WHERE user_id = $1 AND product_id = $2',
            [userId, productId]
        );
        return result.rows.length > 0;
    }

    // Get latest reviews (admin)
    static async getLatest(limit = 10) {
        const result = await pool.query(
            `SELECT r.*, u.full_name, p.name as product_name
             FROM reviews r
             JOIN users u ON r.user_id = u.id
             JOIN products p ON r.product_id = p.id
             ORDER BY r.created_at DESC
             LIMIT $1`,
            [limit]
        );
        return result.rows;
    }

    // Get review statistics (admin)
    static async getStats() {
        const result = await pool.query(`
            SELECT 
                COUNT(*) as total_reviews,
                AVG(rating) as average_rating,
                COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
                COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
                COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
                COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
                COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star,
                COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as new_reviews_this_week
            FROM reviews
        `);
        return result.rows[0];
    }
}

module.exports = Review;