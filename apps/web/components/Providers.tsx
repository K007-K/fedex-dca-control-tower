'use client';

import { ReactNode } from 'react';
import { ToastProvider, ConfirmProvider } from '@/components/ui';
import { PermissionProvider } from '@/components/auth/PermissionGate';

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

