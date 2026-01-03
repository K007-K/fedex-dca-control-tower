/**
 * Structured Logging Service
 * 
 * Enterprise-grade structured logging for observability.
 * All logs are JSON-formatted for Vercel/Render dashboards.
 * 
 * RULES:
 * - No secrets logged
 * - No request bodies logged
 * - Consistent fields across all log types
 */

// ===========================================
// LOG LEVELS
// ===========================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// ===========================================
// BASE LOG STRUCTURE
// ===========================================

interface BaseLog {
    timestamp: string;
    level: LogLevel;
    service: string;
    environment: string;
}

// ===========================================
// API REQUEST LOG
// ===========================================

interface APIRequestLog extends BaseLog {
    type: 'API_REQUEST';
    request_id: string;
    actor_type: 'SYSTEM' | 'HUMAN';
    actor_role?: string;
    actor_id?: string;
    endpoint: string;
    method: string;
    response_status: number;
    latency_ms: number;
}

// ===========================================
// SYSTEM JOB LOG
// ===========================================

interface SystemJobLog extends BaseLog {
    type: 'SYSTEM_JOB';
    job_name: string;
    started_at: string;
    finished_at: string;
    status: 'success' | 'failure' | 'partial';
    records_processed: number;
    errors_count: number;
    error_summary?: string;
}

// ===========================================
// ALLOCATION DECISION LOG
// ===========================================

interface AllocationLog extends BaseLog {
    type: 'ALLOCATION';
    case_id: string;
    case_number: string;
    region_id: string;
    selected_dca_id: string | null;
    selected_dca_name?: string;
    eligibility_count: number;
    selection_reason: string;
    capacity_snapshot: {
        used: number;
        limit: number;
    } | null;
}

// ===========================================
// SLA BREACH LOG
// ===========================================

interface SLABreachLog extends BaseLog {
    type: 'SLA_BREACH';
    case_id: string;
    case_number: string;
    sla_log_id: string;
    sla_template_id: string;
    sla_type: string;
    breach_time: string;
    due_at: string;
    breach_duration_minutes: number;
    escalation_action: 'ESCALATED' | 'NO_ACTION' | 'SKIPPED';
}

// ===========================================
// SECURITY EVENT LOG
// ===========================================

interface SecurityEventLog extends BaseLog {
    type: 'SECURITY';
    event: 'ACCESS_DENIED' | 'INVALID_TOKEN' | 'ROLE_ESCALATION' | 'SYSTEM_IMPERSONATION';
    actor_type: 'SYSTEM' | 'HUMAN' | 'UNKNOWN';
    actor_identifier?: string;
    endpoint: string;
    method: string;
    reason: string;
    ip_address?: string;
}

// ===========================================
// ML INFERENCE LOG
// ===========================================

interface MLInferenceLog extends BaseLog {
    type: 'ML_INFERENCE';
    case_id: string;
    inference_latency_ms: number;
    status: 'success' | 'fallback' | 'error';
    model_version: string;
    priority_score?: number;
    risk_level?: string;
}

// ===========================================
// LOGGER IMPLEMENTATION
// ===========================================

const SERVICE_NAME = 'fedex-dca-control-tower';
const ENVIRONMENT = process.env.NODE_ENV || 'development';

function formatLog(log: unknown): string {
    return JSON.stringify(log);
}

function baseLog(level: LogLevel): BaseLog {
    return {
        timestamp: new Date().toISOString(),
        level,
        service: SERVICE_NAME,
        environment: ENVIRONMENT,
    };
}

// ===========================================
// PUBLIC LOGGING FUNCTIONS
// ===========================================

/**
 * Log API request
 */
export function logAPIRequest(params: {
    request_id: string;
    actor_type: 'SYSTEM' | 'HUMAN';
    actor_role?: string;
    actor_id?: string;
    endpoint: string;
    method: string;
    response_status: number;
    latency_ms: number;
}): void {
    const log: APIRequestLog = {
        ...baseLog(params.response_status >= 500 ? 'error' : params.response_status >= 400 ? 'warn' : 'info'),
        type: 'API_REQUEST',
        ...params,
    };
    console.log(formatLog(log));
}

/**
 * Log SYSTEM job execution
 */
export function logSystemJob(params: {
    job_name: string;
    started_at: string;
    finished_at: string;
    status: 'success' | 'failure' | 'partial';
    records_processed: number;
    errors_count: number;
    error_summary?: string;
}): void {
    const log: SystemJobLog = {
        ...baseLog(params.status === 'failure' ? 'error' : params.status === 'partial' ? 'warn' : 'info'),
        type: 'SYSTEM_JOB',
        ...params,
    };
    console.log(formatLog(log));
}

/**
 * Log allocation decision
 */
export function logAllocation(params: {
    case_id: string;
    case_number: string;
    region_id: string;
    selected_dca_id: string | null;
    selected_dca_name?: string;
    eligibility_count: number;
    selection_reason: string;
    capacity_snapshot: { used: number; limit: number } | null;
}): void {
    const log: AllocationLog = {
        ...baseLog(params.selected_dca_id ? 'info' : 'warn'),
        type: 'ALLOCATION',
        ...params,
    };
    console.log(formatLog(log));
}

/**
 * Log SLA breach
 */
export function logSLABreach(params: {
    case_id: string;
    case_number: string;
    sla_log_id: string;
    sla_template_id: string;
    sla_type: string;
    breach_time: string;
    due_at: string;
    breach_duration_minutes: number;
    escalation_action: 'ESCALATED' | 'NO_ACTION' | 'SKIPPED';
}): void {
    const log: SLABreachLog = {
        ...baseLog('warn'),
        type: 'SLA_BREACH',
        ...params,
    };
    console.log(formatLog(log));
}

/**
 * Log security event
 */
export function logSecurityEvent(params: {
    event: 'ACCESS_DENIED' | 'INVALID_TOKEN' | 'ROLE_ESCALATION' | 'SYSTEM_IMPERSONATION';
    actor_type: 'SYSTEM' | 'HUMAN' | 'UNKNOWN';
    actor_identifier?: string;
    endpoint: string;
    method: string;
    reason: string;
    ip_address?: string;
}): void {
    const log: SecurityEventLog = {
        ...baseLog('error'),
        type: 'SECURITY',
        ...params,
    };
    console.error(formatLog(log));
}

/**
 * Log ML inference
 */
export function logMLInference(params: {
    case_id: string;
    inference_latency_ms: number;
    status: 'success' | 'fallback' | 'error';
    model_version: string;
    priority_score?: number;
    risk_level?: string;
}): void {
    const log: MLInferenceLog = {
        ...baseLog(params.status === 'error' ? 'error' : params.status === 'fallback' ? 'warn' : 'info'),
        type: 'ML_INFERENCE',
        ...params,
    };
    console.log(formatLog(log));
}

// ===========================================
// METRICS HELPERS
// ===========================================

let apiErrorCount = 0;
let slaBreachCount = 0;
let allocationFailureCount = 0;
let mlFallbackCount = 0;

export function incrementMetric(metric: 'api_error' | 'sla_breach' | 'allocation_failure' | 'ml_fallback'): void {
    switch (metric) {
        case 'api_error':
            apiErrorCount++;
            break;
        case 'sla_breach':
            slaBreachCount++;
            break;
        case 'allocation_failure':
            allocationFailureCount++;
            break;
        case 'ml_fallback':
            mlFallbackCount++;
            break;
    }

    // Log metric increment
    console.log(formatLog({
        ...baseLog('debug'),
        type: 'METRIC',
        metric,
        value: { api_error: apiErrorCount, sla_breach: slaBreachCount, allocation_failure: allocationFailureCount, ml_fallback: mlFallbackCount }[metric],
    }));
}

export function getMetrics(): Record<string, number> {
    return {
        api_error_count: apiErrorCount,
        sla_breach_count: slaBreachCount,
        allocation_failure_count: allocationFailureCount,
        ml_fallback_count: mlFallbackCount,
    };
}
