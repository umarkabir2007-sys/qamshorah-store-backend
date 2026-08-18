const crypto = require('crypto');

// ============================================
// STRING HELPERS
// ============================================

// Generate random string
const generateRandomString = (length = 32) => {
    return crypto.randomBytes(length).toString('hex');
};

// Generate unique ID
const generateUniqueId = (prefix = '') => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}${timestamp}${random}`.toUpperCase();
};

// Slugify string
const slugify = (text) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
};

// Truncate text
const truncateText = (text, maxLength = 100, suffix = '...') => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + suffix;
};

// Capitalize first letter
const capitalize = (text) => {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

// ============================================
// NUMBER HELPERS
// ============================================

// Format currency
const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency
    }).format(amount);
};

// Calculate percentage
const calculatePercentage = (part, total) => {
    if (total === 0) return 0;
    return (part / total) * 100;
};

// Round to decimal places
const roundToDecimal = (number, decimals = 2) => {
    const factor = Math.pow(10, decimals);
    return Math.round(number * factor) / factor;
};

// Get random number between min and max
const randomBetween = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

// ============================================
// DATE HELPERS
// ============================================

// Format date
const formatDate = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
};

// Get date difference in days
const daysBetween = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Check if date is in past
const isPastDate = (date) => {
    return new Date(date) < new Date();
};

// Check if date is in future
const isFutureDate = (date) => {
    return new Date(date) > new Date();
};

// ============================================
// ARRAY HELPERS
// ============================================

// Chunk array into smaller arrays
const chunkArray = (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
};

// Remove duplicates from array
const uniqueArray = (array) => {
    return [...new Set(array)];
};

// Shuffle array
const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

// ============================================
// OBJECT HELPERS
// ============================================

// Pick specific keys from object
const pickObject = (obj, keys) => {
    const result = {};
    keys.forEach(key => {
        if (obj.hasOwnProperty(key)) {
            result[key] = obj[key];
        }
    });
    return result;
};

// Omit specific keys from object
const omitObject = (obj, keys) => {
    const result = { ...obj };
    keys.forEach(key => {
        delete result[key];
    });
    return result;
};

// Deep clone object
const deepClone = (obj) => {
    return JSON.parse(JSON.stringify(obj));
};

// ============================================
// FILE HELPERS
// ============================================

// Get file extension
const getFileExtension = (filename) => {
    return filename.split('.').pop();
};

// Get file name without extension
const getFileNameWithoutExtension = (filename) => {
    return filename.substring(0, filename.lastIndexOf('.')) || filename;
};

// Check if file is image
const isImageFile = (filename) => {
    const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
    const ext = getFileExtension(filename).toLowerCase();
    return extensions.includes(ext);
};

// ============================================
// URL HELPERS
// ============================================

// Build URL with query parameters
const buildUrl = (baseUrl, params) => {
    const url = new URL(baseUrl);
    Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
            url.searchParams.append(key, params[key]);
        }
    });
    return url.toString();
};

// Extract domain from URL
const extractDomain = (url) => {
    try {
        const domain = new URL(url).hostname;
        return domain.replace('www.', '');
    } catch {
        return null;
    }
};

// ============================================
// EXPORT ALL HELPERS
// ============================================

module.exports = {
    // String helpers
    generateRandomString,
    generateUniqueId,
    slugify,
    truncateText,
    capitalize,
    
    // Number helpers
    formatCurrency,
    calculatePercentage,
    roundToDecimal,
    randomBetween,
    
    // Date helpers
    formatDate,
    daysBetween,
    isPastDate,
    isFutureDate,
    
    // Array helpers
    chunkArray,
    uniqueArray,
    shuffleArray,
    
    // Object helpers
    pickObject,
    omitObject,
    deepClone,
    
    // File helpers
    getFileExtension,
    getFileNameWithoutExtension,
    isImageFile,
    
    // URL helpers
    buildUrl,
    extractDomain
};