'use client';

import { ReactNode } from 'react';

import { Header } from './Header';
import { Sidebar } from './Sidebar';

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
        <div className="min-h-screen bg-gray-50">
            {/* Sidebar */}
            <Sidebar userEmail={userEmail} userRole={userRole} />

            {/* Main Content Area */}
            <div className="ml-64 transition-all duration-300">
                {/* Header */}
                <Header
                    userEmail={userEmail}
                    userAvatarUrl={userAvatarUrl}
                    pageTitle={pageTitle}
                    breadcrumbs={breadcrumbs}
                />

                {/* Page Content */}
                <main className="p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}

export default DashboardLayout;
