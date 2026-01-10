'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useMemo } from 'react';
import { DemoModeToggle } from '@/components/demo/DemoModeComponents';
import { AgentDemoModeToggle } from '@/components/demo/AgentDemoComponents';
import { ManagerDemoModeToggle } from '@/components/demo/ManagerDemoComponents';
import type { UserRole } from '@/lib/auth/rbac';

// Standard navigation items for non-agent roles
const standardNavigationConfig = [
    { name: 'Overview', href: '/overview', icon: OverviewIcon, roles: 'all' },
    { name: 'Dashboard', href: '/dashboard', icon: DashboardIcon, roles: 'all' },
    { name: 'Cases', href: '/cases', icon: CasesIcon, roles: 'all' },
    { name: 'DCAs', href: '/dcas', icon: DCAsIcon, roles: ['SUPER_ADMIN', 'FEDEX_ADMIN', 'FEDEX_MANAGER', 'FEDEX_ANALYST', 'FEDEX_AUDITOR', 'FEDEX_VIEWER', 'DCA_ADMIN', 'AUDITOR', 'READONLY'] },
    { name: 'SLA', href: '/sla', icon: SLAIcon, roles: ['SUPER_ADMIN', 'FEDEX_ADMIN', 'FEDEX_MANAGER', 'FEDEX_ANALYST', 'FEDEX_AUDITOR', 'FEDEX_VIEWER', 'DCA_ADMIN', 'AUDITOR', 'READONLY'] },
    { name: 'Analytics', href: '/analytics', icon: AnalyticsIcon, roles: ['SUPER_ADMIN', 'FEDEX_ADMIN', 'FEDEX_MANAGER', 'FEDEX_ANALYST', 'FEDEX_AUDITOR', 'DCA_ADMIN'] },
    { name: 'Reports', href: '/reports', icon: ReportsIcon, roles: ['SUPER_ADMIN', 'FEDEX_ADMIN', 'FEDEX_MANAGER', 'FEDEX_ANALYST'] },
    { name: 'Notifications', href: '/notifications', icon: NotificationsIcon, roles: 'all' },
    { name: 'Settings', href: '/settings', icon: SettingsIcon, roles: 'all' },
] as const;

// DCA_AGENT specific navigation - task-focused workbench
// Per MASTER UI SPEC v1.0: My Dashboard, My Cases, Notifications, Profile/Security
// Extended with Case History and My Stats for performance tracking
const agentNavigationConfig = [
    { name: 'Overview', href: '/agent/overview', icon: OverviewIcon },
    { name: 'My Dashboard', href: '/agent/dashboard', icon: DashboardIcon },
    { name: 'My Cases', href: '/agent/cases', icon: CasesIcon },
    { name: 'Case History', href: '/agent/history', icon: HistoryIcon },
    { name: 'My Stats', href: '/agent/stats', icon: StatsIcon },
    { name: 'Notifications', href: '/agent/notifications', icon: NotificationsIcon },
];

// DCA_MANAGER specific navigation - supervisory workbench
// Per MASTER UI SPEC v1.0: Dashboard, Cases, Team, Notifications, Profile/Security
const managerNavigationConfig = [
    { name: 'Overview', href: '/manager/overview', icon: OverviewIcon },
    { name: 'Dashboard', href: '/manager/dashboard', icon: DashboardIcon },
    { name: 'Team Cases', href: '/manager/cases', icon: CasesIcon },
    { name: 'My Team', href: '/manager/team', icon: TeamIcon },
    { name: 'Notifications', href: '/manager/notifications', icon: NotificationsIcon },
];

// Per spec: Only Profile and Security for agents
const agentSettingsConfig = [
    { name: 'Profile', href: '/settings/profile', icon: ProfileIcon },
    { name: 'Preferences', href: '/settings/notifications', icon: PreferencesIcon },
    { name: 'Security', href: '/settings/security', icon: SecurityIcon },
];

// Manager settings - includes Users and Deletion Requests
const managerSettingsConfig = [
    { name: 'Profile', href: '/settings/profile', icon: ProfileIcon },
    { name: 'Users', href: '/settings/users', icon: TeamIcon },
    { name: 'Preferences', href: '/settings/notifications', icon: PreferencesIcon },
    { name: 'Security', href: '/settings/security', icon: SecurityIcon },
    { name: 'Deletion Requests', href: '/manager/deletion-requests', icon: SecurityIcon },
];

// DCA_ADMIN specific navigation - vendor owner workbench
// Per MASTER UI SPEC: Overview, Dashboard, Cases, Team, Notifications, Settings
const adminNavigationConfig = [
    { name: 'Overview', href: '/admin/overview', icon: OverviewIcon },
    { name: 'Dashboard', href: '/admin/dashboard', icon: DashboardIcon },
    { name: 'Cases', href: '/admin/cases', icon: CasesIcon },
    { name: 'Team', href: '/admin/team', icon: TeamIcon },
    { name: 'Notifications', href: '/admin/notifications', icon: NotificationsIcon },
];

// DCA_ADMIN settings - includes Users management
const adminSettingsConfig = [
    { name: 'Profile', href: '/settings/profile', icon: ProfileIcon },
    { name: 'Users', href: '/settings/users', icon: TeamIcon },  // Uses existing users page with AccessGuard
    { name: 'Preferences', href: '/settings/notifications', icon: PreferencesIcon },
    { name: 'Security', href: '/settings/security', icon: SecurityIcon },
];

interface SidebarProps {
    userEmail?: string;
    userRole?: string;
    collapsed?: boolean;
    onCollapsedChange?: (collapsed: boolean) => void;
}

export function Sidebar({
    userEmail,
    userRole = 'READONLY',
    collapsed: controlledCollapsed,
    onCollapsedChange
}: SidebarProps) {
    const pathname = usePathname();
    const [internalCollapsed, setInternalCollapsed] = useState(false);

    // Use controlled or internal state
    const collapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
    const setCollapsed = (value: boolean) => {
        if (onCollapsedChange) {
            onCollapsedChange(value);
        } else {
            setInternalCollapsed(value);
        }
    };

    const isAgent = userRole === 'DCA_AGENT';
    const isManager = userRole === 'DCA_MANAGER';
    const isAdmin = userRole === 'DCA_ADMIN';

    // Filter navigation based on user role
    const navigation = useMemo(() => {
        if (isAgent) {
            return agentNavigationConfig;
        }
        if (isManager) {
            return managerNavigationConfig;
        }
        if (isAdmin) {
            return adminNavigationConfig;
        }
        return standardNavigationConfig.filter(item => {
            if (item.roles === 'all') return true;
            return (item.roles as readonly string[]).includes(userRole);
        });
    }, [userRole, isAgent, isManager, isAdmin]);

    return (
        <aside
            className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-white dark:bg-black border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'
                }`}
        >
            {/* Logo */}
            <div className="flex h-16 items-center justify-between px-4 border-b border-gray-100 dark:border-gray-800">
                <Link href="/dashboard" className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-dark">
                        <span className="text-xl font-bold text-white">F</span>
                    </div>
                    {!collapsed && (
                        <div className="animate-fade-in">
                            <h1 className="text-sm font-bold text-gray-900 dark:text-white">DCA Control Tower</h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400">FedEx Collections</p>
                        </div>
                    )}
                </Link>
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    <ChevronIcon className={`w-5 h-5 text-gray-400 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {/* Navigation */}
            <nav className={`flex-1 overflow-y-auto ${collapsed ? 'p-2' : 'p-4'}`}>
                <ul className="space-y-1">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                        return (
                            <li key={item.name}>
                                <Link
                                    href={item.href}
                                    className={`flex items-center rounded-lg font-medium transition-all duration-200 group ${collapsed
                                        ? 'justify-center p-2.5'
                                        : 'gap-3 px-3 py-2.5'
                                        } ${isActive
                                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                    title={collapsed ? item.name : undefined}
                                >
                                    <item.icon
                                        className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white'
                                            }`}
                                    />
                                    {!collapsed && (
                                        <span className="animate-fade-in truncate">{item.name}</span>
                                    )}
                                </Link>
                            </li>
                        );
                    })}
                </ul>

                {/* Agent Settings Section - Only for DCA_AGENT */}
                {isAgent && (
                    <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                        {!collapsed && (
                            <p className="px-3 mb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                Settings
                            </p>
                        )}
                        <ul className="space-y-1">
                            {agentSettingsConfig.map((item) => {
                                const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                                return (
                                    <li key={item.name}>
                                        <Link
                                            href={item.href}
                                            className={`flex items-center rounded-lg font-medium transition-all duration-200 group ${collapsed
                                                ? 'justify-center p-2.5'
                                                : 'gap-3 px-3 py-2.5'
                                                } ${isActive
                                                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white'
                                                }`}
                                            title={collapsed ? item.name : undefined}
                                        >
                                            <item.icon
                                                className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white'
                                                    }`}
                                            />
                                            {!collapsed && (
                                                <span className="animate-fade-in truncate">{item.name}</span>
                                            )}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}

                {/* Manager Settings Section - Only for DCA_MANAGER */}
                {isManager && (
                    <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                        {!collapsed && (
                            <p className="px-3 mb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                Settings
                            </p>
                        )}
                        <ul className="space-y-1">
                            {managerSettingsConfig.map((item) => {
                                const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                                return (
                                    <li key={item.name}>
                                        <Link
                                            href={item.href}
                                            className={`flex items-center rounded-lg font-medium transition-all duration-200 group ${collapsed
                                                ? 'justify-center p-2.5'
                                                : 'gap-3 px-3 py-2.5'
                                                } ${isActive
                                                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white'
                                                }`}
                                            title={collapsed ? item.name : undefined}
                                        >
                                            <item.icon
                                                className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white'
                                                    }`}
                                            />
                                            {!collapsed && (
                                                <span className="animate-fade-in truncate">{item.name}</span>
                                            )}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}

                {/* DCA_ADMIN Settings Section - Only for DCA_ADMIN */}
                {isAdmin && (
                    <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                        {!collapsed && (
                            <p className="px-3 mb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                Settings
                            </p>
                        )}
                        <ul className="space-y-1">
                            {adminSettingsConfig.map((item) => {
                                const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                                return (
                                    <li key={item.name}>
                                        <Link
                                            href={item.href}
                                            className={`flex items-center rounded-lg font-medium transition-all duration-200 group ${collapsed
                                                ? 'justify-center p-2.5'
                                                : 'gap-3 px-3 py-2.5'
                                                } ${isActive
                                                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white'
                                                }`}
                                            title={collapsed ? item.name : undefined}
                                        >
                                            <item.icon
                                                className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white'
                                                    }`}
                                            />
                                            {!collapsed && (
                                                <span className="animate-fade-in truncate">{item.name}</span>
                                            )}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
            </nav>

            {/* Demo Mode Toggle - role-specific */}
            <div className={`px-4 pb-2 ${collapsed ? 'px-2' : ''}`}>
                {!collapsed && (
                    isAgent ? <AgentDemoModeToggle />
                        : isManager ? <ManagerDemoModeToggle />
                            : <DemoModeToggle variant="sidebar" />
                )}
            </div>

            {/* User Info */}
            <div className={`border-t border-gray-100 dark:border-gray-800 p-4 ${collapsed ? 'px-2' : ''}`}>
                <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'}`}>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                        <span className="text-primary font-semibold text-sm">
                            {userEmail?.charAt(0).toUpperCase() ?? 'U'}
                        </span>
                    </div>
                    {!collapsed && (
                        <div className="flex-1 min-w-0 animate-fade-in">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {userEmail ?? 'User'}
                            </p>
                            <p className="text-xs text-primary font-medium">{userRole}</p>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}

// Icons
function OverviewIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}

function DashboardIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
    );
}

function CasesIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    );
}

function DCAsIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
    );
}

function AnalyticsIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
    );
}

function ReportsIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    );
}

function SLAIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}

function NotificationsIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
    );
}

function SettingsIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    );
}

function ChevronIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
    );
}

function CalendarIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    );
}

function HistoryIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}

function StatsIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    );
}

function TeamIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
    );
}

// Agent-specific settings icons
function ProfileIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
    );
}

function PreferencesIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
    );
}

function SecurityIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
    );
}

export default Sidebar;
