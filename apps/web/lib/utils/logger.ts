/**
 * Production-Safe Logger
 * P2-13 FIX: Prevent console.error exposure in production
 * 
 * This module provides logging utilities that only output in development
 * and sanitize sensitive information in production.
 */

const isDevelopment = process.env.NODE_ENV === 'development';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogOptions {
    context?: string;
    data?: Record<string, unknown>;
    sendToMonitoring?: boolean;
}

/**
 * Sanitize data to remove sensitive information
 */
function sanitizeData(data: Record<string, unknown>): Record<string, unknown> {
    const sensitiveKeys = [
        'password', 'token', 'secret', 'key', 'authorization',
        'cookie', 'session', 'credit', 'ssn', 'api_key', 'apikey',
    ];

    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
        const lowerKey = key.toLowerCase();

        if (sensitiveKeys.some(k => lowerKey.includes(k))) {
            sanitized[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeData(value as Record<string, unknown>);
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized;
}

/**
 * Format log message with context
 */
function formatMessage(level: LogLevel, message: string, options?: LogOptions): string {
    const timestamp = new Date().toISOString();
    const context = options?.context ? `[${options.context}]` : '';
    return `${timestamp} ${level.toUpperCase()} ${context} ${message}`;
}

/**
 * Log to external monitoring service (placeholder)
 */
async function sendToMonitoring(
    level: LogLevel,
    message: string,
    _options?: LogOptions
): Promise<void> {
    // In production, you would send to a service like Sentry, LogRocket, etc.
    // Example: await sentry.captureMessage(message, level);

    // For now, we just store in a way that doesn't expose to console
    if (typeof window !== 'undefined') {
        // Could send to your backend logging endpoint
        // fetch('/api/logs', { method: 'POST', body: JSON.stringify({ level, message }) });
    }
}

/**
 * Logger object with methods for each log level
 */
export const logger = {
    debug(message: string, options?: LogOptions): void {
        if (isDevelopment) {
            console.debug(formatMessage('debug', message, options));
            if (options?.data) {
                console.debug('Data:', options.data);
            }
        }
    },

    info(message: string, options?: LogOptions): void {
        if (isDevelopment) {
            console.info(formatMessage('info', message, options));
            if (options?.data) {
                console.info('Data:', options.data);
            }
        }
    },

    warn(message: string, options?: LogOptions): void {
        if (isDevelopment) {
            console.warn(formatMessage('warn', message, options));
            if (options?.data) {
                console.warn('Data:', options.data);
            }
        } else if (options?.sendToMonitoring) {
            sendToMonitoring('warn', message, options);
        }
    },

    error(message: string, error?: unknown, options?: LogOptions): void {
        // In development, log everything
        if (isDevelopment) {
            console.error(formatMessage('error', message, options));
            if (error) {
                console.error('Error:', error);
            }
            if (options?.data) {
                console.error('Data:', options.data);
            }
        } else {
            // In production, only send to monitoring service
            // Never expose raw errors to browser console
            const sanitizedData = options?.data ? sanitizeData(options.data) : undefined;
            sendToMonitoring('error', message, { ...options, data: sanitizedData });
        }
    },

    /**
     * Log an API error with request context
     */
    apiError(
        message: string,
        error: unknown,
        request?: { url?: string; method?: string }
    ): void {
        this.error(message, error, {
            context: 'API',
            data: request ? { url: request.url, method: request.method } : undefined,
            sendToMonitoring: true,
        });
    },

    /**
     * Log performance metrics
     */
    perf(label: string, durationMs: number): void {
        this.debug(`${label}: ${durationMs.toFixed(2)}ms`, { context: 'PERF' });
    },
};

/**
 * Safe error handler that works in production
 * Returns a sanitized error message
 */
export function safeErrorMessage(error: unknown): string {
    if (isDevelopment && error instanceof Error) {
        return error.message;
    }

    // In production, return generic message
    return 'An unexpected error occurred. Please try again.';
}

/**
 * Wrap async functions with error logging
 */
export function withErrorLogging<T extends (...args: unknown[]) => Promise<unknown>>(
    fn: T,
    context: string
): T {
    return (async (...args: Parameters<T>) => {
        try {
            return await fn(...args);
        } catch (error) {
            logger.error(`Error in ${context}`, error, { context });
            throw error;
        }
    }) as T;
}

export default logger;
