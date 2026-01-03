/**
 * Manual Case Creation API
 * 
 * POST /api/v1/cases/manual-create
 * 
 * FEDEX_ADMIN-ONLY endpoint for exception-based case creation.
 * Used ONLY when SYSTEM creation is not possible.
 * 
 * Authorization:
 * - ONLY FEDEX_ADMIN role is allowed
 * - SUPER_ADMIN → 403 (governance only, no case creation)
 * - SYSTEM actors → 403 (must use /system-create)
 * - DCA roles → 403 (never create cases)
 * - Other roles → 403
 * 
 * Required: justification_text (min 20 chars)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withPermission, type ApiHandler } from '@/lib/auth/api-wrapper';
import { isSystemRequest } from '@/lib/auth/system-auth';
import {
    createManualCase,
    validateManualCasePayload,
} from '@/lib/case/manual-case-creation';
import { logUserAction } from '@/lib/audit';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Roles that are BLOCKED from manual case creation
 */
const BLOCKED_ROLES = [
    'SUPER_ADMIN',      // Governance only
    'FEDEX_MANAGER',    // Not authorized
    'FEDEX_ANALYST',    // Not authorized
    'FEDEX_AUDITOR',    // Read-only
    'FEDEX_VIEWER',     // Read-only
    'DCA_ADMIN',        // DCAs never create cases
    'DCA_MANAGER',      // DCAs never create cases
    'DCA_AGENT',        // DCAs never create cases
    'AUDITOR',          // Legacy read-only
    'READONLY',         // Legacy read-only
];

/**
 * POST /api/v1/cases/manual-create
 * 
 * Create a new case manually (FEDEX_ADMIN only).
 * 
 * Required fields: Same as SYSTEM + justification_text
 * 
 * Response:
 *   201: Case created successfully
 *   400: Validation error
 *   403: Forbidden (not FEDEX_ADMIN)
 *   500: Internal error
 */
const handleManualCaseCreate: ApiHandler = async (request, { user }) => {
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';

    // ------------------------------------------
    // SECURITY CHECK 1: Block SYSTEM actors
    // ------------------------------------------

    if (isSystemRequest(request)) {
        await logUserAction(
            'ACCESS_DENIED',
            'SYSTEM',
            'SYSTEM',
            'case',
            'N/A',
            {
                action: 'MANUAL_CREATE_BLOCKED',
                reason: 'SYSTEM actors must use /api/v1/cases/system-create',
            }
        );

        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'SYSTEM_NOT_ALLOWED',
                    message: 'SYSTEM actors cannot use manual creation. Use /api/v1/cases/system-create instead.',
                },
            },
            { status: 403 }
        );
    }

    // ------------------------------------------
    // SECURITY CHECK 2: Only FEDEX_ADMIN allowed
    // ------------------------------------------

    if (user.role !== 'FEDEX_ADMIN') {
        await logUserAction(
            'ACCESS_DENIED',
            user.id,
            user.email,
            'case',
            'N/A',
            {
                action: 'MANUAL_CREATE_BLOCKED',
                reason: `Role ${user.role} is not authorized for manual case creation`,
                blocked_role: user.role,
            }
        );

        // Specific message for SUPER_ADMIN
        if (user.role === 'SUPER_ADMIN') {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'SUPER_ADMIN_BLOCKED',
                        message: 'SUPER_ADMIN is a governance role and cannot create cases. This action must be performed by FEDEX_ADMIN.',
                    },
                },
                { status: 403 }
            );
        }

        // Specific message for DCA roles
        if (user.role.startsWith('DCA_')) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'DCA_NOT_ALLOWED',
                        message: 'DCA roles are not authorized to create cases. Cases are created by SYSTEM or FEDEX_ADMIN.',
                    },
                },
                { status: 403 }
            );
        }

        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'ROLE_NOT_AUTHORIZED',
                    message: 'Only FEDEX_ADMIN can manually create cases.',
                },
            },
            { status: 403 }
        );
    }

    try {
        // Parse request body
        let bodyData: unknown;
        try {
            bodyData = await request.json();
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

        // ------------------------------------------
        // STEP 1: VALIDATE PAYLOAD SCHEMA + JUSTIFICATION
        // ------------------------------------------

        const validation = validateManualCasePayload(bodyData);

        if (!validation.success) {
            await logUserAction(
                'VALIDATION_FAILED',
                user.id,
                user.email,
                'case',
                'N/A',
                {
                    action: 'MANUAL_CREATE_VALIDATION_FAILED',
                    errors: validation.errors.issues.map(i => ({
                        path: i.path.join('.'),
                        message: i.message,
                    })),
                }
            );

            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Request payload validation failed',
                        details: validation.errors.issues.map(i => ({
                            field: i.path.join('.'),
                            message: i.message,
                        })),
                    },
                },
                { status: 400 }
            );
        }

        // ------------------------------------------
        // STEPS 2-8: EXECUTE CREATION PIPELINE
        // ------------------------------------------

        const result = await createManualCase(user, validation.data);

        if (!result.success) {
            const statusCode =
                result.error?.code === 'DUPLICATE_CASE' ? 409 :
                    result.error?.code === 'INVALID_REGION' ? 400 :
                        result.error?.code === 'INVALID_AMOUNT' ? 400 :
                            result.error?.code === 'AMOUNT_MISMATCH' ? 400 :
                                500;

            return NextResponse.json(
                {
                    success: false,
                    error: result.error,
                },
                { status: statusCode }
            );
        }

        // ------------------------------------------
        // SUCCESS RESPONSE
        // ------------------------------------------

        return NextResponse.json(
            {
                success: true,
                data: {
                    case_id: result.case_id,
                    case_number: result.case_number,
                    sla_id: result.sla_id,
                    ai_score: {
                        risk_level: result.ai_score?.risk_level,
                        priority_score: result.ai_score?.priority_score,
                        model_version: result.ai_score?.model_version,
                    },
                },
                message: 'Case created manually by FEDEX_ADMIN',
            },
            { status: 201 }
        );

    } catch (error) {
        console.error('Manual case creation API error:', error);

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
};

// Export with permission check
// Note: This requires cases:create permission, plus the role check above
export const POST = withPermission('cases:create', handleManualCaseCreate);
