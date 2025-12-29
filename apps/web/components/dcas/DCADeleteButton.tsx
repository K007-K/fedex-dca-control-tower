'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { usePermissions } from '@/components/auth/PermissionGate';
import { useConfirm, useToast } from '@/components/ui';
import { Button } from '@/components/ui/button';

interface DCADeleteButtonProps {
    dcaId: string;
    dcaName: string;
}

export function DCADeleteButton({ dcaId, dcaName }: DCADeleteButtonProps) {
    const router = useRouter();
    const { confirm } = useConfirm();
    const toast = useToast();
    const { hasPermission, isLoading } = usePermissions();
    const [isDeleting, setIsDeleting] = useState(false);

    // Don't show button if user doesn't have permission
    if (isLoading) return null;
    if (!hasPermission('dcas:delete')) return null;

    const handleDelete = async () => {
        const confirmed = await confirm({
            title: 'Terminate DCA',
            message: `Are you sure you want to terminate ${dcaName}? This will mark the DCA as terminated. DCAs with active cases cannot be terminated.`,
            confirmText: 'Terminate DCA',
            cancelText: 'Cancel',
            variant: 'danger',
        });

        if (!confirmed) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/dcas/${dcaId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error?.message || 'Failed to terminate DCA');
            }

            toast.success('DCA Terminated', `${dcaName} has been terminated successfully.`);
            setTimeout(() => {
                router.push('/dcas');
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
            {isDeleting ? 'Terminating...' : 'Terminate DCA'}
        </Button>
    );
}

