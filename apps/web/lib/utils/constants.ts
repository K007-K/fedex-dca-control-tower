// ===========================================
// Application Constants
// ===========================================

export const APP_NAME = 'FedEx DCA Control Tower';
export const APP_DESCRIPTION = 'Enterprise Debt Collection Agency Management System';

// ===========================================
// Case Status
// ===========================================

export const CASE_STATUS = {
    PENDING_ALLOCATION: 'PENDING_ALLOCATION',
    ALLOCATED: 'ALLOCATED',
    IN_PROGRESS: 'IN_PROGRESS',
    CUSTOMER_CONTACTED: 'CUSTOMER_CONTACTED',
    PAYMENT_PROMISED: 'PAYMENT_PROMISED',
    PARTIAL_RECOVERY: 'PARTIAL_RECOVERY',
    FULL_RECOVERY: 'FULL_RECOVERY',
    DISPUTED: 'DISPUTED',
    ESCALATED: 'ESCALATED',
    LEGAL_ACTION: 'LEGAL_ACTION',
    WRITTEN_OFF: 'WRITTEN_OFF',
    CLOSED: 'CLOSED',
} as const;

export type CaseStatus = (typeof CASE_STATUS)[keyof typeof CASE_STATUS];

export const CASE_STATUS_CONFIG: Record<
    CaseStatus,
    { label: string; color: string; bgColor: string }
> = {
    PENDING_ALLOCATION: {
        label: 'Pending Allocation',
        color: 'text-gray-700',
        bgColor: 'bg-gray-100',
    },
    ALLOCATED: {
        label: 'Allocated',
        color: 'text-info-700',
        bgColor: 'bg-info-50',
    },
    IN_PROGRESS: {
        label: 'In Progress',
        color: 'text-info-700',
        bgColor: 'bg-info-50',
    },
    CUSTOMER_CONTACTED: {
        label: 'Customer Contacted',
        color: 'text-primary-700',
        bgColor: 'bg-primary-50',
    },
    PAYMENT_PROMISED: {
        label: 'Payment Promised',
        color: 'text-success-700',
        bgColor: 'bg-success-50',
    },
    PARTIAL_RECOVERY: {
        label: 'Partial Recovery',
        color: 'text-success-700',
        bgColor: 'bg-success-50',
    },
    FULL_RECOVERY: {
        label: 'Full Recovery',
        color: 'text-success-700',
        bgColor: 'bg-success-100',
    },
    DISPUTED: {
        label: 'Disputed',
        color: 'text-warning-700',
        bgColor: 'bg-warning-50',
    },
    ESCALATED: {
        label: 'Escalated',
        color: 'text-danger-700',
        bgColor: 'bg-danger-50',
    },
    LEGAL_ACTION: {
        label: 'Legal Action',
        color: 'text-danger-700',
        bgColor: 'bg-danger-100',
    },
    WRITTEN_OFF: {
        label: 'Written Off',
        color: 'text-gray-700',
        bgColor: 'bg-gray-200',
    },
    CLOSED: {
        label: 'Closed',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
    },
};

// ===========================================
// Case Priority
// ===========================================

export const CASE_PRIORITY = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL',
} as const;

export type CasePriority = (typeof CASE_PRIORITY)[keyof typeof CASE_PRIORITY];

export const CASE_PRIORITY_CONFIG: Record<
    CasePriority,
    { label: string; color: string; bgColor: string; order: number }
> = {
    LOW: {
        label: 'Low',
        color: 'text-gray-700',
        bgColor: 'bg-gray-100',
        order: 1,
    },
    MEDIUM: {
        label: 'Medium',
        color: 'text-info-700',
        bgColor: 'bg-info-50',
        order: 2,
    },
    HIGH: {
        label: 'High',
        color: 'text-warning-700',
        bgColor: 'bg-warning-50',
        order: 3,
    },
    CRITICAL: {
        label: 'Critical',
        color: 'text-danger-700',
        bgColor: 'bg-danger-50',
        order: 4,
    },
};

// ===========================================
// DCA Status
// ===========================================

export const DCA_STATUS = {
    ACTIVE: 'ACTIVE',
    SUSPENDED: 'SUSPENDED',
    TERMINATED: 'TERMINATED',
    PENDING_APPROVAL: 'PENDING_APPROVAL',
} as const;

export type DCAStatus = (typeof DCA_STATUS)[keyof typeof DCA_STATUS];

export const DCA_STATUS_CONFIG: Record<
    DCAStatus,
    { label: string; color: string; bgColor: string }
> = {
    ACTIVE: {
        label: 'Active',
        color: 'text-success-700',
        bgColor: 'bg-success-50',
    },
    SUSPENDED: {
        label: 'Suspended',
        color: 'text-warning-700',
        bgColor: 'bg-warning-50',
    },
    TERMINATED: {
        label: 'Terminated',
        color: 'text-danger-700',
        bgColor: 'bg-danger-50',
    },
    PENDING_APPROVAL: {
        label: 'Pending Approval',
        color: 'text-gray-700',
        bgColor: 'bg-gray-100',
    },
};

// ===========================================
// User Roles
// ===========================================

export const USER_ROLE = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    FEDEX_ADMIN: 'FEDEX_ADMIN',
    FEDEX_MANAGER: 'FEDEX_MANAGER',
    FEDEX_ANALYST: 'FEDEX_ANALYST',
    FEDEX_AUDITOR: 'FEDEX_AUDITOR',
    DCA_ADMIN: 'DCA_ADMIN',
    DCA_MANAGER: 'DCA_MANAGER',
    DCA_AGENT: 'DCA_AGENT',
    AUDITOR: 'AUDITOR',  // Legacy - maps to FEDEX_AUDITOR
    READONLY: 'READONLY',
} as const;

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];

export const USER_ROLE_CONFIG: Record<
    UserRole,
    { label: string; description: string; level: number }
> = {
    SUPER_ADMIN: {
        label: 'Super Admin',
        description: 'Full system access',
        level: 100,
    },
    FEDEX_ADMIN: {
        label: 'FedEx Admin',
        description: 'FedEx administrative access',
        level: 90,
    },
    FEDEX_MANAGER: {
        label: 'FedEx Manager',
        description: 'FedEx management access',
        level: 80,
    },
    FEDEX_ANALYST: {
        label: 'FedEx Analyst',
        description: 'FedEx analytics and reporting',
        level: 70,
    },
    FEDEX_AUDITOR: {
        label: 'FedEx Auditor',
        description: 'FedEx internal audit access',
        level: 35,
    },
    DCA_ADMIN: {
        label: 'DCA Admin',
        description: 'DCA administrative access',
        level: 60,
    },
    DCA_MANAGER: {
        label: 'DCA Manager',
        description: 'DCA management access',
        level: 50,
    },
    DCA_AGENT: {
        label: 'DCA Agent',
        description: 'DCA agent access',
        level: 40,
    },
    AUDITOR: {
        label: 'Auditor (Legacy)',
        description: 'Read-only audit access',
        level: 30,
    },
    READONLY: {
        label: 'Read Only',
        description: 'External view-only access',
        level: 10,
    },
};

// ===========================================
// SLA Types
// ===========================================

export const SLA_TYPE = {
    FIRST_CONTACT: 'FIRST_CONTACT',
    WEEKLY_UPDATE: 'WEEKLY_UPDATE',
    MONTHLY_REPORT: 'MONTHLY_REPORT',
    RESPONSE_TO_DISPUTE: 'RESPONSE_TO_DISPUTE',
    RECOVERY_TARGET: 'RECOVERY_TARGET',
    DOCUMENTATION_SUBMISSION: 'DOCUMENTATION_SUBMISSION',
} as const;

export type SLAType = (typeof SLA_TYPE)[keyof typeof SLA_TYPE];

export const SLA_STATUS = {
    PENDING: 'PENDING',
    MET: 'MET',
    BREACHED: 'BREACHED',
    EXEMPT: 'EXEMPT',
} as const;

export type SLAStatus = (typeof SLA_STATUS)[keyof typeof SLA_STATUS];

// ===========================================
// Contact Methods
// ===========================================

export const CONTACT_METHOD = {
    PHONE: 'PHONE',
    EMAIL: 'EMAIL',
    SMS: 'SMS',
    LETTER: 'LETTER',
    IN_PERSON: 'IN_PERSON',
    LEGAL_NOTICE: 'LEGAL_NOTICE',
} as const;

export type ContactMethod = (typeof CONTACT_METHOD)[keyof typeof CONTACT_METHOD];

// ===========================================
// Pagination
// ===========================================

export const DEFAULT_PAGE_SIZE = 25;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// ===========================================
// Ageing Buckets
// ===========================================

export const AGEING_BUCKETS = ['0-30', '31-60', '61-90', '91-180', '180+'] as const;

export type AgeingBucket = (typeof AGEING_BUCKETS)[number];
