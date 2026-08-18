// Analytics service for tracking user behavior
// This will be used for analytics and reporting

class AnalyticsService {
    constructor() {
        this.events = [];
        this.maxEvents = 10000; // Keep last 10,000 events
    }

    // Track an event
    trackEvent(eventType, userId, data = {}) {
        const event = {
            id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
            type: eventType,
            userId: userId || 'guest',
            data: data,
            timestamp: new Date().toISOString()
        };

        this.events.push(event);

        // Keep only last maxEvents
        if (this.events.length > this.maxEvents) {
            this.events = this.events.slice(-this.maxEvents);
        }

        // In production, you would send to a service like Google Analytics,
        // Mixpanel, or your own analytics database
        console.log(`📊 Analytics Event:`, event);

        return { success: true, eventId: event.id };
    }

    // Track page view
    trackPageView(userId, page, data = {}) {
        return this.trackEvent('page_view', userId, { page, ...data });
    }

    // Track product view
    trackProductView(userId, productId, data = {}) {
        return this.trackEvent('product_view', userId, { productId, ...data });
    }

    // Track add to cart
    trackAddToCart(userId, productId, quantity, data = {}) {
        return this.trackEvent('add_to_cart', userId, { productId, quantity, ...data });
    }

    // Track purchase
    trackPurchase(userId, orderId, amount, data = {}) {
        return this.trackEvent('purchase', userId, { orderId, amount, ...data });
    }

    // Track search
    trackSearch(userId, query, results, data = {}) {
        return this.trackEvent('search', userId, { query, results, ...data });
    }

    // Get events by type
    getEventsByType(eventType, limit = 100) {
        return this.events
            .filter(e => e.type === eventType)
            .slice(-limit);
    }

    // Get events by user
    getEventsByUser(userId, limit = 100) {
        return this.events
            .filter(e => e.userId === userId)
            .slice(-limit);
    }

    // Get summary stats
    getSummaryStats() {
        const totalEvents = this.events.length;
        const uniqueUsers = new Set(this.events.map(e => e.userId)).size;
        const eventTypes = {};
        
        this.events.forEach(e => {
            eventTypes[e.type] = (eventTypes[e.type] || 0) + 1;
        });

        return {
            totalEvents,
            uniqueUsers,
            eventTypes,
            lastEvent: this.events[this.events.length - 1] || null
        };
    }

    // Clear events
    clearEvents() {
        this.events = [];
        return { success: true, message: 'Events cleared' };
    }
}

module.exports = new AnalyticsService();