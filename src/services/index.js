// Export all services
const paymentService = require('./paymentService');
const notificationService = require('./notificationService');
const analyticsService = require('./analyticsService');

module.exports = {
    paymentService,
    notificationService,
    analyticsService
};