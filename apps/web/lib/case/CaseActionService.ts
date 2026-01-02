/**
 * Case Action Service
 * 
 * Handles case actions with:
 * - Idempotency key support
 * - Optimistic locking (concurrency protection)
 * - State machine validation
 * - Comprehensive timeline logging
 * 
 * @module lib/case/CaseActionService
 */

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { CaseStateMachine, CaseStateError, type TransitionContext } from './CaseStateMachine';
import { logUserAction } from '@/lib/audit';
import type { CaseStatus } from '@/lib/types/case';

// ===========================================
// TYPES
// ===========================================

export type TimelineEventCategory = 'SYSTEM' | 'DCA' | 'AI' | 'SLA' | 'USER';

export type TimelineEventType =
    // System events
    | 'CASE_CREATED'
    | 'CASE_AUTO_ALLOCATED'
    | 'CASE_MANUALLY_ALLOCATED'
    | 'CASE_REALLOCATED'
    | 'CASE_UNALLOCATED'
    | 'STATUS_CHANGED'
    | 'PRIORITY_CHANGED'
    | 'CASE_CLOSED'
    // DCA events
    | 'CONTACT_ATTEMPTED'
    | 'CONTACT_SUCCESSFUL'
    | 'PAYMENT_RECEIVED'
    | 'PAYMENT_PROMISE_RECORDED'
    | 'DISPUTE_RAISED'
    | 'DISPUTE_RESOLVED'
    | 'NOTE_ADDED'
    // AI events
    | 'PRIORITY_SCORED'
    | 'RISK_ASSESSED'
    | 'ROE_GENERATED'
    | 'AI_RECOMMENDATION'
    // SLA events
    | 'SLA_STARTED'
    | 'SLA_WARNING'
    | 'SLA_BREACHED'
    | 'SLA_MET';

export interface TimelineEvent {
    id?: string;
    case_id: string;
    event_type: TimelineEventType;
    event_category: TimelineEventCategory;
    description: string;
    old_value?: string;
    new_value?: string;
    metadata?: Record<string, unknown>;
    performed_by: string;
    performed_by_role: string;
    performed_by_dca_id?: string;
    idempotency_key?: string;
    created_at?: string;
}

export interface ActionResult {
    success: boolean;
    data?: unknown;
    error?: {
        code: string;
        message: string;
        details?: unknown;
    };
    idempotent?: boolean; // True if action was already processed
}

export interface StatusChangeInput {
    caseId: string;
    newStatus: CaseStatus;
    reason?: string;
    recoveredAmount?: number;
    paymentMethod?: string;
    notes?: string;
    idempotencyKey?: string;
}

export interface UserContext {
    id: string;
    email?: string;
    role: string;
    dcaId?: string | null;
}

// ===========================================
// CASE ACTION SERVICE
// ===========================================

export class CaseActionService {

    /**
     * Change case status with state machine validation and timeline logging
     */
    static async changeStatus(
        input: StatusChangeInput,
        user: UserContext
    ): Promise<ActionResult> {
        const supabase = await createClient();

        try {
            // Check idempotency
            if (input.idempotencyKey) {
                const duplicate = await this.checkIdempotency(input.idempotencyKey, input.caseId);
                if (duplicate) {
                    return {
                        success: true,
                        data: duplicate,
                        idempotent: true,
                    };
                }
            }

            // Get current case with version check
            const { data: currentCase, error: fetchError } = await (supabase as any)
                .from('cases')
                .select('id, status, updated_at, outstanding_amount, recovered_amount, assigned_dca_id')
                .eq('id', input.caseId)
                .single();

            if (fetchError || !currentCase) {
                return {
                    success: false,
                    error: { code: 'NOT_FOUND', message: 'Case not found' },
                };
            }

            const currentStatus = currentCase.status as CaseStatus;

            // Validate state transition
            const transitionContext: TransitionContext = {
                userId: user.id,
                userRole: user.role,
                reason: input.reason,
                recoveredAmount: input.recoveredAmount,
                notes: input.notes,
            };

            const validation = CaseStateMachine.validateBusinessRules(
                currentStatus,
                input.newStatus,
                transitionContext
            );

            if (!validation.valid) {
                return {
                    success: false,
                    error: {
                        code: 'INVALID_TRANSITION',
                        message: validation.reason || 'Invalid status transition',
                        details: {
                            from: currentStatus,
                            to: input.newStatus,
                            allowedTransitions: CaseStateMachine.getNextStatuses(currentStatus),
                        },
                    },
                };
            }

            // Prepare update
            const updateData: Record<string, unknown> = {
                status: input.newStatus,
                updated_at: new Date().toISOString(),
                updated_by: user.id,
            };

            // Handle recovered amount for recovery statuses
            if (input.recoveredAmount !== undefined) {
                updateData.recovered_amount = (currentCase.recovered_amount || 0) + input.recoveredAmount;

                if (input.newStatus === 'FULL_RECOVERY') {
                    updateData.outstanding_amount = 0;
                } else if (input.newStatus === 'PARTIAL_RECOVERY') {
                    updateData.outstanding_amount = Math.max(0, currentCase.outstanding_amount - input.recoveredAmount);
                }
            }

            // Handle closure
            if (CaseStateMachine.isTerminal(input.newStatus)) {
                updateData.closed_at = new Date().toISOString();
                updateData.closure_reason = input.reason || 'STATUS_CHANGE';
            }

            // Optimistic locking - check version hasn't changed
            const { data: updated, error: updateError } = await (supabase as any)
                .from('cases')
                .update(updateData)
                .eq('id', input.caseId)
                .eq('updated_at', currentCase.updated_at) // Optimistic lock
                .select()
                .single();

            if (updateError) {
                // Check if it's a concurrency conflict
                if (updateError.code === 'PGRST116') {
                    return {
                        success: false,
                        error: {
                            code: 'CONCURRENCY_CONFLICT',
                            message: 'Case was modified by another user. Please refresh and try again.',
                        },
                    };
                }
                throw updateError;
            }

            // Log timeline event
            await this.logTimelineEvent({
                case_id: input.caseId,
                event_type: 'STATUS_CHANGED',
                event_category: 'USER',
                description: input.reason || `Status changed from ${currentStatus} to ${input.newStatus}`,
                old_value: currentStatus,
                new_value: input.newStatus,
                metadata: {
                    recovered_amount: input.recoveredAmount,
                    payment_method: input.paymentMethod,
                    notes: input.notes,
                },
                performed_by: user.id,
                performed_by_role: user.role,
                performed_by_dca_id: user.dcaId || undefined,
                idempotency_key: input.idempotencyKey,
            });

            // Audit log
            await logUserAction(
                'CASE_STATUS_CHANGED',
                user.id,
                user.email,
                'case',
                input.caseId,
                {
                    from_status: currentStatus,
                    to_status: input.newStatus,
                    reason: input.reason,
                }
            );

            return {
                success: true,
                data: updated,
            };

        } catch (error) {
            console.error('Status change error:', error);

            if (error instanceof CaseStateError) {
                return {
                    success: false,
                    error: {
                        code: 'INVALID_TRANSITION',
                        message: error.message,
                        details: error.toJSON(),
                    },
                };
            }

            return {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Failed to change status',
                },
            };
        }
    }

    /**
     * Log a contact attempt
     */
    static async logContactAttempt(
        caseId: string,
        contactMethod: string,
        outcome: string,
        notes: string,
        user: UserContext,
        idempotencyKey?: string
    ): Promise<ActionResult> {
        const supabase = await createClient();

        try {
            // Check idempotency
            if (idempotencyKey) {
                const duplicate = await this.checkIdempotency(idempotencyKey, caseId);
                if (duplicate) {
                    return { success: true, data: duplicate, idempotent: true };
                }
            }

            // Log case action
            const { data, error } = await (supabase as any)
                .from('case_actions')
                .insert({
                    case_id: caseId,
                    action_type: 'CONTACT_ATTEMPT',
                    contact_method: contactMethod,
                    contact_outcome: outcome,
                    contact_notes: notes,
                    performed_by: user.id,
                    performed_by_role: user.role,
                    performed_by_dca_id: user.dcaId,
                })
                .select()
                .single();

            if (error) throw error;

            // Update case last contact date
            await (supabase as any)
                .from('cases')
                .update({
                    last_contact_date: new Date().toISOString(),
                    contact_attempts: (supabase as any).rpc('increment_contact_attempts', { case_id: caseId }),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', caseId);

            // Log timeline
            await this.logTimelineEvent({
                case_id: caseId,
                event_type: outcome === 'SPOKE_WITH_CUSTOMER' ? 'CONTACT_SUCCESSFUL' : 'CONTACT_ATTEMPTED',
                event_category: 'DCA',
                description: `${contactMethod} contact - ${outcome}`,
                metadata: { method: contactMethod, outcome, notes },
                performed_by: user.id,
                performed_by_role: user.role,
                performed_by_dca_id: user.dcaId || undefined,
                idempotency_key: idempotencyKey,
            });

            return { success: true, data };

        } catch (error) {
            console.error('Log contact attempt error:', error);
            return {
                success: false,
                error: { code: 'INTERNAL_ERROR', message: 'Failed to log contact attempt' },
            };
        }
    }

    /**
     * Record a payment
     */
    static async recordPayment(
        caseId: string,
        amount: number,
        method: string,
        reference: string,
        user: UserContext,
        idempotencyKey?: string
    ): Promise<ActionResult> {
        const supabase = await createClient();

        try {
            // Idempotency check
            if (idempotencyKey) {
                const duplicate = await this.checkIdempotency(idempotencyKey, caseId);
                if (duplicate) {
                    return { success: true, data: duplicate, idempotent: true };
                }
            }

            // Get current case
            const { data: currentCase, error: fetchError } = await (supabase as any)
                .from('cases')
                .select('id, status, outstanding_amount, recovered_amount, original_amount, updated_at')
                .eq('id', caseId)
                .single();

            if (fetchError || !currentCase) {
                return {
                    success: false,
                    error: { code: 'NOT_FOUND', message: 'Case not found' },
                };
            }

            // Calculate new amounts
            const newRecovered = (currentCase.recovered_amount || 0) + amount;
            const newOutstanding = Math.max(0, currentCase.outstanding_amount - amount);

            // Determine new status
            let newStatus = currentCase.status;
            if (newOutstanding === 0) {
                newStatus = 'FULL_RECOVERY';
            } else if (amount > 0) {
                newStatus = 'PARTIAL_RECOVERY';
            }

            // Validate transition
            if (newStatus !== currentCase.status) {
                const validation = CaseStateMachine.canTransition(currentCase.status, newStatus);
                if (!validation.valid) {
                    return {
                        success: false,
                        error: {
                            code: 'INVALID_TRANSITION',
                            message: `Cannot record payment in current status: ${currentCase.status}`,
                        },
                    };
                }
            }

            // Update case
            const { data: updated, error: updateError } = await (supabase as any)
                .from('cases')
                .update({
                    recovered_amount: newRecovered,
                    outstanding_amount: newOutstanding,
                    status: newStatus,
                    last_payment_date: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    updated_by: user.id,
                })
                .eq('id', caseId)
                .eq('updated_at', currentCase.updated_at) // Optimistic lock
                .select()
                .single();

            if (updateError) {
                if (updateError.code === 'PGRST116') {
                    return {
                        success: false,
                        error: {
                            code: 'CONCURRENCY_CONFLICT',
                            message: 'Case was modified. Please refresh and retry.',
                        },
                    };
                }
                throw updateError;
            }

            // Log action
            await (supabase as any)
                .from('case_actions')
                .insert({
                    case_id: caseId,
                    action_type: 'PAYMENT_RECEIVED',
                    payment_amount: amount,
                    payment_method: method,
                    payment_reference: reference,
                    old_status: currentCase.status,
                    new_status: newStatus,
                    performed_by: user.id,
                    performed_by_role: user.role,
                    performed_by_dca_id: user.dcaId,
                });

            // Timeline
            await this.logTimelineEvent({
                case_id: caseId,
                event_type: 'PAYMENT_RECEIVED',
                event_category: 'DCA',
                description: `Payment of ${amount} received via ${method}`,
                old_value: String(currentCase.recovered_amount || 0),
                new_value: String(newRecovered),
                metadata: { amount, method, reference, new_outstanding: newOutstanding },
                performed_by: user.id,
                performed_by_role: user.role,
                performed_by_dca_id: user.dcaId || undefined,
                idempotency_key: idempotencyKey,
            });

            return { success: true, data: updated };

        } catch (error) {
            console.error('Record payment error:', error);
            return {
                success: false,
                error: { code: 'INTERNAL_ERROR', message: 'Failed to record payment' },
            };
        }
    }

    // ===========================================
    // HELPER METHODS
    // ===========================================

    /**
     * Check idempotency key for duplicate action
     */
    private static async checkIdempotency(key: string, caseId: string): Promise<unknown | null> {
        const supabase = await createClient();

        const { data } = await (supabase as any)
            .from('case_timeline')
            .select('*')
            .eq('idempotency_key', key)
            .eq('case_id', caseId)
            .single();

        return data || null;
    }

    /**
     * Log a timeline event
     */
    static async logTimelineEvent(event: TimelineEvent): Promise<void> {
        try {
            const supabase = createAdminClient();

            await (supabase as any)
                .from('case_timeline')
                .insert({
                    case_id: event.case_id,
                    event_type: event.event_type,
                    event_category: event.event_category,
                    description: event.description,
                    old_value: event.old_value,
                    new_value: event.new_value,
                    metadata: event.metadata,
                    performed_by: event.performed_by,
                    performed_by_role: event.performed_by_role,
                    performed_by_dca_id: event.performed_by_dca_id,
                    idempotency_key: event.idempotency_key,
                    created_at: new Date().toISOString(),
                });
        } catch (error) {
            console.error('Failed to log timeline event:', error);
            // Don't throw - timeline logging shouldn't break main operation
        }
    }

    /**
     * Log AI event
     */
    static async logAIEvent(
        caseId: string,
        eventType: 'PRIORITY_SCORED' | 'RISK_ASSESSED' | 'ROE_GENERATED' | 'AI_RECOMMENDATION',
        description: string,
        metadata: Record<string, unknown>
    ): Promise<void> {
        await this.logTimelineEvent({
            case_id: caseId,
            event_type: eventType,
            event_category: 'AI',
            description,
            metadata,
            performed_by: 'SYSTEM',
            performed_by_role: 'SYSTEM',
        });
    }

    /**
     * Log SLA event
     */
    static async logSLAEvent(
        caseId: string,
        eventType: 'SLA_STARTED' | 'SLA_WARNING' | 'SLA_BREACHED' | 'SLA_MET',
        slaType: string,
        dueAt?: string
    ): Promise<void> {
        await this.logTimelineEvent({
            case_id: caseId,
            event_type: eventType,
            event_category: 'SLA',
            description: `${slaType} SLA ${eventType.replace('SLA_', '').toLowerCase()}`,
            metadata: { sla_type: slaType, due_at: dueAt },
            performed_by: 'SYSTEM',
            performed_by_role: 'SYSTEM',
        });
    }
}

// Export singleton for convenience
export const caseActionService = CaseActionService;
