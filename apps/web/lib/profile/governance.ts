/**
 * Profile Settings Governance Configuration
 * 
 * Defines role-based editable fields for profile settings.
 * Backend MUST enforce these rules - UI restrictions are secondary.
 * 
 * CORE PRINCIPLES:
 * - Email is NEVER editable (security identifier)
 * - Role is NEVER editable (authorization control)
 * - Profile Settings are for SELF-MANAGEMENT only
 */

import { UserRole } from '@/lib/auth/rbac';

// ============================================================
// FIELD CLASSIFICATION
// ============================================================

/**
 * RESTRICTED FIELDS - Never editable by any user in profile settings
 * These require system admin workflows to change
 */
export const RESTRICTED_FIELDS = [
    'email',
    'role',
    'organization_id',
    'dca_id',
    'primary_region_id',
    'auth_user_id',
    'id',
    'is_active',
    'created_at',
    'updated_at',
] as const;

/**
 * COSMETIC FIELDS - May be editable depending on role
 */
export const COSMETIC_FIELDS = [
    'display_name',
    'full_name',
    'phone',
    'timezone',
    'language',
    'theme',
] as const;

type RestrictedField = typeof RESTRICTED_FIELDS[number];
type CosmeticField = typeof COSMETIC_FIELDS[number];

// ============================================================
// ROLE-BASED EDITABLE FIELDS
// ============================================================

interface ProfileRuleSet {
    editable: CosmeticField[];
    visible_security: string[];
    can_revoke_sessions: boolean;
    mfa_mandatory: boolean;
}

export const PROFILE_RULES: Record<UserRole, ProfileRuleSet> = {
    // ============================================================
    // SUPER_ADMIN - Maximum visibility, limited edit (security)
    // ============================================================
    'SUPER_ADMIN': {
        editable: ['display_name', 'full_name', 'phone'],
        visible_security: ['mfa_status', 'last_login', 'password_changed', 'active_sessions'],
        can_revoke_sessions: true,
        mfa_mandatory: true,
    },

    // ============================================================
    // FEDEX_ADMIN - High visibility
    // ============================================================
    'FEDEX_ADMIN': {
        editable: ['display_name', 'full_name', 'phone'],
        visible_security: ['mfa_status', 'last_login', 'active_sessions'],
        can_revoke_sessions: false,
        mfa_mandatory: false,
    },

    // ============================================================
    // FEDEX_MANAGER - Standard access
    // ============================================================
    'FEDEX_MANAGER': {
        editable: ['display_name', 'full_name', 'phone'],
        visible_security: ['last_login', 'password_changed'],
        can_revoke_sessions: false,
        mfa_mandatory: false,
    },

    // ============================================================
    // FEDEX_ANALYST - Limited edit
    // ============================================================
    'FEDEX_ANALYST': {
        editable: ['display_name', 'full_name'],
        visible_security: ['last_login'],
        can_revoke_sessions: false,
        mfa_mandatory: false,
    },

    // ============================================================
    // FEDEX_AUDITOR - Limited edit (read-heavy role)
    // ============================================================
    'FEDEX_AUDITOR': {
        editable: ['display_name', 'full_name'],
        visible_security: ['last_login'],
        can_revoke_sessions: false,
        mfa_mandatory: false,
    },

    // ============================================================
    // FEDEX_VIEWER - Minimal edit
    // ============================================================
    'FEDEX_VIEWER': {
        editable: ['display_name', 'full_name'],
        visible_security: ['last_login'],
        can_revoke_sessions: false,
        mfa_mandatory: false,
    },

    // ============================================================
    // DCA_ADMIN - DCA boundary visible
    // ============================================================
    'DCA_ADMIN': {
        editable: ['display_name', 'full_name', 'phone'],
        visible_security: ['last_login', 'active_sessions'],
        can_revoke_sessions: false,
        mfa_mandatory: false,
    },

    // ============================================================
    // DCA_MANAGER - Standard DCA access
    // ============================================================
    'DCA_MANAGER': {
        editable: ['display_name', 'full_name', 'phone'],
        visible_security: ['last_login'],
        can_revoke_sessions: false,
        mfa_mandatory: false,
    },

    // ============================================================
    // DCA_AGENT - Minimal access
    // ============================================================
    'DCA_AGENT': {
        editable: ['display_name', 'full_name'],
        visible_security: ['last_login'],
        can_revoke_sessions: false,
        mfa_mandatory: false,
    },

    // ============================================================
    // READONLY - Legacy read-only role
    // ============================================================
    'READONLY': {
        editable: ['display_name'],
        visible_security: ['last_login'],
        can_revoke_sessions: false,
        mfa_mandatory: false,
    },

    // ============================================================
    // AUDITOR - Legacy auditor role
    // ============================================================
    'AUDITOR': {
        editable: ['display_name', 'full_name'],
        visible_security: ['last_login'],
        can_revoke_sessions: false,
        mfa_mandatory: false,
    },
};

// ============================================================
// GOVERNANCE HELPER FUNCTIONS
// ============================================================

/**
 * Get editable fields for a role
 */
export function getEditableFields(role: UserRole): CosmeticField[] {
    return PROFILE_RULES[role]?.editable || ['display_name'];
}

/**
 * Check if a field is editable for a role
 */
export function isFieldEditable(role: UserRole, field: string): boolean {
    const editableFields = getEditableFields(role);
    return editableFields.includes(field as CosmeticField);
}

/**
 * Check if a field is restricted (never editable)
 */
export function isRestrictedField(field: string): boolean {
    return RESTRICTED_FIELDS.includes(field as RestrictedField);
}

/**
 * Validate profile update payload - returns list of violations
 */
export function validateProfileUpdate(
    role: UserRole,
    payload: Record<string, unknown>
): { valid: boolean; violations: string[]; sanitized: Record<string, unknown> } {
    const violations: string[] = [];
    const sanitized: Record<string, unknown> = {};
    const editableFields = getEditableFields(role);

    for (const [field, value] of Object.entries(payload)) {
        // Check for restricted field access attempt
        if (isRestrictedField(field)) {
            violations.push(`${field} is a restricted security field`);
            continue;
        }

        // Check if field is editable for this role
        if (!editableFields.includes(field as CosmeticField)) {
            violations.push(`${field} is not editable for ${role}`);
            continue;
        }

        // Field is valid
        sanitized[field] = value;
    }

    return {
        valid: violations.length === 0,
        violations,
        sanitized,
    };
}

/**
 * Get security visibility for a role
 */
export function getSecurityVisibility(role: UserRole): string[] {
    return PROFILE_RULES[role]?.visible_security || ['last_login'];
}

/**
 * Check if role can revoke sessions
 */
export function canRevokeSessions(role: UserRole): boolean {
    return PROFILE_RULES[role]?.can_revoke_sessions || false;
}
