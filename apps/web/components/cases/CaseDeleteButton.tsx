'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { usePermissions } from '@/components/auth/PermissionGate';
import { useConfirm, useToast } from '@/components/ui';
import { Button } from '@/components/ui/button';

interface CaseDeleteButtonProps {
    caseId: string;
    caseNumber: string;
}

export function CaseDeleteButton({ caseId, caseNumber }: CaseDeleteButtonProps) {
    const router = useRouter();
    const { confirm } = useConfirm();
    const toast = useToast();
    const { hasPermission, isLoading } = usePermissions();
    const [isDeleting, setIsDeleting] = useState(false);

    // Don't show button if user doesn't have permission
    if (isLoading) return null;
    if (!hasPermission('cases:delete')) return null;

    const handleDelete = async () => {
        const confirmed = await confirm({
            title: 'Close Case',
            message: `Are you sure you want to close case ${caseNumber}? This will mark it as closed and cannot be undone.`,
            confirmText: 'Close Case',
            cancelText: 'Cancel',
            variant: 'danger',
        });

        if (!confirmed) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/cases/${caseId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error?.message || 'Failed to close case');
            }

            toast.success('Case Closed', `Case ${caseNumber} has been closed successfully.`);
            setTimeout(() => {
                router.push('/cases');
                router.refresh();
            }, 1000);
        } catch (err) {
            toast.error('Action Failed', err instanceof Error ? err.message : 'An error occurred');
            setIsDeleting(false);
        }
    };

    return (
        <Button
            variant="outline"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-red-600 border-red-200 hover:bg-red-50"
        >
            {isDeleting ? 'Closing...' : 'Close Case'}
        </Button>
    );
}

