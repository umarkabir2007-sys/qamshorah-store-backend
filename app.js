const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({
    origin: '*',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: '🚀 QAMSHORAH STORE API is running',
        timestamp: new Date().toISOString()
    });
});

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Welcome to QAMSHORAH STORE API'
    });
});

// Simple routes (without importing other files)
app.post('/api/auth/register', (req, res) => {
    res.json({ success: true, message: 'Register endpoint - coming soon' });
});

app.post('/api/auth/login', (req, res) => {
    res.json({ success: true, message: 'Login endpoint - coming soon' });
});

app.get('/api/products', (req, res) => {
    res.json({ success: true, data: [], message: 'Products endpoint - coming soon' });
});

module.exports = app;
