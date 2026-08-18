const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { cache } = require('../config/redis');

// ============================================
// CONTROLLER FUNCTIONS
// ============================================

// Get cart items
exports.getCart = async (req, res) => {
    try {
        const userId = req.userId;

        // Check cache
        const cacheKey = `cart:${userId}`;
        const cachedData = await cache.get(cacheKey);
        
        if (cachedData) {
            return res.json({
                success: true,
                data: cachedData,
                fromCache: true
            });
        }

        const items = await Cart.getUserCart(userId);
        const total = await Cart.getCartTotal(userId);
        const count = await Cart.getCartCount(userId);

        const cartData = {
            items,
            total,
            count
        };

        // Cache for 5 minutes
        await cache.set(cacheKey, cartData, 300);

        res.json({
            success: true,
            data: cartData
        });
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get cart count
exports.getCartCount = async (req, res) => {
    try {
        const userId = req.userId;
        const count = await Cart.getCartCount(userId);
        res.json({
            success: true,
            data: { count }
        });
    } catch (error) {
        console.error('Get cart count error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get cart total
exports.getCartTotal = async (req, res) => {
    try {
        const userId = req.userId;
        const total = await Cart.getCartTotal(userId);
        res.json({
            success: true,
            data: { total }
        });
    } catch (error) {
        console.error('Get cart total error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Add to cart
exports.addToCart = async (req, res) => {
    try {
        const userId = req.userId;
        const { productId, quantity = 1 } = req.body;

        // Validate product exists and has stock
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        if (product.stock < quantity) {
            return res.status(400).json({
                success: false,
                error: `Insufficient stock. Available: ${product.stock}`
            });
        }

        // Check if product is already in cart
        const existing = await Cart.itemExists(userId, productId);
        if (existing) {
            const currentQuantity = await Cart.getProductQuantity(userId, productId);
            const newQuantity = currentQuantity + quantity;
            
            if (newQuantity > product.stock) {
                return res.status(400).json({
                    success: false,
                    error: `Cannot add more. Max available: ${product.stock}`
                });
            }

            await Cart.updateItemQuantity(userId, productId, newQuantity);
        } else {
            await Cart.addItem(userId, productId, quantity);
        }

        // Clear cache
        await cache.delete(`cart:${userId}`);

        res.json({
            success: true,
            message: 'Item added to cart successfully'
        });
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Update cart item quantity
exports.updateCartItem = async (req, res) => {
    try {
        const userId = req.userId;
        const productId = parseInt(req.params.productId);
        const { quantity } = req.body;

        // Validate quantity
        if (quantity < 0) {
            return res.status(400).json({
                success: false,
                error: 'Quantity must be 0 or greater'
            });
        }

        // Check if item exists in cart
        if (!await Cart.itemExists(userId, productId)) {
            return res.status(404).json({
                success: false,
                error: 'Item not found in cart'
            });
        }

        // If quantity is 0, remove item
        if (quantity === 0) {
            await Cart.removeItem(userId, productId);
        } else {
            // Check stock
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    error: 'Product not found'
                });
            }

            if (product.stock < quantity) {
                return res.status(400).json({
                    success: false,
                    error: `Insufficient stock. Available: ${product.stock}`
                });
            }

            await Cart.updateItemQuantity(userId, productId, quantity);
        }

        // Clear cache
        await cache.delete(`cart:${userId}`);

        res.json({
            success: true,
            message: quantity === 0 ? 'Item removed from cart' : 'Cart updated successfully'
        });
    } catch (error) {
        console.error('Update cart item error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
    try {
        const userId = req.userId;
        const productId = parseInt(req.params.productId);

        if (!await Cart.itemExists(userId, productId)) {
            return res.status(404).json({
                success: false,
                error: 'Item not found in cart'
            });
        }

        await Cart.removeItem(userId, productId);

        // Clear cache
        await cache.delete(`cart:${userId}`);

        res.json({
            success: true,
            message: 'Item removed from cart'
        });
    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Clear cart
exports.clearCart = async (req, res) => {
    try {
        const userId = req.userId;
        await Cart.clearCart(userId);

        // Clear cache
        await cache.delete(`cart:${userId}`);

        res.json({
            success: true,
            message: 'Cart cleared successfully'
        });
    } catch (error) {
        console.error('Clear cart error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Checkout
exports.checkout = async (req, res) => {
    try {
        const userId = req.userId;
        const result = await Cart.checkout(userId);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: result.message
            });
        }

        // Clear cache
        await cache.delete(`cart:${userId}`);

        res.json({
            success: true,
            message: 'Checkout successful',
            data: result.items
        });
    } catch (error) {
        console.error('Checkout error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Sync cart (for guest to logged in user)
exports.syncCart = async (req, res) => {
    try {
        const userId = req.userId;
        const { items } = req.body;

        if (!items || !Array.isArray(items)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid items data'
            });
        }

        let addedCount = 0;
        let errorCount = 0;

        for (const item of items) {
            try {
                const product = await Product.findById(item.productId);
                if (product && product.stock >= item.quantity) {
                    await Cart.addItem(userId, item.productId, item.quantity);
                    addedCount++;
                } else {
                    errorCount++;
                }
            } catch (error) {
                errorCount++;
            }
        }

        // Clear cache
        await cache.delete(`cart:${userId}`);

        res.json({
            success: true,
            message: 'Cart synced successfully',
            data: {
                synced: addedCount,
                failed: errorCount
            }
        });
    } catch (error) {
        console.error('Sync cart error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get cart with product details
exports.getCartWithDetails = async (req, res) => {
    try {
        const userId = req.userId;
        const items = await Cart.getUserCart(userId);
        
        // Add product details to each item
        const detailedItems = await Promise.all(items.map(async (item) => {
            const product = await Product.findById(item.product_id);
            return {
                ...item,
                product: product
            };
        }));

        const total = await Cart.getCartTotal(userId);
        const count = await Cart.getCartCount(userId);

        res.json({
            success: true,
            data: {
                items: detailedItems,
                total,
                count
            }
        });
    } catch (error) {
        console.error('Get cart with details error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};