/**
 * Audit Logging Service - Enhanced for Traceability
 * 
 * CRITICAL GOVERNANCE REQUIREMENTS:
 * - actor_type is derived from session/service context, NOT from UI
 * - region_id is derived from affected resource, NEVER from request body
 * - All sensitive operations MUST be logged
 * - Logs are immutable (enforced at DB level)
 */

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';

// ===========================================
// AUDIT ACTION TYPES
// ===========================================

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
    // SYSTEM auto-actions
    | 'SYSTEM_DCA_ASSIGNED'
    | 'SYSTEM_AGENT_ASSIGNED'
    | 'SYSTEM_CASE_INGESTED'
    | 'SYSTEM_SLA_STARTED'
    | 'SYSTEM_SLA_BREACHED'
    | 'SYSTEM_ESCALATION_TRIGGERED'
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
    | 'SLA_BREACH_CHECK'
    | 'SLA_BREACH_CHECK_START'
    // Permission events (SECURITY)
    | 'PERMISSION_DENIED'
    | 'PERMISSION_GRANTED'
    | 'ACCESS_DENIED'
    | 'VALIDATION_FAILED'
    | 'API_KEY_INVALID'
    // Operations
    | 'REPORT_GENERATED'
    | 'REPORT_EXPORTED'
    | 'REPORT_PREVIEWED'
    | 'REPORT_ACCESS_DENIED'
    | 'REPORT_EXPORT_DENIED'
    | 'RATE_LIMITED'
    // Security & Governance
    | 'SECURITY_SETTINGS_UPDATED'
    | 'GOVERNANCE_SETTING_CHANGED'
    | 'FEATURE_FLAG_TOGGLED'
    // Integration events
    | 'INTEGRATION_ACTION'
    | 'API_KEY_REGENERATED'
    // Notification events
    | 'NOTIFICATION_DELIVERED'
    | 'NOTIFICATION_PREFERENCE_UPDATED';

export type ActorType = 'SYSTEM' | 'HUMAN';
export type AuditSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
export type RequestSource = 'SYSTEM' | 'MANUAL' | 'API' | 'WEBHOOK' | 'SCHEDULER';

// ===========================================
// SYSTEM SERVICE NAMES (for SYSTEM actors)
// ===========================================

export const SYSTEM_SERVICES = {
    DCA_ALLOCATOR: 'DCA_ALLOCATOR',
    AGENT_ASSIGNER: 'AGENT_ASSIGNER',
    CASE_INGESTOR: 'CASE_INGESTOR',
    SLA_MONITOR: 'SLA_MONITOR',
    ESCALATION_ENGINE: 'ESCALATION_ENGINE',
    REPORT_GENERATOR: 'REPORT_GENERATOR',
    NOTIFICATION_SERVICE: 'NOTIFICATION_SERVICE',
    ANALYTICS_AGGREGATOR: 'ANALYTICS_AGGREGATOR',
} as const;

// ===========================================
// AUDIT ENTRY TYPES
// ===========================================

interface BaseAuditEntry {
    action: AuditAction;
    resourceType: string;
    resourceId: string;
    regionId: string;  // MANDATORY - derived from resource
    details?: Record<string, unknown>;
    severity?: AuditSeverity;
}

interface SystemAuditEntry extends BaseAuditEntry {
    actorType: 'SYSTEM';
    serviceName: keyof typeof SYSTEM_SERVICES | string;
}

interface HumanAuditEntry extends BaseAuditEntry {
    actorType: 'HUMAN';
    userId: string;
    userEmail: string;
    userRole: string;
    ipAddress?: string;
    userAgent?: string;
}

type AuditEntry = SystemAuditEntry | HumanAuditEntry;

// ===========================================
// CORE AUDIT LOGGER
// ===========================================

/**
 * Internal function to write audit log to database
 * Uses admin client to bypass RLS
 */
async function writeAuditLog(entry: AuditEntry): Promise<string | null> {
    try {
        const supabase = createAdminClient();

        const logEntry = {
            action: entry.action,
            actor_type: entry.actorType,
            actor_service_name: entry.actorType === 'SYSTEM' ? entry.serviceName : null,
            user_id: entry.actorType === 'HUMAN' ? entry.userId : null,
            user_email: entry.actorType === 'HUMAN' ? entry.userEmail : null,
            actor_role: entry.actorType === 'HUMAN' ? entry.userRole : 'SYSTEM',
            resource_type: entry.resourceType,
            resource_id: entry.resourceId,
            region_id: entry.regionId,
            changes: entry.details || {},
            severity: entry.severity || 'INFO',
            request_source: entry.actorType === 'SYSTEM' ? 'SYSTEM' : 'MANUAL',
            user_ip: entry.actorType === 'HUMAN' ? entry.ipAddress || null : null,
            user_agent: entry.actorType === 'HUMAN' ? entry.userAgent || null : null,
            created_at: new Date().toISOString(),
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
            .from('audit_logs')
            .insert(logEntry)
            .select('id')
            .single();

        if (error) {
            console.error('[AUDIT] Failed to write to DB:', error.message);
            console.log('[AUDIT_FALLBACK]', JSON.stringify(logEntry, null, 2));
            return null;
        }

        return data?.id || null;
    } catch (error) {
        console.error('[AUDIT] Exception:', error);
        return null;
    }
}

// ===========================================
// PUBLIC LOGGING FUNCTIONS
// ===========================================

/**
 * Log a SYSTEM action (automated services)
 * 
 * @param serviceName - The service performing the action (from SYSTEM_SERVICES)
 * @param action - The action being performed
 * @param resourceType - Type of resource affected
 * @param resourceId - ID of resource affected
 * @param regionId - Region of the affected resource (DERIVED, not from UI)
 * @param details - Additional context
 */
export async function logSystemAction(
    serviceName: keyof typeof SYSTEM_SERVICES | string,
    action: AuditAction,
    resourceType: string,
    resourceId: string,
    regionId: string,
    details?: Record<string, unknown>
): Promise<string | null> {
    return writeAuditLog({
        actorType: 'SYSTEM',
        serviceName,
        action,
        resourceType,
        resourceId,
        regionId,
        details,
        severity: 'INFO',
    });
}

/**
 * Log a HUMAN action (user-initiated)
 * 
 * @param user - User context (derived from session, NOT from request body)
 * @param action - The action being performed
 * @param resourceType - Type of resource affected
 * @param resourceId - ID of resource affected
 * @param regionId - Region of the affected resource (DERIVED from resource)
 * @param details - Additional context
 * @param request - Optional request for IP/UA extraction
 */
export async function logHumanAction(
    user: { id: string; email: string; role: string },
    action: AuditAction,
    resourceType: string,
    resourceId: string,
    regionId: string,
    details?: Record<string, unknown>,
    request?: Request
): Promise<string | null> {
    const metadata = request ? getRequestMetadata(request) : { ipAddress: undefined, userAgent: undefined };

    return writeAuditLog({
        actorType: 'HUMAN',
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        action,
        resourceType,
        resourceId,
        regionId,
        details,
        severity: 'INFO',
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
    });
}

/**
 * Log a security event (CRITICAL severity)
 */
export async function logSecurityEvent(
    actorType: ActorType,
    action: AuditAction,
    resourceType: string,
    resourceId: string,
    regionId: string,
    details: Record<string, unknown>,
    user?: { id: string; email: string; role: string },
    serviceName?: string
): Promise<string | null> {
    if (actorType === 'SYSTEM') {
        return writeAuditLog({
            actorType: 'SYSTEM',
            serviceName: serviceName || 'SECURITY_MONITOR',
            action,
            resourceType,
            resourceId,
            regionId,
            details,
            severity: 'CRITICAL',
        });
    } else {
        return writeAuditLog({
            actorType: 'HUMAN',
            userId: user?.id || 'UNKNOWN',
            userEmail: user?.email || 'UNKNOWN',
            userRole: user?.role || 'UNKNOWN',
            action,
            resourceType,
            resourceId,
            regionId,
            details,
            severity: 'CRITICAL',
        });
    }
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Extract request metadata (IP, User Agent)
 */
export function getRequestMetadata(request: Request): { ipAddress: string; userAgent: string } {
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded?.split(',')[0] ?? 'unknown';
    const userAgent = request.headers.get('user-agent') ?? 'unknown';
    return { ipAddress, userAgent };
}

/**
 * Derive region_id from a case
 */
export async function deriveRegionFromCase(caseId: string): Promise<string | null> {
    try {
        const supabase = await createClient();
        const { data } = await supabase
            .from('cases')
            .select('region_id')
            .eq('id', caseId)
            .single();
        return data?.region_id || null;
    } catch {
        return null;
    }
}

/**
 * Derive region_id from a DCA
 */
export async function deriveRegionFromDCA(dcaId: string): Promise<string | null> {
    try {
        const supabase = await createClient();
        const { data } = await supabase
            .from('dcas')
            .select('region_id')
            .eq('id', dcaId)
            .single();
        return data?.region_id || null;
    } catch {
        return null;
    }
}

/**
 * Derive region_id from a user
 */
export async function deriveRegionFromUser(userId: string): Promise<string | null> {
    try {
        const supabase = await createClient();
        const { data } = await supabase
            .from('users')
            .select('primary_region_id')
            .eq('id', userId)
            .single();
        return data?.primary_region_id || null;
    } catch {
        return null;
    }
}

/**
 * Get default region (fallback when derivation fails)
 */
export async function getDefaultRegion(): Promise<string> {
    try {
        const supabase = await createClient();
        const { data } = await supabase
            .from('regions')
            .select('id')
            .eq('status', 'ACTIVE')
            .order('name')
            .limit(1)
            .single();
        return data?.id || 'DEFAULT_REGION';
    } catch {
        return 'DEFAULT_REGION';
    }
}

// ===========================================
// LEGACY COMPATIBILITY (to be deprecated)
// ===========================================

export async function logAudit(entry: {
    action: AuditAction;
    actorType?: ActorType;
    serviceName?: string;
    userId?: string;
    userEmail?: string;
    resourceType?: string;
    resourceId?: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    severity?: AuditSeverity;
    requestSource?: RequestSource;
}): Promise<void> {
    console.warn('[AUDIT] Using legacy logAudit - migrate to logSystemAction or logHumanAction');

    // Derive region from resource if possible
    let regionId = await getDefaultRegion();
    if (entry.resourceType === 'case' && entry.resourceId) {
        regionId = await deriveRegionFromCase(entry.resourceId) || regionId;
    } else if (entry.resourceType === 'dca' && entry.resourceId) {
        regionId = await deriveRegionFromDCA(entry.resourceId) || regionId;
    }

    await writeAuditLog({
        actorType: entry.actorType || 'HUMAN',
        serviceName: entry.serviceName || 'LEGACY',
        userId: entry.userId || 'UNKNOWN',
        userEmail: entry.userEmail || 'UNKNOWN',
        userRole: 'UNKNOWN',
        action: entry.action,
        resourceType: entry.resourceType || 'UNKNOWN',
        resourceId: entry.resourceId || 'UNKNOWN',
        regionId,
        details: entry.details,
        severity: entry.severity,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
    } as AuditEntry);
}

// Legacy exports for backward compatibility
export { logAudit as logUserAction };
export { logSecurityEvent as logCriticalEvent };
