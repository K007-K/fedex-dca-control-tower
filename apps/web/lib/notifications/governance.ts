/**
 * Notification Governance Configuration
 * 
 * Defines notification tiers, role eligibility, and enforcement rules.
 * This is the single source of truth for notification authorization.
 * 
 * CORE PRINCIPLE: Notifications are SYSTEM-EMITTED EVENTS.
 * Users can ONLY express delivery PREFERENCES, not control event existence.
 */

import { UserRole } from '@/lib/auth/rbac';

// ============================================================
// NOTIFICATION TIER SYSTEM
// ============================================================

export type NotificationTier = 'CRITICAL' | 'OPERATIONAL' | 'INFORMATIONAL';

export interface NotificationConfig {
    id: string;
    label: string;
    description: string;
    tier: NotificationTier;
    // If true, user CANNOT disable this notification
    isNonDisableable: boolean;
    // Roles that are eligible to receive this notification
    eligibleRoles: UserRole[];
    // Default delivery channels
    defaultEmail: boolean;
    defaultInApp: boolean;
    // UI display category
    category: 'SYSTEM' | 'CASE' | 'DCA' | 'PLATFORM';
}

// ============================================================
// GOVERNED NOTIFICATION TYPES
// ============================================================

export const GOVERNED_NOTIFICATIONS: Record<string, NotificationConfig> = {
    // ============================================================
    // TIER 1 — CRITICAL (NON-DISABLEABLE)
    // ============================================================
    'sla_breaches': {
        id: 'sla_breaches',
        label: 'SLA Breaches',
        description: 'Critical alerts when SLA deadlines are breached',
        tier: 'CRITICAL',
        isNonDisableable: true,
        eligibleRoles: ['SUPER_ADMIN', 'FEDEX_ADMIN', 'FEDEX_MANAGER', 'FEDEX_AUDITOR', 'DCA_ADMIN'],
        defaultEmail: true,
        defaultInApp: true,
        category: 'SYSTEM',
    },
    'escalations': {
        id: 'escalations',
        label: 'Escalations',
        description: 'Immediate notification for case escalations',
        tier: 'CRITICAL',
        isNonDisableable: true,
        eligibleRoles: ['SUPER_ADMIN', 'FEDEX_ADMIN', 'FEDEX_MANAGER', 'DCA_ADMIN', 'DCA_MANAGER', 'DCA_AGENT'],
        defaultEmail: true,
        defaultInApp: true,
        category: 'SYSTEM',
    },
    'security_events': {
        id: 'security_events',
        label: 'Security Events',
        description: 'Security alerts, unauthorized access attempts, and login anomalies',
        tier: 'CRITICAL',
        isNonDisableable: true,
        eligibleRoles: ['SUPER_ADMIN', 'FEDEX_ADMIN'],
        defaultEmail: true,
        defaultInApp: true,
        category: 'SYSTEM',
    },
    'system_outages': {
        id: 'system_outages',
        label: 'System Outages',
        description: 'System health alerts, outages, and maintenance windows',
        tier: 'CRITICAL',
        isNonDisableable: true,
        eligibleRoles: ['SUPER_ADMIN', 'FEDEX_ADMIN'],
        defaultEmail: true,
        defaultInApp: true,
        category: 'SYSTEM',
    },
    'allocation_failures': {
        id: 'allocation_failures',
        label: 'Allocation Failures',
        description: 'Alerts when case allocation fails or encounters errors',
        tier: 'CRITICAL',
        isNonDisableable: true,
        eligibleRoles: ['SUPER_ADMIN', 'FEDEX_ADMIN', 'FEDEX_MANAGER'],
        defaultEmail: true,
        defaultInApp: true,
        category: 'SYSTEM',
    },

    // ============================================================
    // TIER 2 — OPERATIONAL (ROLE-BASED)
    // ============================================================
    'case_updates': {
        id: 'case_updates',
        label: 'Case Updates',
        description: 'Receive notifications when cases are updated or status changes',
        tier: 'OPERATIONAL',
        isNonDisableable: false,
        eligibleRoles: ['SUPER_ADMIN', 'FEDEX_ADMIN', 'FEDEX_MANAGER', 'FEDEX_ANALYST', 'DCA_ADMIN', 'DCA_MANAGER', 'DCA_AGENT'],
        defaultEmail: true,
        defaultInApp: true,
        category: 'CASE',
    },
    'case_assignments': {
        id: 'case_assignments',
        label: 'Case Assignments',
        description: 'Notifications when cases are assigned to or from your scope',
        tier: 'OPERATIONAL',
        isNonDisableable: false,
        eligibleRoles: ['FEDEX_MANAGER', 'DCA_ADMIN', 'DCA_MANAGER', 'DCA_AGENT'],
        defaultEmail: true,
        defaultInApp: true,
        category: 'CASE',
    },
    'sla_warnings': {
        id: 'sla_warnings',
        label: 'SLA Warnings',
        description: 'Alerts when SLA deadlines are approaching (before breach)',
        tier: 'OPERATIONAL',
        isNonDisableable: false,
        eligibleRoles: ['SUPER_ADMIN', 'FEDEX_ADMIN', 'FEDEX_MANAGER', 'DCA_ADMIN', 'DCA_MANAGER', 'DCA_AGENT'],
        defaultEmail: true,
        defaultInApp: true,
        category: 'CASE',
    },
    'dca_performance': {
        id: 'dca_performance',
        label: 'DCA Performance',
        description: 'Updates on DCA performance metrics and capacity',
        tier: 'OPERATIONAL',
        isNonDisableable: false,
        eligibleRoles: ['SUPER_ADMIN', 'FEDEX_ADMIN', 'FEDEX_MANAGER', 'DCA_ADMIN', 'DCA_MANAGER'],
        defaultEmail: false,
        defaultInApp: true,
        category: 'DCA',
    },
    'allocation_completed': {
        id: 'allocation_completed',
        label: 'Allocation Completed',
        description: 'Notification when case allocation completes successfully',
        tier: 'OPERATIONAL',
        isNonDisableable: false,
        eligibleRoles: ['SUPER_ADMIN', 'FEDEX_ADMIN', 'FEDEX_MANAGER', 'DCA_ADMIN', 'DCA_MANAGER'],
        defaultEmail: false,
        defaultInApp: true,
        category: 'CASE',
    },

    // ============================================================
    // TIER 3 — INFORMATIONAL (OPTIONAL)
    // ============================================================
    'weekly_summaries': {
        id: 'weekly_summaries',
        label: 'Weekly Summaries',
        description: 'Weekly digest of key metrics and activities',
        tier: 'INFORMATIONAL',
        isNonDisableable: false,
        eligibleRoles: ['SUPER_ADMIN', 'FEDEX_ADMIN', 'FEDEX_MANAGER', 'FEDEX_ANALYST', 'DCA_ADMIN', 'DCA_MANAGER'],
        defaultEmail: false,
        defaultInApp: true,
        category: 'PLATFORM',
    },
    'platform_updates': {
        id: 'platform_updates',
        label: 'Platform Updates',
        description: 'New features, improvements, and platform announcements',
        tier: 'INFORMATIONAL',
        isNonDisableable: false,
        eligibleRoles: ['SUPER_ADMIN', 'FEDEX_ADMIN', 'FEDEX_MANAGER', 'FEDEX_ANALYST', 'FEDEX_AUDITOR', 'FEDEX_VIEWER', 'DCA_ADMIN', 'DCA_MANAGER', 'DCA_AGENT'],
        defaultEmail: false,
        defaultInApp: true,
        category: 'PLATFORM',
    },
};

// ============================================================
// GOVERNANCE HELPER FUNCTIONS
// ============================================================

/**
 * Get notifications accessible to a user role
 */
export function getNotificationsForRole(userRole: UserRole): NotificationConfig[] {
    return Object.values(GOVERNED_NOTIFICATIONS).filter(
        notification => notification.eligibleRoles.includes(userRole)
    );
}

/**
 * Check if a notification can be disabled by user
 */
export function canDisableNotification(notificationId: string): boolean {
    const notification = GOVERNED_NOTIFICATIONS[notificationId];
    return notification ? !notification.isNonDisableable : false;
}

/**
 * Check if user role is eligible for a notification
 */
export function isEligibleForNotification(notificationId: string, userRole: UserRole): boolean {
    const notification = GOVERNED_NOTIFICATIONS[notificationId];
    if (!notification) return false;
    return notification.eligibleRoles.includes(userRole);
}

/**
 * Get tier display badge color
 */
export function getTierBadgeColor(tier: NotificationTier): { bg: string; text: string } {
    switch (tier) {
        case 'CRITICAL':
            return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' };
        case 'OPERATIONAL':
            return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' };
        case 'INFORMATIONAL':
            return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300' };
    }
}

/**
 * Get category display label
 */
export function getCategoryLabel(category: NotificationConfig['category']): string {
    switch (category) {
        case 'SYSTEM':
            return 'System';
        case 'CASE':
            return 'Cases';
        case 'DCA':
            return 'DCA';
        case 'PLATFORM':
            return 'Platform';
    }
}

/**
 * Validate preference update - returns list of invalid changes
 * Used by backend to reject attempts to disable critical notifications
 */
export function validatePreferenceUpdate(
    preferences: Record<string, { email: boolean; inApp: boolean }>
): { valid: boolean; invalidChanges: string[] } {
    const invalidChanges: string[] = [];

    for (const [notificationId, prefs] of Object.entries(preferences)) {
        const notification = GOVERNED_NOTIFICATIONS[notificationId];
        if (!notification) continue;

        // Critical notifications cannot be turned off
        if (notification.isNonDisableable) {
            if (!prefs.email || !prefs.inApp) {
                invalidChanges.push(notificationId);
            }
        }
    }

    return {
        valid: invalidChanges.length === 0,
        invalidChanges,
    };
}
