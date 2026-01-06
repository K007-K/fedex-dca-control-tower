'use client';

import { ReactNode, useState } from 'react';

import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { DemoModeProvider } from '@/lib/context/DemoModeContext';
import { DemoStepIndicator } from '@/components/demo/DemoModeComponents';
import { AgentDemoProvider } from '@/lib/context/AgentDemoContext';
import { AgentDemoStepIndicator } from '@/components/demo/AgentDemoComponents';
import { ManagerDemoProvider } from '@/lib/context/ManagerDemoContext';
import { ManagerDemoStepIndicator } from '@/components/demo/ManagerDemoComponents';

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
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const isAgent = userRole === 'DCA_AGENT';
    const isManager = userRole === 'DCA_MANAGER';

    // Use different demo provider based on role
    const DemoProvider = isAgent
        ? AgentDemoProvider
        : isManager
            ? ManagerDemoProvider
            : DemoModeProvider;
    const StepIndicator = isAgent
        ? AgentDemoStepIndicator
        : isManager
            ? ManagerDemoStepIndicator
            : DemoStepIndicator;

    return (
        <DemoProvider>
            <div className="min-h-screen bg-gray-50 dark:bg-black">
                {/* Sidebar */}
                <Sidebar
                    userEmail={userEmail}
                    userRole={userRole}
                    collapsed={sidebarCollapsed}
                    onCollapsedChange={setSidebarCollapsed}
                />

                {/* Main Content Area - dynamically adjusts based on sidebar state */}
                <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
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
