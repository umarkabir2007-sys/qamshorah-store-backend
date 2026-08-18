const pool = require('../config/database');

class Product {
    // Create product
    static async create(productData) {
        const { 
            name, description, price, comparePrice, stock, sku, 
            imageUrl, galleryImages, category, tags, weight, dimensions,
            isActive = true, isFeatured = false 
        } = productData;
        
        const result = await pool.query(
            `INSERT INTO products (
                name, description, price, compare_price, stock, sku, 
                image_url, gallery_images, category, tags, weight, dimensions,
                is_active, is_featured
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING *`,
            [
                name, description, price, comparePrice || null, stock, sku || null,
                imageUrl || null, galleryImages || null, category || null, 
                tags || null, weight || null, dimensions || null,
                isActive, isFeatured
            ]
        );
        return result.rows[0];
    }

    // Find product by ID
    static async findById(id) {
        const result = await pool.query(
            'SELECT * FROM products WHERE id = $1 AND is_active = true',
            [id]
        );
        return result.rows[0];
    }

    // Get all products with pagination and filters
    static async getAll({ 
        limit = 50, 
        offset = 0, 
        category = null, 
        search = null,
        featured = null,
        minPrice = null,
        maxPrice = null,
        sort = 'created_at',
        order = 'DESC'
    } = {}) {
        let query = 'SELECT * FROM products WHERE is_active = true';
        const params = [];
        let paramCount = 1;

        if (category) {
            query += ` AND category = $${paramCount}`;
            params.push(category);
            paramCount++;
        }

        if (search) {
            query += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount} OR tags ILIKE $${paramCount})`;
            params.push(`%${search}%`);
            paramCount++;
        }

        if (featured === true) {
            query += ` AND is_featured = true`;
        }

        if (minPrice !== null) {
            query += ` AND price >= $${paramCount}`;
            params.push(minPrice);
            paramCount++;
        }

        if (maxPrice !== null) {
            query += ` AND price <= $${paramCount}`;
            params.push(maxPrice);
            paramCount++;
        }

        query += ` ORDER BY ${sort} ${order} LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);
        return result.rows;
    }

    // Get total count of products
    static async getCount({ category = null, search = null, minPrice = null, maxPrice = null } = {}) {
        let query = 'SELECT COUNT(*) FROM products WHERE is_active = true';
        const params = [];
        let paramCount = 1;

        if (category) {
            query += ` AND category = $${paramCount}`;
            params.push(category);
            paramCount++;
        }

        if (search) {
            query += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount} OR tags ILIKE $${paramCount})`;
            params.push(`%${search}%`);
            paramCount++;
        }

        if (minPrice !== null) {
            query += ` AND price >= $${paramCount}`;
            params.push(minPrice);
            paramCount++;
        }

        if (maxPrice !== null) {
            query += ` AND price <= $${paramCount}`;
            params.push(maxPrice);
            paramCount++;
        }

        const result = await pool.query(query, params);
        return parseInt(result.rows[0].count);
    }

    // Update product
    static async update(id, updateData) {
        const keys = Object.keys(updateData);
        const values = Object.values(updateData);
        const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
        
        const result = await pool.query(
            `UPDATE products SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $1 
             RETURNING *`,
            [id, ...values]
        );
        return result.rows[0];
    }

    // Delete product (soft delete)
    static async delete(id) {
        await pool.query(
            'UPDATE products SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
            [id]
        );
        return true;
    }

    // Hard delete product (admin only)
    static async hardDelete(id) {
        await pool.query('DELETE FROM products WHERE id = $1', [id]);
        return true;
    }

    // Increment views
    static async incrementViews(id) {
        await pool.query(
            'UPDATE products SET views = views + 1 WHERE id = $1',
            [id]
        );
    }

    // Check stock
    static async checkStock(productId, quantity) {
        const result = await pool.query(
            'SELECT stock FROM products WHERE id = $1 AND is_active = true',
            [productId]
        );
        if (result.rows.length === 0) return false;
        return result.rows[0].stock >= quantity;
    }

    // Update stock
    static async updateStock(productId, quantity) {
        await pool.query(
            'UPDATE products SET stock = stock - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [quantity, productId]
        );
    }

    // Get product reviews
    static async getReviews(productId) {
        const result = await pool.query(
            `SELECT r.*, u.full_name, u.email 
             FROM reviews r 
             JOIN users u ON r.user_id = u.id 
             WHERE r.product_id = $1 
             ORDER BY r.created_at DESC`,
            [productId]
        );
        return result.rows;
    }

    // Get product categories
    static async getCategories() {
        const result = await pool.query(
            'SELECT DISTINCT category FROM products WHERE is_active = true AND category IS NOT NULL ORDER BY category'
        );
        return result.rows.map(row => row.category);
    }

    // Get product statistics
    static async getStats() {
        const result = await pool.query(`
            SELECT 
                COUNT(*) as total_products,
                COUNT(CASE WHEN is_featured = true THEN 1 END) as featured_products,
                COUNT(CASE WHEN stock = 0 THEN 1 END) as out_of_stock,
                COUNT(CASE WHEN stock <= 10 AND stock > 0 THEN 1 END) as low_stock,
                AVG(price) as average_price,
                MAX(price) as max_price,
                MIN(price) as min_price
            FROM products
            WHERE is_active = true
        `);
        return result.rows[0];
    }
}

module.exports = Product;