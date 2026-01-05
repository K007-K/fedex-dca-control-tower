'use client';

import { ReactNode } from 'react';

import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { DemoModeProvider } from '@/lib/context/DemoModeContext';
import { DemoStepIndicator } from '@/components/demo/DemoModeComponents';
import { AgentDemoProvider } from '@/lib/context/AgentDemoContext';
import { AgentDemoStepIndicator } from '@/components/demo/AgentDemoComponents';

interface DashboardLayoutProps {
    children: ReactNode;
    userEmail?: string;
    userAvatarUrl?: string;
    userRole?: string;         // Raw role for navigation logic (e.g., 'DCA_AGENT')
    userRoleLabel?: string;    // Display label for UI (e.g., 'DCA Agent')
    pageTitle?: string;
    breadcrumbs?: { name: string; href: string }[];
}

export function DashboardLayout({
    children,
    userEmail,
    userAvatarUrl,
    userRole,
    userRoleLabel,
    pageTitle,
    breadcrumbs,
}: DashboardLayoutProps) {
    const isAgent = userRole === 'DCA_AGENT';

    // Use different demo provider based on role
    const DemoProvider = isAgent ? AgentDemoProvider : DemoModeProvider;
    const StepIndicator = isAgent ? AgentDemoStepIndicator : DemoStepIndicator;

    return (
        <DemoProvider>
            <div className="min-h-screen bg-gray-50 dark:bg-black">
                {/* Sidebar */}
                <Sidebar userEmail={userEmail} userRole={userRole} />

                {/* Main Content Area */}
                <div className="ml-64 transition-all duration-300">
                    {/* Header */}
                    <Header
                        userEmail={userEmail}
                        userAvatarUrl={userAvatarUrl}
                        userRole={userRoleLabel || userRole}
                        pageTitle={pageTitle}
                        breadcrumbs={breadcrumbs}
                    />

                    {/* Page Content */}
                    <main className="p-6">
                        {children}
                    </main>
                </div>

                {/* Demo Step Indicator - role-specific */}
                <StepIndicator />
            </div>
        </DemoProvider>
    );
}

export default DashboardLayout;

