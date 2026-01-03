'use client';

import { ReactNode } from 'react';

import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { DemoModeProvider } from '@/lib/context/DemoModeContext';
import { DemoStepIndicator } from '@/components/demo/DemoModeComponents';

interface DashboardLayoutProps {
    children: ReactNode;
    userEmail?: string;
    userAvatarUrl?: string;
    userRole?: string;
    pageTitle?: string;
    breadcrumbs?: { name: string; href: string }[];
}

export function DashboardLayout({
    children,
    userEmail,
    userAvatarUrl,
    userRole,
    pageTitle,
    breadcrumbs,
}: DashboardLayoutProps) {
    return (
        <DemoModeProvider>
            <div className="min-h-screen bg-gray-50 dark:bg-black">
                {/* Sidebar */}
                <Sidebar userEmail={userEmail} userRole={userRole} />

                {/* Main Content Area */}
                <div className="ml-64 transition-all duration-300">
                    {/* Header */}
                    <Header
                        userEmail={userEmail}
                        userAvatarUrl={userAvatarUrl}
                        userRole={userRole}
                        pageTitle={pageTitle}
                        breadcrumbs={breadcrumbs}
                    />

                    {/* Page Content */}
                    <main className="p-6">
                        {children}
                    </main>
                </div>

                {/* Demo Step Indicator */}
                <DemoStepIndicator />
            </div>
        </DemoModeProvider>
    );
}

export default DashboardLayout;
