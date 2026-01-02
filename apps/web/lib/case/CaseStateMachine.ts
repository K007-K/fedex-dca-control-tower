/**
 * Case State Machine
 * 
 * Enforces strict state transitions for case management.
 * No illegal status jumps allowed.
 * 
 * @module lib/case/CaseStateMachine
 */

import type { CaseStatus } from '@/lib/types/case';

// ===========================================
// STATE TRANSITION DEFINITIONS
// ===========================================

/**
 * Valid state transitions map
 * Each status maps to an array of allowed next statuses
 */
export const CASE_STATUS_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
    // Initial state - can only be allocated
    PENDING_ALLOCATION: ['ALLOCATED'],

    // Allocated - work starts or can be unallocated
    ALLOCATED: ['IN_PROGRESS', 'PENDING_ALLOCATION'],

    // In progress - contact made or escalation
    IN_PROGRESS: ['CUSTOMER_CONTACTED', 'ESCALATED', 'DISPUTED'],

    // Customer contacted - various outcomes
    CUSTOMER_CONTACTED: ['PAYMENT_PROMISED', 'DISPUTED', 'ESCALATED', 'IN_PROGRESS'],

    // Payment promised - await fulfillment
    PAYMENT_PROMISED: ['PARTIAL_RECOVERY', 'FULL_RECOVERY', 'IN_PROGRESS', 'ESCALATED'],

    // Partial recovery - continue or close
    PARTIAL_RECOVERY: ['FULL_RECOVERY', 'PAYMENT_PROMISED', 'WRITTEN_OFF', 'CLOSED', 'ESCALATED'],

    // Full recovery - close
    FULL_RECOVERY: ['CLOSED'],

    // Disputed - resolve or escalate
    DISPUTED: ['IN_PROGRESS', 'LEGAL_ACTION', 'WRITTEN_OFF', 'CLOSED'],

    // Escalated - higher level handling
    ESCALATED: ['IN_PROGRESS', 'LEGAL_ACTION', 'WRITTEN_OFF'],

    // Legal action - final outcomes
    LEGAL_ACTION: ['FULL_RECOVERY', 'PARTIAL_RECOVERY', 'WRITTEN_OFF', 'CLOSED'],

    // Written off - can only close
    WRITTEN_OFF: ['CLOSED'],

    // Terminal state - no transitions allowed
    CLOSED: [],
};

/**
 * Status metadata for UI and business logic
 */
export const CASE_STATUS_METADATA: Record<CaseStatus, {
    label: string;
    description: string;
    category: 'ACTIVE' | 'PENDING' | 'RESOLVED' | 'TERMINAL';
    color: string;
    requiresAction: boolean;
}> = {
    PENDING_ALLOCATION: {
        label: 'Pending Allocation',
        description: 'Case awaiting DCA assignment',
        category: 'PENDING',
        color: 'yellow',
        requiresAction: true,
    },
    ALLOCATED: {
        label: 'Allocated',
        description: 'Assigned to DCA, awaiting first contact',
        category: 'ACTIVE',
        color: 'blue',
        requiresAction: true,
    },
    IN_PROGRESS: {
        label: 'In Progress',
        description: 'Active collection in progress',
        category: 'ACTIVE',
        color: 'blue',
        requiresAction: true,
    },
    CUSTOMER_CONTACTED: {
        label: 'Customer Contacted',
        description: 'Initial contact made with customer',
        category: 'ACTIVE',
        color: 'cyan',
        requiresAction: true,
    },
    PAYMENT_PROMISED: {
        label: 'Payment Promised',
        description: 'Customer committed to payment',
        category: 'PENDING',
        color: 'purple',
        requiresAction: false,
    },
    PARTIAL_RECOVERY: {
        label: 'Partial Recovery',
        description: 'Partial payment received',
        category: 'RESOLVED',
        color: 'green',
        requiresAction: true,
    },
    FULL_RECOVERY: {
        label: 'Full Recovery',
        description: 'Full amount recovered',
        category: 'RESOLVED',
        color: 'green',
        requiresAction: false,
    },
    DISPUTED: {
        label: 'Disputed',
        description: 'Customer disputing the invoice',
        category: 'ACTIVE',
        color: 'orange',
        requiresAction: true,
    },
    ESCALATED: {
        label: 'Escalated',
        description: 'Escalated for management review',
        category: 'ACTIVE',
        color: 'red',
        requiresAction: true,
    },
    LEGAL_ACTION: {
        label: 'Legal Action',
        description: 'Referred for legal proceedings',
        category: 'ACTIVE',
        color: 'red',
        requiresAction: true,
    },
    WRITTEN_OFF: {
        label: 'Written Off',
        description: 'Deemed unrecoverable',
        category: 'TERMINAL',
        color: 'gray',
        requiresAction: false,
    },
    CLOSED: {
        label: 'Closed',
        description: 'Case completed',
        category: 'TERMINAL',
        color: 'gray',
        requiresAction: false,
    },
};

// ===========================================
// STATE MACHINE CLASS
// ===========================================

export interface TransitionValidationResult {
    valid: boolean;
    reason?: string;
    allowedTransitions?: CaseStatus[];
}

export interface TransitionContext {
    userId: string;
    userRole: string;
    reason?: string;
    recoveredAmount?: number;
    paymentMethod?: string;
    notes?: string;
}

export class CaseStateMachine {

    /**
     * Check if a transition from one status to another is valid
     */
    static canTransition(from: CaseStatus, to: CaseStatus): TransitionValidationResult {
        const allowedTransitions = CASE_STATUS_TRANSITIONS[from];

        if (!allowedTransitions) {
            return {
                valid: false,
                reason: `Unknown status: ${from}`,
            };
        }

        if (from === to) {
            return {
                valid: true, // Same status is always valid (no-op)
            };
        }

        if (!allowedTransitions.includes(to)) {
            return {
                valid: false,
                reason: `Cannot transition from ${from} to ${to}`,
                allowedTransitions,
            };
        }

        return { valid: true };
    }

    /**
     * Get all valid next statuses from current status
     */
    static getNextStatuses(currentStatus: CaseStatus): CaseStatus[] {
        return CASE_STATUS_TRANSITIONS[currentStatus] || [];
    }

    /**
     * Check if a status is terminal (no further transitions)
     */
    static isTerminal(status: CaseStatus): boolean {
        return CASE_STATUS_TRANSITIONS[status]?.length === 0;
    }

    /**
     * Validate a transition and throw if invalid
     */
    static validateTransition(from: CaseStatus, to: CaseStatus): void {
        const result = this.canTransition(from, to);
        if (!result.valid) {
            throw new CaseStateError(
                result.reason || 'Invalid transition',
                from,
                to,
                result.allowedTransitions
            );
        }
    }

    /**
     * Get status metadata
     */
    static getStatusMetadata(status: CaseStatus) {
        return CASE_STATUS_METADATA[status];
    }

    /**
     * Get all statuses by category
     */
    static getStatusesByCategory(category: 'ACTIVE' | 'PENDING' | 'RESOLVED' | 'TERMINAL'): CaseStatus[] {
        return (Object.entries(CASE_STATUS_METADATA) as [CaseStatus, typeof CASE_STATUS_METADATA[CaseStatus]][])
            .filter(([, meta]) => meta.category === category)
            .map(([status]) => status);
    }

    /**
     * Validate transition with additional business rules
     */
    static validateBusinessRules(
        from: CaseStatus,
        to: CaseStatus,
        context: TransitionContext
    ): TransitionValidationResult {
        // First check basic transition validity
        const basicResult = this.canTransition(from, to);
        if (!basicResult.valid) {
            return basicResult;
        }

        // Additional business rules

        // FULL_RECOVERY requires recovered amount
        if (to === 'FULL_RECOVERY' && (!context.recoveredAmount || context.recoveredAmount <= 0)) {
            return {
                valid: false,
                reason: 'Full recovery requires a positive recovered amount',
            };
        }

        // WRITTEN_OFF requires reason
        if (to === 'WRITTEN_OFF' && !context.reason) {
            return {
                valid: false,
                reason: 'Write-off requires a reason',
            };
        }

        // LEGAL_ACTION restricted to certain roles
        if (to === 'LEGAL_ACTION' && !['SUPER_ADMIN', 'FEDEX_ADMIN', 'FEDEX_MANAGER'].includes(context.userRole)) {
            return {
                valid: false,
                reason: 'Legal action can only be initiated by management',
            };
        }

        return { valid: true };
    }
}

// ===========================================
// ERROR CLASS
// ===========================================

export class CaseStateError extends Error {
    constructor(
        message: string,
        public readonly fromStatus: CaseStatus,
        public readonly toStatus: CaseStatus,
        public readonly allowedTransitions?: CaseStatus[]
    ) {
        super(message);
        this.name = 'CaseStateError';
    }

    toJSON() {
        return {
            error: 'INVALID_STATE_TRANSITION',
            message: this.message,
            fromStatus: this.fromStatus,
            toStatus: this.toStatus,
            allowedTransitions: this.allowedTransitions,
        };
    }
}
