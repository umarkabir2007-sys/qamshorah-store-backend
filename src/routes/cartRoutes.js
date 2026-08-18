const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authMiddleware } = require('../middleware/auth');
const { validateIdParam } = require('../middleware/validation');

// ============================================
// ALL ROUTES ARE PROTECTED (User must be logged in)
// ============================================

// Get cart items
router.get('/', authMiddleware, cartController.getCart);

// Get cart count
router.get('/count', authMiddleware, cartController.getCartCount);

// Get cart total
router.get('/total', authMiddleware, cartController.getCartTotal);

// Add item to cart
router.post('/add', authMiddleware, cartController.addToCart);

// Update cart item quantity
router.put('/update/:productId', authMiddleware, validateIdParam, cartController.updateCartItem);

// Remove item from cart
router.delete('/remove/:productId', authMiddleware, validateIdParam, cartController.removeFromCart);

// Clear entire cart
router.delete('/clear', authMiddleware, cartController.clearCart);

// Move cart items to orders (checkout)
router.post('/checkout', authMiddleware, cartController.checkout);

// Sync cart (for guest to logged in user)
router.post('/sync', authMiddleware, cartController.syncCart);

// Get cart items with product details
router.get('/details', authMiddleware, cartController.getCartWithDetails);

module.exports = router;