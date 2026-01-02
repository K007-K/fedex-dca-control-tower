/**
 * Application Configuration Module
 * 
 * Centralizes configuration values to avoid hardcoded logic throughout the codebase.
 * All configuration is read-only and can be extended to support:
 * - Environment variables
 * - Database-driven config
 * - Feature flags
 */

/**
 * Region Configuration
 * Maps region codes to their properties
 */
export const REGION_CONFIG = {
    AMERICAS: {
        name: 'Americas',
        currency: 'USD',
        timezone: 'America/New_York',
        businessHoursStart: 9,
        businessHoursEnd: 18,
        locale: 'en-US',
    },
    EMEA: {
        name: 'Europe, Middle East & Africa',
        currency: 'EUR',
        timezone: 'Europe/London',
        businessHoursStart: 9,
        businessHoursEnd: 18,
        locale: 'en-GB',
    },
    APAC: {
        name: 'Asia Pacific',
        currency: 'USD',
        timezone: 'Asia/Singapore',
        businessHoursStart: 9,
        businessHoursEnd: 18,
        locale: 'en-SG',
    },
    INDIA: {
        name: 'India',
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        businessHoursStart: 9,
        businessHoursEnd: 18,
        locale: 'en-IN',
    },
    LATAM: {
        name: 'Latin America',
        currency: 'USD',
        timezone: 'America/Sao_Paulo',
        businessHoursStart: 9,
        businessHoursEnd: 18,
        locale: 'es-MX',
    },
    GLOBAL: {
        name: 'Global',
        currency: 'USD',
        timezone: 'UTC',
        businessHoursStart: 0,
        businessHoursEnd: 24,
        locale: 'en-US',
    },
} as const;

export type RegionCode = keyof typeof REGION_CONFIG;

/**
 * Get currency for a region
 */
export function getCurrencyForRegion(region: string | null | undefined): 'USD' | 'INR' | 'EUR' {
    if (!region || region === 'ALL') return 'USD';
    const config = REGION_CONFIG[region as RegionCode];
    return (config?.currency || 'USD') as 'USD' | 'INR' | 'EUR';
}

/**
 * SLA Configuration
 * Default SLA durations by priority
 */
export const SLA_CONFIG = {
    CRITICAL: {
        responseTimeHours: 1,
        resolutionTimeHours: 24,
        escalationThresholdHours: 2,
    },
    HIGH: {
        responseTimeHours: 4,
        resolutionTimeHours: 48,
        escalationThresholdHours: 8,
    },
    MEDIUM: {
        responseTimeHours: 8,
        resolutionTimeHours: 72,
        escalationThresholdHours: 24,
    },
    LOW: {
        responseTimeHours: 24,
        resolutionTimeHours: 168, // 7 days
        escalationThresholdHours: 48,
    },
} as const;

export type Priority = keyof typeof SLA_CONFIG;

/**
 * Pagination Defaults
 */
export const PAGINATION_CONFIG = {
    defaultPageSize: 25,
    maxPageSize: 100,
    defaultPage: 1,
} as const;

/**
 * DCA Capacity Thresholds
 */
export const DCA_CONFIG = {
    nearCapacityThreshold: 0.9, // 90%
    warningCapacityThreshold: 0.75, // 75%
    defaultCapacityLimit: 100,
    defaultPerformanceScore: 50,
    defaultCommissionRate: 15,
} as const;

/**
 * Case Configuration
 */
export const CASE_CONFIG = {
    autoGeneratePrefix: 'CASE',
    agingBuckets: {
        current: { min: 0, max: 30 },
        aging30: { min: 31, max: 60 },
        aging60: { min: 61, max: 90 },
        aging90Plus: { min: 91, max: Infinity },
    },
} as const;

/**
 * Feature Flags (can be extended to pull from DB/env)
 */
export const FEATURE_FLAGS = {
    enableMLPrioritization: true,
    enableWebhooks: true,
    enableEmailNotifications: true,
    enableAuditLogging: true,
    enableRegionEnforcement: true,
} as const;

/**
 * RBAC Configuration
 * Role and permission configuration for enterprise authorization
 * Can be extended to load from database for runtime changes
 */
export const RBAC_CONFIG = {
    /** Roles that bypass region checks (global access) */
    globalRoles: ['SUPER_ADMIN', 'FEDEX_ADMIN'] as const,

    /** Roles that require region-specific access */
    regionalRoles: ['FEDEX_MANAGER', 'FEDEX_ANALYST', 'DCA_ADMIN', 'DCA_MANAGER', 'DCA_AGENT'] as const,

    /** DCA-specific roles that are restricted to their assigned DCA */
    dcaRoles: ['DCA_ADMIN', 'DCA_MANAGER', 'DCA_AGENT'] as const,

    /** FedEx internal roles */
    fedexRoles: ['SUPER_ADMIN', 'FEDEX_ADMIN', 'FEDEX_MANAGER', 'FEDEX_ANALYST'] as const,

    /** Role hierarchy (higher number = more privileges) */
    roleHierarchy: {
        SUPER_ADMIN: 100,
        FEDEX_ADMIN: 90,
        FEDEX_MANAGER: 70,
        FEDEX_ANALYST: 50,
        DCA_ADMIN: 60,
        DCA_MANAGER: 40,
        DCA_AGENT: 20,
        AUDITOR: 30,
        READONLY: 10,
    } as const,

    /** Access level hierarchy */
    accessLevelHierarchy: {
        READ: 1,
        WRITE: 2,
        ADMIN: 3,
    } as const,
} as const;

/**
 * Check if a role is a global admin (bypasses region checks)
 */
export function isGlobalRole(role: string): boolean {
    return RBAC_CONFIG.globalRoles.includes(role as typeof RBAC_CONFIG.globalRoles[number]);
}

/**
 * Check if a role is a DCA role (restricted to assigned DCA)
 */
export function isDCARole(role: string): boolean {
    return RBAC_CONFIG.dcaRoles.includes(role as typeof RBAC_CONFIG.dcaRoles[number]);
}

/**
 * Check if a role is a FedEx internal role
 */
export function isFedExRole(role: string): boolean {
    return RBAC_CONFIG.fedexRoles.includes(role as typeof RBAC_CONFIG.fedexRoles[number]);
}

/**
 * Check if role A can manage role B (based on hierarchy)
 */
export function canManageRole(managerRole: string, targetRole: string): boolean {
    const managerLevel = RBAC_CONFIG.roleHierarchy[managerRole as keyof typeof RBAC_CONFIG.roleHierarchy] || 0;
    const targetLevel = RBAC_CONFIG.roleHierarchy[targetRole as keyof typeof RBAC_CONFIG.roleHierarchy] || 0;
    return managerLevel > targetLevel;
}
