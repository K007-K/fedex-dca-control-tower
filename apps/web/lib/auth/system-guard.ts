/**
 * System Guard - Spoofing Protection
 * 
 * Protects against attempts to impersonate SYSTEM actors.
 * All spoofing attempts are logged as security events.
 * 
 * SECURITY PRINCIPLES:
 * - UI-originated requests can NEVER be SYSTEM
 * - Invalid SYSTEM credentials result in 403 + security log
 * - IP-based blocking for repeated violations
 */

import { logCriticalEvent, getRequestMetadata } from '@/lib/audit';
import { SYSTEM_AUTH_HEADER, REQUEST_ID_HEADER } from './actor';

// ===========================================
// SPOOFING DETECTION
// ===========================================

/**
 * Headers that indicate UI/browser origin
 */
const UI_ORIGIN_INDICATORS = [
    'sec-fetch-mode',
    'sec-fetch-site',
    'sec-fetch-dest',
] as const;

/**
 * Headers that SYSTEM requests must NOT have
 */
const FORBIDDEN_SYSTEM_HEADERS = [
    'cookie',           // SYSTEM doesn't use cookies
    'sec-ch-ua',        // Browser user-agent hints
    'sec-ch-ua-mobile', // Browser mobile hint
];

/**
 * Check if a request appears to be from a browser/UI
 */
export function isFromBrowser(request: Request): boolean {
    // Check for Sec-Fetch headers (only browsers send these)
    for (const header of UI_ORIGIN_INDICATORS) {
        if (request.headers.has(header)) {
            return true;
        }
    }

    // Check for user-agent patterns typical of browsers
    const userAgent = request.headers.get('user-agent') || '';
    const browserPatterns = [
        'Mozilla/',
        'Chrome/',
        'Safari/',
        'Firefox/',
        'Edge/',
        'Opera/',
    ];

    for (const pattern of browserPatterns) {
        if (userAgent.includes(pattern)) {
            return true;
        }
    }

    return false;
}

// ===========================================
// SPOOFING ATTEMPT DETECTION
// ===========================================

export interface SpoofingCheckResult {
    isSpoofing: boolean;
    reason?: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

/**
 * Comprehensive check for SYSTEM impersonation attempts
 * 
 * @param request - The incoming request
 * @param hasValidSystemAuth - Whether SYSTEM auth was validated
 * @returns Spoofing check result
 */
export function detectSpoofingAttempt(
    request: Request,
    hasValidSystemAuth: boolean
): SpoofingCheckResult {
    const hasSystemAuthHeader = request.headers.has(SYSTEM_AUTH_HEADER);
    const isFromUI = isFromBrowser(request);

    // Case 1: UI request with SYSTEM auth header = CRITICAL spoofing
    if (isFromUI && hasSystemAuthHeader) {
        return {
            isSpoofing: true,
            reason: 'UI-originated request with SYSTEM auth header',
            severity: 'CRITICAL',
        };
    }

    // Case 2: Has SYSTEM header but auth failed = potential attack
    if (hasSystemAuthHeader && !hasValidSystemAuth) {
        return {
            isSpoofing: true,
            reason: 'Invalid SYSTEM authentication credentials',
            severity: 'HIGH',
        };
    }

    // Case 3: SYSTEM request with forbidden headers
    if (hasSystemAuthHeader) {
        for (const header of FORBIDDEN_SYSTEM_HEADERS) {
            if (request.headers.has(header)) {
                return {
                    isSpoofing: true,
                    reason: `SYSTEM request with forbidden header: ${header}`,
                    severity: 'MEDIUM',
                };
            }
        }
    }

    return {
        isSpoofing: false,
        severity: 'LOW',
    };
}

// ===========================================
// SECURITY VIOLATION LOGGING
// ===========================================

/**
 * Log a security violation for spoofing attempt
 */
export async function logSpoofingAttempt(
    request: Request,
    result: SpoofingCheckResult
): Promise<void> {
    const { ipAddress, userAgent } = getRequestMetadata(request);
    const requestId = request.headers.get(REQUEST_ID_HEADER) || 'unknown';

    await logCriticalEvent(
        'PERMISSION_DENIED',
        {
            type: 'SYSTEM_SPOOFING_ATTEMPT',
            reason: result.reason,
            severity: result.severity,
            request_id: requestId,
            endpoint: new URL(request.url).pathname,
            method: request.method,
            user_agent: userAgent,
            headers: {
                has_system_auth: request.headers.has(SYSTEM_AUTH_HEADER),
                sec_fetch_mode: request.headers.get('sec-fetch-mode'),
                sec_fetch_site: request.headers.get('sec-fetch-site'),
            },
        },
        ipAddress
    );
}

// ===========================================
// GUARD MIDDLEWARE HELPER
// ===========================================

/**
 * Guard result for middleware use
 */
export interface GuardResult {
    allowed: boolean;
    error?: string;
    statusCode: number;
}

/**
 * Execute full spoofing guard check
 * 
 * This is the main entry point for the guard.
 * Returns whether the request should be allowed to proceed.
 * 
 * @param request - The incoming request
 * @param hasValidSystemAuth - Whether SYSTEM auth was successfully validated
 * @returns Guard result with allowed status
 */
export async function guard(
    request: Request,
    hasValidSystemAuth: boolean
): Promise<GuardResult> {
    const spoofCheck = detectSpoofingAttempt(request, hasValidSystemAuth);

    if (spoofCheck.isSpoofing) {
        // Log the security violation
        await logSpoofingAttempt(request, spoofCheck);

        return {
            allowed: false,
            error: 'Access denied: Security violation detected',
            statusCode: 403,
        };
    }

    return {
        allowed: true,
        statusCode: 200,
    };
}

// ===========================================
// RATE LIMITING FOR FAILED ATTEMPTS
// ===========================================

/**
 * In-memory tracking of failed SYSTEM auth attempts by IP
 * In production, this should use Redis or similar
 */
const failedAttempts: Map<string, { count: number; firstAttempt: number }> = new Map();

/**
 * Maximum failed attempts before temporary block
 */
const MAX_FAILED_ATTEMPTS = 5;

/**
 * Time window for failed attempts (15 minutes)
 */
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

/**
 * Block duration after max failures (1 hour)
 */
const BLOCK_DURATION_MS = 60 * 60 * 1000;

/**
 * Record a failed SYSTEM auth attempt
 */
export function recordFailedAttempt(ipAddress: string): void {
    const now = Date.now();
    const record = failedAttempts.get(ipAddress);

    if (!record || now - record.firstAttempt > ATTEMPT_WINDOW_MS) {
        // Start new window
        failedAttempts.set(ipAddress, { count: 1, firstAttempt: now });
    } else {
        // Increment existing window
        record.count++;
    }
}

/**
 * Check if an IP is temporarily blocked
 */
export function isIpBlocked(ipAddress: string): boolean {
    const record = failedAttempts.get(ipAddress);
    if (!record) return false;

    const now = Date.now();

    // Check if still in block period
    if (record.count >= MAX_FAILED_ATTEMPTS) {
        if (now - record.firstAttempt < BLOCK_DURATION_MS) {
            return true;
        }
        // Block period expired, clear record
        failedAttempts.delete(ipAddress);
    }

    return false;
}

/**
 * Clear failed attempts for an IP (on successful auth)
 */
export function clearFailedAttempts(ipAddress: string): void {
    failedAttempts.delete(ipAddress);
}

// ===========================================
// CLEANUP (call periodically)
// ===========================================

/**
 * Clean up expired failed attempt records
 * Call this periodically (e.g., every 5 minutes)
 */
export function cleanupExpiredRecords(): void {
    const now = Date.now();
    const expireThreshold = ATTEMPT_WINDOW_MS + BLOCK_DURATION_MS;

    for (const [ip, record] of failedAttempts.entries()) {
        if (now - record.firstAttempt > expireThreshold) {
            failedAttempts.delete(ip);
        }
    }
}
