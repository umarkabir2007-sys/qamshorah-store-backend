const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    // Create new user
    static async create(userData) {
        const { fullName, email, password, role = 'customer', verificationToken = null } = userData;
        const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 10);
        
        const result = await pool.query(
            `INSERT INTO users (full_name, email, password_hash, role, verification_token) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING id, full_name, email, role, is_verified, created_at`,
            [fullName, email, hashedPassword, role, verificationToken]
        );
        return result.rows[0];
    }

    // Find user by email
    static async findByEmail(email) {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        return result.rows[0];
    }

    // Find user by ID
    static async findById(id) {
        const result = await pool.query(
            'SELECT id, full_name, email, role, is_verified, last_login, created_at FROM users WHERE id = $1',
            [id]
        );
        return result.rows[0];
    }

    // Find user by verification token
    static async findByVerificationToken(token) {
        const result = await pool.query(
            'SELECT * FROM users WHERE verification_token = $1',
            [token]
        );
        return result.rows[0];
    }

    // Find user by reset token
    static async findByResetToken(token) {
        const result = await pool.query(
            'SELECT * FROM users WHERE reset_password_token = $1 AND reset_password_expires > NOW()',
            [token]
        );
        return result.rows[0];
    }

    // Update user
    static async update(id, updateData) {
        const keys = Object.keys(updateData);
        const values = Object.values(updateData);
        const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
        
        const result = await pool.query(
            `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $1 
             RETURNING id, full_name, email, role, is_verified`,
            [id, ...values]
        );
        return result.rows[0];
    }

    // Update last login
    static async updateLastLogin(id) {
        await pool.query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [id]
        );
    }

    // Get all users (admin)
    static async getAll(limit = 50, offset = 0) {
        const result = await pool.query(
            'SELECT id, full_name, email, role, is_verified, last_login, created_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
            [limit, offset]
        );
        return result.rows;
    }

    // Get user count
    static async getCount() {
        const result = await pool.query('SELECT COUNT(*) FROM users');
        return parseInt(result.rows[0].count);
    }

    // Delete user
    static async delete(id) {
        await pool.query('DELETE FROM users WHERE id = $1', [id]);
        return true;
    }

    // Compare password
    static async comparePassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }

    // Change password
    static async changePassword(id, newPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS) || 10);
        await pool.query(
            'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [hashedPassword, id]
        );
        return true;
    }

    // Get user statistics
    static async getStats() {
        const result = await pool.query(`
            SELECT 
                COUNT(*) as total_users,
                COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
                COUNT(CASE WHEN role = 'customer' THEN 1 END) as customer_count,
                COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_users,
                COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as new_users_this_week
            FROM users
        `);
        return result.rows[0];
    }
}

module.exports = User;