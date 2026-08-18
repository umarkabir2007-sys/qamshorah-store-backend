const validator = require('validator');

// ============================================
// CUSTOM VALIDATORS
// ============================================

// Validate password strength
const validatePasswordStrength = (password) => {
    const checks = {
        minLength: password.length >= 8,
        hasUpperCase: /[A-Z]/.test(password),
        hasLowerCase: /[a-z]/.test(password),
        hasNumber: /\d/.test(password),
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const passed = Object.values(checks).filter(Boolean).length;
    const strength = passed <= 2 ? 'weak' : passed <= 4 ? 'medium' : 'strong';

    return {
        ...checks,
        strength,
        score: passed,
        isValid: passed >= 4
    };
};

// Validate phone number
const validatePhoneNumber = (phone) => {
    return validator.isMobilePhone(phone, 'any') || validator.isLength(phone, { min: 10, max: 15 });
};

// Validate postal code
const validatePostalCode = (postalCode, country = 'any') => {
    return validator.isPostalCode(postalCode, country);
};

// Validate credit card
const validateCreditCard = (cardNumber) => {
    return validator.isCreditCard(cardNumber);
};

// Validate UUID
const validateUUID = (uuid) => {
    return validator.isUUID(uuid);
};

// Validate hex color
const validateHexColor = (color) => {
    return validator.isHexColor(color);
};

// Validate ISBN
const validateISBN = (isbn) => {
    return validator.isISBN(isbn);
};

// Validate IP address
const validateIPAddress = (ip) => {
    return validator.isIP(ip);
};

// Validate MAC address
const validateMACAddress = (mac) => {
    return validator.isMACAddress(mac);
};

// Validate date string
const validateDate = (date) => {
    return validator.isDate(date);
};

// Validate JSON
const validateJSON = (str) => {
    try {
        JSON.parse(str);
        return true;
    } catch {
        return false;
    }
};

// Validate base64
const validateBase64 = (str) => {
    return validator.isBase64(str);
};

// Validate alpha (letters only)
const validateAlpha = (str) => {
    return validator.isAlpha(str, 'en-US', { ignore: ' ' });
};

// Validate alphanumeric
const validateAlphanumeric = (str) => {
    return validator.isAlphanumeric(str, 'en-US', { ignore: ' ' });
};

// ============================================
// BUSINESS VALIDATORS
// ============================================

// Validate product SKU format
const validateSKU = (sku) => {
    return /^[A-Z0-9\-_]{3,20}$/.test(sku);
};

// Validate discount percentage
const validateDiscountPercentage = (percentage) => {
    return percentage >= 0 && percentage <= 100;
};

// Validate quantity
const validateQuantity = (quantity) => {
    return Number.isInteger(quantity) && quantity >= 0;
};

// Validate price
const validatePrice = (price) => {
    return typeof price === 'number' && price >= 0 && price <= 999999.99;
};

// Validate stock quantity
const validateStock = (stock) => {
    return Number.isInteger(stock) && stock >= 0;
};

// Validate order status
const validateOrderStatus = (status) => {
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    return validStatuses.includes(status);
};

// Validate payment status
const validatePaymentStatus = (status) => {
    const validStatuses = ['unpaid', 'paid', 'failed', 'refunded', 'pending'];
    return validStatuses.includes(status);
};

// Validate payment method
const validatePaymentMethod = (method) => {
    const validMethods = ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash_on_delivery'];
    return validMethods.includes(method);
};

// ============================================
// EXPORT ALL VALIDATORS
// ============================================

module.exports = {
    // Custom validators
    validatePasswordStrength,
    validatePhoneNumber,
    validatePostalCode,
    validateCreditCard,
    validateUUID,
    validateHexColor,
    validateISBN,
    validateIPAddress,
    validateMACAddress,
    validateDate,
    validateJSON,
    validateBase64,
    validateAlpha,
    validateAlphanumeric,
    
    // Business validators
    validateSKU,
    validateDiscountPercentage,
    validateQuantity,
    validatePrice,
    validateStock,
    validateOrderStatus,
    validatePaymentStatus,
    validatePaymentMethod
};