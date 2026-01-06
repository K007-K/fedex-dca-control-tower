'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface WorkloadItem {
    name: string;
    caseCount: number;
    activeAmount: number;
}

interface AtRiskCase {
    id: string;
    case_number: string;
    customer_name: string;
    agent_name: string;
    hours_remaining: number;
    is_breached: boolean;
}

interface StuckCase {
    id: string;
    case_number: string;
    customer_name: string;
    status: string;
    updated_at: string;
    agent_name: string;
}

interface DashboardData {
    dcaName: string;
    teamKPIs: {
        totalAgents: number;
        totalCases: number;
        slaDueSoon: number;
        slaBreached: number;
    };
    agentWorkload: WorkloadItem[];
    atRiskCases: AtRiskCase[];
    stuckCases: StuckCase[];
}

export default function ManagerDashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await fetch('/api/manager/dashboard');
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || 'Failed to load dashboard');
                }
                const json = await res.json();
                setData(json);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load');
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 w-48 bg-gray-200 dark:bg-[#1a1a1a] rounded animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-24 bg-gray-200 dark:bg-[#1a1a1a] rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Manager Dashboard
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                    {data?.dcaName} — Team workload and performance overview
                </p>
            </div>

            {/* Team KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Active Agents</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {data?.teamKPIs.totalAgents ?? 0}
                    </p>
                </div>
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Team Cases</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {data?.teamKPIs.totalCases ?? 0}
                    </p>
                </div>
                <div className="bg-white dark:bg-[#111] rounded-xl border border-yellow-200 dark:border-yellow-800 p-4 bg-yellow-50 dark:bg-yellow-900/20">
                    <p className="text-sm text-yellow-600 dark:text-yellow-400">SLA Due Soon</p>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        {data?.teamKPIs.slaDueSoon ?? 0}
                    </p>
                </div>
                <div className="bg-white dark:bg-[#111] rounded-xl border border-red-200 dark:border-red-800 p-4 bg-red-50 dark:bg-red-900/20">
                    <p className="text-sm text-red-600 dark:text-red-400">SLA Breached</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {data?.teamKPIs.slaBreached ?? 0}
                    </p>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Agent Workload */}
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Agent Workload
                        </h3>
                        <Link href="/manager/team" className="text-sm text-primary hover:underline">
                            View Team →
                        </Link>
                    </div>
                    {data?.agentWorkload && data.agentWorkload.length > 0 ? (
                        <div className="space-y-3">
                            {data.agentWorkload.map((agent, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#0a0a0a] rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                                            <span className="text-sm font-medium text-yellow-600">
                                                {agent.name.charAt(0)}
                                            </span>
                                        </div>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                            {agent.name}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                                            {agent.caseCount} cases
                                        </span>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            ₹{agent.activeAmount.toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <p>No agents in your DCA</p>
                        </div>
                    )}
                </div>

                {/* At-Risk Cases */}
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            At-Risk Cases
                        </h3>
                        <Link href="/manager/cases?sla_risk=at_risk" className="text-sm text-primary hover:underline">
                            View All →
                        </Link>
                    </div>
                    {data?.atRiskCases && data.atRiskCases.length > 0 ? (
                        <div className="space-y-2">
                            {data.atRiskCases.slice(0, 5).map((c) => (
                                <Link
                                    key={c.id}
                                    href={`/manager/cases/${c.id}`}
                                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#0a0a0a] rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors"
                                >
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {c.case_number}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {c.customer_name} • {c.agent_name}
                                        </p>
                                    </div>
                                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${c.is_breached
                                            ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                            : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                                        }`}>
                                        {c.is_breached ? 'BREACHED' : `${Math.round(c.hours_remaining)}h`}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <p className="text-green-600">✓ No at-risk cases today</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Stuck Cases */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Stuck Cases (No activity in 48h)
                    </h3>
                </div>
                {data?.stuckCases && data.stuckCases.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-[#222]">
                                    <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Case</th>
                                    <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Customer</th>
                                    <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Agent</th>
                                    <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Status</th>
                                    <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Last Updated</th>
                                    <th className="text-right py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.stuckCases.map((c) => (
                                    <tr key={c.id} className="border-b border-gray-100 dark:border-[#1a1a1a]">
                                        <td className="py-2 px-3 font-medium text-gray-900 dark:text-white">{c.case_number}</td>
                                        <td className="py-2 px-3 text-gray-600 dark:text-gray-400">{c.customer_name}</td>
                                        <td className="py-2 px-3 text-gray-600 dark:text-gray-400">{c.agent_name}</td>
                                        <td className="py-2 px-3">
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400">
                                                {c.status}
                                            </span>
                                        </td>
                                        <td className="py-2 px-3 text-gray-500 dark:text-gray-400">
                                            {new Date(c.updated_at).toLocaleDateString()}
                                        </td>
                                        <td className="py-2 px-3 text-right">
                                            <Link
                                                href={`/manager/cases/${c.id}`}
                                                className="text-primary hover:underline text-xs"
                                            >
                                                Review
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <p className="text-green-600">✓ All cases have recent activity</p>
                    </div>
                )}
            </div>
        </div>
    );
}
