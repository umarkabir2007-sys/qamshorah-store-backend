const errorHandler = (err, req, res, next) => {
    console.error('========================================');
    console.error('🚨 Error:', err);
    console.error('========================================');
    console.error('📝 Message:', err.message);
    console.error('📂 Stack:', err.stack);
    console.error('📊 Status:', err.status || 500);
    console.error('========================================');
    
    // Database errors
    if (err.code === '23505') { // Unique violation
        return res.status(409).json({
            success: false,
            error: 'Duplicate entry found. This record already exists.'
        });
    }
    
    if (err.code === '23503') { // Foreign key violation
        return res.status(400).json({
            success: false,
            error: 'Referenced record not found. Please check your input.'
        });
    }
    
    if (err.code === '23502') { // Not null violation
        return res.status(400).json({
            success: false,
            error: 'Required field is missing. Please check your input.'
        });
    }
    
    if (err.code === '22P02') { // Invalid input syntax
        return res.status(400).json({
            success: false,
            error: 'Invalid data format provided.'
        });
    }
    
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            error: 'Invalid authentication token. Please login again.'
        });
    }
    
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            error: 'Authentication token expired. Please login again.'
        });
    }
    
    // Validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            error: err.message
        });
    }
    
    // Multer errors (file upload)
    if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'File size too large. Maximum size is 5MB.'
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                error: 'Too many files uploaded.'
            });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                error: 'Unexpected file field.'
            });
        }
        return res.status(400).json({
            success: false,
            error: 'File upload error: ' + err.message
        });
    }
    
    // Rate limiting errors
    if (err.name === 'RateLimitError') {
        return res.status(429).json({
            success: false,
            error: 'Too many requests. Please slow down and try again later.'
        });
    }
    
    // Default error response
    const statusCode = err.status || 500;
    const message = process.env.NODE_ENV === 'production' 
        ? 'Internal server error. Please try again later.'
        : err.message || 'Something went wrong';
    
    res.status(statusCode).json({
        success: false,
        error: message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
};

// 404 handler
const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method
    });
};

// Async wrapper to catch errors in async functions
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

module.exports = {
    errorHandler,
    notFoundHandler,
    asyncHandler
};