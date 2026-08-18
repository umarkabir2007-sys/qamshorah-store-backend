const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// ============================================
// SECURITY MIDDLEWARE
// ============================================

app.use(helmet());
app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ============================================
// ROUTES (REAL DATABASE CONNECTION)
// ============================================

// Import routes from src folder
try {
    const authRoutes = require('./src/routes/authRoutes');
    const productRoutes = require('./src/routes/productRoutes');
    const orderRoutes = require('./src/routes/orderRoutes');
    const userRoutes = require('./src/routes/userRoutes');
    const cartRoutes = require('./src/routes/cartRoutes');

    // Use routes
    app.use('/api/auth', authRoutes);
    app.use('/api/products', productRoutes);
    app.use('/api/orders', orderRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/cart', cartRoutes);
    
    console.log('✅ Database routes loaded successfully');
} catch (error) {
    console.error('❌ Error loading routes:', error.message);
}

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: '🚀 QAMSHORAH STORE API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        database: process.env.DATABASE_URL ? 'connected' : 'not connected'
    });
});

// ============================================
// FALLBACK ROUTES (for testing)
// ============================================

app.get('/api/products', (req, res) => {
    res.json({
        success: true,
        data: [],
        message: 'Products endpoint - database not connected yet'
    });
});

app.post('/api/auth/register', (req, res) => {
    res.json({
        success: false,
        error: 'Database not connected. Please check your DATABASE_URL environment variable.'
    });
});

app.post('/api/auth/login', (req, res) => {
    res.json({
        success: false,
        error: 'Database not connected. Please check your DATABASE_URL environment variable.'
    });
});

// ============================================
// 404 HANDLER
// ============================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});

// ============================================
// ERROR HANDLER
// ============================================

app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: err.message
    });
});

// ============================================
// EXPORT APP
// ============================================

module.exports = app;
