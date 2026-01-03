/**
 * Audit Logging Service
 * P1-6 FIX: Implement comprehensive audit logging for sensitive operations
 */

import { createClient } from '@/lib/supabase/server';

export type AuditAction =
    // Authentication events
    | 'USER_LOGIN'
    | 'USER_LOGOUT'
    | 'USER_LOGIN_FAILED'
    // User management events
    | 'USER_CREATED'
    | 'USER_UPDATED'
    | 'USER_DELETED'
    | 'PASSWORD_CHANGED'
    | 'PASSWORD_RESET_REQUESTED'
    // Role management events (SECURITY)
    | 'ROLE_CHANGED'
    | 'ROLE_ESCALATION_ATTEMPT'
    // Region access events (SECURITY)
    | 'REGION_ACCESS_GRANTED'
    | 'REGION_ACCESS_REVOKED'
    | 'CROSS_REGION_ACCESS_ATTEMPT'
    // Case events
    | 'CASE_CREATED'
    | 'CASE_UPDATED'
    | 'CASE_DELETED'
    | 'CASE_ASSIGNED'
    | 'CASE_ESCALATED'
    | 'CASE_STATUS_CHANGED'
    | 'CASE_CREATION_FAILED'
    // Bulk operations
    | 'BULK_ACTION'
    | 'BULK_STATUS_CHANGE'
    | 'BULK_ALLOCATION'
    // DCA events
    | 'DCA_CREATED'
    | 'DCA_UPDATED'
    | 'DCA_DELETED'
    // SLA events
    | 'SLA_CREATED'
    | 'SLA_UPDATED'
    | 'SLA_BREACHED'
    // Permission events (SECURITY)
    | 'PERMISSION_DENIED'
    | 'PERMISSION_GRANTED'
    | 'ACCESS_DENIED'
    | 'VALIDATION_FAILED'
    | 'API_KEY_INVALID'
    // Operations
    | 'REPORT_GENERATED'
    | 'RATE_LIMITED'
    // Security & Governance
    | 'SECURITY_SETTINGS_UPDATED'
    // SLA system events
    | 'SLA_BREACH_CHECK'
    | 'SLA_BREACH_CHECK_START';


export type AuditSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

interface AuditLogEntry {
    action: AuditAction;
    // Actor identification
    actorType?: 'SYSTEM' | 'HUMAN';
    serviceName?: string;  // For SYSTEM actors
    userId?: string;
    userEmail?: string;
    // Resource affected
    resourceType?: string;
    resourceId?: string;
    // Context
    details?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    severity?: AuditSeverity;
    requestSource?: 'SYSTEM' | 'MANUAL';
}

/**
 * Log an audit event
 */
export async function logAudit(entry: AuditLogEntry): Promise<void> {
    try {
        const supabase = await createClient();

        const logEntry = {
            action: entry.action,
            // Actor identification
            actor_type: entry.actorType || 'HUMAN',
            service_name: entry.serviceName || null,
            user_id: entry.userId || null,
            user_email: entry.userEmail || null,
            // Resource affected
            resource_type: entry.resourceType || null,
            resource_id: entry.resourceId || null,
            // Context
            details: entry.details || {},
            ip_address: entry.ipAddress || null,
            user_agent: entry.userAgent || null,
            severity: entry.severity || 'INFO',
            request_source: entry.requestSource || 'MANUAL',
            created_at: new Date().toISOString(),
        };

        // Try to insert into audit_logs table
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
            .from('audit_logs')
            .insert(logEntry);

        if (error) {
            // Fall back to console logging if table doesn't exist
            console.log('[AUDIT]', JSON.stringify(logEntry, null, 2));
        }
    } catch (error) {
        // Always fall back to console to ensure audit trail is captured
        console.log('[AUDIT]', JSON.stringify({
            ...entry,
            timestamp: new Date().toISOString(),
        }, null, 2));
    }
}

/**
 * Log a security event (e.g., failed login, permission denied)
 */
export async function logSecurityEvent(
    action: AuditAction,
    userId: string | undefined,
    details: Record<string, unknown>,
    ipAddress?: string
): Promise<void> {
    await logAudit({
        action,
        userId,
        details,
        ipAddress,
        severity: 'WARNING',
    });
}

/**
 * Log a critical security event (e.g., rate limiting, suspected abuse)
 */
export async function logCriticalEvent(
    action: AuditAction,
    details: Record<string, unknown>,
    ipAddress?: string
): Promise<void> {
    await logAudit({
        action,
        details,
        ipAddress,
        severity: 'CRITICAL',
    });
}

/**
 * Log a user action
 */
export async function logUserAction(
    action: AuditAction,
    userId: string,
    userEmail: string,
    resourceType: string,
    resourceId: string,
    details?: Record<string, unknown>
): Promise<void> {
    await logAudit({
        action,
        userId,
        userEmail,
        resourceType,
        resourceId,
        details,
        severity: 'INFO',
    });
}

/**
 * Create a helper function to extract request metadata
 */
export function getRequestMetadata(request: Request): { ipAddress: string; userAgent: string } {
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded?.split(',')[0] ?? 'unknown';
    const userAgent = request.headers.get('user-agent') ?? 'unknown';

    return { ipAddress, userAgent };
}

/**
 * Log a SYSTEM actor action
 * Use this when logging actions performed by automated services
 */
export async function logSystemAction(
    action: AuditAction,
    serviceName: string,
    resourceType: string,
    resourceId: string,
    details?: Record<string, unknown>,
    ipAddress?: string
): Promise<void> {
    await logAudit({
        action,
        actorType: 'SYSTEM',
        serviceName,
        resourceType,
        resourceId,
        details,
        ipAddress,
        severity: 'INFO',
        requestSource: 'SYSTEM',
    });
}
