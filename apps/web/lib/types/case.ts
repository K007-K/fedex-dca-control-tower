// ===========================================
// Case Types
// ===========================================

export type CaseStatus =
    | 'PENDING_ALLOCATION'
    | 'ALLOCATED'
    | 'IN_PROGRESS'
    | 'CUSTOMER_CONTACTED'
    | 'PAYMENT_PROMISED'
    | 'PARTIAL_RECOVERY'
    | 'FULL_RECOVERY'
    | 'DISPUTED'
    | 'ESCALATED'
    | 'LEGAL_ACTION'
    | 'WRITTEN_OFF'
    | 'CLOSED';

export type CasePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Case {
    id: string;
    caseNumber: string;

    // Invoice Details
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    originalAmount: number;
    outstandingAmount: number;
    currency: string;

    // Customer Information
    customerId: string;
    customerName: string;
    customerType: string | null;
    customerSegment: string | null;
    customerIndustry: string | null;
    customerCountry: string | null;
    customerState: string | null;
    customerCity: string | null;
    customerContact: CustomerContact | null;
    customerCreditScore: number | null;
    customerPaymentHistory: unknown | null;

    // Case Metadata
    status: CaseStatus;
    priority: CasePriority;
    ageingDays: number;
    ageingBucket: string;

    // AI Scores
    priorityScore: number | null;
    recoveryProbability: number | null;
    aiConfidenceScore: number | null;
    riskScore: number | null;
    lastScoredAt: string | null;

    // Assignment
    assignedDcaId: string | null;
    assignedAgentId: string | null;
    assignedAt: string | null;
    assignmentMethod: string | null;

    // Recovery Details
    recoveredAmount: number;
    recoveryPercentage: number;
    lastPaymentDate: string | null;
    paymentPlanActive: boolean;
    paymentPlanDetails: unknown | null;

    // Dispute Management
    isDisputed: boolean;
    disputeReason: string | null;
    disputeOpenedAt: string | null;
    disputeResolvedAt: string | null;
    disputeResolution: string | null;

    // Flags
    highPriorityFlag: boolean;
    vipCustomer: boolean;
    fraudSuspected: boolean;
    bankruptcyFlag: boolean;

    // ROE Recommendations
    roeRecommendations: ROERecommendation[] | null;
    roeLastUpdated: string | null;

    // Tracking
    firstContactDate: string | null;
    lastContactDate: string | null;
    contactAttempts: number;
    successfulContacts: number;

    // Documents
    documentUrls: CaseDocument[] | null;

    // Metadata
    tags: string[] | null;
    internalNotes: string | null;
    metadata: unknown | null;

    // Timestamps
    createdAt: string;
    updatedAt: string;
    createdBy: string | null;
    updatedBy: string | null;

    // Relations (when expanded)
    assignedDca?: DCA;
    assignedAgent?: User;
    actions?: CaseAction[];
    slaLogs?: SLALog[];
}

export interface CustomerContact {
    phone?: string;
    email?: string;
    address?: {
        street?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
    };
}

export interface CaseDocument {
    type: string;
    url: string;
    uploadedAt: string;
    uploadedBy?: string;
    name?: string;
}

export interface ROERecommendation {
    id: string;
    type: 'CONTACT' | 'SETTLEMENT' | 'ESCALATION' | 'WRITE_OFF';
    recommendation: string;
    confidence: number;
    reasoning: string;
    generatedAt: string;
}

export interface CaseFilters {
    status?: CaseStatus[];
    priority?: CasePriority[];
    assignedDcaId?: string;
    ageingBucket?: string[];
    search?: string;
    dateRange?: {
        start: string;
        end: string;
    };
    minAmount?: number;
    maxAmount?: number;
}

export interface CaseCreateInput {
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    originalAmount: number;
    outstandingAmount: number;
    currency?: string;
    customerId: string;
    customerName: string;
    customerType?: string;
    customerSegment?: string;
    customerIndustry?: string;
    customerCountry?: string;
    customerState?: string;
    customerCity?: string;
    customerContact?: CustomerContact;
    priority?: CasePriority;
    tags?: string[];
    internalNotes?: string;
}

export interface CaseUpdateInput {
    status?: CaseStatus;
    priority?: CasePriority;
    assignedDcaId?: string | null;
    assignedAgentId?: string | null;
    outstandingAmount?: number;
    recoveredAmount?: number;
    internalNotes?: string;
    tags?: string[];
}

// ===========================================
// Case Action Types
// ===========================================

export type ContactMethod =
    | 'PHONE'
    | 'EMAIL'
    | 'SMS'
    | 'LETTER'
    | 'IN_PERSON'
    | 'LEGAL_NOTICE';

export type ContactOutcome =
    | 'NO_ANSWER'
    | 'WRONG_NUMBER'
    | 'VOICEMAIL'
    | 'SPOKE_WITH_CUSTOMER'
    | 'PAYMENT_COMMITTED'
    | 'DISPUTE_RAISED'
    | 'CALLBACK_REQUESTED'
    | 'REFUSED_TO_PAY'
    | 'BANKRUPTCY_DECLARED';

export interface CaseAction {
    id: string;
    caseId: string;
    actionType: string;
    actionDescription: string | null;

    // Contact Details
    contactMethod: ContactMethod | null;
    contactOutcome: ContactOutcome | null;
    contactDurationSeconds: number | null;
    contactNotes: string | null;
    nextContactScheduled: string | null;

    // Payment Details
    paymentAmount: number | null;
    paymentMethod: string | null;
    paymentReference: string | null;

    // Status Change
    oldStatus: CaseStatus | null;
    newStatus: CaseStatus | null;
    statusChangeReason: string | null;

    // Actor
    performedBy: string;
    performedByRole: UserRole;
    performedByDcaId: string | null;

    // Sentiment
    sentimentScore: number | null;
    sentimentLabel: string | null;

    // Metadata
    metadata: unknown | null;
    createdAt: string;

    // Relations
    performer?: User;
}

// Forward declarations for relations
import type { DCA } from './dca';
import type { User, UserRole } from './user';
import type { SLALog } from './sla';
