'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

/**
 * Agent Case History Page
 * 
 * PURPOSE: View completed/recovered cases for the agent
 * SCOPE: Cases that are FULL_RECOVERY, PARTIAL_RECOVERY, or CLOSED
 */

interface Case {
    id: string;
    case_number: string;
    customer_name: string;
    outstanding_amount: number;
    original_amount: number;
    recovered_amount: number;
    status: string;
    currency: string;
    updated_at: string;
    closed_at?: string;
}

const STATUS_OPTIONS = [
    { value: '', label: 'All Completed' },
    { value: 'FULL_RECOVERY', label: 'Full Recovery' },
    { value: 'PARTIAL_RECOVERY', label: 'Partial Recovery' },
    { value: 'CLOSED', label: 'Closed' },
];

export default function AgentHistoryPage() {
    const [cases, setCases] = useState<Case[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState('');

    const fetchCases = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('history', 'true');
            if (statusFilter) params.set('status', statusFilter);

            const response = await fetch(`/api/agent/cases?${params.toString()}`);
            if (response.ok) {
                const result = await response.json();
                setCases(result.cases || []);
            } else if (response.status === 403) {
                setError('Access denied. This page is for DCA Agents only.');
            } else {
                setError('Failed to load case history');
            }
        } catch (e) {
            console.error('Agent history fetch error:', e);
            setError('Failed to connect to server');
        } finally {
            setIsLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        fetchCases();
    }, [fetchCases]);

    const currencySymbol = cases[0]?.currency === 'USD' ? '$' : '₹';

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

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Case History</h1>
                <p className="text-gray-500 dark:text-gray-400">Your completed and recovered cases</p>
            </div>

            {/* Status Filter */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-4">
                <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Filter by Status:
                    </label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-10 rounded-md border border-gray-300 dark:border-[#333] bg-white dark:bg-[#1a1a1a] px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    >
                        {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    {statusFilter && (
                        <button
                            onClick={() => setStatusFilter('')}
                            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Cases List */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">Loading case history...</p>
                    </div>
                ) : cases.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="text-4xl mb-4">📜</div>
                        <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            No completed cases yet
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Cases will appear here once they are recovered or closed.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-[#0a0a0a]">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider">
                                        Case ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider">
                                        Customer
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider">
                                        Original Amount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider">
                                        Recovered
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider">
                                        Closed
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-[#222]">
                                {cases.map((caseItem) => (
                                    <tr key={caseItem.id} className="hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-medium text-primary">
                                                {caseItem.case_number}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-200">
                                            {caseItem.customer_name}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            {currencySymbol}{caseItem.original_amount?.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-green-600 dark:text-green-400">
                                            {currencySymbol}{caseItem.recovered_amount?.toLocaleString() || 0}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={caseItem.status} />
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            {formatDate(caseItem.updated_at)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/agent/cases/${caseItem.id}`}
                                                className="text-sm text-primary hover:text-primary/80"
                                            >
                                                View Details
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Summary Stats */}
            {cases.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Completed</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{cases.length}</p>
                    </div>
                    <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Full Recoveries</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {cases.filter(c => c.status === 'FULL_RECOVERY').length}
                        </p>
                    </div>
                    <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Recovered</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {currencySymbol}{cases.reduce((sum, c) => sum + (c.recovered_amount || 0), 0).toLocaleString()}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
        FULL_RECOVERY: { bg: 'bg-green-500/20 border-green-500/30', text: 'text-green-500', label: '✓ Full Recovery' },
        PARTIAL_RECOVERY: { bg: 'bg-orange-500/20 border-orange-500/30', text: 'text-orange-500', label: 'Partial' },
        CLOSED: { bg: 'bg-gray-500/20 border-gray-500/30', text: 'text-gray-500', label: 'Closed' },
    };
    const config = statusConfig[status] ?? { bg: 'bg-gray-500/20 border-gray-500/30', text: 'text-gray-500', label: status };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text}`}>
            {config.label}
        </span>
    );
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
