const adminMiddleware = (req, res, next) => {
    // Check if user exists and has admin role
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Access denied. Admin privileges required.'
        });
    }

    next();
};

// Super admin middleware (for critical operations)
const superAdminMiddleware = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }

    if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Access denied. Super admin privileges required.'
        });
    }

    next();
};

// Check if user owns resource or is admin
const ownerOrAdminMiddleware = (req, res, next) => {
    const resourceUserId = parseInt(req.params.userId) || parseInt(req.body.userId);
    
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }

    // Allow if user is admin or owns the resource
    if (req.user.role === 'admin' || req.user.id === resourceUserId) {
        return next();
    }

    return res.status(403).json({
        success: false,
        error: 'Access denied. You can only access your own resources.'
    });
};

module.exports = {
    adminMiddleware,
    superAdminMiddleware,
    ownerOrAdminMiddleware
};