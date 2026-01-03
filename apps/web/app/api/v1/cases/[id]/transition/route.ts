/**
 * Case Transition API
 * 
 * POST /api/v1/cases/{id}/transition
 * 
 * Governed workflow endpoint for case status transitions.
 * Only authorized roles can transition cases through approved paths.
 * 
 * RULES:
 * - DCA roles can only transition cases assigned to their DCA
 * - Transitions must follow role-specific state machine
 * - All transitions are audited
 */

import { NextRequest, NextResponse } from 'next/server';
import { withPermission } from '@/lib/auth/api-wrapper';
import { transitionCase, getAllowedTransitions, isValidCaseStatus, type CaseStatus } from '@/lib/workflow';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/cases/{id}/transition
 * 
 * Execute a governed status transition on a case.
 * 
 * Body:
 * - to_status: Target case status
 * - notes: Optional transition notes
 */
export const POST = withPermission('cases:workflow', async (request: NextRequest, { params, user }) => {
    try {
        const { id: caseId } = await params;

        if (!caseId) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'MISSING_CASE_ID',
                        message: 'Case ID is required',
                    },
                },
                { status: 400 }
            );
        }

        // Parse body
        let body: { to_status?: string; notes?: string };
        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'INVALID_JSON',
                        message: 'Request body must be valid JSON',
                    },
                },
                { status: 400 }
            );
        }

        // Validate to_status
        if (!body.to_status) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'MISSING_TO_STATUS',
                        message: 'to_status is required',
                    },
                },
                { status: 400 }
            );
        }

        if (!isValidCaseStatus(body.to_status)) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'INVALID_STATUS',
                        message: `Invalid status: ${body.to_status}`,
                    },
                },
                { status: 400 }
            );
        }

        // Execute transition
        const result = await transitionCase(
            caseId,
            user,
            {
                to_status: body.to_status as CaseStatus,
                notes: body.notes,
            }
        );

        if (!result.success) {
            // Determine appropriate status code
            let statusCode = 400;
            if (result.error?.code === 'CASE_NOT_FOUND') {
                statusCode = 404;
            } else if (result.error?.code === 'NOT_ASSIGNED_TO_USER_DCA' || result.error?.code === 'INVALID_TRANSITION') {
                statusCode = 403;
            }

            return NextResponse.json(
                {
                    success: false,
                    error: result.error,
                },
                { status: statusCode }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                case_id: caseId,
                from_status: result.from_status,
                to_status: result.to_status,
                transitioned_by: user.email,
            },
        });

    } catch (error) {
        console.error('Transition API error:', error);
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'An unexpected error occurred',
                },
            },
            { status: 500 }
        );
    }
});

/**
 * GET /api/v1/cases/{id}/transition
 * 
 * Get allowed transitions for a case based on current user's role.
 */
export const GET = withPermission('cases:workflow', async (request: NextRequest, { params, user }) => {
    try {
        const { id: caseId } = await params;

        if (!caseId) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'MISSING_CASE_ID',
                        message: 'Case ID is required',
                    },
                },
                { status: 400 }
            );
        }

        const allowedTransitions = await getAllowedTransitions(caseId, user);

        return NextResponse.json({
            success: true,
            data: {
                case_id: caseId,
                allowed_transitions: allowedTransitions,
                user_role: user.role,
            },
        });

    } catch (error) {
        console.error('Get transitions error:', error);
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'An unexpected error occurred',
                },
            },
            { status: 500 }
        );
    }
});
