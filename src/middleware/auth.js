const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Main authentication middleware
const authMiddleware = async (req, res, next) => {
    try {
        // Get token from cookie or Authorization header
        let token = req.cookies?.token;
        
        if (!token && req.headers.authorization) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required. Please login.'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if user still exists
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'User no longer exists'
            });
        }

        // Attach user info to request
        req.user = decoded;
        req.userId = decoded.id;
        req.userRole = decoded.role;
        
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: 'Invalid token. Please login again.'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Token expired. Please login again.'
            });
        }
        console.error('Auth error:', error);
        return res.status(500).json({
            success: false,
            error: 'Authentication error'
        });
    }
};

// Optional auth middleware (doesn't throw error if no token)
const optionalAuthMiddleware = async (req, res, next) => {
    try {
        let token = req.cookies?.token;
        
        if (!token && req.headers.authorization) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);
            if (user) {
                req.user = decoded;
                req.userId = decoded.id;
            }
        }
        next();
    } catch (error) {
        // Just continue without user
        next();
    }
};

// Verify email middleware
const verifiedMiddleware = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'User not found'
            });
        }

        if (!user.is_verified) {
            return res.status(403).json({
                success: false,
                error: 'Please verify your email first'
            });
        }

        next();
    } catch (error) {
        console.error('Verify middleware error:', error);
        res.status(500).json({
            success: false,
            error: 'Verification error'
        });
    }
};

// Refresh token middleware
const refreshTokenMiddleware = async (req, res, next) => {
    try {
        const refreshToken = req.cookies?.refreshToken;
        
        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                error: 'Refresh token required'
            });
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid refresh token'
            });
        }

        req.userId = decoded.id;
        next();
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(401).json({
            success: false,
            error: 'Invalid or expired refresh token'
        });
    }
};

module.exports = {
    authMiddleware,
    optionalAuthMiddleware,
    verifiedMiddleware,
    refreshTokenMiddleware
};