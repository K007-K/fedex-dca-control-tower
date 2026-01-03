'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useToast } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { DisabledActionHint, DISABLED_ACTIONS } from '@/components/ui/DisabledActionHint';
import { parsePermissionError, isForbiddenResponse } from '@/lib/utils/permission-error';
import { isGovernanceRole, type UserRole } from '@/lib/auth/rbac';

import { EscalationDialog } from './EscalationDialog';

interface CaseActionsProps {
    caseId: string;
    caseNumber: string;
    status: string;
    hasAssignedDca: boolean;
    userRole?: UserRole; // Added for role-aware visibility
}

export function CaseActions({ caseId, caseNumber, status, hasAssignedDca, userRole }: CaseActionsProps) {
    const router = useRouter();
    const toast = useToast();
    const [showEscalationDialog, setShowEscalationDialog] = useState(false);
    const [allocating, setAllocating] = useState(false);

    // GOVERNANCE: Check if user is governance-only role (SUPER_ADMIN)
    const isGovernanceOnlyRole = userRole ? isGovernanceRole(userRole) : false;

    const handleAutoAssign = async () => {
        setAllocating(true);
        try {
            const res = await fetch('/api/cases/allocate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ case_id: caseId }),
            });

            const data = await res.json();

            // Handle 403 with user-friendly message
            if (isForbiddenResponse(res)) {
                const permError = parsePermissionError(data);
                toast.error(`${permError.title}: ${permError.message}`);
                return;
            }

            if (!res.ok) {
                throw new Error(data.error || 'Failed to allocate case');
            }

            toast.success(`Case assigned to ${data.data.assigned_dca_name}`);
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to allocate case');
        } finally {
            setAllocating(false);
        }
    };

    const handleEscalationSuccess = () => {
        router.refresh();
    };

    const canEscalate = !['CLOSED', 'FULL_RECOVERY', 'WRITTEN_OFF'].includes(status);
    const canAutoAssign = status === 'PENDING_ALLOCATION' && !hasAssignedDca;
    const caseAlreadyAssigned = hasAssignedDca;

    // GOVERNANCE: Hide operational buttons for SUPER_ADMIN (governance-only role)
    // SUPER_ADMIN has oversight, not operational authority
    const showOperationalButtons = !isGovernanceOnlyRole;

    return (
        <>
            <div className="flex items-center gap-2">
                {/* Auto-Assign Button - Hidden for governance roles */}
                {canAutoAssign && showOperationalButtons && (
                    <Button
                        variant="outline"
                        onClick={handleAutoAssign}
                        disabled={allocating}
                    >
                        {allocating ? '⏳ Assigning...' : '🎯 Auto-Assign DCA'}
                    </Button>
                )}
                {/* Escalate Button - Hidden for governance roles */}
                {canEscalate && showOperationalButtons && (
                    <Button
                        variant="danger"
                        onClick={() => setShowEscalationDialog(true)}
                    >
                        ⚠️ Escalate
                    </Button>
                )}
                {/* Show tooltip for governance roles explaining why buttons are hidden */}
                {isGovernanceOnlyRole && (
                    <span className="text-xs text-gray-400 italic">
                        Governance role — operational actions managed by FEDEX_ADMIN
                    </span>
                )}
            </div>

            {/* Show explanation when case is already assigned */}
            {caseAlreadyAssigned && status !== 'PENDING_ALLOCATION' && (
                <div className="mt-3">
                    <DisabledActionHint
                        {...DISABLED_ACTIONS.DCA_ALLOCATION}
                        mode="inline"
                    />
                </div>
            )}

            <EscalationDialog
                caseId={caseId}
                caseNumber={caseNumber}
                isOpen={showEscalationDialog}
                onClose={() => setShowEscalationDialog(false)}
                onSuccess={handleEscalationSuccess}
            />
        </>
    );
}
