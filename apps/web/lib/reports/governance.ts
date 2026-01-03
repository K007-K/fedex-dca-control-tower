/**
 * Report Governance Configuration
 * 
 * Defines access control, scope, and sensitivity for each report type.
 * This is the single source of truth for report authorization.
 */

import { UserRole } from '@/lib/auth/rbac';

// ============================================================
// REPORT ACCESS MATRIX (MANDATORY - Per Enterprise Requirements)
// ============================================================

export interface ReportGovernance {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    // Access Control
    allowedRoles: UserRole[];
    // Scope defines data boundaries
    scope: 'GLOBAL' | 'REGION' | 'DCA';
    // Data classification
    sensitivity: 'FINANCIAL' | 'COMPLIANCE' | 'OPERATIONAL';
    // Export permissions
    csvExportAllowed: boolean;
    // Audit requirements
    auditRequired: boolean;
    // Data freshness indicator
    refreshInterval: '5min' | '15min' | '1hr' | '24hr';
}

// ============================================================
// GOVERNED REPORT TEMPLATES
// ============================================================

export const GOVERNED_REPORTS: Record<string, ReportGovernance> = {
    'recovery-summary': {
        id: 'recovery-summary',
        name: 'Recovery Summary',
        description: 'Monthly overview of recovery performance across all DCAs',
        icon: '💰',
        category: 'Financial',
        // Access: SUPER_ADMIN, FEDEX_ADMIN only
        allowedRoles: ['SUPER_ADMIN', 'FEDEX_ADMIN'],
        scope: 'GLOBAL',
        sensitivity: 'FINANCIAL',
        csvExportAllowed: true,
        auditRequired: true,
        refreshInterval: '1hr',
    },
    'dca-performance': {
        id: 'dca-performance',
        name: 'DCA Performance Report',
        description: 'Detailed performance metrics for each DCA partner',
        icon: '📊',
        category: 'Operations',
        // Access: SUPER_ADMIN, FEDEX_MANAGER
        allowedRoles: ['SUPER_ADMIN', 'FEDEX_MANAGER', 'FEDEX_ADMIN'],
        scope: 'REGION',
        sensitivity: 'OPERATIONAL',
        csvExportAllowed: true,
        auditRequired: true,
        refreshInterval: '15min',
    },
    'sla-compliance': {
        id: 'sla-compliance',
        name: 'SLA Compliance Report',
        description: 'Track SLA adherence and identify breaches',
        icon: '⏱️',
        category: 'Compliance',
        // Access: SUPER_ADMIN, FEDEX_AUDITOR
        allowedRoles: ['SUPER_ADMIN', 'FEDEX_AUDITOR', 'FEDEX_ADMIN'],
        scope: 'GLOBAL',
        sensitivity: 'COMPLIANCE',
        csvExportAllowed: true,
        auditRequired: true,
        refreshInterval: '5min',
    },
    'aging-report': {
        id: 'aging-report',
        name: 'Aging Report',
        description: 'Cases grouped by days past due',
        icon: '📅',
        category: 'Financial',
        // Access: SUPER_ADMIN, FEDEX_MANAGER
        allowedRoles: ['SUPER_ADMIN', 'FEDEX_MANAGER', 'FEDEX_ADMIN'],
        scope: 'REGION',
        sensitivity: 'FINANCIAL',
        csvExportAllowed: true,
        auditRequired: true,
        refreshInterval: '1hr',
    },
};

// ============================================================
// GOVERNANCE HELPER FUNCTIONS
// ============================================================

/**
 * Check if a user role can access a specific report
 */
export function canAccessReport(reportId: string, userRole: UserRole): boolean {
    const report = GOVERNED_REPORTS[reportId];
    if (!report) return false;
    return report.allowedRoles.includes(userRole);
}

/**
 * Check if a user role can export CSV for a specific report
 * FEDEX_VIEWER and DCA roles cannot export
 */
export function canExportReport(reportId: string, userRole: UserRole): boolean {
    const report = GOVERNED_REPORTS[reportId];
    if (!report) return false;

    // FEDEX_VIEWER cannot export
    if (userRole === 'FEDEX_VIEWER') return false;

    // DCA roles cannot export beyond their scope
    if (userRole.startsWith('DCA_')) return false;

    // Must be in allowed roles AND csvExportAllowed
    return report.csvExportAllowed && report.allowedRoles.includes(userRole);
}

/**
 * Get reports accessible to a user role
 */
export function getAccessibleReports(userRole: UserRole): ReportGovernance[] {
    return Object.values(GOVERNED_REPORTS).filter(report =>
        report.allowedRoles.includes(userRole)
    );
}

/**
 * Get sensitivity label color
 */
export function getSensitivityColor(sensitivity: ReportGovernance['sensitivity']): { bg: string; text: string } {
    switch (sensitivity) {
        case 'FINANCIAL':
            return { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300' };
        case 'COMPLIANCE':
            return { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300' };
        case 'OPERATIONAL':
            return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' };
        default:
            return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300' };
    }
}

/**
 * Get scope label
 */
export function getScopeLabel(scope: ReportGovernance['scope']): string {
    switch (scope) {
        case 'GLOBAL':
            return 'Cross-Region';
        case 'REGION':
            return 'Region-Scoped';
        case 'DCA':
            return 'DCA-Specific';
        default:
            return scope;
    }
}
