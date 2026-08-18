const validator = require('validator');

// ============================================
// VALIDATION FUNCTIONS
// ============================================

// Validate email
const validateEmail = (email) => {
    return validator.isEmail(email);
};

// Validate password (min 6 chars, at least 1 number and 1 letter)
const validatePassword = (password) => {
    return password.length >= 6 && /\d/.test(password) && /[a-zA-Z]/.test(password);
};

// Validate phone number
const validatePhone = (phone) => {
    return validator.isMobilePhone(phone) || validator.isLength(phone, { min: 10, max: 15 });
};

// Validate product price
const validatePrice = (price) => {
    return !isNaN(price) && price > 0;
};

// Validate URL
const validateUrl = (url) => {
    return validator.isURL(url);
};

// Validate postal code
const validatePostalCode = (postalCode) => {
    return validator.isPostalCode(postalCode, 'any');
};

// Sanitize input
const sanitizeInput = (input) => {
    if (typeof input === 'string') {
        return validator.escape(input.trim());
    }
    return input;
};

// ============================================
// VALIDATION MIDDLEWARE
// ============================================

// Register validation
const validateRegister = (req, res, next) => {
    const { fullName, email, password } = req.body;
    
    if (!fullName || fullName.length < 2) {
        return res.status(400).json({
            success: false,
            error: 'Full name must be at least 2 characters'
        });
    }
    
    if (!email || !validateEmail(email)) {
        return res.status(400).json({
            success: false,
            error: 'Please provide a valid email address'
        });
    }
    
    if (!password || !validatePassword(password)) {
        return res.status(400).json({
            success: false,
            error: 'Password must be at least 6 characters and contain at least one number and one letter'
        });
    }
    
    // Sanitize inputs
    req.body.fullName = sanitizeInput(fullName);
    req.body.email = sanitizeInput(email);
    
    next();
};

// Login validation
const validateLogin = (req, res, next) => {
    const { email, password } = req.body;
    
    if (!email || !validateEmail(email)) {
        return res.status(400).json({
            success: false,
            error: 'Please provide a valid email address'
        });
    }
    
    if (!password || password.length < 1) {
        return res.status(400).json({
            success: false,
            error: 'Password is required'
        });
    }
    
    req.body.email = sanitizeInput(email);
    next();
};

// Product validation
const validateProduct = (req, res, next) => {
    const { name, description, price, stock, category } = req.body;
    
    if (!name || name.length < 3) {
        return res.status(400).json({
            success: false,
            error: 'Product name must be at least 3 characters'
        });
    }
    
    if (!price || !validatePrice(price)) {
        return res.status(400).json({
            success: false,
            error: 'Please provide a valid product price'
        });
    }
    
    if (stock === undefined || stock < 0 || isNaN(stock)) {
        return res.status(400).json({
            success: false,
            error: 'Please provide a valid stock quantity'
        });
    }
    
    if (description && description.length > 5000) {
        return res.status(400).json({
            success: false,
            error: 'Description cannot exceed 5000 characters'
        });
    }
    
    // Sanitize
    req.body.name = sanitizeInput(name);
    if (description) req.body.description = sanitizeInput(description);
    if (category) req.body.category = sanitizeInput(category);
    
    next();
};

// Address validation
const validateAddress = (req, res, next) => {
    const { addressLine1, city, state, postalCode, country, phone } = req.body;
    
    if (!addressLine1 || addressLine1.length < 5) {
        return res.status(400).json({
            success: false,
            error: 'Address line 1 is required and must be at least 5 characters'
        });
    }
    
    if (!city || city.length < 2) {
        return res.status(400).json({
            success: false,
            error: 'City is required'
        });
    }
    
    if (!state || state.length < 2) {
        return res.status(400).json({
            success: false,
            error: 'State/Province is required'
        });
    }
    
    if (!postalCode || !validatePostalCode(postalCode)) {
        return res.status(400).json({
            success: false,
            error: 'Please provide a valid postal code'
        });
    }
    
    if (!country || country.length < 2) {
        return res.status(400).json({
            success: false,
            error: 'Country is required'
        });
    }
    
    if (phone && !validatePhone(phone)) {
        return res.status(400).json({
            success: false,
            error: 'Please provide a valid phone number'
        });
    }
    
    // Sanitize
    req.body.addressLine1 = sanitizeInput(addressLine1);
    req.body.city = sanitizeInput(city);
    req.body.state = sanitizeInput(state);
    req.body.country = sanitizeInput(country);
    if (phone) req.body.phone = sanitizeInput(phone);
    
    next();
};

// Review validation
const validateReview = (req, res, next) => {
    const { rating, title, comment } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({
            success: false,
            error: 'Rating must be between 1 and 5'
        });
    }
    
    if (comment && comment.length > 1000) {
        return res.status(400).json({
            success: false,
            error: 'Comment cannot exceed 1000 characters'
        });
    }
    
    if (title && title.length > 100) {
        return res.status(400).json({
            success: false,
            error: 'Title cannot exceed 100 characters'
        });
    }
    
    // Sanitize
    if (title) req.body.title = sanitizeInput(title);
    if (comment) req.body.comment = sanitizeInput(comment);
    
    next();
};

// Order validation
const validateOrder = (req, res, next) => {
    const { shippingAddress, paymentMethod } = req.body;
    
    if (!shippingAddress || typeof shippingAddress !== 'object') {
        return res.status(400).json({
            success: false,
            error: 'Shipping address is required'
        });
    }
    
    if (!paymentMethod || !['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash_on_delivery'].includes(paymentMethod)) {
        return res.status(400).json({
            success: false,
            error: 'Please select a valid payment method'
        });
    }
    
    next();
};

// Password reset validation
const validatePasswordReset = (req, res, next) => {
    const { password, confirmPassword } = req.body;
    
    if (!password || !validatePassword(password)) {
        return res.status(400).json({
            success: false,
            error: 'Password must be at least 6 characters and contain at least one number and one letter'
        });
    }
    
    if (password !== confirmPassword) {
        return res.status(400).json({
            success: false,
            error: 'Passwords do not match'
        });
    }
    
    next();
};

// Validate ID parameter
const validateIdParam = (req, res, next) => {
    const id = parseInt(req.params.id);
    if (!id || isNaN(id) || id <= 0) {
        return res.status(400).json({
            success: false,
            error: 'Invalid ID parameter'
        });
    }
    req.params.id = id;
    next();
};

// Validate pagination parameters
const validatePagination = (req, res, next) => {
    const limit = parseInt(req.query.limit);
    const offset = parseInt(req.query.offset);
    
    if (limit && (isNaN(limit) || limit < 1 || limit > 100)) {
        return res.status(400).json({
            success: false,
            error: 'Limit must be between 1 and 100'
        });
    }
    
    if (offset && (isNaN(offset) || offset < 0)) {
        return res.status(400).json({
            success: false,
            error: 'Offset must be a positive number'
        });
    }
    
    req.query.limit = limit || 50;
    req.query.offset = offset || 0;
    next();
};

module.exports = {
    validateEmail,
    validatePassword,
    validatePhone,
    validatePrice,
    validateUrl,
    validatePostalCode,
    sanitizeInput,
    validateRegister,
    validateLogin,
    validateProduct,
    validateAddress,
    validateReview,
    validateOrder,
    validatePasswordReset,
    validateIdParam,
    validatePagination
};