const jwt = require('jsonwebtoken');

// ============================================
// JWT HELPERS
// ============================================

// Generate access token
const generateAccessToken = (payload) => {
    return jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

// Generate refresh token
const generateRefreshToken = (payload) => {
    return jwt.sign(
        payload,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { expiresIn: '30d' }
    );
};

// Verify access token
const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return null;
    }
};

// Verify refresh token
const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(
            token,
            process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
        );
    } catch (error) {
        return null;
    }
};

// Decode token without verification
const decodeToken = (token) => {
    return jwt.decode(token);
};

// Check if token is expired
const isTokenExpired = (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return false;
    } catch (error) {
        return error.name === 'TokenExpiredError';
    }
};

// Get remaining time of token
const getTokenRemainingTime = (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const exp = decoded.exp * 1000;
        const now = Date.now();
        return Math.max(0, exp - now);
    } catch (error) {
        return 0;
    }
};

// ============================================
// EXPORT ALL JWT FUNCTIONS
// ============================================

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    decodeToken,
    isTokenExpired,
    getTokenRemainingTime
};