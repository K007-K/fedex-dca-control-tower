// ===========================================
// DCA Types
// ===========================================

export type DCAStatus = 'ACTIVE' | 'SUSPENDED' | 'TERMINATED' | 'PENDING_APPROVAL';

export interface DCA {
    id: string;
    organizationId: string | null;
    name: string;
    legalName: string | null;
    registrationNumber: string | null;
    status: DCAStatus;

    // Performance Metrics
    performanceScore: number;
    recoveryRate: number;
    slaComplianceRate: number;
    avgRecoveryTimeDays: number | null;
    totalCasesHandled: number;
    totalAmountRecovered: number;

    // Capacity Management
    capacityLimit: number;
    capacityUsed: number;
    maxCaseValue: number | null;
    minCaseValue: number | null;

    // Specializations
    specializations: string[] | null;
    geographicCoverage: string[] | null;

    // Compliance
    certifications: string[] | null;
    licenseExpiry: string | null;
    insuranceValidUntil: string | null;
    lastAuditDate: string | null;
    auditScore: number | null;

    // Contract
    contractStartDate: string | null;
    contractEndDate: string | null;
    commissionRate: number | null;

    // Contact
    primaryContactName: string | null;
    primaryContactEmail: string | null;
    primaryContactPhone: string | null;

    // Metadata
    metadata: unknown | null;
    createdAt: string;
    updatedAt: string;
    createdBy: string | null;
    updatedBy: string | null;

    // Computed
    capacityPercentage?: number;
    isNearCapacity?: boolean;
}

export interface DCAPerformanceMetrics {
    dcaId: string;
    dcaName: string;
    totalCases: number;
    recoveredCases: number;
    totalRecovered: number;
    totalOutstanding: number;
    avgResolutionDays: number | null;
    slaBreaches: number;
    slaMet: number;
    slaComplianceRate: number;
}

export interface DCAFilters {
    status?: DCAStatus[];
    search?: string;
    capacityMin?: number;
    capacityMax?: number;
    performanceScoreMin?: number;
    specializations?: string[];
    geographicCoverage?: string[];
}

export interface DCACreateInput {
    name: string;
    legalName?: string;
    registrationNumber?: string;
    capacityLimit: number;
    maxCaseValue?: number;
    minCaseValue?: number;
    specializations?: string[];
    geographicCoverage?: string[];
    commissionRate?: number;
    primaryContactName: string;
    primaryContactEmail: string;
    primaryContactPhone?: string;
}

export interface DCAUpdateInput {
    name?: string;
    legalName?: string;
    status?: DCAStatus;
    capacityLimit?: number;
    maxCaseValue?: number;
    minCaseValue?: number;
    specializations?: string[];
    geographicCoverage?: string[];
    commissionRate?: number;
    primaryContactName?: string;
    primaryContactEmail?: string;
    primaryContactPhone?: string;
    licenseExpiry?: string;
    insuranceValidUntil?: string;
}
