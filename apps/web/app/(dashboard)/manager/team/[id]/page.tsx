'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

/**
 * Manager Agent Detail Page
 * 
 * Shows individual agent details with their cases and operational metrics
 */

interface AgentDetails {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    joinedAt: string;
    metrics: {
        activeCases: number;
        resolvedCases: number;
        slaBreaches30d: number;
    };
}

interface CaseItem {
    id: string;
    case_number: string;
    customer_name: string;
    status: string;
    outstanding_amount: number;
    updated_at: string;
}

export default function ManagerAgentDetailPage() {
    const params = useParams();
    const agentId = params.id as string;

    const [agent, setAgent] = useState<AgentDetails | null>(null);
    const [cases, setCases] = useState<CaseItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAgentData = async () => {
            try {
                // Fetch team data to get agent info
                const teamRes = await fetch('/api/manager/team');
                if (!teamRes.ok) throw new Error('Failed to load team');
                const teamData = await teamRes.json();

                const foundAgent = teamData.team?.find((a: AgentDetails) => a.id === agentId);
                if (!foundAgent) {
                    throw new Error('Agent not found in your team');
                }
                setAgent(foundAgent);

                // Fetch cases for this agent
                const casesRes = await fetch(`/api/manager/cases?agent_id=${agentId}`);
                if (casesRes.ok) {
                    const casesData = await casesRes.json();
                    setCases(casesData.cases || []);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load');
            } finally {
                setLoading(false);
            }
        };
        fetchAgentData();
    }, [agentId]);

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            'ALLOCATED': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            'IN_PROGRESS': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
            'CUSTOMER_CONTACTED': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
            'PAYMENT_PROMISED': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
            'DISPUTED': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        };
        return colors[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 w-48 bg-gray-200 dark:bg-[#1a1a1a] rounded animate-pulse" />
                <div className="h-64 bg-gray-200 dark:bg-[#1a1a1a] rounded-xl animate-pulse" />
            </div>
        );
    }

    if (error || !agent) {
        return (
            <div className="space-y-4">
                <Link href="/manager/team" className="text-sm text-primary hover:underline">
                    ← Back to My Team
                </Link>
                <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400">
                    {error || 'Agent not found'}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <Link href="/manager/team" className="text-sm text-primary hover:underline mb-2 inline-block">
                    ← Back to My Team
                </Link>
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                        <span className="text-2xl font-medium text-yellow-600">
                            {agent.name.charAt(0)}
                        </span>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {agent.name}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">{agent.email}</p>
                    </div>
                </div>
            </div>

            {/* Metrics Notice */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm text-blue-700 dark:text-blue-300">
                <strong>Note:</strong> These metrics are for operational visibility only and should not be used for ranking or performance evaluation.
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-4 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Active Cases</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {agent.metrics.activeCases}
                    </p>
                </div>
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-4 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Resolved</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {agent.metrics.resolvedCases}
                    </p>
                </div>
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-4 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">SLA Issues (30d)</p>
                    <p className={`text-3xl font-bold ${agent.metrics.slaBreaches30d > 5
                            ? 'text-red-600 dark:text-red-400'
                            : agent.metrics.slaBreaches30d > 0
                                ? 'text-yellow-600 dark:text-yellow-400'
                                : 'text-green-600 dark:text-green-400'
                        }`}>
                        {agent.metrics.slaBreaches30d}
                    </p>
                </div>
            </div>

            {/* Agent's Cases */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-[#222]">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                        Active Cases ({cases.length})
                    </h3>
                </div>
                {cases.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-[#0a0a0a]">
                                <tr>
                                    <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Case</th>
                                    <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Customer</th>
                                    <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Status</th>
                                    <th className="text-right py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Amount</th>
                                    <th className="text-right py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-[#1a1a1a]">
                                {cases.map((c) => (
                                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-[#0a0a0a]">
                                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                                            {c.case_number}
                                        </td>
                                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                                            {c.customer_name}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(c.status)}`}>
                                                {c.status.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right font-medium text-gray-900 dark:text-white">
                                            ₹{c.outstanding_amount?.toLocaleString('en-IN') || '0'}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <Link href={`/manager/cases/${c.id}`} className="text-primary hover:underline text-xs">
                                                View Case
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        No active cases assigned to this agent
                    </div>
                )}
            </div>

            {/* Contact Info */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h3>
                <dl className="space-y-3">
                    <div className="flex justify-between">
                        <dt className="text-gray-500 dark:text-gray-400">Email</dt>
                        <dd className="text-gray-900 dark:text-white">{agent.email}</dd>
                    </div>
                    {agent.phone && (
                        <div className="flex justify-between">
                            <dt className="text-gray-500 dark:text-gray-400">Phone</dt>
                            <dd className="text-gray-900 dark:text-white">{agent.phone}</dd>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <dt className="text-gray-500 dark:text-gray-400">Joined</dt>
                        <dd className="text-gray-900 dark:text-white">
                            {new Date(agent.joinedAt).toLocaleDateString()}
                        </dd>
                    </div>
                </dl>
            </div>
        </div>
    );
}
