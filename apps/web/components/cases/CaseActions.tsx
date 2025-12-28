'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui';
import { EscalationDialog } from './EscalationDialog';

interface CaseActionsProps {
    caseId: string;
    caseNumber: string;
    status: string;
    hasAssignedDca: boolean;
}

export function CaseActions({ caseId, caseNumber, status, hasAssignedDca }: CaseActionsProps) {
    const router = useRouter();
    const toast = useToast();
    const [showEscalationDialog, setShowEscalationDialog] = useState(false);
    const [allocating, setAllocating] = useState(false);

    const handleAutoAssign = async () => {
        setAllocating(true);
        try {
            const res = await fetch('/api/cases/allocate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ case_id: caseId }),
            });

            const data = await res.json();

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

    return (
        <>
            <div className="flex items-center gap-2">
                {canAutoAssign && (
                    <Button
                        variant="outline"
                        onClick={handleAutoAssign}
                        disabled={allocating}
                    >
                        {allocating ? '⏳ Assigning...' : '🎯 Auto-Assign DCA'}
                    </Button>
                )}
                {canEscalate && (
                    <Button
                        variant="danger"
                        onClick={() => setShowEscalationDialog(true)}
                    >
                        ⚠️ Escalate
                    </Button>
                )}
            </div>

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
