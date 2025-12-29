'use client';

import { ReactNode } from 'react';

import { PermissionProvider } from '@/components/auth/PermissionGate';
import { ToastProvider, ConfirmProvider } from '@/components/ui';

interface ProvidersProps {
    children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    return (
        <ToastProvider>
            <ConfirmProvider>
                <PermissionProvider>
                    {children}
                </PermissionProvider>
            </ConfirmProvider>
        </ToastProvider>
    );
}

