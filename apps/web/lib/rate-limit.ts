/**
 * Rate Limiting Utility
 * In-memory rate limiter for API routes
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

// In-memory store (use Redis in production for distributed environments)
const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
    /** Maximum requests allowed in the window */
    limit: number;
    /** Time window in seconds */
    windowSeconds: number;
}

// Default configurations for different endpoint types
export const RATE_LIMIT_CONFIGS = {
    // Standard API endpoints
    standard: { limit: 100, windowSeconds: 60 },
    // Sensitive endpoints (login, password reset)
    auth: { limit: 10, windowSeconds: 60 },
    // Export endpoints (resource intensive)
    export: { limit: 20, windowSeconds: 60 },
    // Admin endpoints
    admin: { limit: 50, windowSeconds: 60 },
    // ML service calls
    ml: { limit: 60, windowSeconds: 60 },
} as const;

interface RateLimitResult {
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
}

/**
 * Check rate limit for a given identifier
 */
export function checkRateLimit(
    identifier: string,
    config: RateLimitConfig = RATE_LIMIT_CONFIGS.standard
): RateLimitResult {
    const now = Date.now();
    const key = identifier;
    const entry = rateLimitStore.get(key);

    // Clean up expired entries periodically
    if (rateLimitStore.size > 10000) {
        cleanupExpiredEntries();
    }

    // If no entry or expired, create new one
    if (!entry || now > entry.resetTime) {
        const resetTime = now + config.windowSeconds * 1000;
        rateLimitStore.set(key, { count: 1, resetTime });
        return {
            success: true,
            limit: config.limit,
            remaining: config.limit - 1,
            reset: resetTime,
        };
    }

    // Check if limit exceeded
    if (entry.count >= config.limit) {
        return {
            success: false,
            limit: config.limit,
            remaining: 0,
            reset: entry.resetTime,
        };
    }

    // Increment count
    entry.count++;
    rateLimitStore.set(key, entry);

    return {
        success: true,
        limit: config.limit,
        remaining: config.limit - entry.count,
        reset: entry.resetTime,
    };
}

/**
 * Clean up expired entries from the store
 */
function cleanupExpiredEntries(): void {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (now > entry.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
    return {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.reset.toString(),
    };
}

/**
 * Create rate limited response
 */
export function rateLimitedResponse(): Response {
    return new Response(
        JSON.stringify({
            error: 'Too Many Requests',
            message: 'Rate limit exceeded. Please try again later.',
        }),
        {
            status: 429,
            headers: {
                'Content-Type': 'application/json',
                'Retry-After': '60',
            },
        }
    );
}

/**
 * Wrapper for rate-limited API handlers
 */
export function withRateLimit<T>(
    handler: (request: Request) => Promise<Response>,
    config: RateLimitConfig = RATE_LIMIT_CONFIGS.standard
) {
    return async (request: Request): Promise<Response> => {
        // Get identifier from IP or auth header
        const forwarded = request.headers.get('x-forwarded-for');
        const ip = forwarded?.split(',')[0] ?? 'anonymous';
        const url = new URL(request.url);
        const identifier = `${ip}:${url.pathname}`;

        const result = checkRateLimit(identifier, config);

        if (!result.success) {
            return new Response(
                JSON.stringify({
                    error: 'Too Many Requests',
                    message: 'Rate limit exceeded. Please try again later.',
                    retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
                }),
                {
                    status: 429,
                    headers: {
                        'Content-Type': 'application/json',
                        ...getRateLimitHeaders(result),
                    },
                }
            );
        }

        // Call the actual handler
        const response = await handler(request);

        // Add rate limit headers to response
        const headers = new Headers(response.headers);
        Object.entries(getRateLimitHeaders(result)).forEach(([key, value]) => {
            headers.set(key, value);
        });

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers,
        });
    };
}
