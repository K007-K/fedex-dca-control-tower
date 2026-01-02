/**
 * DCA Allocation Engine
 * 
 * Enterprise-grade DCA allocation based on:
 * 1. Region eligibility
 * 2. DCA capacity
 * 3. Historical DCA performance in that region
 * 4. Case risk score (AI integration)
 * 
 * @module lib/region/DCAAllocationEngine
 */

import { createClient } from '@/lib/supabase/server';

// ===========================================
// TYPES
// ===========================================

export interface DCA {
    id: string;
    name: string;
    status: string;
    performance_score: number;
    recovery_rate: number;
    sla_compliance_rate: number;
    capacity_limit: number;
    capacity_used: number;
    region?: string;
}

export interface RegionDCAAssignment {
    id: string;
    region_id: string;
    dca_id: string;
    is_primary: boolean;
    allocation_priority: number;
    capacity_allocation_pct: number;
    region_recovery_rate: number;
    region_sla_compliance: number;
    region_cases_handled: number;
    is_active: boolean;
    dca?: DCA;
}

export interface CaseForAllocation {
    id?: string;
    region_id: string;
    outstanding_amount: number;
    priority?: string;
    risk_score?: number;
    customer_segment?: string;
}

export interface ScoredDCA {
    dca: DCA;
    assignment: RegionDCAAssignment;
    score: number;
    availableCapacity: number;
}

export interface AllocationResult {
    dca: DCA;
    allocation_reason: string;
    score: number;
}

export class DCAAllocationError extends Error {
    constructor(message: string, public readonly code: string = 'DCA_ALLOCATION_FAILED') {
        super(message);
        this.name = 'DCAAllocationError';
    }
}

// ===========================================
// ALLOCATION WEIGHTS
// ===========================================

const ALLOCATION_WEIGHTS = {
    REGION_RECOVERY_RATE: 0.30,      // 30% weight on historical recovery rate
    REGION_SLA_COMPLIANCE: 0.25,     // 25% weight on SLA compliance
    AVAILABLE_CAPACITY: 0.20,        // 20% weight on available capacity
    OVERALL_PERFORMANCE: 0.15,       // 15% weight on overall DCA performance
    ALLOCATION_PRIORITY: 0.10,       // 10% weight on admin-defined priority
};

// ===========================================
// DCA ALLOCATION ENGINE
// ===========================================

export class DCAAllocationEngine {

    /**
     * Allocates the best DCA for a case based on region and performance.
     * 
     * @param caseData - Case data with region_id
     * @returns Best DCA allocation result
     * @throws DCAAllocationError if no eligible DCA found
     */
    async allocateDCA(caseData: CaseForAllocation): Promise<AllocationResult> {
        // 1. Get DCAs eligible for this region
        const eligibleDCAs = await this.getRegionDCAs(caseData.region_id);

        if (eligibleDCAs.length === 0) {
            throw new DCAAllocationError(
                'No DCAs available for this region',
                'NO_ELIGIBLE_DCA'
            );
        }

        // 2. Filter by capacity availability
        const availableDCAs = eligibleDCAs.filter(assignment => {
            if (!assignment.dca) return false;
            const effectiveCapacity = Math.floor(
                assignment.dca.capacity_limit * (assignment.capacity_allocation_pct / 100)
            );
            return assignment.dca.capacity_used < effectiveCapacity;
        });

        if (availableDCAs.length === 0) {
            throw new DCAAllocationError(
                'All eligible DCAs are at capacity',
                'NO_CAPACITY'
            );
        }

        // 3. Score DCAs based on multiple factors
        const scoredDCAs = this.scoreDCAs(availableDCAs, caseData);

        // 4. Return highest scoring DCA
        const best = scoredDCAs[0];

        return {
            dca: best.assignment.dca!,
            allocation_reason: this.buildAllocationReason(best),
            score: best.score,
        };
    }

    /**
     * Gets all DCAs eligible for a region.
     */
    async getRegionDCAs(regionId: string): Promise<RegionDCAAssignment[]> {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('region_dca_assignments')
            .select(`
                *,
                dca:dcas(*)
            `)
            .eq('region_id', regionId)
            .eq('is_active', true)
            .is('suspended_at', null)
            .order('allocation_priority', { ascending: true });

        if (error) {
            console.error('Failed to fetch region DCAs:', error);
            return [];
        }

        // Filter to only active DCAs
        return (data || []).filter(
            assignment => assignment.dca?.status === 'ACTIVE'
        );
    }

    /**
     * Scores DCAs based on weighted factors.
     */
    private scoreDCAs(
        assignments: RegionDCAAssignment[],
        caseData: CaseForAllocation
    ): ScoredDCA[] {
        return assignments
            .map(assignment => {
                const dca = assignment.dca!;

                // Calculate effective capacity
                const effectiveCapacity = Math.floor(
                    dca.capacity_limit * (assignment.capacity_allocation_pct / 100)
                );
                const availableCapacity = effectiveCapacity - dca.capacity_used;
                const capacityPercent = (availableCapacity / effectiveCapacity) * 100;

                // Calculate weighted score
                const score =
                    (assignment.region_recovery_rate || dca.recovery_rate || 0) * ALLOCATION_WEIGHTS.REGION_RECOVERY_RATE +
                    (assignment.region_sla_compliance || dca.sla_compliance_rate || 0) * ALLOCATION_WEIGHTS.REGION_SLA_COMPLIANCE +
                    capacityPercent * ALLOCATION_WEIGHTS.AVAILABLE_CAPACITY +
                    (dca.performance_score || 0) * ALLOCATION_WEIGHTS.OVERALL_PERFORMANCE +
                    ((100 - (assignment.allocation_priority * 10)) || 0) * ALLOCATION_WEIGHTS.ALLOCATION_PRIORITY;

                // Bonus for primary DCA
                const primaryBonus = assignment.is_primary ? 5 : 0;

                // Case-specific adjustments
                const caseBonus = this.calculateCaseBonus(assignment, caseData);

                return {
                    dca,
                    assignment,
                    score: score + primaryBonus + caseBonus,
                    availableCapacity,
                };
            })
            .sort((a, b) => b.score - a.score);
    }

    /**
     * Calculates bonus score based on case specifics.
     * E.g., high-value cases might go to DCAs with better track record
     */
    private calculateCaseBonus(
        assignment: RegionDCAAssignment,
        caseData: CaseForAllocation
    ): number {
        let bonus = 0;

        // High-value case bonus for experienced DCAs
        if (caseData.outstanding_amount > 100000 && assignment.region_cases_handled > 50) {
            bonus += 5;
        }

        // High-risk case bonus for DCAs with good SLA compliance
        if (caseData.risk_score && caseData.risk_score > 70) {
            if ((assignment.region_sla_compliance || 0) > 90) {
                bonus += 3;
            }
        }

        return bonus;
    }

    /**
     * Builds a human-readable allocation reason.
     */
    private buildAllocationReason(scoredDCA: ScoredDCA): string {
        const reasons = [];

        if (scoredDCA.assignment.is_primary) {
            reasons.push('Primary DCA for region');
        }

        if (scoredDCA.assignment.region_recovery_rate > 80) {
            reasons.push(`High recovery rate (${scoredDCA.assignment.region_recovery_rate}%)`);
        }

        if (scoredDCA.assignment.region_sla_compliance > 90) {
            reasons.push(`Excellent SLA compliance (${scoredDCA.assignment.region_sla_compliance}%)`);
        }

        if (scoredDCA.availableCapacity > 20) {
            reasons.push(`Good capacity (${scoredDCA.availableCapacity} slots)`);
        }

        return reasons.length > 0
            ? reasons.join(', ')
            : `Best scored DCA (score: ${scoredDCA.score.toFixed(1)})`;
    }

    /**
     * Updates DCA performance metrics for a region after case closure.
     */
    async updateRegionPerformance(
        regionId: string,
        dcaId: string,
        recovered: boolean,
        slaMet: boolean,
        recoveredAmount: number,
        recoveryDays: number
    ): Promise<void> {
        const supabase = await createClient();

        // Get current assignment
        const { data: assignment } = await supabase
            .from('region_dca_assignments')
            .select('*')
            .eq('region_id', regionId)
            .eq('dca_id', dcaId)
            .single();

        if (!assignment) return;

        // Calculate new metrics
        const newCasesHandled = (assignment.region_cases_handled || 0) + 1;
        const newAmountRecovered = (assignment.region_amount_recovered || 0) + recoveredAmount;

        // Update sliding average for recovery rate and SLA compliance
        const oldRecoveryRate = assignment.region_recovery_rate || 0;
        const oldSlaCompliance = assignment.region_sla_compliance || 0;

        const newRecoveryRate = (oldRecoveryRate * (newCasesHandled - 1) + (recovered ? 100 : 0)) / newCasesHandled;
        const newSlaCompliance = (oldSlaCompliance * (newCasesHandled - 1) + (slaMet ? 100 : 0)) / newCasesHandled;

        // Calculate average recovery days
        const oldAvgDays = assignment.region_avg_recovery_days || 0;
        const newAvgDays = Math.round(
            (oldAvgDays * (newCasesHandled - 1) + recoveryDays) / newCasesHandled
        );

        // Update assignment
        await supabase
            .from('region_dca_assignments')
            .update({
                region_cases_handled: newCasesHandled,
                region_amount_recovered: newAmountRecovered,
                region_recovery_rate: newRecoveryRate,
                region_sla_compliance: newSlaCompliance,
                region_avg_recovery_days: newAvgDays,
                updated_at: new Date().toISOString(),
            })
            .eq('id', assignment.id);
    }
}

// Singleton instance
export const dcaAllocationEngine = new DCAAllocationEngine();
