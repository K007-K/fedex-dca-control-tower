'use client';

import { useEffect, useState } from 'react';

/**
 * Agent Stats Page
 * 
 * PURPOSE: Show agent's performance metrics and case history for auto-assignment reference
 * SCOPE: Personal stats only - lifetime performance data
 */

interface AgentStats {
    totalCasesHandled: number;
    activeCases: number;
    fullRecoveryCount: number;
    partialRecoveryCount: number;
    totalAmountRecovered: number;
    totalAmountAssigned: number;
    recoveryRate: number;
    avgResolutionDays: number;
    currency: string;
    currentStreak: number;
    bestMonth: {
        month: string;
        count: number;
        amount: number;
    } | null;
}

export default function AgentStatsPage() {
    const [stats, setStats] = useState<AgentStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch('/api/agent/stats');
                if (response.ok) {
                    const data = await response.json();
                    setStats(data);
                } else if (response.status === 403) {
                    setError('Access denied. This page is for DCA Agents only.');
                } else {
                    setError('Failed to load stats');
                }
            } catch (e) {
                console.error('Stats fetch error:', e);
                setError('Failed to connect to server');
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, []);

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

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="h-8 w-32 bg-gray-200 dark:bg-[#1a1a1a] rounded animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6 h-32 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    const currencySymbol = stats?.currency === 'USD' ? '$' : '₹';

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Performance</h1>
                <p className="text-gray-500 dark:text-gray-400">Your lifetime recovery metrics and achievements</p>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Cases Handled */}
                <StatCard
                    icon="📋"
                    label="Cases Handled"
                    value={stats?.totalCasesHandled ?? 0}
                    subtext="Lifetime total"
                />

                {/* Currently Active */}
                <StatCard
                    icon="⏳"
                    label="Active Cases"
                    value={stats?.activeCases ?? 0}
                    subtext="Currently assigned"
                    color="blue"
                />

                {/* Full Recoveries */}
                <StatCard
                    icon="✅"
                    label="Full Recoveries"
                    value={stats?.fullRecoveryCount ?? 0}
                    subtext="100% recovered"
                    color="green"
                />

                {/* Partial Recoveries */}
                <StatCard
                    icon="📊"
                    label="Partial Recoveries"
                    value={stats?.partialRecoveryCount ?? 0}
                    subtext="Partial payment"
                    color="orange"
                />
            </div>

            {/* Financial Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total Recovered */}
                <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 dark:from-green-500/20 dark:to-green-600/10 rounded-xl border border-green-500/20 p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">💰</span>
                        <span className="text-sm font-medium text-green-700 dark:text-green-300">Total Recovered</span>
                    </div>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {currencySymbol}{(stats?.totalAmountRecovered ?? 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-green-600/70 dark:text-green-400/70 mt-1">
                        From {(stats?.fullRecoveryCount ?? 0) + (stats?.partialRecoveryCount ?? 0)} successful cases
                    </p>
                </div>

                {/* Recovery Rate */}
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">📈</span>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Recovery Rate</span>
                    </div>
                    <div className="flex items-end gap-2">
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">
                            {(stats?.recoveryRate ?? 0).toFixed(1)}%
                        </p>
                        <RecoveryRateBadge rate={stats?.recoveryRate ?? 0} />
                    </div>
                    <div className="mt-3 h-2 bg-gray-200 dark:bg-[#222] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-primary to-green-500 rounded-full transition-all"
                            style={{ width: `${Math.min(stats?.recoveryRate ?? 0, 100)}%` }}
                        />
                    </div>
                </div>

                {/* Avg Resolution Time */}
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">⏱️</span>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Resolution</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {(stats?.avgResolutionDays ?? 0).toFixed(0)} <span className="text-lg font-normal text-gray-500">days</span>
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Average time to close a case
                    </p>
                </div>
            </div>

            {/* Achievements / Milestones */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Achievements</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <AchievementCard
                        icon="🎯"
                        title="Cases Milestone"
                        description={`Handled ${stats?.totalCasesHandled ?? 0} cases`}
                        unlocked={(stats?.totalCasesHandled ?? 0) >= 10}
                    />
                    <AchievementCard
                        icon="💎"
                        title="High Recovery"
                        description="75%+ recovery rate"
                        unlocked={(stats?.recoveryRate ?? 0) >= 75}
                    />
                    <AchievementCard
                        icon="🚀"
                        title="Speed Demon"
                        description="Avg resolution under 30 days"
                        unlocked={(stats?.avgResolutionDays ?? Infinity) < 30}
                    />
                </div>
            </div>

            {/* Note about auto-assignment */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-4">
                <div className="flex items-start gap-3">
                    <span className="text-xl">💡</span>
                    <div>
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            How Your Stats Impact Case Assignment
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                            Your performance metrics are used to optimize case allocation. Higher recovery rates and
                            faster resolution times may result in more case assignments matching your expertise.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({
    icon,
    label,
    value,
    subtext,
    color = 'default'
}: {
    icon: string;
    label: string;
    value: number;
    subtext: string;
    color?: 'default' | 'green' | 'blue' | 'orange';
}) {
    const colors = {
        default: 'text-gray-900 dark:text-white',
        green: 'text-green-600 dark:text-green-400',
        blue: 'text-blue-600 dark:text-blue-400',
        orange: 'text-orange-600 dark:text-orange-400',
    };

    return (
        <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
            <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{icon}</span>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</span>
            </div>
            <p className={`text-3xl font-bold ${colors[color]}`}>{value.toLocaleString()}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtext}</p>
        </div>
    );
}

function RecoveryRateBadge({ rate }: { rate: number }) {
    if (rate >= 80) {
        return <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">Excellent</span>;
    }
    if (rate >= 60) {
        return <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">Good</span>;
    }
    if (rate >= 40) {
        return <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full">Average</span>;
    }
    return <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 rounded-full">Building</span>;
}

function AchievementCard({
    icon,
    title,
    description,
    unlocked
}: {
    icon: string;
    title: string;
    description: string;
    unlocked: boolean;
}) {
    return (
        <div className={`rounded-lg p-4 border ${unlocked
                ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800'
                : 'bg-gray-50 dark:bg-[#0a0a0a] border-gray-200 dark:border-[#222] opacity-50'
            }`}>
            <div className="flex items-center gap-3">
                <span className={`text-2xl ${unlocked ? '' : 'grayscale'}`}>{icon}</span>
                <div>
                    <p className={`text-sm font-medium ${unlocked ? 'text-amber-700 dark:text-amber-300' : 'text-gray-500 dark:text-gray-400'}`}>
                        {title}
                    </p>
                    <p className={`text-xs ${unlocked ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-gray-500'}`}>
                        {description}
                    </p>
                </div>
                {unlocked && <span className="ml-auto text-amber-500">🏆</span>}
            </div>
        </div>
    );
}
