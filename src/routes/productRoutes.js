const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authMiddleware } = require('../middleware/auth');
const { adminMiddleware } = require('../middleware/admin');
const { validateProduct, validateIdParam, validatePagination } = require('../middleware/validation');
const { apiLimiter } = require('../middleware/rateLimit');
const { uploadSingle, uploadErrorHandler } = require('../middleware/upload');

// ============================================
// PUBLIC ROUTES
// ============================================

// Get all products (with pagination, search, filter)
router.get('/', apiLimiter, validatePagination, productController.getAllProducts);

// Get single product by ID
router.get('/:id', apiLimiter, validateIdParam, productController.getProduct);

// Get product reviews
router.get('/:id/reviews', validateIdParam, productController.getProductReviews);

// Get product categories
router.get('/categories/all', productController.getCategories);

// Get featured products
router.get('/featured/all', productController.getFeaturedProducts);

// Search products
router.get('/search/:query', apiLimiter, productController.searchProducts);

// ============================================
// ADMIN ONLY ROUTES
// ============================================

// Create product
router.post('/', authMiddleware, adminMiddleware, validateProduct, productController.createProduct);

// Update product
router.put('/:id', authMiddleware, adminMiddleware, validateIdParam, validateProduct, productController.updateProduct);

// Delete product (soft delete)
router.delete('/:id', authMiddleware, adminMiddleware, validateIdParam, productController.deleteProduct);

// Hard delete product (permanent)
router.delete('/:id/permanent', authMiddleware, adminMiddleware, validateIdParam, productController.hardDeleteProduct);

// Upload product image
router.post('/:id/upload-image', 
    authMiddleware, 
    adminMiddleware, 
    validateIdParam,
    uploadSingle,
    uploadErrorHandler,
    productController.uploadProductImage
);

// Bulk upload products
router.post('/bulk', authMiddleware, adminMiddleware, productController.bulkUploadProducts);

// Get product statistics (admin)
router.get('/admin/stats', authMiddleware, adminMiddleware, productController.getProductStats);

// Get low stock products (admin)
router.get('/admin/low-stock', authMiddleware, adminMiddleware, productController.getLowStockProducts);

module.exports = router;