const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { cache } = require('../config/redis');

// ============================================
// CONTROLLER FUNCTIONS
// ============================================

// Create review
exports.createReview = async (req, res) => {
    try {
        const userId = req.userId;
        const { productId, rating, title, comment } = req.body;

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        // Check if user has purchased this product
        const hasPurchased = await Order.hasUserPurchasedProduct(userId, productId);
        if (!hasPurchased) {
            return res.status(400).json({
                success: false,
                error: 'You can only review products you have purchased'
            });
        }

        // Check if user already reviewed this product
        const hasReviewed = await Review.hasUserReviewed(userId, productId);
        if (hasReviewed) {
            return res.status(400).json({
                success: false,
                error: 'You have already reviewed this product'
            });
        }

        const review = await Review.create({
            userId,
            productId,
            rating,
            title,
            comment
        });

        // Clear cache
        await cache.delete(`reviews:product:${productId}`);
        await cache.delete(`product:${productId}`);

        res.status(201).json({
            success: true,
            message: 'Review created successfully',
            data: review
        });
    } catch (error) {
        console.error('Create review error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get product reviews
exports.getProductReviews = async (req, res) => {
    try {
        const productId = parseInt(req.params.productId);
        const { limit = 50, offset = 0 } = req.query;

        // Check cache
        const cacheKey = `reviews:product:${productId}:${limit}:${offset}`;
        const cachedData = await cache.get(cacheKey);
        
        if (cachedData) {
            return res.json({
                success: true,
                data: cachedData,
                fromCache: true
            });
        }

        const reviews = await Review.findByProduct(productId, parseInt(limit), parseInt(offset));
        const total = await Review.getCountByProduct(productId);

        const response = {
            reviews,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                pages: Math.ceil(total / parseInt(limit))
            }
        };

        // Cache for 5 minutes
        await cache.set(cacheKey, response, 300);

        res.json({
            success: true,
            data: response
        });
    } catch (error) {
        console.error('Get product reviews error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get product rating summary
exports.getProductRatingSummary = async (req, res) => {
    try {
        const productId = parseInt(req.params.productId);

        // Check cache
        const cacheKey = `reviews:rating:${productId}`;
        const cachedData = await cache.get(cacheKey);
        
        if (cachedData) {
            return res.json({
                success: true,
                data: cachedData,
                fromCache: true
            });
        }

        const summary = await Review.getProductRatingSummary(productId);

        // Cache for 10 minutes
        await cache.set(cacheKey, summary, 600);

        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error('Get product rating summary error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Update review
exports.updateReview = async (req, res) => {
    try {
        const reviewId = parseInt(req.params.id);
        const userId = req.userId;
        const { rating, title, comment } = req.body;

        // Check if review exists and belongs to user
        const existingReview = await Review.findById(reviewId);
        if (!existingReview) {
            return res.status(404).json({
                success: false,
                error: 'Review not found'
            });
        }

        if (existingReview.user_id !== userId) {
            return res.status(403).json({
                success: false,
                error: 'You can only update your own reviews'
            });
        }

        const review = await Review.update(reviewId, userId, { rating, title, comment });

        // Clear cache
        await cache.delete(`reviews:product:${existingReview.product_id}`);
        await cache.delete(`reviews:rating:${existingReview.product_id}`);
        await cache.delete(`product:${existingReview.product_id}`);

        res.json({
            success: true,
            message: 'Review updated successfully',
            data: review
        });
    } catch (error) {
        console.error('Update review error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Delete review
exports.deleteReview = async (req, res) => {
    try {
        const reviewId = parseInt(req.params.id);
        const userId = req.userId;

        const existingReview = await Review.findById(reviewId);
        if (!existingReview) {
            return res.status(404).json({
                success: false,
                error: 'Review not found'
            });
        }

        if (existingReview.user_id !== userId) {
            return res.status(403).json({
                success: false,
                error: 'You can only delete your own reviews'
            });
        }

        await Review.delete(reviewId, userId);

        // Clear cache
        await cache.delete(`reviews:product:${existingReview.product_id}`);
        await cache.delete(`reviews:rating:${existingReview.product_id}`);
        await cache.delete(`product:${existingReview.product_id}`);

        res.json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get user's reviews
exports.getMyReviews = async (req, res) => {
    try {
        const userId = req.userId;
        const { limit = 50, offset = 0 } = req.query;

        const reviews = await Review.findByUser(userId, parseInt(limit), parseInt(offset));
        res.json({
            success: true,
            data: reviews
        });
    } catch (error) {
        console.error('Get my reviews error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Check if user has reviewed a product
exports.hasReviewed = async (req, res) => {
    try {
        const userId = req.userId;
        const productId = parseInt(req.params.productId);

        const hasReviewed = await Review.hasUserReviewed(userId, productId);
        res.json({
            success: true,
            data: { hasReviewed }
        });
    } catch (error) {
        console.error('Check has reviewed error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// ============================================
// ADMIN ONLY FUNCTIONS
// ============================================

// Get all reviews (admin)
exports.getAllReviews = async (req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;
        const reviews = await Review.getLatest(parseInt(limit));
        res.json({
            success: true,
            data: reviews
        });
    } catch (error) {
        console.error('Get all reviews error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Delete any review (admin)
exports.adminDeleteReview = async (req, res) => {
    try {
        const reviewId = parseInt(req.params.id);
        const existingReview = await Review.findById(reviewId);
        
        if (!existingReview) {
            return res.status(404).json({
                success: false,
                error: 'Review not found'
            });
        }

        await Review.delete(reviewId, existingReview.user_id);

        // Clear cache
        await cache.delete(`reviews:product:${existingReview.product_id}`);
        await cache.delete(`reviews:rating:${existingReview.product_id}`);
        await cache.delete(`product:${existingReview.product_id}`);

        res.json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        console.error('Admin delete review error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get review statistics (admin)
exports.getReviewStats = async (req, res) => {
    try {
        const stats = await Review.getStats();
        
        // Cache for 10 minutes
        await cache.set('reviews:stats', stats, 600);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Get review stats error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get latest reviews (admin)
exports.getLatestReviews = async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const reviews = await Review.getLatest(parseInt(limit));
        res.json({
            success: true,
            data: reviews
        });
    } catch (error) {
        console.error('Get latest reviews error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};