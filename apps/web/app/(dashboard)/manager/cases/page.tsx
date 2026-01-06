'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Agent {
    id: string;
    name: string;
    email: string;
}

interface CaseItem {
    id: string;
    case_number: string;
    customer_name: string;
    status: string;
    outstanding_amount: number;
    currency: string;
    assigned_agent_id: string;
    agent_name: string;
    agent_email: string;
    created_at: string;
    updated_at: string;
    sla?: {
        due_at: string;
        status: string;
        hours_remaining: number;
    };
}

const STATUS_OPTIONS = [
    { value: '', label: 'All Statuses' },
    { value: 'ALLOCATED', label: 'Allocated' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'CUSTOMER_CONTACTED', label: 'Contacted' },
    { value: 'PAYMENT_PROMISED', label: 'Payment Promised' },
    { value: 'PARTIAL_PAYMENT', label: 'Partial Payment' },
    { value: 'DISPUTED', label: 'Disputed' },
];

export default function ManagerCasesPage() {
    const searchParams = useSearchParams();
    const isHistoryMode = searchParams.get('history') === 'true';

    const [cases, setCases] = useState<CaseItem[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [agentFilter, setAgentFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [slaRiskFilter, setSlaRiskFilter] = useState('');

    useEffect(() => {
        const fetchCases = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (agentFilter) params.append('agent_id', agentFilter);
                if (statusFilter) params.append('status', statusFilter);
                if (slaRiskFilter) params.append('sla_risk', slaRiskFilter);
                if (isHistoryMode) params.append('history', 'true');

                const res = await fetch(`/api/manager/cases?${params.toString()}`);
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || 'Failed to load cases');
                }
                const json = await res.json();
                setCases(json.cases || []);
                setAgents(json.agents || []);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load');
            } finally {
                setLoading(false);
            }
        };
        fetchCases();
    }, [agentFilter, statusFilter, slaRiskFilter, isHistoryMode]);

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            'ALLOCATED': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            'IN_PROGRESS': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
            'CUSTOMER_CONTACTED': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
            'PAYMENT_PROMISED': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
            'PARTIAL_PAYMENT': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
            'DISPUTED': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            'FULL_RECOVERY': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            'PARTIAL_RECOVERY': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            'CLOSED': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
            'WRITTEN_OFF': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
        };
        return colors[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {isHistoryMode ? 'Case History' : 'Team Cases'}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        {isHistoryMode
                            ? 'Closed and recovered cases from your team'
                            : 'All cases assigned to agents in your DCA'}
                    </p>
                </div>
                {isHistoryMode ? (
                    <Link
                        href="/manager/cases"
                        className="text-sm text-primary hover:underline"
                    >
                        ← View Active Cases
                    </Link>
                ) : (
                    <Link
                        href="/manager/cases?history=true"
                        className="text-sm text-primary hover:underline"
                    >
                        View Case History →
                    </Link>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-4">
                <div className="flex-1 min-w-[150px]">
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Agent</label>
                    <select
                        value={agentFilter}
                        onChange={(e) => setAgentFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-[#222] rounded-lg bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white text-sm"
                    >
                        <option value="">All Agents</option>
                        {agents.map((agent) => (
                            <option key={agent.id} value={agent.id}>{agent.name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex-1 min-w-[150px]">
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Status</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-[#222] rounded-lg bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white text-sm"
                    >
                        {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
                <div className="flex-1 min-w-[150px]">
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">SLA Risk</label>
                    <select
                        value={slaRiskFilter}
                        onChange={(e) => setSlaRiskFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-[#222] rounded-lg bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white text-sm"
                    >
                        <option value="">All</option>
                        <option value="at_risk">At Risk (&lt;24h)</option>
                        <option value="breached">Breached</option>
                    </select>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400">
                    {error}
                </div>
            )}

            {/* Cases Table */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading...</div>
                ) : cases.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        No cases found matching filters
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-[#0a0a0a]">
                                <tr>
                                    <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Case</th>
                                    <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Customer</th>
                                    <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Agent</th>
                                    <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Status</th>
                                    <th className="text-right py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Amount</th>
                                    <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">SLA</th>
                                    <th className="text-right py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-[#1a1a1a]">
                                {cases.map((c) => (
                                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-[#0a0a0a]">
                                        <td className="py-3 px-4">
                                            <Link href={`/manager/cases/${c.id}`} className="font-medium text-gray-900 dark:text-white hover:text-primary">
                                                {c.case_number}
                                            </Link>
                                        </td>
                                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                                            {c.customer_name}
                                        </td>
                                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                                            {c.agent_name}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(c.status)}`}>
                                                {c.status.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right font-medium text-gray-900 dark:text-white">
                                            ₹{c.outstanding_amount?.toLocaleString('en-IN') || '0'}
                                        </td>
                                        <td className="py-3 px-4">
                                            {c.sla ? (
                                                <span className={`text-xs px-2 py-1 rounded-full ${c.sla.status === 'BREACHED' || c.sla.hours_remaining < 0
                                                    ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                                    : c.sla.hours_remaining < 24
                                                        ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                        : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                                    }`}>
                                                    {c.sla.status === 'BREACHED' || c.sla.hours_remaining < 0
                                                        ? 'Breached'
                                                        : `${Math.round(c.sla.hours_remaining)}h`}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400">—</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <Link href={`/manager/cases/${c.id}`} className="text-primary hover:underline text-xs">
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                Showing {cases.length} cases
            </p>
        </div>
    );
}
