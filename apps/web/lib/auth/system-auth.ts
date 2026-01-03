/**
 * SYSTEM Authentication Service
 * 
 * Handles authentication for non-human SYSTEM actors.
 * SYSTEM actors authenticate via signed JWT, NOT via user credentials.
 * 
 * SECURITY PRINCIPLES:
 * - SYSTEM credentials are NEVER exposed to frontend
 * - JWT is signed with SERVICE_SECRET (env var)
 * - Requests are validated against service_actors registry
 * - All SYSTEM auth attempts are logged
 */

import * as jose from 'jose';
import { createAdminClient } from '@/lib/supabase/server';
import {
    type SystemActor,
    type ServiceActorRecord,
    SYSTEM_AUTH_HEADER,
    SYSTEM_AUTH_PREFIX,
} from './actor';

// ===========================================
// CONFIGURATION
// ===========================================

/**
 * Get the service secret from environment
 * @throws if SERVICE_SECRET is not configured
 */
function getServiceSecret(): Uint8Array {
    const secret = process.env.SERVICE_SECRET;
    if (!secret || secret.length < 32) {
        throw new Error('SERVICE_SECRET must be configured and at least 32 characters');
    }
    return new TextEncoder().encode(secret);
}

/**
 * JWT algorithm for service tokens
 */
const JWT_ALGORITHM = 'HS256';

/**
 * Default token expiration (1 hour)
 */
const TOKEN_EXPIRATION = '1h';

// ===========================================
// SERVICE TOKEN VALIDATION
// ===========================================

/**
 * JWT payload for service tokens
 */
interface ServiceTokenPayload {
    service_name: string;
    iat: number;
    exp: number;
}

/**
 * Result of service token verification
 */
interface VerifyResult {
    valid: boolean;
    service_name?: string;
    error?: string;
}

/**
 * Verify a service authentication token
 * 
 * @param token - JWT token from X-Service-Auth header
 * @returns Verification result with service name if valid
 */
export async function verifyServiceToken(token: string): Promise<VerifyResult> {
    try {
        const secret = getServiceSecret();

        // Verify the JWT signature
        const { payload } = await jose.jwtVerify(token, secret, {
            algorithms: [JWT_ALGORITHM],
        });

        const serviceName = payload.service_name as string;

        if (!serviceName) {
            return { valid: false, error: 'Missing service_name in token' };
        }

        return {
            valid: true,
            service_name: serviceName,
        };
    } catch (error) {
        if (error instanceof jose.errors.JWTExpired) {
            return { valid: false, error: 'Token expired' };
        }
        if (error instanceof jose.errors.JWTInvalid) {
            return { valid: false, error: 'Invalid token signature' };
        }
        return { valid: false, error: 'Token verification failed' };
    }
}

// ===========================================
// SERVICE ACTOR LOOKUP
// ===========================================

/**
 * Get a service actor from the registry by name
 * 
 * @param serviceName - The service name to look up
 * @returns ServiceActorRecord if found and active, null otherwise
 */
export async function getServiceActor(serviceName: string): Promise<ServiceActorRecord | null> {
    try {
        const supabase = createAdminClient();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
            .from('service_actors')
            .select('*')
            .eq('service_name', serviceName)
            .eq('is_active', true)
            .single();

        if (error || !data) {
            return null;
        }

        return data as ServiceActorRecord;
    } catch {
        return null;
    }
}

/**
 * Update the last_used_at timestamp for a service actor
 */
async function updateServiceLastUsed(serviceName: string): Promise<void> {
    try {
        const supabase = createAdminClient();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
            .from('service_actors')
            .update({ last_used_at: new Date().toISOString() })
            .eq('service_name', serviceName);
    } catch {
        // Non-critical, don't fail the request
    }
}

// ===========================================
// SYSTEM REQUEST DETECTION
// ===========================================

/**
 * Check if a request is a SYSTEM request (has service auth header)
 * 
 * @param request - The incoming request
 * @returns true if request has SYSTEM auth header
 */
export function isSystemRequest(request: Request): boolean {
    const authHeader = request.headers.get(SYSTEM_AUTH_HEADER);
    return authHeader !== null && authHeader.startsWith(SYSTEM_AUTH_PREFIX);
}

/**
 * Extract the service token from request headers
 * 
 * @param request - The incoming request
 * @returns The token string or null if not present
 */
export function extractServiceToken(request: Request): string | null {
    const authHeader = request.headers.get(SYSTEM_AUTH_HEADER);

    if (!authHeader || !authHeader.startsWith(SYSTEM_AUTH_PREFIX)) {
        return null;
    }

    return authHeader.slice(SYSTEM_AUTH_PREFIX.length).trim();
}

// ===========================================
// FULL SYSTEM AUTHENTICATION
// ===========================================

/**
 * Result of full SYSTEM authentication
 */
export interface SystemAuthResult {
    authenticated: boolean;
    actor?: SystemActor;
    error?: string;
    errorCode?: 'NO_TOKEN' | 'INVALID_TOKEN' | 'EXPIRED_TOKEN' | 'SERVICE_NOT_FOUND' | 'SERVICE_INACTIVE';
}

/**
 * Authenticate a SYSTEM request
 * 
 * This is the main entry point for SYSTEM authentication:
 * 1. Extract token from headers
 * 2. Verify JWT signature
 * 3. Look up service in registry
 * 4. Build SystemActor
 * 
 * @param request - The incoming request
 * @returns Authentication result with SystemActor if successful
 */
export async function authenticateSystemRequest(request: Request): Promise<SystemAuthResult> {
    // Step 1: Extract token
    const token = extractServiceToken(request);
    if (!token) {
        return {
            authenticated: false,
            error: 'No service authentication token provided',
            errorCode: 'NO_TOKEN',
        };
    }

    // Step 2: Verify token
    const verifyResult = await verifyServiceToken(token);
    if (!verifyResult.valid) {
        return {
            authenticated: false,
            error: verifyResult.error || 'Token verification failed',
            errorCode: verifyResult.error?.includes('expired') ? 'EXPIRED_TOKEN' : 'INVALID_TOKEN',
        };
    }

    const serviceName = verifyResult.service_name!;

    // Step 3: Look up service in registry
    const serviceRecord = await getServiceActor(serviceName);
    if (!serviceRecord) {
        return {
            authenticated: false,
            error: `Service '${serviceName}' not found or inactive`,
            errorCode: 'SERVICE_NOT_FOUND',
        };
    }

    if (!serviceRecord.is_active) {
        return {
            authenticated: false,
            error: `Service '${serviceName}' is inactive`,
            errorCode: 'SERVICE_INACTIVE',
        };
    }

    // Step 4: Update last used timestamp
    await updateServiceLastUsed(serviceName);

    // Step 5: Build SystemActor
    const actor: SystemActor = {
        actor_type: 'SYSTEM',
        actor_id: serviceRecord.id,
        actor_role: null,
        region_scope: null, // SYSTEM has global access
        service_name: serviceRecord.service_name,
        allowed_operations: serviceRecord.allowed_operations,
        is_active: serviceRecord.is_active,
    };

    return {
        authenticated: true,
        actor,
    };
}

// ===========================================
// TOKEN GENERATION (for backend/cron use)
// ===========================================

/**
 * Generate a service authentication token
 * 
 * Use this in backend services/cron jobs to generate tokens
 * for authenticating with the API.
 * 
 * @param serviceName - The registered service name
 * @param expiresIn - Token expiration (default: 1h)
 * @returns Signed JWT token
 */
export async function generateServiceToken(
    serviceName: string,
    expiresIn: string = TOKEN_EXPIRATION
): Promise<string> {
    const secret = getServiceSecret();

    const token = await new jose.SignJWT({ service_name: serviceName })
        .setProtectedHeader({ alg: JWT_ALGORITHM })
        .setIssuedAt()
        .setExpirationTime(expiresIn)
        .sign(secret);

    return token;
}

// ===========================================
// IP WHITELIST VALIDATION (optional)
// ===========================================

/**
 * Validate client IP against service whitelist
 * 
 * @param serviceRecord - The service actor record
 * @param clientIp - The client IP address
 * @returns true if IP is allowed (or no whitelist configured)
 */
export function validateIpWhitelist(
    serviceRecord: ServiceActorRecord,
    clientIp: string
): boolean {
    // No whitelist means all IPs are allowed
    if (!serviceRecord.ip_whitelist || serviceRecord.ip_whitelist.length === 0) {
        return true;
    }

    // Check if client IP is in whitelist
    return serviceRecord.ip_whitelist.includes(clientIp);
}

// ===========================================
// OPERATION PERMISSION CHECK
// ===========================================

/**
 * Check if a service is allowed to perform an operation
 * 
 * @param actor - The system actor
 * @param operation - The operation to check (e.g., 'cases:create')
 * @returns true if operation is allowed
 */
export function serviceCanPerform(actor: SystemActor, operation: string): boolean {
    // Empty allowed_operations means all operations allowed
    if (actor.allowed_operations.length === 0) {
        return true;
    }

    return actor.allowed_operations.includes(operation);
}
