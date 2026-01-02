/**
 * Bulk Case Operations
 * 
 * Handles bulk operations with:
 * - Transactional semantics
 * - Partial failure handling
 * - Rollback support
 * - Detailed results
 * 
 * @module lib/case/BulkCaseOperations
 */

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { CaseStateMachine } from './CaseStateMachine';
import { CaseActionService, type UserContext } from './CaseActionService';
import { dcaAllocationEngine } from '@/lib/region/DCAAllocationEngine';
import { logUserAction } from '@/lib/audit';
import type { CaseStatus } from '@/lib/types/case';

// ===========================================
// TYPES
// ===========================================

export interface BulkOperationResult {
    success: boolean;
    totalProcessed: number;
    successCount: number;
    failureCount: number;
    results: {
        caseId: string;
        success: boolean;
        error?: string;
        data?: unknown;
    }[];
    rollbackPerformed?: boolean;
}

export interface BulkStatusChangeInput {
    caseIds: string[];
    newStatus: CaseStatus;
    reason?: string;
    failureThreshold?: number; // Percentage (0-100) - rollback if exceeded
}

export interface BulkAllocationInput {
    caseIds: string[];
    dcaId?: string; // If provided, allocate to this DCA, else auto-allocate
    allocationMethod?: 'MANUAL' | 'AUTO' | 'ROUND_ROBIN';
}

// ===========================================
// BULK CASE OPERATIONS
// ===========================================

export class BulkCaseOperations {

    /**
     * Bulk change status with transactional semantics
     */
    static async bulkChangeStatus(
        input: BulkStatusChangeInput,
        user: UserContext
    ): Promise<BulkOperationResult> {
        const supabase = await createClient();
        const failureThreshold = input.failureThreshold ?? 50; // Default 50%

        const results: BulkOperationResult['results'] = [];
        let successCount = 0;
        let failureCount = 0;
        const processedCaseIds: string[] = [];
        const originalStatuses: Map<string, CaseStatus> = new Map();

        try {
            // Validate all cases first (fail-fast)
            const { data: cases, error } = await (supabase as any)
                .from('cases')
                .select('id, status, region')
                .in('id', input.caseIds);

            if (error) {
                return {
                    success: false,
                    totalProcessed: 0,
                    successCount: 0,
                    failureCount: input.caseIds.length,
                    results: input.caseIds.map(id => ({
                        caseId: id,
                        success: false,
                        error: 'Failed to fetch cases',
                    })),
                };
            }

            const caseMap = new Map(cases.map((c: any) => [c.id, c]));

            // Pre-validate all transitions
            for (const caseId of input.caseIds) {
                const caseData = caseMap.get(caseId);

                if (!caseData) {
                    results.push({ caseId, success: false, error: 'Case not found' });
                    failureCount++;
                    continue;
                }

                const validation = CaseStateMachine.canTransition(caseData.status, input.newStatus);
                if (!validation.valid) {
                    results.push({
                        caseId,
                        success: false,
                        error: validation.reason,
                    });
                    failureCount++;
                    continue;
                }

                originalStatuses.set(caseId, caseData.status);
            }

            // Check if we should proceed based on pre-validation failures
            const preValidationFailureRate = (failureCount / input.caseIds.length) * 100;
            if (preValidationFailureRate > failureThreshold) {
                return {
                    success: false,
                    totalProcessed: 0,
                    successCount: 0,
                    failureCount,
                    results,
                    rollbackPerformed: false,
                };
            }

            // Process valid cases
            for (const [caseId, originalStatus] of originalStatuses) {
                try {
                    const { data: updated, error: updateError } = await (supabase as any)
                        .from('cases')
                        .update({
                            status: input.newStatus,
                            updated_at: new Date().toISOString(),
                            updated_by: user.id,
                        })
                        .eq('id', caseId)
                        .select()
                        .single();

                    if (updateError) {
                        results.push({ caseId, success: false, error: updateError.message });
                        failureCount++;
                    } else {
                        results.push({ caseId, success: true, data: updated });
                        successCount++;
                        processedCaseIds.push(caseId);

                        // Log timeline event
                        await CaseActionService.logTimelineEvent({
                            case_id: caseId,
                            event_type: 'STATUS_CHANGED',
                            event_category: 'USER',
                            description: `Bulk status change: ${originalStatus} → ${input.newStatus}`,
                            old_value: originalStatus,
                            new_value: input.newStatus,
                            metadata: { bulk_operation: true, reason: input.reason },
                            performed_by: user.id,
                            performed_by_role: user.role,
                        });
                    }
                } catch (err) {
                    results.push({ caseId, success: false, error: 'Processing failed' });
                    failureCount++;
                }

                // Check running failure rate
                const runningFailureRate = (failureCount / (successCount + failureCount)) * 100;
                if (runningFailureRate > failureThreshold && successCount > 0) {
                    // Rollback successful changes
                    await this.rollbackStatusChanges(processedCaseIds, originalStatuses, user);

                    return {
                        success: false,
                        totalProcessed: successCount + failureCount,
                        successCount: 0,
                        failureCount: input.caseIds.length,
                        results: results.map(r => ({
                            ...r,
                            success: false,
                            error: r.success ? 'Rolled back due to failure threshold' : r.error,
                        })),
                        rollbackPerformed: true,
                    };
                }
            }

            // Audit log
            await logUserAction(
                'BULK_STATUS_CHANGE',
                user.id,
                user.email || 'unknown',
                'cases',
                'bulk',
                {
                    count: successCount,
                    new_status: input.newStatus,
                    reason: input.reason,
                }
            );

            return {
                success: failureCount === 0,
                totalProcessed: input.caseIds.length,
                successCount,
                failureCount,
                results,
            };

        } catch (error) {
            console.error('Bulk status change error:', error);

            // Attempt rollback
            if (processedCaseIds.length > 0) {
                await this.rollbackStatusChanges(processedCaseIds, originalStatuses, user);
            }

            return {
                success: false,
                totalProcessed: successCount + failureCount,
                successCount: 0,
                failureCount: input.caseIds.length,
                results: results.map(r => ({
                    ...r,
                    success: false,
                    error: 'Operation failed and rolled back',
                })),
                rollbackPerformed: true,
            };
        }
    }

    /**
     * Bulk allocate cases to DCAs
     */
    static async bulkAllocate(
        input: BulkAllocationInput,
        user: UserContext
    ): Promise<BulkOperationResult> {
        const supabase = await createClient();
        const results: BulkOperationResult['results'] = [];
        let successCount = 0;
        let failureCount = 0;

        try {
            // Fetch cases with region info
            const { data: cases, error } = await (supabase as any)
                .from('cases')
                .select('id, status, region, region_id, outstanding_amount, priority')
                .in('id', input.caseIds);

            if (error) {
                return {
                    success: false,
                    totalProcessed: 0,
                    successCount: 0,
                    failureCount: input.caseIds.length,
                    results: input.caseIds.map(id => ({
                        caseId: id,
                        success: false,
                        error: 'Failed to fetch cases',
                    })),
                };
            }

            for (const caseData of cases) {
                try {
                    // Validate case is allocatable
                    if (caseData.status !== 'PENDING_ALLOCATION' && caseData.status !== 'ALLOCATED') {
                        const validation = CaseStateMachine.canTransition(caseData.status, 'ALLOCATED');
                        if (!validation.valid) {
                            results.push({
                                caseId: caseData.id,
                                success: false,
                                error: `Cannot allocate case in status ${caseData.status}`,
                            });
                            failureCount++;
                            continue;
                        }
                    }

                    let targetDcaId = input.dcaId;
                    let allocationReason = 'Manual allocation';

                    // Auto-allocate if no specific DCA
                    if (!targetDcaId && input.allocationMethod !== 'MANUAL') {
                        try {
                            const allocation = await dcaAllocationEngine.allocateDCA({
                                id: caseData.id,
                                region_id: caseData.region_id || caseData.region,
                                outstanding_amount: caseData.outstanding_amount,
                                priority: caseData.priority,
                            });
                            targetDcaId = allocation.dca.id;
                            allocationReason = allocation.allocation_reason;
                        } catch (allocError: any) {
                            results.push({
                                caseId: caseData.id,
                                success: false,
                                error: allocError.message || 'No eligible DCA found',
                            });
                            failureCount++;
                            continue;
                        }
                    }

                    if (!targetDcaId) {
                        results.push({
                            caseId: caseData.id,
                            success: false,
                            error: 'No DCA specified or found',
                        });
                        failureCount++;
                        continue;
                    }

                    // Update case
                    const { data: updated, error: updateError } = await (supabase as any)
                        .from('cases')
                        .update({
                            status: 'ALLOCATED',
                            assigned_dca_id: targetDcaId,
                            assigned_at: new Date().toISOString(),
                            assignment_method: input.allocationMethod || 'MANUAL',
                            updated_at: new Date().toISOString(),
                            updated_by: user.id,
                        })
                        .eq('id', caseData.id)
                        .select('*, assigned_dca:dcas(id, name)')
                        .single();

                    if (updateError) {
                        results.push({ caseId: caseData.id, success: false, error: updateError.message });
                        failureCount++;
                    } else {
                        results.push({ caseId: caseData.id, success: true, data: updated });
                        successCount++;

                        // Log timeline
                        await CaseActionService.logTimelineEvent({
                            case_id: caseData.id,
                            event_type: input.allocationMethod === 'AUTO' ? 'CASE_AUTO_ALLOCATED' : 'CASE_MANUALLY_ALLOCATED',
                            event_category: input.allocationMethod === 'AUTO' ? 'SYSTEM' : 'USER',
                            description: allocationReason,
                            new_value: updated.assigned_dca?.name,
                            metadata: { dca_id: targetDcaId, method: input.allocationMethod },
                            performed_by: user.id,
                            performed_by_role: user.role,
                        });

                        // Update DCA capacity
                        await (supabase as any)
                            .from('dcas')
                            .update({
                                capacity_used: (supabase as any).rpc('increment_capacity', { dca_id: targetDcaId }),
                            })
                            .eq('id', targetDcaId);
                    }

                } catch (err) {
                    results.push({ caseId: caseData.id, success: false, error: 'Allocation failed' });
                    failureCount++;
                }
            }

            // Audit log
            await logUserAction(
                'BULK_ALLOCATION',
                user.id,
                user.email || 'unknown',
                'cases',
                'bulk',
                {
                    count: successCount,
                    method: input.allocationMethod,
                    target_dca: input.dcaId,
                }
            );

            return {
                success: failureCount === 0,
                totalProcessed: cases.length,
                successCount,
                failureCount,
                results,
            };

        } catch (error) {
            console.error('Bulk allocation error:', error);
            return {
                success: false,
                totalProcessed: 0,
                successCount: 0,
                failureCount: input.caseIds.length,
                results: input.caseIds.map(id => ({
                    caseId: id,
                    success: false,
                    error: 'Operation failed',
                })),
            };
        }
    }

    /**
     * Rollback status changes
     */
    private static async rollbackStatusChanges(
        caseIds: string[],
        originalStatuses: Map<string, CaseStatus>,
        user: UserContext
    ): Promise<void> {
        const supabase = await createClient();

        for (const caseId of caseIds) {
            const originalStatus = originalStatuses.get(caseId);
            if (originalStatus) {
                try {
                    await (supabase as any)
                        .from('cases')
                        .update({
                            status: originalStatus,
                            updated_at: new Date().toISOString(),
                            updated_by: user.id,
                        })
                        .eq('id', caseId);

                    await CaseActionService.logTimelineEvent({
                        case_id: caseId,
                        event_type: 'STATUS_CHANGED',
                        event_category: 'SYSTEM',
                        description: 'Rollback: Status restored after bulk operation failure',
                        new_value: originalStatus,
                        performed_by: 'SYSTEM',
                        performed_by_role: 'SYSTEM',
                    });
                } catch (err) {
                    console.error(`Failed to rollback case ${caseId}:`, err);
                }
            }
        }
    }
}

export const bulkCaseOperations = BulkCaseOperations;
