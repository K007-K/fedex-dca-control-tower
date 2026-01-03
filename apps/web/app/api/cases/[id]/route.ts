/* eslint-disable @typescript-eslint/no-explicit-any */

// Force dynamic rendering - this route uses cookies/headers
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

import { withPermission, withAnyPermission, type ApiHandler } from '@/lib/auth/api-wrapper';
import { canAccessCase, isDCARole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { CaseStateMachine, CaseActionService } from '@/lib/case';

/**
 * GET /api/cases/[id]
 * Get case details by ID
 * Permission: cases:read
 */
const handleGetCase: ApiHandler = async (request, { params, user }) => {
    try {
        const { id } = await params;

        // Check if user can access this specific case
        const canAccess = await canAccessCase(id);
        if (!canAccess) {
            return NextResponse.json(
                { error: { code: 'FORBIDDEN', message: 'You do not have access to this case' } },
                { status: 403 }
            );
        }

        const supabase = await createClient();

        const result = await (supabase as any)
            .from('cases')
            .select(`
                *,
                assigned_dca:dcas(id, name, status, performance_score, recovery_rate),
                assigned_agent:users!cases_assigned_agent_id_fkey(id, full_name, email, role)
            `)
            .eq('id', id)
            .single();

        if (result.error) {
            if (result.error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: { code: 'NOT_FOUND', message: 'Case not found' } },
                    { status: 404 }
                );
            }
            return NextResponse.json(
                { error: { code: 'DATABASE_ERROR', message: result.error.message } },
                { status: 500 }
            );
        }

        return NextResponse.json({ data: result.data });
    } catch (error) {
        console.error('Case API error:', error);
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch case' } },
            { status: 500 }
        );
    }
};

/**
 * PATCH /api/cases/[id]
 * Update case details with state machine validation
 * Permission: cases:update
 */
const handleUpdateCase: ApiHandler = async (request, { params, user }) => {
    try {
        const { id } = await params;

        // Check if user can access this specific case
        const canAccess = await canAccessCase(id);
        if (!canAccess) {
            return NextResponse.json(
                { error: { code: 'FORBIDDEN', message: 'You do not have access to this case' } },
                { status: 403 }
            );
        }

        const supabase = await createClient();
        const body = await request.json();

        // Get current case for state machine validation
        const { data: currentCase, error: fetchError } = await (supabase as any)
            .from('cases')
            .select('id, status, updated_at')
            .eq('id', id)
            .single();

        if (fetchError || !currentCase) {
            return NextResponse.json(
                { error: { code: 'NOT_FOUND', message: 'Case not found' } },
                { status: 404 }
            );
        }

        // STATUS CHANGE: Validate with state machine
        if (body.status && body.status !== currentCase.status) {
            const validation = CaseStateMachine.validateBusinessRules(
                currentCase.status,
                body.status,
                {
                    userId: user.id,
                    userRole: user.role,
                    reason: body.status_change_reason,
                    recoveredAmount: body.recovered_amount,
                }
            );

            if (!validation.valid) {
                return NextResponse.json(
                    {
                        error: {
                            code: 'INVALID_STATE_TRANSITION',
                            message: validation.reason,
                            details: {
                                currentStatus: currentCase.status,
                                requestedStatus: body.status,
                                allowedTransitions: CaseStateMachine.getNextStatuses(currentCase.status),
                            },
                        },
                    },
                    { status: 400 }
                );
            }
        }

        // ============================================================
        // SECURITY: BLOCK SYSTEM-ONLY FIELDS
        // ============================================================
        // assigned_dca_id and assigned_agent_id are SYSTEM-ONLY fields.
        // Humans CANNOT set or modify these fields under any circumstance.
        // Assignment is performed ONLY by the SYSTEM allocation service.
        // ============================================================

        const SYSTEM_ONLY_FIELDS = ['assigned_dca_id', 'assigned_agent_id'];
        const attemptedSystemFields = SYSTEM_ONLY_FIELDS.filter(field => body[field] !== undefined);

        if (attemptedSystemFields.length > 0) {
            // Log security event for attempted override
            const { logSecurityEvent } = await import('@/lib/audit');
            await logSecurityEvent(
                'PERMISSION_DENIED',
                user.id,
                {
                    action: 'ASSIGNMENT_OVERRIDE_BLOCKED',
                    reason: 'Human attempted to modify SYSTEM-controlled assignment fields',
                    blocked_fields: attemptedSystemFields,
                    user_role: user.role,
                    user_email: user.email,
                    case_id: id,
                    endpoint: `/api/cases/${id}`,
                },
                request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
            );

            return NextResponse.json(
                {
                    error: {
                        code: 'SYSTEM_ONLY_FIELD',
                        message: 'DCA and agent assignment are controlled exclusively by SYSTEM. Human override is not permitted.',
                        blocked_fields: attemptedSystemFields,
                    },
                },
                { status: 403 }
            );
        }

        const updateData: Record<string, any> = {};

        // SECURITY: Assignment fields REMOVED from allowed list
        // Only SYSTEM can set: assigned_dca_id, assigned_agent_id
        const allowedFields = [
            'status', 'priority',
            'outstanding_amount', 'recovered_amount', 'internal_notes', 'tags',
            'is_disputed', 'dispute_reason', 'high_priority_flag', 'vip_customer'
        ];

        // DCA users have limited update capabilities
        const dcaAllowedFields = ['status', 'internal_notes', 'recovered_amount'];
        const fieldsToCheck = isDCARole(user.role) ? dcaAllowedFields : allowedFields;

        for (const field of fieldsToCheck) {
            if (body[field] !== undefined) {
                updateData[field] = body[field];
            }
        }

        // Map 'notes' from form to 'internal_notes' in database
        if (body.notes !== undefined) {
            updateData['internal_notes'] = body.notes;
        }

        // REMOVED: Manual assignment handling (was security vulnerability)
        // Assignment is now ONLY through /api/cases/allocate (SYSTEM-only)

        // Handle terminal status
        if (body.status && CaseStateMachine.isTerminal(body.status)) {
            updateData['closed_at'] = new Date().toISOString();
            updateData['closure_reason'] = body.status_change_reason || 'STATUS_CHANGE';
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { error: { code: 'VALIDATION_ERROR', message: 'No valid fields to update' } },
                { status: 400 }
            );
        }

        updateData['updated_at'] = new Date().toISOString();
        updateData['updated_by'] = user.id;

        // Optimistic locking - prevent concurrent updates
        const result = await (supabase as any)
            .from('cases')
            .update(updateData)
            .eq('id', id)
            .eq('updated_at', currentCase.updated_at) // Optimistic lock
            .select()
            .single();

        if (result.error) {
            if (result.error.code === 'PGRST116') {
                // Could be not found or concurrency conflict
                return NextResponse.json(
                    { error: { code: 'CONCURRENCY_CONFLICT', message: 'Case was modified by another user. Please refresh and try again.' } },
                    { status: 409 }
                );
            }
            return NextResponse.json(
                { error: { code: 'DATABASE_ERROR', message: result.error.message } },
                { status: 500 }
            );
        }

        // Log timeline event for status changes
        if (body.status && body.status !== currentCase.status) {
            await CaseActionService.logTimelineEvent({
                case_id: id,
                event_type: 'STATUS_CHANGED',
                event_category: 'USER',
                description: body.status_change_reason || `Status changed from ${currentCase.status} to ${body.status}`,
                old_value: currentCase.status,
                new_value: body.status,
                performed_by: user.id,
                performed_by_role: user.role,
                performed_by_dca_id: user.dcaId || undefined,
            });
        }

        return NextResponse.json({ data: result.data });
    } catch (error) {
        console.error('Case API error:', error);
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Failed to update case' } },
            { status: 500 }
        );
    }
};

/**
 * DELETE /api/cases/[id]
 * Soft delete a case (mark as closed)
 * Permission: cases:delete
 */
const handleDeleteCase: ApiHandler = async (request, { params, user }) => {
    try {
        const { id } = await params;
        const supabase = await createClient();

        const result = await (supabase as any)
            .from('cases')
            .update({
                status: 'CLOSED',
                closed_at: new Date().toISOString(),
                closure_reason: 'MANUALLY_CLOSED',
                updated_at: new Date().toISOString(),
                updated_by: user.id,
            })
            .eq('id', id)
            .select()
            .single();

        if (result.error) {
            if (result.error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: { code: 'NOT_FOUND', message: 'Case not found' } },
                    { status: 404 }
                );
            }
            return NextResponse.json(
                { error: { code: 'DATABASE_ERROR', message: result.error.message } },
                { status: 500 }
            );
        }

        return NextResponse.json({ data: result.data, message: 'Case closed successfully' });
    } catch (error) {
        console.error('Case API error:', error);
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Failed to close case' } },
            { status: 500 }
        );
    }
};

// Export wrapped handlers with proper permissions
export const GET = withPermission('cases:read', handleGetCase);
export const PATCH = withPermission('cases:update', handleUpdateCase);
export const DELETE = withPermission('cases:delete', handleDeleteCase);
