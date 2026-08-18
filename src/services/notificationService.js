// Notification service for sending push notifications
// This will be used for real-time notifications

class NotificationService {
    constructor() {
        this.enabled = true;
        this.devices = new Map(); // Store device tokens
    }

    // Register device for notifications
    registerDevice(userId, deviceToken, platform) {
        if (!this.devices.has(userId)) {
            this.devices.set(userId, []);
        }
        
        const userDevices = this.devices.get(userId);
        const existing = userDevices.find(d => d.token === deviceToken);
        
        if (!existing) {
            userDevices.push({
                token: deviceToken,
                platform: platform || 'web',
                registeredAt: new Date().toISOString()
            });
        }
        
        return { success: true, message: 'Device registered' };
    }

    // Send notification to user
    async sendToUser(userId, title, body, data = {}) {
        const userDevices = this.devices.get(userId) || [];
        
        if (userDevices.length === 0) {
            return { 
                success: false, 
                error: 'No devices registered for this user' 
            };
        }

        // In production, you would send to Firebase Cloud Messaging (FCM)
        // or OneSignal, etc.
        console.log(`📱 Sending notification to user ${userId}:`, { title, body });

        return {
            success: true,
            message: 'Notification sent',
            devices: userDevices.length
        };
    }

    // Send notification to multiple users
    async sendToMultipleUsers(userIds, title, body, data = {}) {
        const results = [];
        
        for (const userId of userIds) {
            const result = await this.sendToUser(userId, title, body, data);
            results.push({ userId, ...result });
        }

        return {
            success: true,
            results
        };
    }

    // Unregister device
    unregisterDevice(userId, deviceToken) {
        if (!this.devices.has(userId)) {
            return { success: false, error: 'User not found' };
        }

        const userDevices = this.devices.get(userId);
        const filtered = userDevices.filter(d => d.token !== deviceToken);
        
        if (filtered.length === 0) {
            this.devices.delete(userId);
        } else {
            this.devices.set(userId, filtered);
        }

        return { success: true, message: 'Device unregistered' };
    }

    // Clear all devices for a user
    clearUserDevices(userId) {
        this.devices.delete(userId);
        return { success: true, message: 'All devices cleared' };
    }
}

module.exports = new NotificationService();