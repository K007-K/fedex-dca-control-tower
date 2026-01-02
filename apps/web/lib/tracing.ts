/**
 * Request Tracing Middleware
 * Adds correlation IDs to all requests for debugging and logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export const CORRELATION_ID_HEADER = 'x-correlation-id';
export const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Generate or extract correlation ID from request
 */
export function getCorrelationId(request: NextRequest): string {
    // Check if client sent a correlation ID
    const clientId = request.headers.get(CORRELATION_ID_HEADER);
    if (clientId) {
        return clientId;
    }

    // Generate new correlation ID
    return `req_${uuidv4().replace(/-/g, '').substring(0, 16)}`;
}

/**
 * Add tracing headers to response
 */
export function addTracingHeaders(
    response: NextResponse,
    correlationId: string,
    requestId?: string
): NextResponse {
    response.headers.set(CORRELATION_ID_HEADER, correlationId);
    if (requestId) {
        response.headers.set(REQUEST_ID_HEADER, requestId);
    }
    return response;
}

/**
 * Create a traced logger that includes correlation ID
 */
export function createTracedLogger(correlationId: string) {
    return {
        info: (message: string, data?: Record<string, unknown>) => {
            console.log(JSON.stringify({
                level: 'info',
                correlationId,
                message,
                ...data,
                timestamp: new Date().toISOString(),
            }));
        },
        warn: (message: string, data?: Record<string, unknown>) => {
            console.warn(JSON.stringify({
                level: 'warn',
                correlationId,
                message,
                ...data,
                timestamp: new Date().toISOString(),
            }));
        },
        error: (message: string, error?: unknown, data?: Record<string, unknown>) => {
            console.error(JSON.stringify({
                level: 'error',
                correlationId,
                message,
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                ...data,
                timestamp: new Date().toISOString(),
            }));
        },
    };
}

/**
 * Middleware to add correlation ID to all API requests
 * Use in middleware.ts
 */
export function withRequestTracing(request: NextRequest): {
    correlationId: string;
    requestId: string;
    startTime: number;
} {
    const correlationId = getCorrelationId(request);
    const requestId = `rid_${Date.now().toString(36)}`;
    const startTime = Date.now();

    return { correlationId, requestId, startTime };
}

/**
 * Log request completion with timing
 */
export function logRequestComplete(
    correlationId: string,
    requestId: string,
    method: string,
    path: string,
    status: number,
    startTime: number
): void {
    const duration = Date.now() - startTime;
    console.log(JSON.stringify({
        level: 'info',
        type: 'request_complete',
        correlationId,
        requestId,
        method,
        path,
        status,
        durationMs: duration,
        timestamp: new Date().toISOString(),
    }));
}
