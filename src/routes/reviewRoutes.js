const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authMiddleware } = require('../middleware/auth');
const { adminMiddleware } = require('../middleware/admin');
const { validateReview, validateIdParam, validatePagination } = require('../middleware/validation');

// ============================================
// PUBLIC ROUTES
// ============================================

// Get all reviews for a product
router.get('/product/:productId', validateIdParam, validatePagination, reviewController.getProductReviews);

// Get product rating summary
router.get('/product/:productId/rating', validateIdParam, reviewController.getProductRatingSummary);

// ============================================
// PROTECTED ROUTES (User must be logged in)
// ============================================

// Create review
router.post('/', authMiddleware, validateReview, reviewController.createReview);

// Update review
router.put('/:id', authMiddleware, validateIdParam, validateReview, reviewController.updateReview);

// Delete review
router.delete('/:id', authMiddleware, validateIdParam, reviewController.deleteReview);

// Get user's reviews
router.get('/my-reviews', authMiddleware, validatePagination, reviewController.getMyReviews);

// Check if user has reviewed a product
router.get('/check/:productId', authMiddleware, validateIdParam, reviewController.hasReviewed);

// ============================================
// ADMIN ONLY ROUTES
// ============================================

// Get all reviews (admin)
router.get('/admin/all', authMiddleware, adminMiddleware, validatePagination, reviewController.getAllReviews);

// Delete any review (admin)
router.delete('/admin/:id', authMiddleware, adminMiddleware, validateIdParam, reviewController.adminDeleteReview);

// Get review statistics (admin)
router.get('/admin/stats', authMiddleware, adminMiddleware, reviewController.getReviewStats);

// Get latest reviews (admin)
router.get('/admin/latest', authMiddleware, adminMiddleware, reviewController.getLatestReviews);

module.exports = router;