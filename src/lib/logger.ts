import winston from "winston";
import path from "path";
import fs from "fs";

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for readable logs
const customFormat = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        let log = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        if (Object.keys(meta).length > 0) {
            log += ` ${JSON.stringify(meta)}`;
        }
        if (stack) {
            log += `\n${stack}`;
        }
        return log;
    })
);

// JSON format for structured logging
const jsonFormat = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DDTHH:mm:ss.sssZ" }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Create the logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || "info",
    transports: [
        // Error log - only errors
        new winston.transports.File({
            filename: path.join(logsDir, "error.log"),
            level: "error",
            format: customFormat,
            maxsize: 5 * 1024 * 1024, // 5MB
            maxFiles: 5,
        }),
        // Combined log - all levels
        new winston.transports.File({
            filename: path.join(logsDir, "combined.log"),
            format: customFormat,
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5,
        }),
    ],
});

// Separate logger for admin actions (audit trail)
const actionFormat = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.printf(({ timestamp, message, username, action, description }) => {
        return `[${timestamp}] | ${username || "System"} | ${action || "Unknown"} | ${description || message}`;
    })
);

const actionLogger = winston.createLogger({
    level: "info",
    transports: [
        new winston.transports.File({
            filename: path.join(logsDir, "actions.log"),
            format: actionFormat,
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5,
        }),
    ],
});

// Add console logging in development
if (process.env.NODE_ENV !== "production") {
    logger.add(
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            ),
        })
    );
}

// Helper functions for common logging patterns
export const logInfo = (message: string, meta?: object) => {
    logger.info(message, meta);
};

export const logWarn = (message: string, meta?: object) => {
    logger.warn(message, meta);
};

export const logError = (message: string, error?: Error, meta?: object) => {
    logger.error(message, {
        ...meta,
        error: error?.message,
        stack: error?.stack,
    });
};

export const logApiError = (
    endpoint: string,
    method: string,
    error: Error,
    statusCode?: number
) => {
    logger.error(`API Error: ${method} ${endpoint}`, {
        endpoint,
        method,
        statusCode,
        error: error.message,
        stack: error.stack,
    });
};

export const logAuth = (action: string, username: string, success: boolean) => {
    const level = success ? "info" : "warn";
    logger[level](`Auth: ${action}`, {
        username,
        success,
        action,
    });
    // Also log to actions log
    actionLogger.info("", {
        username,
        action: success ? `Login Success` : `Login Failed`,
        description: `User ${success ? "logged in" : "failed to log in"}`,
    });
};

// Log admin actions for audit trail
export const logAction = (
    username: string,
    action: string,
    description: string
) => {
    actionLogger.info("", {
        username,
        action,
        description,
    });
    // Also log to combined for full history
    logger.info(`Action: ${action}`, {
        username,
        action,
        description,
    });
};

export default logger;
