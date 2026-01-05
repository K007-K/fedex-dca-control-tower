'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

/**
 * Agent Cases Page
 * 
 * PURPOSE: Execute recovery work on assigned cases
 * SCOPE: Only cases where assigned_agent_id = current user
 * 
 * DESIGN PRINCIPLES:
 * - Minimal filters (status only)
 * - No region/DCA/priority filters
 * - Focus on task execution
 */

interface Case {
    id: string;
    case_number: string;
    customer_name: string;
    outstanding_amount: number;
    status: string;
    currency: string;
    updated_at: string;
    sla_due_at?: string;
    hours_remaining?: number;
}

const STATUS_OPTIONS = [
    { value: '', label: 'All Statuses' },
    { value: 'ALLOCATED', label: 'Allocated' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'CUSTOMER_CONTACTED', label: 'Contacted' },
    { value: 'PAYMENT_PROMISED', label: 'Payment Promised' },
    { value: 'PARTIAL_RECOVERY', label: 'Partial Recovery' },
    { value: 'DISPUTED', label: 'Disputed' },
];

export default function AgentCasesPage() {
    const [cases, setCases] = useState<Case[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState('');

    const fetchCases = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter) params.set('status', statusFilter);

            const response = await fetch(`/api/agent/cases?${params.toString()}`);
            if (response.ok) {
                const result = await response.json();
                setCases(result.cases || []);
            } else if (response.status === 403) {
                setError('Access denied. This page is for DCA Agents only.');
            } else {
                setError('Failed to load cases');
            }
        } catch (e) {
            console.error('Agent cases fetch error:', e);
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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Cases</h1>
                <p className="text-gray-500 dark:text-gray-400">Cases assigned to you for recovery</p>
            </div>

            {/* Status Filter - Minimal */}
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
                        <p className="text-gray-500 dark:text-gray-400">Loading your cases...</p>
                    </div>
                ) : cases.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="text-4xl mb-4">📋</div>
                        <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            No cases assigned to you
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Contact your DCA Manager if you believe this is an error.
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
                                        Amount Due
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider">
                                        SLA
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider">
                                        Last Activity
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
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-200">
                                            {currencySymbol}{caseItem.outstanding_amount?.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={caseItem.status} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <SLACountdown hoursRemaining={caseItem.hours_remaining} />
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            {formatRelativeTime(caseItem.updated_at)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/agent/cases/${caseItem.id}`}
                                                className="inline-flex items-center px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                                            >
                                                Work on Case
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
        ALLOCATED: { bg: 'bg-blue-500/20 border-blue-500/30', text: 'text-blue-500', label: 'Allocated' },
        IN_PROGRESS: { bg: 'bg-purple-500/20 border-purple-500/30', text: 'text-purple-500', label: 'In Progress' },
        CUSTOMER_CONTACTED: { bg: 'bg-indigo-500/20 border-indigo-500/30', text: 'text-indigo-500', label: 'Contacted' },
        PAYMENT_PROMISED: { bg: 'bg-cyan-500/20 border-cyan-500/30', text: 'text-cyan-500', label: 'Payment Promised' },
        PARTIAL_RECOVERY: { bg: 'bg-orange-500/20 border-orange-500/30', text: 'text-orange-500', label: 'Partial' },
        DISPUTED: { bg: 'bg-red-500/20 border-red-500/30', text: 'text-red-500', label: 'Disputed' },
    };
    const config = statusConfig[status] ?? { bg: 'bg-gray-500/20 border-gray-500/30', text: 'text-gray-500', label: status };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text}`}>
            {config.label}
        </span>
    );
}

function SLACountdown({ hoursRemaining }: { hoursRemaining?: number }) {
    if (hoursRemaining === undefined || hoursRemaining === null) {
        return <span className="text-sm text-gray-400">—</span>;
    }

    if (hoursRemaining < 0) {
        return (
            <span className="text-sm font-medium text-red-500">
                ⚠️ Breached
            </span>
        );
    }

    if (hoursRemaining < 4) {
        return (
            <span className="text-sm font-medium text-red-500">
                ⏰ {formatTimeRemaining(hoursRemaining)}
            </span>
        );
    }

    if (hoursRemaining < 24) {
        return (
            <span className="text-sm font-medium text-yellow-500">
                ⏰ {formatTimeRemaining(hoursRemaining)}
            </span>
        );
    }

    return (
        <span className="text-sm text-green-500">
            ✓ {formatTimeRemaining(hoursRemaining)}
        </span>
    );
}

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
    const remainingHours = Math.round(hours % 24);
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}
