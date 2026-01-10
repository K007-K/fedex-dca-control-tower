import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

import { getCurrentUser, type AuthUser } from '@/lib/auth/permissions';
import { hasPermission, type Permission } from '@/lib/auth/rbac';
import { checkRateLimit, getRateLimitHeaders, RATE_LIMIT_CONFIGS, type RateLimitConfig } from '@/lib/rate-limit';
import { logSecurityEvent, logSystemAction, getRequestMetadata } from '@/lib/audit';
import { regionRBAC } from '@/lib/region';
import { isGlobalRole } from '@/lib/config';

// SYSTEM Actor imports
import {
    type Actor,
    type SystemActor,
    type HumanActor,
    type RequestContext,
    type SystemRequestContext,
    type HumanRequestContext,
    SYSTEM_AUTH_HEADER,
    REQUEST_ID_HEADER,
    isSystemActor,
} from './actor';
import {
    isSystemRequest,
    authenticateSystemRequest,
    serviceCanPerform,
} from './system-auth';
import {
    guard as systemGuard,
    recordFailedAttempt,
    clearFailedAttempts,
    isIpBlocked,
} from './system-guard';

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

            // DCA roles derive region from their DCA assignment, not user_region_access
            // Skip region check for DCA roles - they get region from dca_id
            const isDCA = ['DCA_ADMIN', 'DCA_MANAGER', 'DCA_AGENT'].includes(user.role);

            // FAIL-CLOSED: Non-global users MUST have accessible regions (except DCA roles)
            if (!userIsGlobalAdmin && !isDCA && regionIds.length === 0) {
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

            // DCA roles derive region from their DCA assignment, not user_region_access
            // Skip region check for DCA roles - they get region from dca_id
            const isDCA = ['DCA_ADMIN', 'DCA_MANAGER', 'DCA_AGENT'].includes(user.role);

            if (!userIsGlobalAdmin && !isDCA && regionIds.length === 0) {
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

// ===========================================
// SYSTEM ACTOR TYPES AND HANDLERS
// ===========================================

/**
 * Handler context for SYSTEM-only routes
 */
export type SystemApiHandler = (
    request: NextRequest,
    context: {
        params: Promise<Record<string, string>>;
        actor: SystemActor;
        requestContext: SystemRequestContext;
    }
) => Promise<NextResponse>;

/**
 * Handler context for routes accepting both SYSTEM and HUMAN actors
 */
export type ActorApiHandler = (
    request: NextRequest,
    context: {
        params: Promise<Record<string, string>>;
        actor: Actor;
        requestContext: RequestContext;
        // For HUMAN actors, include full user info
        user?: AuthUser & { accessibleRegions: string[]; isGlobalAdmin: boolean };
    }
) => Promise<NextResponse>;

// ===========================================
// SYSTEM-ONLY AUTHENTICATION WRAPPER
// ===========================================

/**
 * Wrap API route for SYSTEM-only access
 * 
 * Use this for backend-to-backend endpoints that should NEVER
 * be accessed by humans (e.g., automated case creation, internal webhooks).
 * 
 * SECURITY:
 * - Requires X-Service-Auth header with valid JWT
 * - Rejects browser-originated requests
 * - Logs all access attempts
 * 
 * @param operation - Required operation permission (e.g., 'cases:create')
 * @param handler - The route handler
 * 
 * @example
 * export const POST = withSystemAuth('cases:create', async (request, { actor, requestContext }) => {
 *   // actor is guaranteed to be a valid SystemActor
 *   // Create case with actor metadata
 * });
 */
export function withSystemAuth(operation: string, handler: SystemApiHandler) {
    return async (request: NextRequest, context: { params: Promise<Record<string, string>> }) => {
        const { ipAddress, userAgent } = getRequestMetadata(request);
        const requestId = request.headers.get(REQUEST_ID_HEADER) || randomUUID();

        try {
            // Check if IP is blocked due to repeated failures
            if (isIpBlocked(ipAddress)) {
                return NextResponse.json(
                    { error: { code: 'BLOCKED', message: 'Too many failed attempts. Try again later.' } },
                    { status: 429 }
                );
            }

            // Verify this is a SYSTEM request
            if (!isSystemRequest(request)) {
                return NextResponse.json(
                    { error: { code: 'UNAUTHORIZED', message: 'SYSTEM authentication required' } },
                    { status: 401 }
                );
            }

            // Authenticate SYSTEM request
            const authResult = await authenticateSystemRequest(request);

            // Run spoofing guard
            const guardResult = await systemGuard(request, authResult.authenticated);
            if (!guardResult.allowed) {
                recordFailedAttempt(ipAddress);
                return NextResponse.json(
                    { error: { code: 'FORBIDDEN', message: guardResult.error } },
                    { status: guardResult.statusCode }
                );
            }

            if (!authResult.authenticated || !authResult.actor) {
                recordFailedAttempt(ipAddress);
                return NextResponse.json(
                    { error: { code: 'UNAUTHORIZED', message: authResult.error || 'Authentication failed' } },
                    { status: 401 }
                );
            }

            // Check operation permission
            if (!serviceCanPerform(authResult.actor, operation)) {
                await logSecurityEvent('PERMISSION_DENIED', undefined, {
                    type: 'SYSTEM_OPERATION_DENIED',
                    service_name: authResult.actor.service_name,
                    required_operation: operation,
                    allowed_operations: authResult.actor.allowed_operations,
                }, ipAddress);

                return NextResponse.json(
                    { error: { code: 'FORBIDDEN', message: `Service not authorized for operation: ${operation}` } },
                    { status: 403 }
                );
            }

            // Clear failed attempts on successful auth
            clearFailedAttempts(ipAddress);

            // Build request context
            const requestContext: SystemRequestContext = {
                actor: authResult.actor,
                source: 'SYSTEM',
                service_name: authResult.actor.service_name,
                request_id: requestId,
                timestamp: new Date().toISOString(),
                ip_address: ipAddress,
                user_agent: userAgent,
            };

            // Log successful SYSTEM authentication
            await logSystemAction(
                'PERMISSION_GRANTED',
                authResult.actor.service_name,
                'api',
                operation,
                { endpoint: request.url, method: request.method },
                ipAddress
            );

            return handler(request, {
                ...context,
                actor: authResult.actor,
                requestContext,
            });
        } catch (error) {
            console.error('SYSTEM auth error:', error);
            return NextResponse.json(
                { error: { code: 'INTERNAL_ERROR', message: 'Authentication failed' } },
                { status: 500 }
            );
        }
    };
}

// ===========================================
// UNIFIED ACTOR CONTEXT WRAPPER
// ===========================================

/**
 * Wrap API route with unified actor context (SYSTEM or HUMAN)
 * 
 * Use this for endpoints that can be accessed by both:
 * - Automated SYSTEM services (via X-Service-Auth)
 * - Human users (via Supabase session)
 * 
 * The handler receives a unified Actor that can be either type.
 * Use type guards (isSystemActor, isHumanActor) to differentiate.
 * 
 * @param permission - Required permission (for HUMAN actors)
 * @param operation - Required operation (for SYSTEM actors)
 * @param handler - The route handler
 * 
 * @example
 * export const POST = withActorContext('cases:create', 'cases:create', 
 *   async (request, { actor, requestContext, user }) => {
 *     if (isSystemActor(actor)) {
 *       // Handle SYSTEM request
 *     } else {
 *       // Handle HUMAN request with user object
 *     }
 * });
 */
export function withActorContext(
    permission: Permission,
    operation: string,
    handler: ActorApiHandler
) {
    return async (request: NextRequest, context: { params: Promise<Record<string, string>> }) => {
        const { ipAddress, userAgent } = getRequestMetadata(request);
        const requestId = request.headers.get(REQUEST_ID_HEADER) || randomUUID();

        try {
            // Check if this is a SYSTEM request
            if (isSystemRequest(request)) {
                // Handle as SYSTEM
                const authResult = await authenticateSystemRequest(request);

                // Run spoofing guard
                const guardResult = await systemGuard(request, authResult.authenticated);
                if (!guardResult.allowed) {
                    recordFailedAttempt(ipAddress);
                    return NextResponse.json(
                        { error: { code: 'FORBIDDEN', message: guardResult.error } },
                        { status: guardResult.statusCode }
                    );
                }

                if (!authResult.authenticated || !authResult.actor) {
                    recordFailedAttempt(ipAddress);
                    return NextResponse.json(
                        { error: { code: 'UNAUTHORIZED', message: authResult.error } },
                        { status: 401 }
                    );
                }

                // Check operation permission for SYSTEM
                if (!serviceCanPerform(authResult.actor, operation)) {
                    return NextResponse.json(
                        { error: { code: 'FORBIDDEN', message: `Service not authorized for: ${operation}` } },
                        { status: 403 }
                    );
                }

                clearFailedAttempts(ipAddress);

                const requestContext: SystemRequestContext = {
                    actor: authResult.actor,
                    source: 'SYSTEM',
                    service_name: authResult.actor.service_name,
                    request_id: requestId,
                    timestamp: new Date().toISOString(),
                    ip_address: ipAddress,
                    user_agent: userAgent,
                };

                // AUDIT: Log all SYSTEM-authenticated requests
                await logSystemAction(
                    'PERMISSION_GRANTED',
                    authResult.actor.service_name,
                    'api',
                    operation,
                    { endpoint: request.url, method: request.method, wrapper: 'withActorContext' },
                    ipAddress
                );

                return handler(request, {
                    ...context,
                    actor: authResult.actor,
                    requestContext,
                });
            }

            // Handle as HUMAN (existing logic)
            const user = await getCurrentUser();

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
                }, ipAddress);

                return NextResponse.json(
                    { error: { code: 'FORBIDDEN', message: `Missing permission: ${permission}` } },
                    { status: 403 }
                );
            }

            // Get accessible regions
            const accessibleRegions = await regionRBAC.getUserAccessibleRegions(user.id);
            const regionIds = accessibleRegions.map(r => r.region_id);
            const userIsGlobalAdmin = isGlobalRole(user.role);

            // Fail-closed for non-global users
            if (!userIsGlobalAdmin && regionIds.length === 0) {
                return NextResponse.json(
                    { error: { code: 'REGION_ACCESS_DENIED', message: 'No region access configured' } },
                    { status: 403 }
                );
            }

            // Build human actor
            const humanActor: HumanActor = {
                actor_type: 'HUMAN',
                actor_id: user.id,
                actor_role: user.role,
                region_scope: regionIds.length > 0 ? regionIds : null,
                email: user.email,
                organization_id: user.organizationId,
                dca_id: user.dcaId,
            };

            const requestContext: HumanRequestContext = {
                actor: humanActor,
                source: 'MANUAL',
                request_id: requestId,
                timestamp: new Date().toISOString(),
                ip_address: ipAddress,
                user_agent: userAgent,
            };

            return handler(request, {
                ...context,
                actor: humanActor,
                requestContext,
                user: { ...user, accessibleRegions: regionIds, isGlobalAdmin: userIsGlobalAdmin },
            });
        } catch (error) {
            console.error('Actor context error:', error);
            return NextResponse.json(
                { error: { code: 'INTERNAL_ERROR', message: 'Authentication failed' } },
                { status: 500 }
            );
        }
    };
}

// ===========================================
// RE-EXPORTS FOR CONVENIENCE
// ===========================================

export {
    type Actor,
    type SystemActor,
    type HumanActor,
    type RequestContext,
    type SystemRequestContext,
    type HumanRequestContext,
    isSystemActor,
    isSystemRequest,
} from './actor';
