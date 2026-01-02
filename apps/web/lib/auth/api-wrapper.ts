import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser, type AuthUser } from '@/lib/auth/permissions';
import { hasPermission, type Permission } from '@/lib/auth/rbac';
import { checkRateLimit, getRateLimitHeaders, RATE_LIMIT_CONFIGS, type RateLimitConfig } from '@/lib/rate-limit';
import { logSecurityEvent, getRequestMetadata } from '@/lib/audit';
import { regionRBAC } from '@/lib/region';
import { isGlobalRole } from '@/lib/config';

export type ApiHandler = (
    request: NextRequest,
    context: { params: Promise<Record<string, string>>; user: AuthUser & { accessibleRegions: string[]; isGlobalAdmin: boolean } }
) => Promise<NextResponse>;

/**
 * Wrap API route handler with permission check AND region enforcement
 * 
 * SECURITY: Region enforcement is MANDATORY for non-global roles.
 * Users without accessible regions will be REJECTED (fail-closed).
 * 
 * @example
 * export const DELETE = withPermission('cases:delete', async (request, { params, user }) => {
 *   // user is guaranteed to have cases:delete permission
 *   // user.accessibleRegions contains server-enforced region IDs
 *   const { id } = await params;
 *   // ... handle delete
 * });
 */
export function withPermission(permission: Permission, handler: ApiHandler) {
    return async (request: NextRequest, context: { params: Promise<Record<string, string>> }) => {
        try {
            const user = await getCurrentUser();
            const { ipAddress } = getRequestMetadata(request);

            if (!user) {
                return NextResponse.json(
                    { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
                    { status: 401 }
                );
            }

            // Check permission
            if (!hasPermission(user.role, permission)) {
                await logSecurityEvent('PERMISSION_DENIED', user.id, {
                    required_permission: permission,
                    user_role: user.role,
                    user_email: user.email,
                    endpoint: request.url,
                    method: request.method,
                }, ipAddress);

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

            // Get accessible regions for the user
            const accessibleRegions = await regionRBAC.getUserAccessibleRegions(user.id);
            const regionIds = accessibleRegions.map(r => r.region_id);
            const userIsGlobalAdmin = isGlobalRole(user.role);

            // FAIL-CLOSED: Non-global users MUST have accessible regions
            if (!userIsGlobalAdmin && regionIds.length === 0) {
                await logSecurityEvent('PERMISSION_DENIED', user.id, {
                    type: 'NO_REGION_ACCESS',
                    user_role: user.role,
                    user_email: user.email,
                    endpoint: request.url,
                    method: request.method,
                    reason: 'User has no accessible regions configured',
                }, ipAddress);

                return NextResponse.json(
                    {
                        error: {
                            code: 'REGION_ACCESS_DENIED',
                            message: 'No region access configured for your account',
                        }
                    },
                    { status: 403 }
                );
            }

            return handler(request, {
                ...context,
                user: {
                    ...user,
                    accessibleRegions: regionIds,
                    isGlobalAdmin: userIsGlobalAdmin
                }
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
 * Wrap API route with any of multiple permissions (OR logic)
 */
export function withAnyPermission(permissions: Permission[], handler: ApiHandler) {
    return async (request: NextRequest, context: { params: Promise<Record<string, string>> }) => {
        try {
            const user = await getCurrentUser();
            const { ipAddress } = getRequestMetadata(request);

            if (!user) {
                return NextResponse.json(
                    { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
                    { status: 401 }
                );
            }

            const hasAny = permissions.some(p => hasPermission(user.role, p));
            if (!hasAny) {
                await logSecurityEvent('PERMISSION_DENIED', user.id, {
                    required_permissions: permissions,
                    user_role: user.role,
                    endpoint: request.url,
                }, ipAddress);

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

            // Get accessible regions and enforce fail-closed
            const accessibleRegions = await regionRBAC.getUserAccessibleRegions(user.id);
            const regionIds = accessibleRegions.map(r => r.region_id);
            const userIsGlobalAdmin = isGlobalRole(user.role);

            if (!userIsGlobalAdmin && regionIds.length === 0) {
                await logSecurityEvent('PERMISSION_DENIED', user.id, {
                    type: 'NO_REGION_ACCESS',
                    endpoint: request.url,
                }, ipAddress);

                return NextResponse.json(
                    { error: { code: 'REGION_ACCESS_DENIED', message: 'No region access configured' } },
                    { status: 403 }
                );
            }

            return handler(request, {
                ...context,
                user: { ...user, accessibleRegions: regionIds, isGlobalAdmin: userIsGlobalAdmin }
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
 * Simple auth check (no specific permission, just authenticated)
 * WARNING: For security-sensitive data, use withPermission instead
 */
export function withAuth(handler: ApiHandler) {
    return async (request: NextRequest, context: { params: Promise<Record<string, string>> }) => {
        try {
            const user = await getCurrentUser();
            const { ipAddress } = getRequestMetadata(request);

            if (!user) {
                return NextResponse.json(
                    { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
                    { status: 401 }
                );
            }

            // Get accessible regions and enforce fail-closed
            const accessibleRegions = await regionRBAC.getUserAccessibleRegions(user.id);
            const regionIds = accessibleRegions.map(r => r.region_id);
            const userIsGlobalAdmin = isGlobalRole(user.role);

            if (!userIsGlobalAdmin && regionIds.length === 0) {
                await logSecurityEvent('PERMISSION_DENIED', user.id, {
                    type: 'NO_REGION_ACCESS',
                    endpoint: request.url,
                }, ipAddress);

                return NextResponse.json(
                    { error: { code: 'REGION_ACCESS_DENIED', message: 'No region access configured' } },
                    { status: 403 }
                );
            }

            return handler(request, {
                ...context,
                user: { ...user, accessibleRegions: regionIds, isGlobalAdmin: userIsGlobalAdmin }
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

            // Get accessible regions and enforce fail-closed
            const accessibleRegions = await regionRBAC.getUserAccessibleRegions(user.id);
            const regionIds = accessibleRegions.map(r => r.region_id);
            const userIsGlobalAdmin = isGlobalRole(user.role);

            if (!userIsGlobalAdmin && regionIds.length === 0) {
                return NextResponse.json(
                    { error: { code: 'REGION_ACCESS_DENIED', message: 'No region access configured' } },
                    { status: 403, headers: getRateLimitHeaders(rateLimitResult) }
                );
            }

            // Call handler and add rate limit headers to response
            const response = await handler(request, {
                ...context,
                user: { ...user, accessibleRegions: regionIds, isGlobalAdmin: userIsGlobalAdmin }
            });
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

/**
 * Wrap API route with permission check AND region validation
 * Use for endpoints that require both permission and region-based access control
 * 
 * @param permission - Required permission
 * @param getRegionId - Function to extract region ID from request (query param, body, or route param)
 * 
 * @example
 * export const GET = withRegionPermission('cases:read', (req) => {
 *   return new URL(req.url).searchParams.get('region_id');
 * }, handler);
 */
export function withRegionPermission(
    permission: Permission,
    getRegionId: (request: NextRequest, params: Record<string, string>) => string | null | Promise<string | null>,
    handler: ApiHandler
) {
    return async (request: NextRequest, context: { params: Promise<Record<string, string>> }) => {
        try {
            const user = await getCurrentUser();
            const { ipAddress } = getRequestMetadata(request);
            const params = await context.params;

            if (!user) {
                return NextResponse.json(
                    { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
                    { status: 401 }
                );
            }

            // Check permission first
            if (!hasPermission(user.role, permission)) {
                await logSecurityEvent('PERMISSION_DENIED', user.id, {
                    required_permission: permission,
                    user_role: user.role,
                    endpoint: request.url,
                }, ipAddress);

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

            // Check region access
            const regionId = await getRegionId(request, params);
            if (regionId) {
                const accessCheck = await regionRBAC.hasRegionAccess(user.id, regionId);
                if (!accessCheck.allowed) {
                    // Log cross-region access attempt
                    await logSecurityEvent('PERMISSION_DENIED', user.id, {
                        type: 'CROSS_REGION_ACCESS_ATTEMPT',
                        target_region_id: regionId,
                        user_role: user.role,
                        reason: accessCheck.reason,
                        endpoint: request.url,
                    }, ipAddress);

                    return NextResponse.json(
                        {
                            error: {
                                code: 'REGION_ACCESS_DENIED',
                                message: 'You do not have access to this region',
                                reason: accessCheck.reason
                            }
                        },
                        { status: 403 }
                    );
                }
            }

            // Get all accessible regions for the user
            const accessibleRegions = await regionRBAC.getUserAccessibleRegions(user.id);
            const regionIds = accessibleRegions.map(r => r.region_id);
            const userIsGlobalAdmin = isGlobalRole(user.role);

            // Fail-closed for non-global users
            if (!userIsGlobalAdmin && regionIds.length === 0) {
                await logSecurityEvent('PERMISSION_DENIED', user.id, {
                    type: 'NO_REGION_ACCESS',
                    endpoint: request.url,
                }, ipAddress);

                return NextResponse.json(
                    { error: { code: 'REGION_ACCESS_DENIED', message: 'No region access configured' } },
                    { status: 403 }
                );
            }

            return handler(request, {
                ...context,
                user: { ...user, accessibleRegions: regionIds, isGlobalAdmin: userIsGlobalAdmin }
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
