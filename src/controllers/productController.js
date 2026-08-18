const Product = require('../models/Product');
const { cache } = require('../config/redis');

// ============================================
// CONTROLLER FUNCTIONS
// ============================================

// Get all products
exports.getAllProducts = async (req, res) => {
    try {
        const { 
            limit, 
            offset, 
            category, 
            search, 
            featured, 
            sort, 
            order,
            minPrice,
            maxPrice
        } = req.query;
        
        // Check cache
        const cacheKey = `products:${JSON.stringify(req.query)}`;
        const cachedData = await cache.get(cacheKey);
        
        if (cachedData) {
            return res.json({
                success: true,
                data: cachedData.data,
                pagination: cachedData.pagination,
                fromCache: true
            });
        }

        const products = await Product.getAll({
            limit: parseInt(limit) || 50,
            offset: parseInt(offset) || 0,
            category,
            search,
            featured: featured === 'true',
            sort: sort || 'created_at',
            order: order || 'DESC',
            minPrice: minPrice ? parseFloat(minPrice) : null,
            maxPrice: maxPrice ? parseFloat(maxPrice) : null
        });

        const total = await Product.getCount({ 
            category, 
            search,
            minPrice: minPrice ? parseFloat(minPrice) : null,
            maxPrice: maxPrice ? parseFloat(maxPrice) : null
        });

        const response = {
            data: products,
            pagination: {
                total,
                limit: parseInt(limit) || 50,
                offset: parseInt(offset) || 0,
                pages: Math.ceil(total / (parseInt(limit) || 50))
            }
        };

        // Cache for 5 minutes
        await cache.set(cacheKey, response, 300);

        res.json({
            success: true,
            ...response
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get single product
exports.getProduct = async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        
        // Check cache
        const cacheKey = `product:${productId}`;
        const cachedProduct = await cache.get(cacheKey);
        
        if (cachedProduct) {
            return res.json({
                success: true,
                data: cachedProduct,
                fromCache: true
            });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        // Increment views
        await Product.incrementViews(productId);

        // Cache for 10 minutes
        await cache.set(cacheKey, product, 600);

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Create product (admin only)
exports.createProduct = async (req, res) => {
    try {
        const product = await Product.create(req.body);
        
        // Clear product cache
        await cache.delete('products:*');

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: product
        });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Update product (admin only)
exports.updateProduct = async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const product = await Product.update(productId, req.body);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        // Clear cache
        await cache.delete(`product:${productId}`);
        await cache.delete('products:*');

        res.json({
            success: true,
            message: 'Product updated successfully',
            data: product
        });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Delete product (soft delete)
exports.deleteProduct = async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        await Product.delete(productId);

        // Clear cache
        await cache.delete(`product:${productId}`);
        await cache.delete('products:*');

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Hard delete product (admin only)
exports.hardDeleteProduct = async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        await Product.hardDelete(productId);

        // Clear cache
        await cache.delete(`product:${productId}`);
        await cache.delete('products:*');

        res.json({
            success: true,
            message: 'Product permanently deleted'
        });
    } catch (error) {
        console.error('Hard delete product error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Upload product image (admin only)
exports.uploadProductImage = async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No image file uploaded'
            });
        }

        // TODO: Upload to Cloudinary
        // const result = await uploadImage(req.file.path);
        
        // Update product with image URL
        const product = await Product.update(productId, {
            image_url: req.file.path // Replace with Cloudinary URL
        });

        // Clear cache
        await cache.delete(`product:${productId}`);

        res.json({
            success: true,
            message: 'Image uploaded successfully',
            data: product
        });
    } catch (error) {
        console.error('Upload image error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Bulk upload products (admin only)
exports.bulkUploadProducts = async (req, res) => {
    try {
        const { products } = req.body;
        
        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Please provide an array of products'
            });
        }

        if (products.length > 100) {
            return res.status(400).json({
                success: false,
                error: 'Maximum 100 products per bulk upload'
            });
        }

        const results = [];
        for (const productData of products) {
            try {
                const product = await Product.create(productData);
                results.push({ success: true, product });
            } catch (error) {
                results.push({ 
                    success: false, 
                    error: error.message,
                    data: productData 
                });
            }
        }

        // Clear cache
        await cache.delete('products:*');

        res.json({
            success: true,
            message: 'Bulk upload completed',
            data: {
                total: results.length,
                successful: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length,
                results
            }
        });
    } catch (error) {
        console.error('Bulk upload error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get product reviews
exports.getProductReviews = async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const reviews = await Product.getReviews(productId);
        res.json({
            success: true,
            data: reviews
        });
    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get categories
exports.getCategories = async (req, res) => {
    try {
        const categories = await Product.getCategories();
        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get featured products
exports.getFeaturedProducts = async (req, res) => {
    try {
        const products = await Product.getAll({ 
            featured: true, 
            limit: 10 
        });
        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('Get featured products error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Search products
exports.searchProducts = async (req, res) => {
    try {
        const { query } = req.params;
        const products = await Product.getAll({ 
            search: query,
            limit: 50
        });
        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('Search products error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get product statistics (admin)
exports.getProductStats = async (req, res) => {
    try {
        const stats = await Product.getStats();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Get product stats error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get low stock products (admin)
exports.getLowStockProducts = async (req, res) => {
    try {
        const products = await Product.getAll({ 
            limit: 100,
            sort: 'stock',
            order: 'ASC'
        });
        const lowStock = products.filter(p => p.stock <= 10);
        res.json({
            success: true,
            data: lowStock
        });
    } catch (error) {
        console.error('Get low stock products error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};