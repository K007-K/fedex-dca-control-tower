// ===========================================
// SLA Types
// ===========================================

export type SLAType =
    | 'FIRST_CONTACT'
    | 'WEEKLY_UPDATE'
    | 'MONTHLY_REPORT'
    | 'RESPONSE_TO_DISPUTE'
    | 'RECOVERY_TARGET'
    | 'DOCUMENTATION_SUBMISSION';

export type SLAStatus = 'PENDING' | 'MET' | 'BREACHED' | 'EXEMPT';

export interface SLATemplate {
    id: string;
    name: string;
    slaType: SLAType;
    description: string | null;

    // Time constraints
    durationHours: number;
    businessHoursOnly: boolean;

    // Applicability
    applicableTo: SLAApplicability | null;

    // Actions
    breachNotificationTo: string[] | null;
    autoEscalateOnBreach: boolean;
    escalationRules: unknown | null;

    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface SLAApplicability {
    casePriority?: string[];
    customerType?: string[];
    minAmount?: number;
    maxAmount?: number;
}

export interface SLALog {
    id: string;
    caseId: string;
    slaTemplateId: string | null;
    slaType: SLAType;

    // Timeline
    startedAt: string;
    dueAt: string;
    completedAt: string | null;

    // Status
    status: SLAStatus;
    breachDurationMinutes: number | null;

    // Exemption
    isExempt: boolean;
    exemptionReason: string | null;
    exemptedBy: string | null;
    exemptedAt: string | null;

    // Notifications
    warningSent: boolean;
    warningSentAt: string | null;
    breachNotificationSent: boolean;

    // Metadata
    metadata: unknown | null;
    createdAt: string;

    // Relations
    slaTemplate?: SLATemplate;
}

export interface SLALogWithCase extends SLALog {
    case?: import('./case').Case;
}

export interface SLASummary {
    pending: number;
    met: number;
    breached: number;
    exempt: number;
    complianceRate: number;
}

// ===========================================
// Escalation Types
// ===========================================

export type EscalationType =
    | 'SLA_BREACH'
    | 'REPEATED_BREACH'
    | 'NO_PROGRESS'
    | 'CUSTOMER_COMPLAINT'
    | 'DCA_PERFORMANCE'
    | 'HIGH_VALUE'
    | 'FRAUD_SUSPECTED'
    | 'LEGAL_REQUIRED'
    | 'MANUAL';

export type EscalationStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface Escalation {
    id: string;
    caseId: string | null;
    escalationType: EscalationType;

    // Details
    title: string;
    description: string;
    severity: string | null;

    // Status
    status: EscalationStatus;

    // Assignment
    escalatedTo: string | null;
    escalatedFrom: string | null;
    escalatedAt: string;

    // Resolution
    resolution: string | null;
    resolvedBy: string | null;
    resolvedAt: string | null;
    resolutionTimeHours: number | null;

    // Actions Taken
    caseReallocated: boolean;
    newDcaId: string | null;
    dcaPenalized: boolean;
    penaltyDetails: unknown | null;

    // Metadata
    metadata: unknown | null;
    createdAt: string;
    updatedAt: string;

    // Relations
    case?: import('./case').Case;
    escalatedToUser?: import('./user').User;
}
