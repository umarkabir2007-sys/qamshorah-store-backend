const rateLimit = require('express-rate-limit');

// General API rate limiter - 100 requests per 15 minutes
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: {
        success: false,
        error: 'Too many requests, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipFailedRequests: false,
});

// Auth rate limiter (stricter) - 10 requests per 15 minutes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 requests per window (for login/register)
    message: {
        success: false,
        error: 'Too many authentication attempts, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// API rate limiter (for product routes) - 500 requests per hour
const apiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 500, // 500 requests per hour
    message: {
        success: false,
        error: 'Too many requests, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Admin rate limiter - 200 requests per hour
const adminLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 200, // 200 requests per hour
    message: {
        success: false,
        error: 'Too many admin requests, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Checkout rate limiter - 5 requests per 15 minutes (prevent spam)
const checkoutLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: {
        success: false,
        error: 'Too many checkout attempts, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Strict rate limiter for sensitive operations - 3 requests per minute
const strictLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 3, // 3 requests per minute
    message: {
        success: false,
        error: 'Too many requests, please slow down'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Custom rate limiter with configurable options
const createRateLimiter = (windowMs, max, message) => {
    return rateLimit({
        windowMs,
        max,
        message: {
            success: false,
            error: message || 'Too many requests, please try again later'
        },
        standardHeaders: true,
        legacyHeaders: false,
    });
};

module.exports = {
    generalLimiter,
    authLimiter,
    apiLimiter,
    adminLimiter,
    checkoutLimiter,
    strictLimiter,
    createRateLimiter
};