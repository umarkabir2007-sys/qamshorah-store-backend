const fs = require('fs');
const path = require('path');

// ============================================
// LOGGER CONFIGURATION
// ============================================

// Create logs directory
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// Log levels
const LOG_LEVELS = {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug'
};

// ============================================
// LOGGER FUNCTIONS
// ============================================

// Write to log file
const writeToFile = (level, message, data = null) => {
    try {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            data: data || null
        };

        const logFile = path.join(logDir, `${level}-${new Date().toISOString().split('T')[0]}.log`);
        const logLine = JSON.stringify(logEntry) + '\n';
        fs.appendFileSync(logFile, logLine);
    } catch (error) {
        console.error('Error writing log:', error);
    }
};

// Log error
const logError = (message, error = null) => {
    console.error('❌ ERROR:', message);
    if (error) {
        console.error('📂 Error details:', error);
    }
    writeToFile(LOG_LEVELS.ERROR, message, error);
};

// Log warning
const logWarn = (message, data = null) => {
    console.warn('⚠️ WARNING:', message);
    if (data) {
        console.warn('📂 Data:', data);
    }
    writeToFile(LOG_LEVELS.WARN, message, data);
};

// Log info
const logInfo = (message, data = null) => {
    console.log('ℹ️ INFO:', message);
    if (data) {
        console.log('📂 Data:', data);
    }
    writeToFile(LOG_LEVELS.INFO, message, data);
};

// Log debug (only in development)
const logDebug = (message, data = null) => {
    if (process.env.NODE_ENV !== 'production') {
        console.log('🐛 DEBUG:', message);
        if (data) {
            console.log('📂 Data:', data);
        }
        writeToFile(LOG_LEVELS.DEBUG, message, data);
    }
};

// Log API request
const logAPIRequest = (req, res, duration) => {
    const logData = {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent') || 'Unknown'
    };

    const level = res.statusCode >= 500 ? LOG_LEVELS.ERROR :
                  res.statusCode >= 400 ? LOG_LEVELS.WARN :
                  LOG_LEVELS.INFO;

    writeToFile('api', logData);
};

// Log database query
const logDatabaseQuery = (query, params, duration) => {
    if (process.env.NODE_ENV !== 'production') {
        const logData = {
            query,
            params,
            duration: `${duration}ms`
        };
        writeToFile('db', logData);
    }
};

// Log user action
const logUserAction = (userId, action, data = null) => {
    const logData = {
        userId,
        action,
        data,
        timestamp: new Date().toISOString()
    };
    writeToFile('user', logData);
};

// ============================================
// CLEAN OLD LOGS
// ============================================

const cleanOldLogs = (days = 30) => {
    try {
        const files = fs.readdirSync(logDir);
        const now = Date.now();
        const maxAge = days * 24 * 60 * 60 * 1000;

        files.forEach(file => {
            const filePath = path.join(logDir, file);
            const stats = fs.statSync(filePath);
            if (now - stats.mtimeMs > maxAge) {
                fs.unlinkSync(filePath);
                console.log(`🗑️ Deleted old log: ${file}`);
            }
        });
    } catch (error) {
        console.error('Error cleaning logs:', error);
    }
};

// Run log cleanup every day
setInterval(cleanOldLogs, 24 * 60 * 60 * 1000);

// ============================================
// EXPORT ALL LOGGER FUNCTIONS
// ============================================

module.exports = {
    logError,
    logWarn,
    logInfo,
    logDebug,
    logAPIRequest,
    logDatabaseQuery,
    logUserAction,
    cleanOldLogs,
    LOG_LEVELS
};