/**
 * SLA Breach Detection Service
 * 
 * SYSTEM-driven automated breach detection and escalation.
 * Runs periodically to detect SLA violations and trigger actions.
 * 
 * RULES:
 * - SYSTEM-only execution
 * - Idempotent (safe to re-run)
 * - No human intervention
 * - All breaches audited
 * 
 * BREACH DEFINITION:
 * - current_time > sla_due_time
 * - sla_logs.status = 'PENDING'
 * - case.status NOT IN ('RECOVERED', 'CLOSED')
 */

import { createAdminClient } from '@/lib/supabase/server';
import { logSystemAction } from '@/lib/audit';
import { fireWebhookEvent } from '@/lib/webhooks';

// ===========================================
// TYPES
// ===========================================

interface BreachedSLA {
    sla_log_id: string;
    case_id: string;
    case_number: string;
    case_status: string;
    sla_template_id: string;
    sla_type: string;
    due_at: string;
    region_id: string;
    auto_escalate: boolean;
}

interface BreachResult {
    success: boolean;
    breaches_detected: number;
    breaches_processed: number;
    escalations_triggered: number;
    errors: string[];
}

// ===========================================
// TERMINAL CASE STATUSES
// ===========================================

const TERMINAL_STATUSES = ['RECOVERED', 'CLOSED'];

// ===========================================
// DETECT BREACHED SLAs
// ===========================================

/**
 * Find all SLAs that are past due and not yet marked as breached
 */
async function detectBreachedSLAs(
    supabase: ReturnType<typeof createAdminClient>
): Promise<BreachedSLA[]> {
    const now = new Date().toISOString();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
        .from('sla_logs')
        .select(`
            id,
            case_id,
            sla_template_id,
            sla_type,
            due_at,
            cases!inner (
                id,
                case_number,
                status,
                region_id
            ),
            sla_templates!inner (
                id,
                auto_escalate_on_breach
            )
        `)
        .eq('status', 'PENDING')
        .lt('due_at', now)
        .not('cases.status', 'in', `(${TERMINAL_STATUSES.join(',')})`);

    if (error) {
        console.error('Failed to query breached SLAs:', error);
        return [];
    }

    if (!data || data.length === 0) {
        return [];
    }

    return data.map((row: {
        id: string;
        case_id: string;
        sla_template_id: string;
        sla_type: string;
        due_at: string;
        cases: {
            case_number: string;
            status: string;
            region_id: string;
        };
        sla_templates: {
            auto_escalate_on_breach: boolean;
        };
    }) => ({
        sla_log_id: row.id,
        case_id: row.case_id,
        case_number: row.cases.case_number,
        case_status: row.cases.status,
        sla_template_id: row.sla_template_id,
        sla_type: row.sla_type,
        due_at: row.due_at,
        region_id: row.cases.region_id,
        auto_escalate: row.sla_templates.auto_escalate_on_breach,
    }));
}

// ===========================================
// HANDLE SINGLE BREACH
// ===========================================

/**
 * Process a single SLA breach
 */
async function handleBreach(
    supabase: ReturnType<typeof createAdminClient>,
    breach: BreachedSLA
): Promise<{ success: boolean; escalated: boolean; error?: string }> {
    const now = new Date().toISOString();
    const breachTime = new Date(breach.due_at);
    const currentTime = new Date();
    const breachDurationMinutes = Math.floor(
        (currentTime.getTime() - breachTime.getTime()) / (1000 * 60)
    );

    try {
        // -----------------------------------------
        // STEP 1: UPDATE SLA LOG STATUS
        // -----------------------------------------

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: slaError } = await (supabase as any)
            .from('sla_logs')
            .update({
                status: 'BREACHED',
                breach_duration_minutes: breachDurationMinutes,
            })
            .eq('id', breach.sla_log_id);

        if (slaError) {
            return { success: false, escalated: false, error: slaError.message };
        }

        // -----------------------------------------
        // STEP 2: UPDATE CASE sla_breached FLAG
        // -----------------------------------------

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
            .from('cases')
            .update({
                sla_breached: true,
                updated_at: now,
            })
            .eq('id', breach.case_id);

        // -----------------------------------------
        // STEP 3: CREATE TIMELINE ENTRY
        // -----------------------------------------

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
            .from('case_timeline')
            .insert({
                case_id: breach.case_id,
                event_type: 'SLA_BREACHED',
                event_category: 'SYSTEM',
                description: `SLA ${breach.sla_type} breached. Due at ${breach.due_at}, breach duration: ${breachDurationMinutes} minutes.`,
                metadata: {
                    sla_log_id: breach.sla_log_id,
                    sla_template_id: breach.sla_template_id,
                    sla_type: breach.sla_type,
                    due_at: breach.due_at,
                    breach_duration_minutes: breachDurationMinutes,
                    detected_by: 'SYSTEM',
                },
                performed_by: 'SYSTEM',
                performed_by_role: 'SYSTEM',
            });

        // -----------------------------------------
        // STEP 4: WRITE AUDIT LOG
        // -----------------------------------------

        await logSystemAction(
            'SLA_BREACHED',
            'SLA_BREACH_DETECTION',
            'sla_log',
            breach.sla_log_id,
            {
                case_id: breach.case_id,
                case_number: breach.case_number,
                sla_template_id: breach.sla_template_id,
                sla_type: breach.sla_type,
                due_at: breach.due_at,
                breach_time: now,
                breach_duration_minutes: breachDurationMinutes,
            }
        );

        // -----------------------------------------
        // STEP 5: EMIT DOMAIN EVENT
        // -----------------------------------------

        fireWebhookEvent('sla.breached', {
            sla_log_id: breach.sla_log_id,
            case_id: breach.case_id,
            case_number: breach.case_number,
            sla_type: breach.sla_type,
            due_at: breach.due_at,
            breach_duration_minutes: breachDurationMinutes,
        }).catch(err => console.error('Webhook error:', err));

        // -----------------------------------------
        // STEP 6: TRIGGER ESCALATION IF CONFIGURED
        // -----------------------------------------

        let escalated = false;

        if (breach.auto_escalate) {
            try {
                await triggerEscalation(supabase, breach);
                escalated = true;
            } catch (escalationError) {
                console.error('Escalation failed:', escalationError);
            }
        }

        return { success: true, escalated };

    } catch (error) {
        console.error('Breach handling failed:', error);
        return {
            success: false,
            escalated: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

// ===========================================
// TRIGGER ESCALATION
// ===========================================

/**
 * Trigger escalation based on region's escalation matrix
 */
async function triggerEscalation(
    supabase: ReturnType<typeof createAdminClient>,
    breach: BreachedSLA
): Promise<void> {
    const now = new Date().toISOString();

    // Check if already escalated for this breach
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingEscalation } = await (supabase as any)
        .from('escalations')
        .select('id')
        .eq('case_id', breach.case_id)
        .eq('escalation_type', 'SLA_BREACH')
        .single();

    if (existingEscalation) {
        // Already escalated, skip (idempotency)
        return;
    }

    // Get escalation matrix level for region
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: regions } = await (supabase as any)
        .from('regions')
        .select('escalation_matrix_id')
        .eq('id', breach.region_id)
        .single();

    if (!regions?.escalation_matrix_id) {
        console.log('No escalation matrix for region:', breach.region_id);
        return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: matrixLevel } = await (supabase as any)
        .from('escalation_matrix_levels')
        .select('*')
        .eq('matrix_id', regions.escalation_matrix_id)
        .eq('escalation_type', 'SLA_BREACH')
        .order('level', { ascending: true })
        .limit(1)
        .single();

    // Create escalation record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
        .from('escalations')
        .insert({
            case_id: breach.case_id,
            escalation_type: 'SLA_BREACH',
            title: `SLA Breach: ${breach.sla_type}`,
            description: `Auto-escalated due to SLA breach. SLA was due at ${breach.due_at}.`,
            severity: 'HIGH',
            escalated_to: matrixLevel?.assigned_user_id || null,
        });

    // Update case status to ESCALATED if not already
    if (breach.case_status !== 'ESCALATED') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
            .from('cases')
            .update({
                status: 'ESCALATED',
                updated_at: now,
            })
            .eq('id', breach.case_id);

        // Timeline entry for escalation
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
            .from('case_timeline')
            .insert({
                case_id: breach.case_id,
                event_type: 'STATUS_CHANGED',
                event_category: 'SYSTEM',
                description: `Case auto-escalated due to SLA breach`,
                metadata: {
                    from_status: breach.case_status,
                    to_status: 'ESCALATED',
                    reason: 'SLA_BREACH',
                    sla_log_id: breach.sla_log_id,
                },
                performed_by: 'SYSTEM',
                performed_by_role: 'SYSTEM',
            });
    }

    // Update priority if configured
    if (matrixLevel?.auto_change_priority && matrixLevel?.new_priority) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
            .from('cases')
            .update({
                priority: matrixLevel.new_priority,
                updated_at: now,
            })
            .eq('id', breach.case_id);
    }

    // Audit log for escalation
    await logSystemAction(
        'CASE_ESCALATED',
        'SLA_BREACH_DETECTION',
        'case',
        breach.case_id,
        {
            case_number: breach.case_number,
            reason: 'SLA_BREACH',
            sla_type: breach.sla_type,
            escalation_level: matrixLevel?.level || 1,
        }
    );

    // Emit escalation event
    fireWebhookEvent('case.escalated', {
        case_id: breach.case_id,
        case_number: breach.case_number,
        reason: 'SLA_BREACH',
        sla_type: breach.sla_type,
        escalated_by: 'SYSTEM',
    }).catch(err => console.error('Webhook error:', err));
}

// ===========================================
// MAIN DETECTION FUNCTION
// ===========================================

/**
 * Run SLA breach detection job
 * 
 * This function is idempotent and safe to run repeatedly.
 * Should be called by a cron job every 5-15 minutes.
 */
export async function runBreachDetection(): Promise<BreachResult> {
    const supabase = createAdminClient();

    const result: BreachResult = {
        success: true,
        breaches_detected: 0,
        breaches_processed: 0,
        escalations_triggered: 0,
        errors: [],
    };

    try {
        // Detect breached SLAs
        const breachedSLAs = await detectBreachedSLAs(supabase);
        result.breaches_detected = breachedSLAs.length;

        if (breachedSLAs.length === 0) {
            await logSystemAction(
                'SLA_BREACH_CHECK',
                'SLA_BREACH_DETECTION',
                'system',
                'N/A',
                {
                    breaches_found: 0,
                    check_time: new Date().toISOString(),
                }
            );
            return result;
        }

        // Process each breach
        for (const breach of breachedSLAs) {
            const handleResult = await handleBreach(supabase, breach);

            if (handleResult.success) {
                result.breaches_processed++;
                if (handleResult.escalated) {
                    result.escalations_triggered++;
                }
            } else if (handleResult.error) {
                result.errors.push(`${breach.case_number}: ${handleResult.error}`);
            }
        }

        // Log summary
        await logSystemAction(
            'SLA_BREACH_CHECK',
            'SLA_BREACH_DETECTION',
            'system',
            'N/A',
            {
                breaches_detected: result.breaches_detected,
                breaches_processed: result.breaches_processed,
                escalations_triggered: result.escalations_triggered,
                errors_count: result.errors.length,
                check_time: new Date().toISOString(),
            }
        );

        return result;

    } catch (error) {
        console.error('SLA breach detection failed:', error);
        result.success = false;
        result.errors.push(error instanceof Error ? error.message : String(error));

        await logSystemAction(
            'SLA_BREACH_CHECK',
            'SLA_BREACH_DETECTION',
            'system',
            'N/A',
            {
                status: 'ERROR',
                error: error instanceof Error ? error.message : String(error),
                check_time: new Date().toISOString(),
            }
        );

        return result;
    }
}
