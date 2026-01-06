'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

/**
 * DCA_ADMIN Cases Page
 * 
 * SCOPE: Only cases where dca_id = current_user.dca_id
 * 
 * Per MASTER UI SPEC:
 * - Case ID, Assigned Agent, Status, SLA countdown, Last activity
 * - View case details, add internal notes, receive escalations
 */

interface CaseItem {
    id: string;
    case_number: string;
    customer_name: string;
    assigned_agent: string;
    status: string;
    outstanding_amount: number;
    currency: string;
    sla_hours_remaining: number;
    updated_at: string;
    is_escalated: boolean;
}

export default function AdminCasesPage() {
    const [cases, setCases] = useState<CaseItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        const fetchCases = async () => {
            try {
                const params = new URLSearchParams();
                if (filter !== 'all') params.set('filter', filter);

                const response = await fetch(`/api/admin/cases?${params}`);
                if (response.ok) {
                    const data = await response.json();
                    setCases(data.cases || []);
                }
            } catch (e) {
                console.error('Failed to fetch cases:', e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCases();
    }, [filter]);

    const formatCurrency = (amount: number, currency: string) => {
        const symbol = currency === 'INR' ? '₹' : '$';
        return `${symbol}${amount.toLocaleString()}`;
    };

    const formatSLA = (hours: number) => {
        if (hours < 0) return { text: 'Breached', color: 'text-red-500' };
        if (hours < 24) return { text: `${Math.round(hours)}h`, color: 'text-yellow-500' };
        const days = Math.floor(hours / 24);
        return { text: `${days}d ${Math.round(hours % 24)}h`, color: 'text-green-500' };
    };

    const getStatusBadge = (status: string) => {
        const statusColors: Record<string, string> = {
            'PENDING_ALLOCATION': 'bg-gray-100 text-gray-700',
            'ALLOCATED': 'bg-blue-100 text-blue-700',
            'IN_PROGRESS': 'bg-indigo-100 text-indigo-700',
            'CUSTOMER_CONTACTED': 'bg-purple-100 text-purple-700',
            'PAYMENT_PROMISED': 'bg-green-100 text-green-700',
            'DISPUTED': 'bg-red-100 text-red-700',
            'ESCALATED': 'bg-orange-100 text-orange-700',
        };
        return statusColors[status] || 'bg-gray-100 text-gray-700';
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">DCA Cases</h1>
                    <p className="text-gray-500 dark:text-gray-400">All cases assigned to your DCA</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
                {['all', 'escalated', 'at-risk', 'overdue'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#222]'
                            }`}
                    >
                        {f === 'all' ? 'All Cases' : f.charAt(0).toUpperCase() + f.slice(1).replace('-', ' ')}
                    </button>
                ))}
            </div>

            {/* Cases Table */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">Loading cases...</p>
                    </div>
                ) : cases.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="text-4xl mb-4">📭</div>
                        <p className="text-gray-500 dark:text-gray-400">No cases found</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-[#222]">
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Case ID</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Agent</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">SLA</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-[#222]">
                            {cases.map((c) => {
                                const sla = formatSLA(c.sla_hours_remaining);
                                return (
                                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-primary">{c.case_number}</span>
                                                {c.is_escalated && (
                                                    <span className="px-1.5 py-0.5 bg-orange-100 text-orange-600 text-xs rounded">Escalated</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-gray-700 dark:text-gray-300">{c.customer_name}</td>
                                        <td className="px-5 py-4 text-gray-700 dark:text-gray-300">{c.assigned_agent || 'Unassigned'}</td>
                                        <td className="px-5 py-4 font-medium text-gray-900 dark:text-white">{formatCurrency(c.outstanding_amount, c.currency)}</td>
                                        <td className="px-5 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(c.status)}`}>
                                                {c.status.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className={`px-5 py-4 font-medium ${sla.color}`}>{sla.text}</td>
                                        <td className="px-5 py-4">
                                            <Link
                                                href={`/admin/cases/${c.id}`}
                                                className="px-3 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-colors"
                                            >
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
