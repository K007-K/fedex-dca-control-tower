import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser, type AuthUser } from '@/lib/auth/permissions';
import { hasPermission, type Permission } from '@/lib/auth/rbac';
import { checkRateLimit, getRateLimitHeaders, RATE_LIMIT_CONFIGS, type RateLimitConfig } from '@/lib/rate-limit';

export type ApiHandler = (
    request: NextRequest,
    context: { params: Promise<Record<string, string>>; user: AuthUser }
) => Promise<NextResponse>;

/**
 * Wrap API route handler with permission check
 * 
 * @example
 * export const DELETE = withPermission('cases:delete', async (request, { params, user }) => {
 *   // user is guaranteed to have cases:delete permission
 *   const { id } = await params;
 *   // ... handle delete
 * });
 */
export function withPermission(permission: Permission, handler: ApiHandler) {
    return async (request: NextRequest, context: { params: Promise<Record<string, string>> }) => {
        try {
            const user = await getCurrentUser();

            if (!user) {
                return NextResponse.json(
                    { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
                    { status: 401 }
                );
            }

            if (!hasPermission(user.role, permission)) {
                return NextResponse.json(
                    {
                        error: {
                            code: 'FORBIDDEN',
                            message: `You don't have permission to perform this action`,
                            required: permission,
                            userRole: user.role
                        }
                    },
                    { status: 403 }
                );
            }

            return handler(request, { ...context, user });
        } catch (error) {
            console.error('API auth error:', error);
            return NextResponse.json(
                { error: { code: 'INTERNAL_ERROR', message: 'Authentication failed' } },
                { status: 500 }
            );
        }
    };
}

/**
 * Wrap API route with any of multiple permissions (OR logic)
 */
export function withAnyPermission(permissions: Permission[], handler: ApiHandler) {
    return async (request: NextRequest, context: { params: Promise<Record<string, string>> }) => {
        try {
            const user = await getCurrentUser();

            if (!user) {
                return NextResponse.json(
                    { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
                    { status: 401 }
                );
            }

            const hasAny = permissions.some(p => hasPermission(user.role, p));
            if (!hasAny) {
                return NextResponse.json(
                    {
                        error: {
                            code: 'FORBIDDEN',
                            message: `You don't have permission to perform this action`,
                            required: permissions,
                            userRole: user.role
                        }
                    },
                    { status: 403 }
                );
            }

            return handler(request, { ...context, user });
        } catch (error) {
            console.error('API auth error:', error);
            return NextResponse.json(
                { error: { code: 'INTERNAL_ERROR', message: 'Authentication failed' } },
                { status: 500 }
            );
        }
    };
}

/**
 * Simple auth check (no specific permission, just authenticated)
 */
export function withAuth(handler: ApiHandler) {
    return async (request: NextRequest, context: { params: Promise<Record<string, string>> }) => {
        try {
            const user = await getCurrentUser();

            if (!user) {
                return NextResponse.json(
                    { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
                    { status: 401 }
                );
            }

            return handler(request, { ...context, user });
        } catch (error) {
            console.error('API auth error:', error);
            return NextResponse.json(
                { error: { code: 'INTERNAL_ERROR', message: 'Authentication failed' } },
                { status: 500 }
            );
        }
    };
}

/**
 * Wrap API route with permission check AND rate limiting
 * Use this for sensitive endpoints like user creation, auth, exports
 */
export function withRateLimitedPermission(
    permission: Permission,
    handler: ApiHandler,
    rateLimitConfig: RateLimitConfig = RATE_LIMIT_CONFIGS.standard
) {
    return async (request: NextRequest, context: { params: Promise<Record<string, string>> }) => {
        try {
            // Get identifier for rate limiting
            const forwarded = request.headers.get('x-forwarded-for');
            const ip = forwarded?.split(',')[0] ?? 'anonymous';
            const url = new URL(request.url);
            const identifier = `${ip}:${url.pathname}`;

            // Check rate limit first
            const rateLimitResult = checkRateLimit(identifier, rateLimitConfig);
            if (!rateLimitResult.success) {
                return new NextResponse(
                    JSON.stringify({
                        error: {
                            code: 'RATE_LIMITED',
                            message: 'Too many requests. Please try again later.',
                            retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
                        }
                    }),
                    {
                        status: 429,
                        headers: {
                            'Content-Type': 'application/json',
                            ...getRateLimitHeaders(rateLimitResult),
                        },
                    }
                );
            }

            // Then check auth
            const user = await getCurrentUser();
            if (!user) {
                return NextResponse.json(
                    { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
                    { status: 401, headers: getRateLimitHeaders(rateLimitResult) }
                );
            }

            // Then check permission
            if (!hasPermission(user.role, permission)) {
                return NextResponse.json(
                    {
                        error: {
                            code: 'FORBIDDEN',
                            message: `You don't have permission to perform this action`,
                            required: permission,
                            userRole: user.role
                        }
                    },
                    { status: 403, headers: getRateLimitHeaders(rateLimitResult) }
                );
            }

            // Call handler and add rate limit headers to response
            const response = await handler(request, { ...context, user });
            const headers = new Headers(response.headers);
            Object.entries(getRateLimitHeaders(rateLimitResult)).forEach(([key, value]) => {
                headers.set(key, value);
            });

            return new NextResponse(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers,
            });
        } catch (error) {
            console.error('API auth error:', error);
            return NextResponse.json(
                { error: { code: 'INTERNAL_ERROR', message: 'Authentication failed' } },
                { status: 500 }
            );
        }
    };
}

/**
 * Rate limiting only (no auth check) - for public endpoints
 */
export function withRateLimit(
    handler: (request: NextRequest, context: { params: Promise<Record<string, string>> }) => Promise<NextResponse>,
    rateLimitConfig: RateLimitConfig = RATE_LIMIT_CONFIGS.standard
) {
    return async (request: NextRequest, context: { params: Promise<Record<string, string>> }) => {
        const forwarded = request.headers.get('x-forwarded-for');
        const ip = forwarded?.split(',')[0] ?? 'anonymous';
        const url = new URL(request.url);
        const identifier = `${ip}:${url.pathname}`;

        const rateLimitResult = checkRateLimit(identifier, rateLimitConfig);
        if (!rateLimitResult.success) {
            return new NextResponse(
                JSON.stringify({
                    error: {
                        code: 'RATE_LIMITED',
                        message: 'Too many requests. Please try again later.',
                        retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
                    }
                }),
                {
                    status: 429,
                    headers: {
                        'Content-Type': 'application/json',
                        ...getRateLimitHeaders(rateLimitResult),
                    },
                }
            );
        }

        const response = await handler(request, context);
        const headers = new Headers(response.headers);
        Object.entries(getRateLimitHeaders(rateLimitResult)).forEach(([key, value]) => {
            headers.set(key, value);
        });

        return new NextResponse(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers,
        });
    };
}

