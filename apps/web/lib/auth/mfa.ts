/**
 * MFA (Multi-Factor Authentication) Types and Configuration
 * Structure for future MFA implementation
 */

export type MFAMethod = 'totp' | 'sms' | 'email';

export interface MFAConfig {
    required: boolean;
    methods: MFAMethod[];
    gracePeriodsHours: number;
}

export interface MFAStatus {
    enabled: boolean;
    method: MFAMethod | null;
    verifiedAt: string | null;
    backupCodesRemaining: number;
}

/**
 * Role-based MFA requirements
 * Higher-privilege roles require MFA
 */
export const MFA_REQUIREMENTS: Record<string, MFAConfig> = {
    SUPER_ADMIN: {
        required: true,
        methods: ['totp'],
        gracePeriodsHours: 0,
    },
    FEDEX_ADMIN: {
        required: true,
        methods: ['totp', 'email'],
        gracePeriodsHours: 24,
    },
    FEDEX_MANAGER: {
        required: true,
        methods: ['totp', 'email'],
        gracePeriodsHours: 72,
    },
    FEDEX_ANALYST: {
        required: false,
        methods: ['totp', 'email'],
        gracePeriodsHours: 168,
    },
    DCA_ADMIN: {
        required: true,
        methods: ['totp', 'email'],
        gracePeriodsHours: 24,
    },
    DCA_MANAGER: {
        required: false,
        methods: ['totp', 'email'],
        gracePeriodsHours: 168,
    },
    DCA_AGENT: {
        required: false,
        methods: ['email'],
        gracePeriodsHours: 168,
    },
    AUDITOR: {
        required: true,
        methods: ['totp'],
        gracePeriodsHours: 0,
    },
    READONLY: {
        required: false,
        methods: ['email'],
        gracePeriodsHours: 168,
    },
};

/**
 * Check if MFA is required for a role
 */
export function isMFARequired(role: string): boolean {
    return MFA_REQUIREMENTS[role]?.required ?? false;
}

/**
 * Get MFA configuration for a role
 */
export function getMFAConfig(role: string): MFAConfig {
    return MFA_REQUIREMENTS[role] ?? {
        required: false,
        methods: ['email'],
        gracePeriodsHours: 168,
    };
}

/**
 * Validate TOTP code format
 */
export function isValidTOTPCode(code: string): boolean {
    return /^\d{6}$/.test(code);
}

/**
 * Check if user is within MFA grace period
 */
export function isWithinGracePeriod(
    enrolledAt: Date | null,
    graceHours: number
): boolean {
    if (!enrolledAt) return true;

    const graceEndTime = new Date(enrolledAt.getTime() + graceHours * 60 * 60 * 1000);
    return new Date() < graceEndTime;
}

/**
 * MFA enrollment status check
 * Returns true if user needs to enroll in MFA
 */
export function needsMFAEnrollment(
    role: string,
    mfaStatus: MFAStatus | null,
    createdAt: Date
): boolean {
    const config = getMFAConfig(role);

    if (!config.required) {
        return false;
    }

    if (mfaStatus?.enabled) {
        return false;
    }

    // Check grace period
    if (isWithinGracePeriod(createdAt, config.gracePeriodsHours)) {
        return false;
    }

    return true;
}
