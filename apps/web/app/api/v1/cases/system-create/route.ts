/**
 * SYSTEM Case Creation API
 * 
 * POST /api/v1/cases/system-create
 * 
 * SYSTEM-ONLY endpoint for automated case creation.
 * This is the ONLY authorized path for case creation.
 * 
 * Authorization:
 * - ONLY SYSTEM actors (via X-Service-Auth header)
 * - HUMAN requests → 403 Forbidden
 * - Spoof attempts → audit + reject
 * 
 * Required operation: cases:system-create
 */

import { NextRequest, NextResponse } from 'next/server';
import { withSystemAuth, type SystemApiHandler } from '@/lib/auth/api-wrapper';
import {
    createSystemCase,
    validateSystemCasePayload,
} from '@/lib/case/system-case-creation';
import { logSecurityEvent } from '@/lib/audit';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/cases/system-create
 * 
 * Create a new case via SYSTEM pipeline.
 * 
 * Required headers:
 *   X-Service-Auth: Bearer <service_jwt_token>
 * 
 * Request body: SystemCaseCreatePayload
 * 
 * Response:
 *   201: Case created successfully
 *   400: Validation error
 *   401: Unauthorized (missing/invalid token)
 *   403: Forbidden (not a SYSTEM actor or operation denied)
 *   500: Internal error
 */
const handleSystemCaseCreate: SystemApiHandler = async (request, { actor, requestContext }) => {
    const ipAddress = requestContext.ip_address;

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
        // STEP 1: VALIDATE PAYLOAD SCHEMA
        // ------------------------------------------

        const validation = validateSystemCasePayload(bodyData);

        if (!validation.success) {
            // Log validation failure
            await logSecurityEvent('VALIDATION_FAILED', undefined, {
                type: 'SYSTEM_CASE_CREATE_VALIDATION',
                service_name: actor.service_name,
                errors: validation.errors.issues.map(i => ({
                    path: i.path.join('.'),
                    message: i.message,
                })),
            }, ipAddress);

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

        const result = await createSystemCase(actor, validation.data);

        if (!result.success) {
            // Return appropriate status code based on error
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
                message: 'Case created successfully',
            },
            { status: 201 }
        );

    } catch (error) {
        console.error('System case creation API error:', error);

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

// Export with SYSTEM-ONLY authentication
// Operation: cases:system-create
export const POST = withSystemAuth('cases:system-create', handleSystemCaseCreate);
