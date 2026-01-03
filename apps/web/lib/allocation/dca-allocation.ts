/**
 * DCA Allocation Service
 * 
 * SYSTEM-controlled, capacity-aware DCA allocation.
 * Automatically assigns newly created cases to eligible DCAs.
 * 
 * RULES:
 * - Allocation is SYSTEM-initiated only
 * - DCAs do NOT self-assign
 * - Capacity limits are enforced
 * - All assignments are audited
 * 
 * ELIGIBILITY:
 * - DCA status = ACTIVE
 * - Region assignment is_active = TRUE
 * - Not suspended (suspended_at IS NULL)
 * - Has available capacity (capacity_used < capacity_limit)
 * 
 * RANKING (higher = better):
 * - 40%: Lowest capacity utilization
 * - 35%: Best SLA compliance
 * - 25%: Best recovery rate
 */

import { createAdminClient } from '@/lib/supabase/server';
import { logSystemAction } from '@/lib/audit';
import { fireWebhookEvent } from '@/lib/webhooks';

// ===========================================
// TYPES
// ===========================================

interface EligibleDCA {
    dca_id: string;
    dca_name: string;
    capacity_limit: number;
    capacity_used: number;
    capacity_available: number;
    utilization_pct: number;
    allocation_priority: number;
    region_sla_compliance: number;
    region_recovery_rate: number;
    score: number;
}

interface AllocationResult {
    success: boolean;
    allocated: boolean;
    dca_id?: string;
    dca_name?: string;
    reason: string;
    score?: number;
    candidates_evaluated?: number;
}

interface CaseForAllocation {
    id: string;
    case_number: string;
    region_id: string;
    region_code: string;
    priority: string;
    total_due: number;
}

// ===========================================
// CONSTANTS
// ===========================================

const WEIGHT_CAPACITY = 0.40;
const WEIGHT_SLA = 0.35;
const WEIGHT_RECOVERY = 0.25;

// ===========================================
// ELIGIBILITY CHECK
// ===========================================

/**
 * Find all eligible DCAs for a case's region
 */
async function findEligibleDCAs(
    supabase: ReturnType<typeof createAdminClient>,
    regionId: string
): Promise<EligibleDCA[]> {
    // Query DCAs that:
    // 1. Are ACTIVE
    // 2. Have active region assignment for this region
    // 3. Are not suspended
    // 4. Have available capacity

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
        .from('region_dca_assignments')
        .select(`
            dca_id,
            allocation_priority,
            region_sla_compliance,
            region_recovery_rate,
            dcas!inner (
                id,
                name,
                status,
                capacity_limit,
                capacity_used
            )
        `)
        .eq('region_id', regionId)
        .eq('is_active', true)
        .is('suspended_at', null)
        .eq('dcas.status', 'ACTIVE');

    if (error) {
        console.error('Failed to query eligible DCAs:', error);
        return [];
    }

    if (!data || data.length === 0) {
        return [];
    }

    // Filter and transform to eligibility records
    const eligible: EligibleDCA[] = [];

    for (const row of data) {
        const dca = row.dcas;
        const capacityLimit = dca.capacity_limit || 100;
        const capacityUsed = dca.capacity_used || 0;
        const capacityAvailable = capacityLimit - capacityUsed;

        // Skip if no capacity
        if (capacityAvailable <= 0) {
            continue;
        }

        const utilizationPct = (capacityUsed / capacityLimit) * 100;

        eligible.push({
            dca_id: dca.id,
            dca_name: dca.name,
            capacity_limit: capacityLimit,
            capacity_used: capacityUsed,
            capacity_available: capacityAvailable,
            utilization_pct: utilizationPct,
            allocation_priority: row.allocation_priority || 1,
            region_sla_compliance: row.region_sla_compliance || 0,
            region_recovery_rate: row.region_recovery_rate || 0,
            score: 0, // Will be calculated
        });
    }

    return eligible;
}

// ===========================================
// RANKING ALGORITHM
// ===========================================

/**
 * Calculate allocation score for each DCA
 * Higher score = better candidate
 */
function rankDCAs(dcas: EligibleDCA[]): EligibleDCA[] {
    for (const dca of dcas) {
        // Capacity score: Lower utilization = higher score
        const capacityScore = (100 - dca.utilization_pct);

        // SLA score: Higher compliance = higher score
        const slaScore = dca.region_sla_compliance;

        // Recovery score: Higher rate = higher score
        const recoveryScore = dca.region_recovery_rate;

        // Weighted total
        dca.score =
            (capacityScore * WEIGHT_CAPACITY) +
            (slaScore * WEIGHT_SLA) +
            (recoveryScore * WEIGHT_RECOVERY);
    }

    // Sort by score descending (highest first)
    return dcas.sort((a, b) => b.score - a.score);
}

// ===========================================
// CAPACITY UPDATE
// ===========================================

async function incrementDCACapacity(
    supabase: ReturnType<typeof createAdminClient>,
    dcaId: string,
    currentUsed: number
): Promise<boolean> {
    // Direct update with incremented value
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
        .from('dcas')
        .update({
            capacity_used: currentUsed + 1,
            updated_at: new Date().toISOString(),
        })
        .eq('id', dcaId);

    if (error) {
        console.error('Failed to increment DCA capacity:', error);
        return false;
    }

    return true;
}

// ===========================================
// TIMELINE & AUDIT
// ===========================================

/**
 * Create case timeline entry for assignment
 */
async function createAssignmentTimeline(
    supabase: ReturnType<typeof createAdminClient>,
    caseId: string,
    dcaId: string,
    dcaName: string,
    reason: string,
    score: number
): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
        .from('case_timeline')
        .insert({
            case_id: caseId,
            event_type: 'CASE_ASSIGNED',
            event_category: 'SYSTEM',
            description: `Case auto-assigned to ${dcaName} by SYSTEM allocation`,
            metadata: {
                dca_id: dcaId,
                dca_name: dcaName,
                selection_reason: reason,
                allocation_score: score,
                allocated_by: 'SYSTEM',
            },
            performed_by: 'SYSTEM',
            performed_by_role: 'SYSTEM',
        });
}

// ===========================================
// MAIN ALLOCATION FUNCTION
// ===========================================

/**
 * Allocate a case to the best available DCA
 * 
 * @param caseData - Case information for allocation
 * @param serviceName - Name of calling service (for audit)
 * @returns Allocation result
 */
export async function allocateCase(
    caseData: CaseForAllocation,
    serviceName: string = 'ALLOCATION_SERVICE'
): Promise<AllocationResult> {
    const supabase = createAdminClient();

    try {
        // -----------------------------------------
        // STEP 1: FIND ELIGIBLE DCAs
        // -----------------------------------------

        const eligibleDCAs = await findEligibleDCAs(supabase, caseData.region_id);

        if (eligibleDCAs.length === 0) {
            // No eligible DCAs - mark case as pending
            const now = new Date().toISOString();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: currentCase } = await (supabase as any)
                .from('cases')
                .select('metadata')
                .eq('id', caseData.id)
                .single();

            const updatedMetadata = {
                ...(currentCase?.metadata || {}),
                allocation_pending: true,
                allocation_failed_at: now,
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as any)
                .from('cases')
                .update({
                    status: 'ALLOCATION_PENDING',
                    metadata: updatedMetadata,
                    updated_at: now,
                })
                .eq('id', caseData.id);

            // Audit log
            await logSystemAction(
                'CASE_ASSIGNED',
                serviceName,
                'case',
                caseData.id,
                {
                    case_number: caseData.case_number,
                    region_code: caseData.region_code,
                    allocation_status: 'FAILED',
                    reason: 'No eligible DCAs found for region',
                    candidates_evaluated: 0,
                }
            );

            return {
                success: true,
                allocated: false,
                reason: 'No eligible DCAs available for this region',
                candidates_evaluated: 0,
            };
        }

        // -----------------------------------------
        // STEP 2: RANK DCAs
        // -----------------------------------------

        const rankedDCAs = rankDCAs(eligibleDCAs);
        const selectedDCA = rankedDCAs[0];

        const selectionReason =
            `Selected based on: capacity=${(100 - selectedDCA.utilization_pct).toFixed(1)}% available, ` +
            `SLA=${selectedDCA.region_sla_compliance.toFixed(1)}%, ` +
            `recovery=${selectedDCA.region_recovery_rate.toFixed(1)}%. ` +
            `Score: ${selectedDCA.score.toFixed(2)} (${rankedDCAs.length} candidates evaluated)`;

        // -----------------------------------------
        // STEP 3: ASSIGN CASE TO DCA
        // -----------------------------------------

        const now = new Date().toISOString();

        // Get current case metadata
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: currentCase } = await (supabase as any)
            .from('cases')
            .select('metadata')
            .eq('id', caseData.id)
            .single();

        const updatedMetadata = {
            ...(currentCase?.metadata || {}),
            assigned_at: now,
            assigned_by: 'SYSTEM',
            assignment_score: selectedDCA.score,
            assignment_reason: selectionReason,
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: assignError } = await (supabase as any)
            .from('cases')
            .update({
                assigned_dca_id: selectedDCA.dca_id,
                status: 'PENDING_CONTACT',
                updated_at: now,
                metadata: updatedMetadata,
            })
            .eq('id', caseData.id);

        if (assignError) {
            console.error('Failed to assign case:', assignError);
            return {
                success: false,
                allocated: false,
                reason: `Database error: ${assignError.message}`,
            };
        }

        // -----------------------------------------
        // STEP 4: INCREMENT DCA CAPACITY
        // -----------------------------------------

        // Direct capacity increment (since RPC may not exist)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
            .from('dcas')
            .update({
                capacity_used: selectedDCA.capacity_used + 1,
                updated_at: now,
            })
            .eq('id', selectedDCA.dca_id);

        // -----------------------------------------
        // STEP 5: CREATE TIMELINE ENTRY
        // -----------------------------------------

        await createAssignmentTimeline(
            supabase,
            caseData.id,
            selectedDCA.dca_id,
            selectedDCA.dca_name,
            selectionReason,
            selectedDCA.score
        );

        // -----------------------------------------
        // STEP 6: WRITE AUDIT LOG
        // -----------------------------------------

        await logSystemAction(
            'CASE_ASSIGNED',
            serviceName,
            'case',
            caseData.id,
            {
                case_number: caseData.case_number,
                region_code: caseData.region_code,
                assigned_dca_id: selectedDCA.dca_id,
                assigned_dca_name: selectedDCA.dca_name,
                allocation_score: selectedDCA.score,
                selection_reason: selectionReason,
                candidates_evaluated: rankedDCAs.length,
                capacity_after: selectedDCA.capacity_used + 1,
                capacity_limit: selectedDCA.capacity_limit,
            }
        );

        // -----------------------------------------
        // STEP 7: EMIT DOMAIN EVENT
        // -----------------------------------------

        fireWebhookEvent('case.assigned', {
            case_id: caseData.id,
            case_number: caseData.case_number,
            dca_id: selectedDCA.dca_id,
            dca_name: selectedDCA.dca_name,
            region_code: caseData.region_code,
            allocation_score: selectedDCA.score,
            assigned_by: 'SYSTEM',
        }).catch(err => console.error('Webhook error:', err));

        // -----------------------------------------
        // SUCCESS
        // -----------------------------------------

        return {
            success: true,
            allocated: true,
            dca_id: selectedDCA.dca_id,
            dca_name: selectedDCA.dca_name,
            reason: selectionReason,
            score: selectedDCA.score,
            candidates_evaluated: rankedDCAs.length,
        };

    } catch (error) {
        console.error('DCA allocation failed:', error);

        await logSystemAction(
            'CASE_ASSIGNED',
            serviceName,
            'case',
            caseData.id,
            {
                case_number: caseData.case_number,
                allocation_status: 'ERROR',
                error: error instanceof Error ? error.message : String(error),
            }
        );

        return {
            success: false,
            allocated: false,
            reason: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Allocate a case by ID (fetches case data internally)
 */
export async function allocateCaseById(
    caseId: string,
    serviceName: string = 'ALLOCATION_SERVICE'
): Promise<AllocationResult> {
    const supabase = createAdminClient();

    // Fetch case data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: caseData, error } = await (supabase as any)
        .from('cases')
        .select('id, case_number, region_id, region, priority, original_amount')
        .eq('id', caseId)
        .single();

    if (error || !caseData) {
        return {
            success: false,
            allocated: false,
            reason: `Case not found: ${caseId}`,
        };
    }

    return allocateCase({
        id: caseData.id,
        case_number: caseData.case_number,
        region_id: caseData.region_id,
        region_code: caseData.region,
        priority: caseData.priority,
        total_due: caseData.original_amount,
    }, serviceName);
}
