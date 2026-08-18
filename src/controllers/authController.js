const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { validateEmail, validatePassword, sanitizeInput } = require('../middleware/validation');

// ============================================
// HELPER FUNCTIONS
// ============================================

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user.id, 
            email: user.email, 
            role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

// Generate refresh token
const generateRefreshToken = (user) => {
    return jwt.sign(
        { id: user.id },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { expiresIn: '30d' }
    );
};

// Set cookie
const setTokenCookie = (res, token, refreshToken = null) => {
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    if (refreshToken) {
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });
    }
};

// Generate verification token
const generateVerificationToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// ============================================
// CONTROLLER FUNCTIONS
// ============================================

// Register
exports.register = async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        // Check if user exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'Email already registered'
            });
        }

        // Generate verification token
        const verificationToken = generateVerificationToken();

        // Create user
        const user = await User.create({ 
            fullName, 
            email, 
            password,
            verificationToken
        });

        // Generate tokens
        const token = generateToken(user);
        const refreshToken = generateRefreshToken(user);
        setTokenCookie(res, token, refreshToken);

        // TODO: Send verification email
        // await sendVerificationEmail(email, verificationToken);

        // Return response
        res.status(201).json({
            success: true,
            message: 'User registered successfully. Please verify your email.',
            data: {
                user: {
                    id: user.id,
                    fullName: user.full_name,
                    email: user.email,
                    role: user.role,
                    isVerified: user.is_verified
                },
                token,
                refreshToken
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Check password
        const isValid = await User.comparePassword(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Update last login
        await User.updateLastLogin(user.id);

        // Generate tokens
        const token = generateToken(user);
        const refreshToken = generateRefreshToken(user);
        setTokenCookie(res, token, refreshToken);

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user.id,
                    fullName: user.full_name,
                    email: user.email,
                    role: user.role,
                    isVerified: user.is_verified
                },
                token,
                refreshToken
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Logout
exports.logout = async (req, res) => {
    res.clearCookie('token');
    res.clearCookie('refreshToken');
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
};

// Get current user
exports.getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Update profile
exports.updateProfile = async (req, res) => {
    try {
        const { fullName, email, phone, bio } = req.body;
        const userId = req.userId;

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

// Refresh token
exports.refreshToken = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const token = generateToken(user);
        const refreshToken = generateRefreshToken(user);
        setTokenCookie(res, token, refreshToken);

        res.json({
            success: true,
            data: { token, refreshToken }
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Verify email
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;
        
        // Find user by verification token
        const user = await User.findByVerificationToken(token);
        if (!user) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or expired verification token'
            });
        }

        // Update user as verified
        await User.update(user.id, { 
            is_verified: true, 
            verification_token: null 
        });

        res.json({
            success: true,
            message: 'Email verified successfully'
        });
    } catch (error) {
        console.error('Verify email error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Send verification email
exports.sendVerificationEmail = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        if (user.is_verified) {
            return res.status(400).json({
                success: false,
                error: 'Email already verified'
            });
        }

        // Generate new verification token
        const verificationToken = generateVerificationToken();
        await User.update(user.id, { verification_token: verificationToken });

        // TODO: Send verification email
        // await sendVerificationEmail(user.email, verificationToken);

        res.json({
            success: true,
            message: 'Verification email sent'
        });
    } catch (error) {
        console.error('Send verification error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findByEmail(email);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 3600000); // 1 hour

        await User.update(user.id, {
            reset_password_token: resetToken,
            reset_password_expires: resetExpires
        });

        // TODO: Send email with reset link
        // await sendPasswordResetEmail(user.email, resetToken);

        res.json({
            success: true,
            message: 'Password reset email sent',
            data: { resetToken } // Remove in production
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Reset password
exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        // Find user by reset token
        const user = await User.findByResetToken(token);
        if (!user) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or expired reset token'
            });
        }

        // Update password
        await User.changePassword(user.id, password);

        // Clear reset token
        await User.update(user.id, {
            reset_password_token: null,
            reset_password_expires: null
        });

        res.json({
            success: true,
            message: 'Password reset successfully'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Check if email exists
exports.checkEmailExists = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findByEmail(email);
        
        res.json({
            success: true,
            data: {
                exists: !!user,
                isVerified: user ? user.is_verified : false
            }
        });
    } catch (error) {
        console.error('Check email error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};