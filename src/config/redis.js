const redis = require('redis');
const dotenv = require('dotenv');

dotenv.config();

// Create Redis client
const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD || undefined,
});

// Handle errors
redisClient.on('error', (err) => {
    console.log('❌ Redis Client Error:', err);
});

redisClient.on('connect', () => {
    console.log('✅ Connected to Redis successfully');
});

// Connect to Redis
(async () => {
    try {
        await redisClient.connect();
    } catch (error) {
        console.log('⚠️ Redis connection failed. Running without cache.');
    }
})();

// Cache functions
const cache = {
    // Set cache with expiration (seconds)
    set: async (key, value, expiration = 3600) => {
        try {
            await redisClient.setEx(key, expiration, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Cache set error:', error);
            return false;
        }
    },

    // Get cache
    get: async (key) => {
        try {
            const data = await redisClient.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    },

    // Delete cache
    delete: async (key) => {
        try {
            await redisClient.del(key);
            return true;
        } catch (error) {
            console.error('Cache delete error:', error);
            return false;
        }
    },

    // Clear all cache
    clear: async () => {
        try {
            await redisClient.flushAll();
            return true;
        } catch (error) {
            console.error('Cache clear error:', error);
            return false;
        }
    }
};

module.exports = { redisClient, cache };