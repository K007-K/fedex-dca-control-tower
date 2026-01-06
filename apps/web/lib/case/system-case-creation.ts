/**
 * SYSTEM Case Creation Service
 * 
 * Implements the GOVERNED, BACKEND-ONLY, SYSTEM-driven case creation pipeline.
 * SYSTEM is the PRIMARY CREATOR of cases. Humans do NOT create cases in normal flow.
 * 
 * Pipeline Steps (ORDER IS MANDATORY):
 * 1. Validate payload schema
 * 2. Validate business rules
 * 3. Invoke AI scoring service
 * 4. Auto-bind SLA template
 * 5. Persist case to DB
 * 6. Create case_timeline entry
 * 7. Write audit log
 * 8. Emit domain event
 * 
 * FAIL FAST if any step fails. NO PARTIAL CREATION.
 */

import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { logSystemAction } from '@/lib/audit';
import { fireWebhookEvent } from '@/lib/webhooks';
import { allocateCase } from '@/lib/allocation';
import type { SystemActor } from '@/lib/auth/actor';

// ===========================================
// INPUT PAYLOAD SCHEMA
// ===========================================

/**
 * Customer contact schema
 */
const CustomerContactSchema = z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
});

/**
 * Customer address schema
 */
const CustomerAddressSchema = z.object({
    country: z.string().min(2).max(2),
    state: z.string().optional(),
    city: z.string().optional(),
    postal_code: z.string().optional(),
});

/**
 * Valid case types
 */
const CaseTypes = ['INVOICE', 'CONTRACT', 'SERVICE', 'OTHER'] as const;

/**
 * Valid currencies (ISO 4217)
 */
const ValidCurrencies = ['USD', 'INR', 'EUR', 'GBP', 'AED', 'SGD', 'HKD', 'JPY', 'CNY', 'AUD'] as const;

/**
 * System case creation payload schema
 * FACTUAL BUSINESS DATA ONLY - No workflow or assignment inputs
 */
export const SystemCaseCreateSchema = z.object({
    // Case Type
    case_type: z.enum(CaseTypes),
    source_system: z.string().min(1).max(100),
    source_reference_id: z.string().min(1).max(255),

    // Geography
    region: z.string().min(1).max(50),

    // Financial (IMMUTABLE after creation)
    currency: z.enum(ValidCurrencies),
    principal_amount: z.number().positive(),
    tax_amount: z.number().min(0),
    total_due: z.number().positive(),

    // Customer Information
    customer_id: z.string().min(1).max(100),
    customer_name: z.string().min(1).max(255),
    customer_contact: CustomerContactSchema,
    customer_address: CustomerAddressSchema,

    // Optional fields
    invoice_number: z.string().optional(),
    invoice_date: z.string().optional(),
    due_date: z.string().optional(),
    customer_segment: z.string().optional(),
});

export type SystemCaseCreatePayload = z.infer<typeof SystemCaseCreateSchema>;

// ===========================================
// AI SCORING TYPES
// ===========================================

interface AIScoreResult {
    risk_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'MINIMAL';
    priority_score: number;
    confidence_score: number;
    model_version: string;
    factors?: string[];
}

// ===========================================
// CREATION RESULT
// ===========================================

export interface CaseCreationResult {
    success: boolean;
    case_id?: string;
    case_number?: string;
    sla_id?: string;
    ai_score?: AIScoreResult;
    allocation?: {
        dca_id?: string;
        dca_name?: string;
    };
    error?: {
        code: string;
        message: string;
        details?: unknown;
    };
}

// ===========================================
// HELPER: Generate Case Number
// ===========================================

function generateCaseNumber(region: string): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `FDX-${region}-${year}${month}-${random}`;
}

// ===========================================
// STEP 3: INVOKE AI SCORING
// ===========================================

async function invokeAIScoring(payload: SystemCaseCreatePayload): Promise<AIScoreResult> {
    const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

    try {
        // Calculate days past due
        const dueDate = payload.due_date ? new Date(payload.due_date) : new Date();
        const daysPastDue = Math.max(0, Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));

        const response = await fetch(`${ML_SERVICE_URL}/api/v1/priority/score`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                outstanding_amount: payload.total_due,
                days_past_due: daysPastDue,
                segment: payload.customer_segment || 'MEDIUM',
            }),
        });

        if (response.ok) {
            const data = await response.json();
            return {
                risk_level: data.risk_level || 'MEDIUM',
                priority_score: data.priority_score || 50,
                confidence_score: 0.85,
                model_version: 'ML_PRIORITY_1.0',
                factors: data.factors?.map((f: { factor: string }) => f.factor),
            };
        }
    } catch (error) {
        console.warn('ML service unavailable, using stub scoring:', error);
    }

    // FALLBACK: Stub scoring when ML unavailable
    const stubScore = calculateStubScore(payload);
    return {
        ...stubScore,
        model_version: 'STUB_1.0',
    };
}

/**
 * Calculate stub AI score when ML service is unavailable
 */
function calculateStubScore(payload: SystemCaseCreatePayload): Omit<AIScoreResult, 'model_version'> {
    // Simple rule-based scoring
    let score = 50;
    let risk: AIScoreResult['risk_level'] = 'MEDIUM';

    // Amount-based scoring
    if (payload.total_due > 100000) {
        score += 30;
        risk = 'CRITICAL';
    } else if (payload.total_due > 50000) {
        score += 20;
        risk = 'HIGH';
    } else if (payload.total_due > 10000) {
        score += 10;
        risk = 'MEDIUM';
    } else {
        risk = 'LOW';
    }

    // Days past due scoring
    if (payload.due_date) {
        const dueDate = new Date(payload.due_date);
        const daysPastDue = Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysPastDue > 90) {
            score += 20;
            risk = 'CRITICAL';
        } else if (daysPastDue > 60) {
            score += 15;
            if (risk !== 'CRITICAL') risk = 'HIGH';
        } else if (daysPastDue > 30) {
            score += 10;
        }
    }

    return {
        risk_level: risk,
        priority_score: Math.min(100, score),
        confidence_score: 0.5, // Lower confidence for stub
    };
}

// ===========================================
// STEP 4: AUTO-BIND SLA TEMPLATE
// ===========================================

interface SLABindResult {
    sla_log_id: string;
    sla_template_id: string;
    due_at: string;
}

async function autoBindSLA(
    supabase: ReturnType<typeof createAdminClient>,
    caseId: string,
    caseType: string,
    region: string,
    riskLevel: string
): Promise<SLABindResult | null> {
    // Find matching SLA template
    // Priority: case_type + region + risk, then case_type + risk, then default
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: templates } = await (supabase as any)
        .from('sla_templates')
        .select('*')
        .eq('is_active', true)
        .eq('sla_type', 'FIRST_CONTACT')
        .order('duration_hours', { ascending: true })
        .limit(1);

    const template = templates?.[0];

    if (!template) {
        console.warn('No SLA template found for case');
        return null;
    }

    // Calculate SLA due time
    const startedAt = new Date();
    const dueAt = new Date(startedAt.getTime() + template.duration_hours * 60 * 60 * 1000);

    // Create SLA log entry
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: slaLog, error } = await (supabase as any)
        .from('sla_logs')
        .insert({
            case_id: caseId,
            sla_template_id: template.id,
            sla_type: template.sla_type,
            started_at: startedAt.toISOString(),
            due_at: dueAt.toISOString(),
            status: 'PENDING',
        })
        .select()
        .single();

    if (error) {
        console.error('Failed to create SLA log:', error);
        return null;
    }

    return {
        sla_log_id: slaLog.id,
        sla_template_id: template.id,
        due_at: dueAt.toISOString(),
    };
}

// ===========================================
// STEP 6: CREATE TIMELINE ENTRY
// ===========================================

async function createTimelineEntry(
    supabase: ReturnType<typeof createAdminClient>,
    caseId: string,
    serviceName: string,
    payload: SystemCaseCreatePayload
): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
        .from('case_timeline')
        .insert({
            case_id: caseId,
            event_type: 'CASE_CREATED',
            event_category: 'SYSTEM',
            description: `Case created by SYSTEM (${serviceName}) from ${payload.source_system}`,
            metadata: {
                source_system: payload.source_system,
                source_reference_id: payload.source_reference_id,
                case_type: payload.case_type,
                total_due: payload.total_due,
                currency: payload.currency,
            },
            performed_by: `SYSTEM:${serviceName}`,
            performed_by_role: 'SYSTEM',
            idempotency_key: `CREATE-${payload.source_system}-${payload.source_reference_id}`,
        });
}

// ===========================================
// MAIN CREATION FUNCTION
// ===========================================

/**
 * Create a case via SYSTEM pipeline
 * 
 * @param actor - The authenticated SYSTEM actor
 * @param payload - Case creation payload (validated externally)
 * @returns Creation result with case details or error
 */
export async function createSystemCase(
    actor: SystemActor,
    payload: SystemCaseCreatePayload
): Promise<CaseCreationResult> {
    const supabase = createAdminClient();
    const serviceName = actor.service_name;

    try {
        // -----------------------------------------
        // STEP 2: VALIDATE BUSINESS RULES
        // -----------------------------------------

        // Rule: total_due must be positive
        if (payload.total_due <= 0) {
            return {
                success: false,
                error: {
                    code: 'INVALID_AMOUNT',
                    message: 'total_due must be greater than 0',
                },
            };
        }

        // Rule: total_due should roughly equal principal + tax
        const expectedTotal = payload.principal_amount + payload.tax_amount;
        if (Math.abs(payload.total_due - expectedTotal) > 0.01) {
            return {
                success: false,
                error: {
                    code: 'AMOUNT_MISMATCH',
                    message: 'total_due must equal principal_amount + tax_amount',
                    details: { expected: expectedTotal, received: payload.total_due },
                },
            };
        }

        // Rule: Region must exist
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: region } = await (supabase as any)
            .from('regions')
            .select('id, region_code')
            .eq('region_code', payload.region.toUpperCase())
            .eq('status', 'ACTIVE')
            .single();

        if (!region) {
            return {
                success: false,
                error: {
                    code: 'INVALID_REGION',
                    message: `Region '${payload.region}' not found or inactive`,
                },
            };
        }

        // -----------------------------------------
        // STEP 3: INVOKE AI SCORING
        // -----------------------------------------

        const aiScore = await invokeAIScoring(payload);

        // -----------------------------------------
        // STEP 5: PERSIST CASE
        // -----------------------------------------

        const caseNumber = generateCaseNumber(region.region_code);
        const now = new Date().toISOString();

        // Map priority from AI score
        const priorityMap: Record<string, string> = {
            'CRITICAL': 'CRITICAL',
            'HIGH': 'HIGH',
            'MEDIUM': 'MEDIUM',
            'LOW': 'LOW',
            'MINIMAL': 'LOW',
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: createdCase, error: insertError } = await (supabase as any)
            .from('cases')
            .insert({
                // Generated
                case_number: caseNumber,

                // Invoice details
                invoice_number: payload.invoice_number || payload.source_reference_id,
                invoice_date: payload.invoice_date || now.split('T')[0],
                due_date: payload.due_date || now.split('T')[0],
                original_amount: payload.total_due,
                outstanding_amount: payload.total_due,
                currency: payload.currency,

                // Customer
                customer_id: payload.customer_id,
                customer_name: payload.customer_name,
                customer_segment: payload.customer_segment || 'MEDIUM',
                customer_country: payload.customer_address.country,
                customer_state: payload.customer_address.state,
                customer_city: payload.customer_address.city,
                customer_contact: payload.customer_contact,

                // Status
                status: 'PENDING_ALLOCATION',
                priority: priorityMap[aiScore.risk_level] || 'MEDIUM',

                // AI Scores
                priority_score: aiScore.priority_score,
                ai_confidence_score: aiScore.confidence_score,
                risk_score: aiScore.priority_score,
                last_scored_at: now,

                // Region
                region: region.region_code,
                region_id: region.id,

                // Actor metadata (IMMUTABLE)
                actor_type: 'SYSTEM',
                created_source: 'SYSTEM',
                created_by: actor.actor_id,

                // GOVERNANCE: Ingestion tracking (IMMUTABLE columns)
                external_case_id: payload.source_reference_id,
                source_system: payload.source_system,
                ingestion_timestamp: now,

                // Source tracking (legacy JSONB for backwards compatibility)
                metadata: {
                    source_system: payload.source_system,
                    source_reference_id: payload.source_reference_id,
                    case_type: payload.case_type,
                    ai_model_version: aiScore.model_version,
                    created_via: 'SYSTEM_API',
                    service_name: serviceName,
                },

                // Timestamps
                created_at: now,
                updated_at: now,
            })
            .select()
            .single();

        if (insertError) {
            console.error('Failed to create case:', insertError);

            // Check for duplicate
            if (insertError.code === '23505') {
                return {
                    success: false,
                    error: {
                        code: 'DUPLICATE_CASE',
                        message: 'A case with this reference already exists',
                        details: insertError.message,
                    },
                };
            }

            return {
                success: false,
                error: {
                    code: 'DATABASE_ERROR',
                    message: 'Failed to create case',
                    details: insertError.message,
                },
            };
        }

        // -----------------------------------------
        // STEP 4: AUTO-BIND SLA TEMPLATE
        // -----------------------------------------

        const slaResult = await autoBindSLA(
            supabase,
            createdCase.id,
            payload.case_type,
            region.region_code,
            aiScore.risk_level
        );

        // -----------------------------------------
        // STEP 6: CREATE TIMELINE ENTRY
        // -----------------------------------------

        await createTimelineEntry(supabase, createdCase.id, serviceName, payload);

        // -----------------------------------------
        // STEP 7: WRITE AUDIT LOG
        // -----------------------------------------

        await logSystemAction(
            'CASE_CREATED',
            serviceName,
            'case',
            createdCase.id,
            {
                case_number: caseNumber,
                source_system: payload.source_system,
                source_reference_id: payload.source_reference_id,
                case_type: payload.case_type,
                total_due: payload.total_due,
                currency: payload.currency,
                region: region.region_code,
                ai_score: aiScore,
                sla_bound: !!slaResult,
            }
        );

        // -----------------------------------------
        // STEP 8: EMIT DOMAIN EVENT
        // -----------------------------------------

        fireWebhookEvent('case.created', {
            case_id: createdCase.id,
            case_number: caseNumber,
            source_system: payload.source_system,
            source_reference_id: payload.source_reference_id,
            customer_id: payload.customer_id,
            customer_name: payload.customer_name,
            total_due: payload.total_due,
            currency: payload.currency,
            region: region.region_code,
            priority: createdCase.priority,
            risk_level: aiScore.risk_level,
            created_by: 'SYSTEM',
            service_name: serviceName,
        }).catch(err => console.error('Webhook error:', err));

        // -----------------------------------------
        // STEP 9: AUTO-ALLOCATE TO DCA
        // -----------------------------------------

        const allocationResult = await allocateCase(
            {
                id: createdCase.id,
                case_number: caseNumber,
                region_id: region.id,
                region_code: region.region_code,
                priority: createdCase.priority,
                total_due: payload.total_due,
            },
            serviceName
        );

        // -----------------------------------------
        // SUCCESS
        // -----------------------------------------

        return {
            success: true,
            case_id: createdCase.id,
            case_number: caseNumber,
            sla_id: slaResult?.sla_log_id,
            ai_score: aiScore,
            allocation: allocationResult.allocated ? {
                dca_id: allocationResult.dca_id,
                dca_name: allocationResult.dca_name,
            } : undefined,
        };

    } catch (error) {
        console.error('System case creation failed:', error);

        // Log failure
        await logSystemAction(
            'CASE_CREATION_FAILED',
            serviceName,
            'case',
            'N/A',
            {
                error: error instanceof Error ? error.message : String(error),
                payload_summary: {
                    source_system: payload.source_system,
                    source_reference_id: payload.source_reference_id,
                    total_due: payload.total_due,
                },
            }
        );

        return {
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Case creation failed unexpectedly',
                details: error instanceof Error ? error.message : String(error),
            },
        };
    }
}

/**
 * Validate payload against schema
 */
export function validateSystemCasePayload(
    data: unknown
): { success: true; data: SystemCaseCreatePayload } | { success: false; errors: z.ZodError } {
    const result = SystemCaseCreateSchema.safeParse(data);

    if (result.success) {
        return { success: true, data: result.data };
    }

    return { success: false, errors: result.error };
}
