'use client';

import { useEffect, useState, useCallback } from 'react';

/**
 * DCA Agent Workbench Dashboard
 * 
 * PURPOSE: Personal execution snapshot for task-focused debt recovery work
 * SCOPE: Only cases assigned to the current agent (assigned_agent_id = current_user)
 * 
 * DESIGN PRINCIPLES:
 * - Simplicity over completeness
 * - Personal scope ONLY (no aggregates beyond agent)
 * - ZERO governance visibility
 * - Every element answers: "What do I need to do next?"
 */

interface AgentWorkload {
    assignedCases: number;
    dueToday: number;
    overdueCases: number;
}

interface SLACase {
    id: string;
    case_number: string;
    customer_name: string;
    outstanding_amount: number;
    sla_due_at: string;
    hours_remaining: number;
    is_breached: boolean;
    currency?: string;
}

interface ActionReminder {
    id: string;
    case_number: string;
    case_id: string;
    action_type: 'contact' | 'update' | 'followup' | 'payment';
    description: string;
}

interface AgentDashboardData {
    workload: AgentWorkload;
    slaDueSoon: SLACase[];
    slaBreached: SLACase[];
    actionReminders: ActionReminder[];
    currency: 'USD' | 'INR';
}

export default function AgentDashboardPage() {
    const [data, setData] = useState<AgentDashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/agent/dashboard');
            if (response.ok) {
                const result = await response.json();
                setData(result);
            } else if (response.status === 403) {
                setError('Access denied. This page is for DCA Agents only.');
            } else {
                setError('Failed to load dashboard data');
            }
        } catch (e) {
            console.error('Agent dashboard fetch error:', e);
            setError('Failed to connect to server');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const currencySymbol = data?.currency === 'INR' ? '₹' : '$';

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse">
                    <div className="h-8 w-48 bg-gray-200 dark:bg-[#1a1a1a] rounded mb-6" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {[1, 2, 3].map(i => (
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

    const workload = data?.workload ?? { assignedCases: 0, dueToday: 0, overdueCases: 0 };
    const slaDueSoon = data?.slaDueSoon ?? [];
    const slaBreached = data?.slaBreached ?? [];
    const actionReminders = data?.actionReminders ?? [];

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Dashboard</h1>
                <p className="text-gray-500 dark:text-gray-400">Your personal workload and pending actions</p>
            </div>

            {/* Section A: Personal Workload Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <WorkloadCard
                    icon={<CasesIcon />}
                    count={workload.assignedCases}
                    title="Assigned Cases"
                    subtitle="Your active cases"
                    color="blue"
                />
                <WorkloadCard
                    icon={<ClockIcon />}
                    count={workload.dueToday}
                    title="Due Today"
                    subtitle="SLA deadlines today"
                    color="yellow"
                />
                <WorkloadCard
                    icon={<AlertIcon />}
                    count={workload.overdueCases}
                    title="Overdue Cases"
                    subtitle="Requires immediate action"
                    color="red"
                />
            </div>

            {/* Section B: SLA Awareness */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* SLA Due Soon */}
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 dark:border-[#222] flex items-center gap-2">
                        <span className="text-lg">⏰</span>
                        <h3 className="font-semibold text-gray-900 dark:text-white">SLA Due Soon</h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400">(Next 24h)</span>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-[#222]">
                        {slaDueSoon.length === 0 ? (
                            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                                <div className="text-2xl mb-2">✅</div>
                                <p className="text-sm">No SLA deadlines in the next 24 hours</p>
                            </div>
                        ) : (
                            slaDueSoon.slice(0, 5).map(sla => (
                                <a
                                    key={sla.id}
                                    href={`/agent/cases/${sla.id}`}
                                    className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
                                >
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{sla.case_number}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{sla.customer_name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {currencySymbol}{sla.outstanding_amount?.toLocaleString()}
                                        </p>
                                        <p className={`text-xs font-medium ${sla.hours_remaining < 4
                                                ? 'text-red-500'
                                                : sla.hours_remaining < 12
                                                    ? 'text-yellow-500'
                                                    : 'text-green-500'
                                            }`}>
                                            Due in {formatTimeRemaining(sla.hours_remaining)}
                                        </p>
                                    </div>
                                </a>
                            ))
                        )}
                    </div>
                </div>

                {/* SLA Breached */}
                <div className="bg-white dark:bg-[#111] rounded-xl border border-red-200 dark:border-red-900/30 overflow-hidden">
                    <div className="px-5 py-4 border-b border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 flex items-center gap-2">
                        <span className="text-lg">🔴</span>
                        <h3 className="font-semibold text-red-700 dark:text-red-400">SLA Breached</h3>
                        <span className="text-xs text-red-500 dark:text-red-400">(Requires Attention)</span>
                    </div>
                    <div className="divide-y divide-red-100 dark:divide-red-900/30">
                        {slaBreached.length === 0 ? (
                            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                                <div className="text-2xl mb-2">👍</div>
                                <p className="text-sm">No breached SLAs - great work!</p>
                            </div>
                        ) : (
                            slaBreached.slice(0, 5).map(sla => (
                                <a
                                    key={sla.id}
                                    href={`/agent/cases/${sla.id}`}
                                    className="flex items-center justify-between px-5 py-3 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                                >
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{sla.case_number}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{sla.customer_name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {currencySymbol}{sla.outstanding_amount?.toLocaleString()}
                                        </p>
                                        <p className="text-xs font-medium text-red-500">
                                            Breached {formatTimeAgo(sla.hours_remaining)}
                                        </p>
                                    </div>
                                </a>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Section C: Action Reminders */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-[#222] flex items-center gap-2">
                    <span className="text-lg">📋</span>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Action Reminders</h3>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-[#222]">
                    {actionReminders.length === 0 ? (
                        <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                            <div className="text-2xl mb-2">📭</div>
                            <p className="text-sm">No pending actions - all caught up!</p>
                        </div>
                    ) : (
                        actionReminders.slice(0, 8).map(reminder => (
                            <a
                                key={reminder.id}
                                href={`/agent/cases/${reminder.case_id}`}
                                className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
                            >
                                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center text-lg">
                                    {getActionIcon(reminder.action_type)}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-900 dark:text-white">{reminder.description}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{reminder.case_number}</p>
                                </div>
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </a>
                        ))
                    )}
                </div>
            </div>

            {/* Quick Link to Cases */}
            <div className="flex justify-center">
                <a
                    href="/agent/cases"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                    View All My Cases
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                </a>
            </div>
        </div>
    );
}

// Helpers
function formatTimeRemaining(hours: number): string {
    if (hours < 1) {
        const minutes = Math.round(hours * 60);
        return `${minutes}m`;
    }
    if (hours < 24) {
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }
    const days = Math.floor(hours / 24);
    return `${days}d`;
}

function formatTimeAgo(hours: number): string {
    const absHours = Math.abs(hours);
    if (absHours < 1) {
        return `${Math.round(absHours * 60)}m ago`;
    }
    if (absHours < 24) {
        return `${Math.round(absHours)}h ago`;
    }
    return `${Math.floor(absHours / 24)}d ago`;
}

function getActionIcon(type: string): string {
    switch (type) {
        case 'contact': return '📞';
        case 'update': return '📝';
        case 'followup': return '🔄';
        case 'payment': return '💰';
        default: return '📌';
    }
}

// Workload Card Component
function WorkloadCard({ icon, count, title, subtitle, color }: {
    icon: React.ReactNode;
    count: number;
    title: string;
    subtitle: string;
    color: 'blue' | 'yellow' | 'red';
}) {
    const colorClasses = {
        blue: 'bg-blue-500/10 border-blue-500/20 dark:bg-blue-500/5 dark:border-blue-500/20',
        yellow: 'bg-yellow-500/10 border-yellow-500/20 dark:bg-yellow-500/5 dark:border-yellow-500/20',
        red: 'bg-red-500/10 border-red-500/20 dark:bg-red-500/5 dark:border-red-500/20',
    };
    const iconColors = {
        blue: 'text-blue-500',
        yellow: 'text-yellow-500',
        red: 'text-red-500',
    };

    return (
        <div className={`rounded-xl border p-5 ${colorClasses[color]}`}>
            <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg bg-white dark:bg-[#111] flex items-center justify-center ${iconColors[color]}`}>
                    {icon}
                </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{count}</h3>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500">{subtitle}</p>
        </div>
    );
}

// Icons
function CasesIcon() {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    );
}

function ClockIcon() {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}

function AlertIcon() {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
    );
}
