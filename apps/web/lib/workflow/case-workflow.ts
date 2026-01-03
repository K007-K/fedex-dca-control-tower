/**
 * Case Workflow Service
 * 
 * Implements GOVERNED status transitions for cases.
 * DCAs can ONLY progress cases through approved state paths.
 * 
 * RULES:
 * - Transitions must follow defined paths
 * - Skipping states is FORBIDDEN
 * - Only assigned DCA users can act on cases
 * - All transitions are audited
 * 
 * STATE FLOW:
 * OPEN → IN_PROGRESS → CONTACTED → PROMISE_TO_PAY → PARTIALLY_RECOVERED → RECOVERED → CLOSED
 *                              ↘ FAILED ─────────────────────────────────────↗
 *                    (any) → ESCALATED
 */

import { createAdminClient } from '@/lib/supabase/server';
import { logUserAction } from '@/lib/audit';
import { fireWebhookEvent } from '@/lib/webhooks';
import type { AuthUser } from '@/lib/auth/permissions';

// ===========================================
// CANONICAL CASE STATES
// ===========================================

export const CASE_STATES = [
    'OPEN',
    'IN_PROGRESS',
    'CONTACTED',
    'PROMISE_TO_PAY',
    'PARTIALLY_RECOVERED',
    'RECOVERED',
    'FAILED',
    'ESCALATED',
    'CLOSED',
] as const;

export type CaseStatus = typeof CASE_STATES[number];

// ===========================================
// ROLE-BASED TRANSITIONS
// ===========================================

type TransitionMap = Record<CaseStatus, CaseStatus[]>;

/**
 * DCA_AGENT allowed transitions
 */
const DCA_AGENT_TRANSITIONS: TransitionMap = {
    'OPEN': ['IN_PROGRESS'],
    'IN_PROGRESS': ['CONTACTED'],
    'CONTACTED': ['PROMISE_TO_PAY', 'FAILED'],
    'PROMISE_TO_PAY': ['PARTIALLY_RECOVERED', 'FAILED'],
    'PARTIALLY_RECOVERED': ['RECOVERED', 'FAILED'],
    'RECOVERED': [],
    'FAILED': [],
    'ESCALATED': [],
    'CLOSED': [],
};

/**
 * DCA_MANAGER allowed transitions (includes DCA_AGENT + escalation)
 */
const DCA_MANAGER_TRANSITIONS: TransitionMap = {
    'OPEN': ['IN_PROGRESS', 'ESCALATED'],
    'IN_PROGRESS': ['CONTACTED', 'ESCALATED'],
    'CONTACTED': ['PROMISE_TO_PAY', 'FAILED', 'ESCALATED'],
    'PROMISE_TO_PAY': ['PARTIALLY_RECOVERED', 'FAILED', 'ESCALATED'],
    'PARTIALLY_RECOVERED': ['RECOVERED', 'FAILED', 'ESCALATED'],
    'RECOVERED': ['ESCALATED'],
    'FAILED': ['ESCALATED'],
    'ESCALATED': [],
    'CLOSED': [],
};

/**
 * FEDEX_ADMIN allowed transitions
 */
const FEDEX_ADMIN_TRANSITIONS: TransitionMap = {
    'OPEN': [],
    'IN_PROGRESS': [],
    'CONTACTED': [],
    'PROMISE_TO_PAY': [],
    'PARTIALLY_RECOVERED': [],
    'RECOVERED': ['CLOSED'],
    'FAILED': ['CLOSED'],
    'ESCALATED': ['IN_PROGRESS', 'CLOSED'], // Can resolve escalations
    'CLOSED': [],
};

/**
 * Get allowed transitions for a role
 */
function getTransitionsForRole(role: string): TransitionMap | null {
    switch (role) {
        case 'DCA_AGENT':
            return DCA_AGENT_TRANSITIONS;
        case 'DCA_MANAGER':
            return DCA_MANAGER_TRANSITIONS;
        case 'FEDEX_ADMIN':
            return FEDEX_ADMIN_TRANSITIONS;
        default:
            return null;
    }
}

// ===========================================
// TYPES
// ===========================================

export interface TransitionPayload {
    to_status: CaseStatus;
    notes?: string;
}

export interface TransitionResult {
    success: boolean;
    from_status?: CaseStatus;
    to_status?: CaseStatus;
    error?: {
        code: string;
        message: string;
        details?: unknown;
    };
}

// ===========================================
// VALIDATION
// ===========================================

/**
 * Validate if a status is a valid case state
 */
export function isValidCaseStatus(status: string): status is CaseStatus {
    return CASE_STATES.includes(status as CaseStatus);
}

/**
 * Check if a transition is allowed for a role
 */
export function isTransitionAllowed(
    role: string,
    fromStatus: CaseStatus,
    toStatus: CaseStatus
): boolean {
    const transitions = getTransitionsForRole(role);
    if (!transitions) return false;

    const allowedTargets = transitions[fromStatus];
    return allowedTargets?.includes(toStatus) ?? false;
}

// ===========================================
// MAIN TRANSITION FUNCTION
// ===========================================

/**
 * Execute a case status transition
 * 
 * @param caseId - The case ID to transition
 * @param user - The authenticated user
 * @param payload - Transition details (to_status, notes)
 * @returns Transition result
 */
export async function transitionCase(
    caseId: string,
    user: AuthUser & { dca_id?: string },
    payload: TransitionPayload
): Promise<TransitionResult> {
    const supabase = createAdminClient();

    try {
        // -----------------------------------------
        // STEP 1: VERIFY CASE EXISTS
        // -----------------------------------------

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: caseData, error: caseError } = await (supabase as any)
            .from('cases')
            .select('id, case_number, status, assigned_dca_id, region')
            .eq('id', caseId)
            .single();

        if (caseError || !caseData) {
            return {
                success: false,
                error: {
                    code: 'CASE_NOT_FOUND',
                    message: `Case ${caseId} not found`,
                },
            };
        }

        const fromStatus = caseData.status as CaseStatus;

        // -----------------------------------------
        // STEP 2: VALIDATE TARGET STATUS
        // -----------------------------------------

        if (!isValidCaseStatus(payload.to_status)) {
            return {
                success: false,
                error: {
                    code: 'INVALID_STATUS',
                    message: `Invalid target status: ${payload.to_status}`,
                    details: { valid_states: CASE_STATES },
                },
            };
        }

        // -----------------------------------------
        // STEP 3: VERIFY DCA ASSIGNMENT (for DCA roles)
        // -----------------------------------------

        if (user.role.startsWith('DCA_')) {
            if (!caseData.assigned_dca_id) {
                return {
                    success: false,
                    error: {
                        code: 'CASE_NOT_ASSIGNED',
                        message: 'Case is not assigned to any DCA',
                    },
                };
            }

            // Get user's DCA
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: userData } = await (supabase as any)
                .from('users')
                .select('dca_id')
                .eq('id', user.id)
                .single();

            const userDcaId = userData?.dca_id || user.dca_id;

            if (userDcaId !== caseData.assigned_dca_id) {
                await logUserAction(
                    'PERMISSION_DENIED',
                    user.id,
                    user.email,
                    'case',
                    caseId,
                    {
                        action: 'TRANSITION_BLOCKED',
                        reason: 'Case is assigned to different DCA',
                        user_dca: userDcaId,
                        case_dca: caseData.assigned_dca_id,
                    }
                );

                return {
                    success: false,
                    error: {
                        code: 'NOT_ASSIGNED_TO_USER_DCA',
                        message: 'You can only transition cases assigned to your DCA',
                    },
                };
            }
        }

        // -----------------------------------------
        // STEP 4: VALIDATE TRANSITION PATH
        // -----------------------------------------

        if (!isTransitionAllowed(user.role, fromStatus, payload.to_status)) {
            const transitions = getTransitionsForRole(user.role);
            const allowed = transitions?.[fromStatus] || [];

            await logUserAction(
                'PERMISSION_DENIED',
                user.id,
                user.email,
                'case',
                caseId,
                {
                    action: 'INVALID_TRANSITION',
                    from_status: fromStatus,
                    to_status: payload.to_status,
                    allowed_targets: allowed,
                    role: user.role,
                }
            );

            return {
                success: false,
                error: {
                    code: 'INVALID_TRANSITION',
                    message: `Cannot transition from ${fromStatus} to ${payload.to_status} with role ${user.role}`,
                    details: {
                        from_status: fromStatus,
                        to_status: payload.to_status,
                        allowed_targets: allowed,
                    },
                },
            };
        }

        // -----------------------------------------
        // STEP 5: PERSIST NEW STATUS
        // -----------------------------------------

        const now = new Date().toISOString();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updateError } = await (supabase as any)
            .from('cases')
            .update({
                status: payload.to_status,
                updated_at: now,
            })
            .eq('id', caseId);

        if (updateError) {
            console.error('Failed to update case status:', updateError);
            return {
                success: false,
                error: {
                    code: 'DATABASE_ERROR',
                    message: 'Failed to update case status',
                    details: updateError.message,
                },
            };
        }

        // -----------------------------------------
        // STEP 6: CREATE TIMELINE ENTRY
        // -----------------------------------------

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
            .from('case_timeline')
            .insert({
                case_id: caseId,
                event_type: 'STATUS_CHANGED',
                event_category: 'USER',
                description: `Status changed from ${fromStatus} to ${payload.to_status}${payload.notes ? `: ${payload.notes}` : ''}`,
                metadata: {
                    from_status: fromStatus,
                    to_status: payload.to_status,
                    notes: payload.notes,
                    transitioned_by_role: user.role,
                },
                performed_by: user.email,
                performed_by_role: user.role,
            });

        // -----------------------------------------
        // STEP 7: WRITE AUDIT LOG
        // -----------------------------------------

        await logUserAction(
            'CASE_STATUS_CHANGED',
            user.id,
            user.email,
            'case',
            caseId,
            {
                case_number: caseData.case_number,
                from_status: fromStatus,
                to_status: payload.to_status,
                notes: payload.notes,
                region: caseData.region,
                actor_role: user.role,
            }
        );

        // -----------------------------------------
        // STEP 8: EMIT DOMAIN EVENT
        // -----------------------------------------

        fireWebhookEvent('case.status.changed', {
            case_id: caseId,
            case_number: caseData.case_number,
            from_status: fromStatus,
            to_status: payload.to_status,
            changed_by: user.email,
            changed_by_role: user.role,
            notes: payload.notes,
        }).catch(err => console.error('Webhook error:', err));

        // -----------------------------------------
        // SUCCESS
        // -----------------------------------------

        return {
            success: true,
            from_status: fromStatus,
            to_status: payload.to_status,
        };

    } catch (error) {
        console.error('Case transition failed:', error);

        await logUserAction(
            'CASE_STATUS_CHANGED',
            user.id,
            user.email,
            'case',
            caseId,
            {
                action: 'TRANSITION_FAILED',
                error: error instanceof Error ? error.message : String(error),
                to_status: payload.to_status,
            }
        );

        return {
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Case transition failed unexpectedly',
                details: error instanceof Error ? error.message : String(error),
            },
        };
    }
}

/**
 * Get allowed transitions for a user on a specific case
 */
export async function getAllowedTransitions(
    caseId: string,
    user: AuthUser
): Promise<CaseStatus[]> {
    const supabase = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: caseData } = await (supabase as any)
        .from('cases')
        .select('status')
        .eq('id', caseId)
        .single();

    if (!caseData) return [];

    const currentStatus = caseData.status as CaseStatus;
    const transitions = getTransitionsForRole(user.role);

    if (!transitions) return [];

    return transitions[currentStatus] || [];
}
