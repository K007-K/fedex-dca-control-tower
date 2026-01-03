/**
 * DCA Allocation API
 * 
 * POST /api/cases/allocate
 * 
 * SYSTEM-ONLY ENDPOINT
 * 
 * This endpoint is DISABLED for human actors.
 * DCA allocation is performed AUTOMATICALLY by the SYSTEM
 * after case creation. Humans CANNOT trigger allocation.
 * 
 * All allocation happens internally via:
 * - lib/allocation/dca-allocation.ts
 * 
 * Human actors attempting to access this endpoint
 * will receive 403 Forbidden.
 */

import { NextRequest, NextResponse } from 'next/server';
import { logSecurityEvent } from '@/lib/audit';
import { getCurrentUser } from '@/lib/auth/permissions';
import { isSystemRequest, authenticateSystemRequest } from '@/lib/auth/system-auth';
import { allocateCaseById } from '@/lib/allocation';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * POST /api/cases/allocate
 * 
 * SYSTEM-ONLY: Trigger DCA allocation for a specific case.
 * 
 * HUMAN ACTORS → 403 FORBIDDEN
 * SYSTEM ACTORS → Uses internal allocation service
 */
export async function POST(request: NextRequest) {
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';

    // ------------------------------------------
    // SECURITY CHECK 1: Block ALL human actors
    // ------------------------------------------

    if (!isSystemRequest(request)) {
        // This is a human request - BLOCK IT
        const user = await getCurrentUser();

        await logSecurityEvent(
            'PERMISSION_DENIED',
            user?.id || 'anonymous',
            {
                action: 'ALLOCATION_BLOCKED',
                reason: 'DCA allocation is SYSTEM-only. Human actors cannot trigger allocation.',
                user_role: user?.role || 'anonymous',
                user_email: user?.email || 'anonymous',
                endpoint: '/api/cases/allocate',
            },
            ipAddress
        );

        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'SYSTEM_ONLY_ENDPOINT',
                    message: 'DCA allocation is performed automatically by SYSTEM. Human actors cannot trigger allocation.',
                },
            },
            { status: 403 }
        );
    }

    // ------------------------------------------
    // SECURITY CHECK 2: Authenticate SYSTEM actor
    // ------------------------------------------

    const systemAuth = await authenticateSystemRequest(request);

    if (!systemAuth.authenticated) {
        await logSecurityEvent(
            'PERMISSION_DENIED',
            'SYSTEM',
            {
                action: 'ALLOCATION_BLOCKED',
                reason: 'SYSTEM authentication failed',
                error: systemAuth.error,
            },
            ipAddress
        );

        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'SYSTEM_AUTH_FAILED',
                    message: systemAuth.error || 'System authentication failed',
                },
            },
            { status: 403 }
        );
    }

    // ------------------------------------------
    // MAIN LOGIC: Execute allocation
    // ------------------------------------------

    try {
        const body = await request.json();
        const { case_id } = body;

        if (!case_id) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'MISSING_CASE_ID',
                        message: 'case_id is required',
                    },
                },
                { status: 400 }
            );
        }

        // Use the internal allocation service
        const result = await allocateCaseById(case_id, systemAuth.actor!.service_name);

        if (!result.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'ALLOCATION_FAILED',
                        message: result.reason,
                    },
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                case_id,
                allocated: result.allocated,
                assigned_dca_id: result.dca_id,
                assigned_dca_name: result.dca_name,
                reason: result.reason,
                allocation_score: result.score,
                candidates_evaluated: result.candidates_evaluated,
            },
        });

    } catch (error) {
        console.error('Allocation API error:', error);
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
}
