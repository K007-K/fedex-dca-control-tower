'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRegion } from '@/lib/context/RegionContext';
import { MLInsightsPanel } from '@/components/ml';
import { SLABreachAlerts } from '@/components/sla';
import { GovernanceModeIndicator, GovernanceBadge } from '@/components/ui/GovernanceModeIndicator';
import { DemoPageMessage } from '@/components/demo/DemoModeComponents';
import { type UserRole, isGovernanceRole } from '@/lib/auth/rbac';

interface DashboardMetrics {
    totalCases: number;
    activeDCAs: number;
    recoveryRate: number;
    slaCompliance: number;
    pendingCases: number;
    totalRecovered: number;
    totalOutstanding: number;
    trends: {
        casesTrend: number;
        dcasTrend: number;
        recoveryTrend: number;
        slaTrend: number;
    };
}

interface RecentCase {
    id: string;
    case_number: string;
    customer_name: string;
    outstanding_amount: number;
    status: string;
    priority: string;
    created_at: string;
    currency?: string;
}

interface DashboardData {
    metrics: DashboardMetrics;
    recentCases: RecentCase[];
    currency: 'USD' | 'INR';
}

interface DashboardClientProps {
    userRole?: UserRole;
}

export function DashboardClient({ userRole = 'FEDEX_VIEWER' }: DashboardClientProps) {
    const { region } = useRegion();
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const isGovernance = isGovernanceRole(userRole);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const regionParam = region !== 'ALL' ? `?region=${region}` : '';
            const response = await fetch(`/api/dashboard${regionParam}`);
            if (response.ok) {
                const result = await response.json();
                setData(result);
            }
        } catch (e) {
            console.error('Dashboard fetch error:', e);
        } finally {
            setIsLoading(false);
        }
    }, [region]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const currencySymbol = data?.currency === 'INR' ? '₹' : '$';
    const metrics = data?.metrics ?? {
        totalCases: 0,
        activeDCAs: 0,
        recoveryRate: 0,
        slaCompliance: 0,
        pendingCases: 0,
        totalRecovered: 0,
        totalOutstanding: 0,
        trends: { casesTrend: 0, dcasTrend: 0, recoveryTrend: 0, slaTrend: 0 },
    };
    const recentCases = data?.recentCases ?? [];

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse">
                    <div className="h-32 bg-gray-200 dark:bg-[#1a1a1a] rounded-2xl mb-6" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-32 bg-gray-200 dark:bg-[#1a1a1a] rounded-xl" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Demo Mode Message */}
            <DemoPageMessage
                step={2}
                message="This view is for oversight, not execution. Metrics are SYSTEM-generated."
            />

            {/* Governance Mode Indicator - for SUPER_ADMIN */}
            <GovernanceModeIndicator role={userRole} />

            {/* SLA Breach Alerts */}
            <SLABreachAlerts />

            {/* AI/ML Insights */}
            <MLInsightsPanel />

            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-primary via-primary-600 to-accent dark:from-[#111] dark:via-[#111] dark:to-[#111] rounded-2xl p-6 text-white shadow-lg dark:border dark:border-[#222]">
                <h2 className="text-2xl font-bold mb-2">
                    Welcome to FedEx DCA Control Tower
                </h2>
                <p className="text-white/80 dark:text-gray-400">
                    Monitor debt collection performance, track SLA compliance, and manage DCA relationships.
                    {region !== 'ALL' && (
                        <span className="ml-2 px-2 py-0.5 bg-white/20 rounded text-sm">
                            {region === 'INDIA' ? '🇮🇳 India' : region === 'AMERICA' ? '🇺🇸 America' : region}
                        </span>
                    )}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    icon={<CasesIcon />}
                    value={metrics.totalCases.toString()}
                    title="Total Cases"
                    subtitle="Active debt cases"
                    trend={metrics.trends.casesTrend !== 0
                        ? `${metrics.trends.casesTrend > 0 ? '+' : ''}${metrics.trends.casesTrend}% from last month`
                        : 'No change'}
                    trendUp={metrics.trends.casesTrend > 0 ? true : metrics.trends.casesTrend < 0 ? false : null}
                />
                <MetricCard
                    icon={<BuildingIcon />}
                    value={metrics.activeDCAs.toString()}
                    title="Active DCAs"
                    subtitle="Collection agencies"
                    trend={`${metrics.activeDCAs} in region`}
                    trendUp={null}
                />
                <MetricCard
                    icon={<ChartIcon />}
                    value={`${metrics.recoveryRate.toFixed(1)}%`}
                    title="Recovery Rate"
                    subtitle="Average across all DCAs"
                    trend={metrics.trends.recoveryTrend !== 0
                        ? `${metrics.trends.recoveryTrend > 0 ? '+' : ''}${metrics.trends.recoveryTrend}% from last quarter`
                        : 'Stable'}
                    trendUp={metrics.trends.recoveryTrend > 0 ? true : metrics.trends.recoveryTrend < 0 ? false : null}
                />
                <MetricCard
                    icon={<CheckIcon />}
                    value={`${metrics.slaCompliance.toFixed(1)}%`}
                    title="SLA Compliance"
                    subtitle="SYSTEM-enforced monitoring"
                    trend={metrics.slaCompliance >= 90 ? 'Above 90% target' : `${(90 - metrics.slaCompliance).toFixed(1)}% below target`}
                    trendUp={metrics.slaCompliance >= 90}
                />
            </div>

            {/* SYSTEM Automation Notice */}
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    SLA enforcement is automated by SYSTEM — Allocation and breach detection run continuously
                </span>
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SecondaryStatCard
                    title="Pending Cases"
                    value={metrics.pendingCases.toString()}
                    icon={<HourglassIcon />}
                />
                <SecondaryStatCard
                    title="Total Recovered"
                    value={`${currencySymbol}${metrics.totalRecovered.toLocaleString()}`}
                    valueColor="text-green-400"
                    icon={<DollarIcon />}
                />
                <SecondaryStatCard
                    title="Outstanding Amount"
                    value={`${currencySymbol}${metrics.totalOutstanding.toLocaleString()}`}
                    icon={<BarChartIcon />}
                />
            </div>

            {/* Recent Cases Table */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-[#222] flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Cases</h3>
                    <a href="/cases" className="text-sm text-primary font-medium hover:underline">
                        View all →
                    </a>
                </div>
                <div className="overflow-x-auto">
                    {recentCases.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                            No cases found for this region. Try selecting "All Regions" or add new cases.
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-[#0a0a0a]">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider">Case #</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider">Customer</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider">Priority</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-[#222]">
                                {recentCases.map((caseItem) => (
                                    <tr key={caseItem.id} className="hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
                                        <td className="px-6 py-4">
                                            <a href={`/cases/${caseItem.id}`} className="text-sm font-medium text-primary hover:underline">
                                                {caseItem.case_number}
                                            </a>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-200">
                                            {caseItem.customer_name}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-200">
                                            {currencySymbol}{caseItem.outstanding_amount?.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={caseItem.status} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <PriorityBadge priority={caseItem.priority} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <a href="/cases" className="flex flex-col items-center p-4 rounded-lg bg-gray-50 dark:bg-[#1a1a1a] hover:bg-primary/5 dark:hover:bg-[#222] border border-transparent dark:border-[#222] transition-all">
                        <span className="text-2xl mb-2">📁</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">View Cases</span>
                    </a>
                    <a href="/dcas" className="flex flex-col items-center p-4 rounded-lg bg-gray-50 dark:bg-[#1a1a1a] hover:bg-primary/5 dark:hover:bg-[#222] border border-transparent dark:border-[#222] transition-all">
                        <span className="text-2xl mb-2">🏢</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Manage DCAs</span>
                    </a>
                    <a href="/analytics" className="flex flex-col items-center p-4 rounded-lg bg-gray-50 dark:bg-[#1a1a1a] hover:bg-primary/5 dark:hover:bg-[#222] border border-transparent dark:border-[#222] transition-all">
                        <span className="text-2xl mb-2">📊</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Analytics</span>
                    </a>
                    <a href="/settings" className="flex flex-col items-center p-4 rounded-lg bg-gray-50 dark:bg-[#1a1a1a] hover:bg-primary/5 dark:hover:bg-[#222] border border-transparent dark:border-[#222] transition-all">
                        <span className="text-2xl mb-2">⚙️</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Settings</span>
                    </a>
                </div>
            </div>
        </div>
    );
}

// Component helpers
function MetricCard({ icon, value, title, subtitle, trend, trendUp, isSystemGenerated = true }: {
    icon: React.ReactNode;
    value: string;
    title: string;
    subtitle: string;
    trend: string;
    trendUp: boolean | null;
    isSystemGenerated?: boolean;
}) {
    return (
        <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-5">
            <div className="flex items-center justify-between mb-6">
                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center">
                    {icon}
                </div>
                {trend && (
                    <span className={`text-xs font-medium px-3 py-1 rounded-full border ${trendUp === true
                        ? 'bg-green-500/10 text-green-400 border-green-500/30'
                        : trendUp === false
                            ? 'bg-red-500/10 text-red-400 border-red-500/30'
                            : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 border-gray-300 dark:border-[#333]'
                        }`}>
                        {trend}
                    </span>
                )}
            </div>
            <h3 className="text-4xl font-bold text-gray-900 dark:text-white mb-1">{value}</h3>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500">{subtitle}</p>
            {isSystemGenerated && (
                <div className="mt-3 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    <span className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500 font-medium">System-Generated</span>
                </div>
            )}
        </div>
    );
}

function SecondaryStatCard({ title, value, icon, valueColor = 'text-gray-900 dark:text-white' }: {
    title: string;
    value: string;
    icon: React.ReactNode;
    valueColor?: string;
}) {
    return (
        <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-5">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{title}</p>
                    <p className={`text-3xl font-bold ${valueColor}`}>{value}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center">
                    {icon}
                </div>
            </div>
        </div>
    );
}

// Icons
function CasesIcon() {
    return (
        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    );
}

function BuildingIcon() {
    return (
        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
    );
}

function ChartIcon() {
    return (
        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
    );
}

function CheckIcon() {
    return (
        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}

function HourglassIcon() {
    return (
        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}

function DollarIcon() {
    return (
        <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}

function BarChartIcon() {
    return (
        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
    );
}

function StatusBadge({ status }: { status: string }) {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
        PENDING_ALLOCATION: { bg: 'bg-yellow-500/20 border-yellow-500/30', text: 'text-yellow-400', label: 'Pending' },
        ALLOCATED: { bg: 'bg-blue-500/20 border-blue-500/30', text: 'text-blue-400', label: 'Allocated' },
        IN_PROGRESS: { bg: 'bg-purple-500/20 border-purple-500/30', text: 'text-purple-400', label: 'In Progress' },
        CUSTOMER_CONTACTED: { bg: 'bg-indigo-500/20 border-indigo-500/30', text: 'text-indigo-400', label: 'Contacted' },
        PAYMENT_PROMISED: { bg: 'bg-cyan-500/20 border-cyan-500/30', text: 'text-cyan-400', label: 'Payment Promised' },
        PARTIAL_RECOVERY: { bg: 'bg-orange-500/20 border-orange-500/30', text: 'text-orange-400', label: 'Partial' },
        FULL_RECOVERY: { bg: 'bg-green-500/20 border-green-500/30', text: 'text-green-400', label: 'Recovered' },
        DISPUTED: { bg: 'bg-red-500/20 border-red-500/30', text: 'text-red-400', label: 'Disputed' },
        ESCALATED: { bg: 'bg-red-500/20 border-red-500/30', text: 'text-red-400', label: 'Escalated' },
        CLOSED: { bg: 'bg-gray-500/20 border-gray-500/30', text: 'text-gray-400', label: 'Closed' },
    };
    const config = statusConfig[status] ?? { bg: 'bg-gray-500/20 border-gray-500/30', text: 'text-gray-400', label: status };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text}`}>
            {config.label}
        </span>
    );
}

function PriorityBadge({ priority }: { priority: string }) {
    const priorityConfig: Record<string, { color: string; dot: string }> = {
        CRITICAL: { color: 'text-red-400', dot: 'bg-red-400' },
        HIGH: { color: 'text-orange-400', dot: 'bg-orange-400' },
        MEDIUM: { color: 'text-yellow-400', dot: 'bg-yellow-400' },
        LOW: { color: 'text-green-400', dot: 'bg-green-400' },
    };
    const config = priorityConfig[priority] ?? { color: 'text-gray-400', dot: 'bg-gray-400' };
    return (
        <span className={`inline-flex items-center text-xs font-medium ${config.color}`}>
            <span className={`w-2 h-2 rounded-full ${config.dot} mr-2`}></span>
            {priority}
        </span>
    );
}
