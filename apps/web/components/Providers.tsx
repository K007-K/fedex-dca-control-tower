'use client';

import { ReactNode } from 'react';
import { ToastProvider, ConfirmProvider } from '@/components/ui';

interface ProvidersProps {
    children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    return (
        <ToastProvider>
            <ConfirmProvider>
                {children}
            </ConfirmProvider>
        </ToastProvider>
    );
}
