const User = require('../models/User');
const Address = require('../models/Address');
const Order = require('../models/Order');
const { cache } = require('../config/redis');
const { sanitizeInput } = require('../middleware/validation');

// ============================================
// USER PROFILE FUNCTIONS
// ============================================

// Get user profile
exports.getProfile = async (req, res) => {
    try {
        const userId = req.userId;
        
        // Check cache
        const cacheKey = `user:profile:${userId}`;
        const cachedData = await cache.get(cacheKey);
        
        if (cachedData) {
            return res.json({
                success: true,
                data: cachedData,
                fromCache: true
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Get user stats
        const orderCount = await Order.getUserOrderCount(userId);
        const addressCount = await Address.getCount(userId);

        const userData = {
            ...user,
            stats: {
                totalOrders: orderCount,
                totalAddresses: addressCount
            }
        };

        // Cache for 10 minutes
        await cache.set(cacheKey, userData, 600);

        res.json({
            success: true,
            data: userData
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Update user profile
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.userId;
        const { fullName, email, phone, bio } = req.body;

        // Check if email is being changed and if it's already taken
        if (email) {
            const existingUser = await User.findByEmail(email);
            if (existingUser && existingUser.id !== userId) {
                return res.status(400).json({
                    success: false,
                    error: 'Email already in use'
                });
            }
        }

        const updateData = {};
        if (fullName) updateData.full_name = sanitizeInput(fullName);
        if (email) updateData.email = sanitizeInput(email);
        if (phone) updateData.phone = sanitizeInput(phone);
        if (bio) updateData.bio = sanitizeInput(bio);

        const user = await User.update(userId, updateData);

        // Clear cache
        await cache.delete(`user:profile:${userId}`);

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: user
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Change password
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.userId;

        // Get user with password
        const user = await User.findWithPassword(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Verify current password
        const isValid = await User.comparePassword(currentPassword, user.password_hash);
        if (!isValid) {
            return res.status(401).json({
                success: false,
                error: 'Current password is incorrect'
            });
        }

        // Update password
        await User.changePassword(userId, newPassword);

        // Clear cache
        await cache.delete(`user:profile:${userId}`);

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// ============================================
// ADDRESS MANAGEMENT FUNCTIONS
// ============================================

// Get all addresses
exports.getAddresses = async (req, res) => {
    try {
        const userId = req.userId;
        const addresses = await Address.findByUser(userId);
        res.json({
            success: true,
            data: addresses
        });
    } catch (error) {
        console.error('Get addresses error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get default address
exports.getDefaultAddress = async (req, res) => {
    try {
        const userId = req.userId;
        const address = await Address.getDefaultAddress(userId);
        res.json({
            success: true,
            data: address || null
        });
    } catch (error) {
        console.error('Get default address error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Add new address
exports.addAddress = async (req, res) => {
    try {
        const userId = req.userId;
        const { addressLine1, addressLine2, city, state, postalCode, country, phone, isDefault } = req.body;

        // Check address limit
        const count = await Address.getCount(userId);
        if (count >= 10) {
            return res.status(400).json({
                success: false,
                error: 'Maximum 10 addresses allowed'
            });
        }

        const address = await Address.create({
            userId,
            addressLine1,
            addressLine2,
            city,
            state,
            postalCode,
            country,
            phone,
            isDefault: isDefault || false
        });

        res.status(201).json({
            success: true,
            message: 'Address added successfully',
            data: address
        });
    } catch (error) {
        console.error('Add address error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Update address
exports.updateAddress = async (req, res) => {
    try {
        const addressId = parseInt(req.params.id);
        const userId = req.userId;
        const { addressLine1, addressLine2, city, state, postalCode, country, phone, isDefault } = req.body;

        // Check if address belongs to user
        const existingAddress = await Address.findById(addressId);
        if (!existingAddress || existingAddress.user_id !== userId) {
            return res.status(404).json({
                success: false,
                error: 'Address not found'
            });
        }

        const updateData = {};
        if (addressLine1) updateData.address_line1 = sanitizeInput(addressLine1);
        if (addressLine2) updateData.address_line2 = sanitizeInput(addressLine2);
        if (city) updateData.city = sanitizeInput(city);
        if (state) updateData.state = sanitizeInput(state);
        if (postalCode) updateData.postal_code = sanitizeInput(postalCode);
        if (country) updateData.country = sanitizeInput(country);
        if (phone) updateData.phone = sanitizeInput(phone);
        if (isDefault !== undefined) updateData.is_default = isDefault;

        // If setting as default, update other addresses
        if (isDefault) {
            await Address.setDefault(userId, addressId);
        }

        const address = await Address.update(addressId, updateData);

        res.json({
            success: true,
            message: 'Address updated successfully',
            data: address
        });
    } catch (error) {
        console.error('Update address error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Set address as default
exports.setDefaultAddress = async (req, res) => {
    try {
        const addressId = parseInt(req.params.id);
        const userId = req.userId;

        // Check if address belongs to user
        const existingAddress = await Address.findById(addressId);
        if (!existingAddress || existingAddress.user_id !== userId) {
            return res.status(404).json({
                success: false,
                error: 'Address not found'
            });
        }

        const address = await Address.setDefault(userId, addressId);
        res.json({
            success: true,
            message: 'Default address updated',
            data: address
        });
    } catch (error) {
        console.error('Set default address error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Delete address
exports.deleteAddress = async (req, res) => {
    try {
        const addressId = parseInt(req.params.id);
        const userId = req.userId;

        // Check if address belongs to user
        const existingAddress = await Address.findById(addressId);
        if (!existingAddress || existingAddress.user_id !== userId) {
            return res.status(404).json({
                success: false,
                error: 'Address not found'
            });
        }

        await Address.delete(addressId, userId);

        res.json({
            success: true,
            message: 'Address deleted successfully'
        });
    } catch (error) {
        console.error('Delete address error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// ============================================
// ADMIN ONLY FUNCTIONS
// ============================================

// Get all users (admin)
exports.getAllUsers = async (req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;
        const users = await User.getAll(parseInt(limit), parseInt(offset));
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

// Get user by ID (admin)
exports.getUserById = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Get user stats
        const orderCount = await Order.getUserOrderCount(userId);
        const addressCount = await Address.getCount(userId);
        const orders = await Order.findByUser(userId, 5, 0);

        res.json({
            success: true,
            data: {
                ...user,
                stats: {
                    totalOrders: orderCount,
                    totalAddresses: addressCount
                },
                recentOrders: orders
            }
        });
    } catch (error) {
        console.error('Get user by ID error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Update user role (admin)
exports.updateUserRole = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { role } = req.body;

        // Check if role is valid
        if (!['customer', 'admin', 'super_admin'].includes(role)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid role. Must be: customer, admin, or super_admin'
            });
        }

        // Prevent changing own role
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

// Update user status (admin)
exports.updateUserStatus = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { isActive } = req.body;

        // Prevent deactivating own account
        if (userId === req.userId) {
            return res.status(400).json({
                success: false,
                error: 'You cannot change your own status'
            });
        }

        const user = await User.update(userId, { is_active: isActive });
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Clear cache
        await cache.delete(`user:profile:${userId}`);

        res.json({
            success: true,
            message: `User ${isActive ? 'activated' : 'suspended'} successfully`,
            data: user
        });
    } catch (error) {
        console.error('Update user status error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Delete user (admin)
exports.deleteUser = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);

        // Prevent deleting own account
        if (userId === req.userId) {
            return res.status(400).json({
                success: false,
                error: 'You cannot delete your own account'
            });
        }

        await User.delete(userId);

        // Clear cache
        await cache.delete(`user:profile:${userId}`);

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

// Get user statistics (admin)
exports.getUserStats = async (req, res) => {
    try {
        const stats = await User.getStats();
        
        // Cache for 10 minutes
        await cache.set('user:stats', stats, 600);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Search users (admin)
exports.searchUsers = async (req, res) => {
    try {
        const { query } = req.params;
        const users = await User.search(query);
        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};