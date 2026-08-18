const pool = require('../config/database');

class Address {
    // Create new address
    static async create(addressData) {
        const {
            userId,
            addressLine1,
            addressLine2,
            city,
            state,
            postalCode,
            country,
            phone,
            isDefault = false
        } = addressData;

        // If this is default, remove default from other addresses
        if (isDefault) {
            await pool.query(
                'UPDATE addresses SET is_default = false WHERE user_id = $1',
                [userId]
            );
        }

        const result = await pool.query(
            `INSERT INTO addresses (
                user_id, address_line1, address_line2, city, state, 
                postal_code, country, phone, is_default
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *`,
            [userId, addressLine1, addressLine2, city, state, postalCode, country, phone, isDefault]
        );
        return result.rows[0];
    }

    // Get address by ID
    static async findById(id) {
        const result = await pool.query(
            'SELECT * FROM addresses WHERE id = $1',
            [id]
        );
        return result.rows[0];
    }

    // Get all addresses for a user
    static async findByUser(userId) {
        const result = await pool.query(
            'SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
            [userId]
        );
        return result.rows;
    }

    // Get default address for a user
    static async getDefaultAddress(userId) {
        const result = await pool.query(
            'SELECT * FROM addresses WHERE user_id = $1 AND is_default = true',
            [userId]
        );
        return result.rows[0];
    }

    // Update address
    static async update(id, updateData) {
        const keys = Object.keys(updateData);
        const values = Object.values(updateData);
        const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
        
        const result = await pool.query(
            `UPDATE addresses SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $1 
             RETURNING *`,
            [id, ...values]
        );
        return result.rows[0];
    }

    // Set address as default
    static async setDefault(userId, addressId) {
        // Remove default from all addresses
        await pool.query(
            'UPDATE addresses SET is_default = false WHERE user_id = $1',
            [userId]
        );
        
        // Set this address as default
        const result = await pool.query(
            'UPDATE addresses SET is_default = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2 RETURNING *',
            [addressId, userId]
        );
        return result.rows[0];
    }

    // Delete address
    static async delete(id, userId) {
        // Check if this is the default address
        const address = await this.findById(id);
        if (address && address.is_default) {
            // Remove default flag first
            await pool.query(
                'UPDATE addresses SET is_default = false WHERE id = $1',
                [id]
            );
        }
        
        await pool.query(
            'DELETE FROM addresses WHERE id = $1 AND user_id = $2',
            [id, userId]
        );
        return true;
    }

    // Delete all addresses for a user
    static async deleteAll(userId) {
        await pool.query(
            'DELETE FROM addresses WHERE user_id = $1',
            [userId]
        );
        return true;
    }

    // Get address count for a user
    static async getCount(userId) {
        const result = await pool.query(
            'SELECT COUNT(*) FROM addresses WHERE user_id = $1',
            [userId]
        );
        return parseInt(result.rows[0].count);
    }
}

module.exports = Address;