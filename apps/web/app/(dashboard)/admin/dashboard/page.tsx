'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

/**
 * DCA_ADMIN Dashboard Page
 * 
 * PURPOSE: DCA-level performance snapshot
 * SCOPE: Only own DCA data
 * 
 * Per MASTER UI SPEC:
 * - Total active cases
 * - SLA compliance rate
 * - Overdue/at-risk cases
 * - Team size
 * - Escalations received
 */

interface DashboardData {
    totalCases: number;
    activeCases: number;
    slaComplianceRate: number;
    overdueCases: number;
    atRiskCases: number;
    teamSize: { managers: number; agents: number };
    escalationsReceived: number;
    recentEscalations: Array<{
        id: string;
        case_number: string;
        from_user: string;
        reason: string;
        created_at: string;
    }>;
    dcaName: string;
}

export default function AdminDashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            const response = await fetch('/api/admin/dashboard');
            if (response.ok) {
                const result = await response.json();
                setData(result);
            } else if (response.status === 403) {
                setError('Access denied. This page is for DCA Admins only.');
            } else {
                setError('Failed to load dashboard data');
            }
        } catch (e) {
            console.error('Admin dashboard fetch error:', e);
            setError('Failed to connect to server');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse">
                    <div className="h-8 w-48 bg-gray-200 dark:bg-[#1a1a1a] rounded mb-6" />
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-28 bg-gray-200 dark:bg-[#1a1a1a] rounded-xl" />
                        ))}
                    </div>
                    <div className="h-64 bg-gray-200 dark:bg-[#1a1a1a] rounded-xl" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="text-4xl mb-4">🚫</div>
                    <p className="text-gray-600 dark:text-gray-400">{error}</p>
                </div>
            </div>
        );
    }

    const stats = data || {
        totalCases: 0,
        activeCases: 0,
        slaComplianceRate: 0,
        overdueCases: 0,
        atRiskCases: 0,
        teamSize: { managers: 0, agents: 0 },
        escalationsReceived: 0,
        recentEscalations: [],
        dcaName: 'Your DCA',
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
                <p className="text-gray-500 dark:text-gray-400">{stats.dcaName} — Performance overview</p>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    icon="📊"
                    value={stats.activeCases}
                    label="Active Cases"
                    sublabel={`${stats.totalCases} total`}
                    color="blue"
                />
                <MetricCard
                    icon="✅"
                    value={`${stats.slaComplianceRate}%`}
                    label="SLA Compliance"
                    sublabel="Current rate"
                    color="green"
                />
                <MetricCard
                    icon="⚠️"
                    value={stats.overdueCases + stats.atRiskCases}
                    label="At Risk / Overdue"
                    sublabel={`${stats.atRiskCases} at risk, ${stats.overdueCases} overdue`}
                    color={stats.overdueCases > 0 ? 'red' : 'yellow'}
                />
                <MetricCard
                    icon="👥"
                    value={stats.teamSize.managers + stats.teamSize.agents}
                    label="Team Size"
                    sublabel={`${stats.teamSize.managers} managers, ${stats.teamSize.agents} agents`}
                    color="purple"
                />
            </div>

            {/* Second Row - Escalations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Escalations Card */}
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 dark:border-[#222] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">🔔</span>
                            <h3 className="font-semibold text-gray-900 dark:text-white">Escalations</h3>
                            {stats.escalationsReceived > 0 && (
                                <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium rounded-full">
                                    {stats.escalationsReceived} pending
                                </span>
                            )}
                        </div>
                        <Link href="/admin/cases?filter=escalated" className="text-sm text-primary hover:underline">
                            View All →
                        </Link>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-[#222]">
                        {stats.recentEscalations.length === 0 ? (
                            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                                <div className="text-2xl mb-2">✅</div>
                                <p className="text-sm">No pending escalations</p>
                            </div>
                        ) : (
                            stats.recentEscalations.slice(0, 4).map((esc) => (
                                <Link
                                    key={esc.id}
                                    href={`/admin/cases/${esc.id}`}
                                    className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
                                >
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{esc.case_number}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">From {esc.from_user}</p>
                                    </div>
                                    <span className="text-xs text-gray-400">{esc.reason}</span>
                                </Link>
                            ))
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-5">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <span>⚡</span> Quick Actions
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <Link
                            href="/admin/cases"
                            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#1a1a1a] rounded-lg hover:bg-gray-100 dark:hover:bg-[#222] transition-colors"
                        >
                            <span className="text-xl">📁</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">View Cases</span>
                        </Link>
                        <Link
                            href="/admin/team"
                            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#1a1a1a] rounded-lg hover:bg-gray-100 dark:hover:bg-[#222] transition-colors"
                        >
                            <span className="text-xl">👥</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">Manage Team</span>
                        </Link>
                        <Link
                            href="/admin/notifications"
                            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#1a1a1a] rounded-lg hover:bg-gray-100 dark:hover:bg-[#222] transition-colors"
                        >
                            <span className="text-xl">🔔</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">Notifications</span>
                        </Link>
                        <Link
                            href="/admin/settings/users"
                            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#1a1a1a] rounded-lg hover:bg-gray-100 dark:hover:bg-[#222] transition-colors"
                        >
                            <span className="text-xl">➕</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">Add User</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Metric Card Component
function MetricCard({ icon, value, label, sublabel, color }: {
    icon: string;
    value: number | string;
    label: string;
    sublabel: string;
    color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}) {
    const colorClasses = {
        blue: 'bg-blue-500/10 border-blue-500/20',
        green: 'bg-green-500/10 border-green-500/20',
        yellow: 'bg-yellow-500/10 border-yellow-500/20',
        red: 'bg-red-500/10 border-red-500/20',
        purple: 'bg-purple-500/10 border-purple-500/20',
    };

    return (
        <div className={`rounded-xl border p-5 ${colorClasses[color]}`}>
            <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{icon}</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{value}</h3>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500">{sublabel}</p>
        </div>
    );
}
