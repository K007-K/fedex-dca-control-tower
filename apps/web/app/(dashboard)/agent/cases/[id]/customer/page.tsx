'use client';

/**
 * Agent Case Customer Profile Page
 * 
 * PURPOSE: View customer details for a case
 * SCOPE: Only for cases assigned to the current agent
 */

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface CustomerInfo {
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    customer_address?: string;
    case_count?: number;
    total_outstanding?: number;
    currency?: string;
}

interface CaseInfo {
    id: string;
    case_number: string;
    outstanding_amount: number;
    status: string;
    created_at: string;
}

export default function AgentCaseCustomerPage() {
    const params = useParams();
    const caseId = params.id as string;

    const [customer, setCustomer] = useState<CustomerInfo | null>(null);
    const [currentCase, setCurrentCase] = useState<CaseInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/agent/cases/${caseId}`);
            if (res.ok) {
                const data = await res.json();
                const c = data.case;
                setCustomer({
                    customer_name: c.customer_name,
                    customer_email: c.customer_email,
                    customer_phone: c.customer_phone,
                    customer_address: c.customer_address,
                    currency: c.currency,
                });
                setCurrentCase({
                    id: c.id,
                    case_number: c.case_number,
                    outstanding_amount: c.outstanding_amount,
                    status: c.status,
                    created_at: c.created_at,
                });
            } else if (res.status === 403) {
                setError('This case is not assigned to you.');
            } else {
                setError('Failed to load customer info.');
            }
        } catch {
            setError('Failed to connect to server.');
        } finally {
            setIsLoading(false);
        }
    }, [caseId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const currencySymbol = customer?.currency === 'USD' ? '$' : '₹';

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Loading customer info...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                    <Link href="/agent/cases" className="text-primary hover:underline">
                        ← Back to My Cases
                    </Link>
                </div>
            </div>
        );
    }

    if (!customer) return null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <Link href={`/agent/cases/${caseId}`} className="text-sm text-gray-500 hover:text-primary mb-2 inline-block">
                    ← Back to Case
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customer Profile</h1>
                <p className="text-gray-500 dark:text-gray-400">{currentCase?.case_number}</p>
            </div>

            {/* Customer Card */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                <div className="flex items-start gap-6">
                    {/* Avatar */}
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-3xl font-bold text-primary">
                            {customer.customer_name?.charAt(0).toUpperCase() || '?'}
                        </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                            {customer.customer_name}
                        </h2>
                        <div className="space-y-2 mt-4">
                            <InfoRow icon="📧" label="Email" value={customer.customer_email || '—'} />
                            <InfoRow icon="📞" label="Phone" value={customer.customer_phone || '—'} />
                            {customer.customer_address && (
                                <InfoRow icon="📍" label="Address" value={customer.customer_address} />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Current Case Summary */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Current Case</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatBox label="Case Number" value={currentCase?.case_number || '—'} />
                    <StatBox
                        label="Outstanding"
                        value={`${currencySymbol}${currentCase?.outstanding_amount?.toLocaleString() || 0}`}
                        highlight
                    />
                    <StatBox label="Status" value={currentCase?.status?.replace(/_/g, ' ') || '—'} />
                    <StatBox label="Created" value={formatDate(currentCase?.created_at || '')} />
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                <div className="flex flex-wrap gap-3">
                    {customer.customer_phone && (
                        <a
                            href={`tel:${customer.customer_phone}`}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                            📞 Call Customer
                        </a>
                    )}
                    {customer.customer_email && (
                        <a
                            href={`mailto:${customer.customer_email}`}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                        >
                            📧 Email Customer
                        </a>
                    )}
                    <Link
                        href={`/agent/cases/${caseId}`}
                        className="px-4 py-2 border border-gray-200 dark:border-[#333] rounded-lg hover:bg-gray-100 dark:hover:bg-[#222] transition-colors text-sm"
                    >
                        📋 View Case Actions
                    </Link>
                </div>
            </div>

            {/* Privacy Notice */}
            <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 rounded-xl p-4">
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    <strong>⚠️ Privacy Notice:</strong> Customer information is confidential.
                    Use this data only for authorized debt collection purposes.
                    All access is logged for audit compliance.
                </p>
            </div>
        </div>
    );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
    return (
        <div className="flex items-center gap-3">
            <span>{icon}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400 w-20">{label}:</span>
            <span className="text-sm text-gray-900 dark:text-white">{value}</span>
        </div>
    );
}

function StatBox({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-3 text-center">
            <p className={`font-semibold ${highlight ? 'text-primary text-lg' : 'text-gray-900 dark:text-white'}`}>
                {value}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
        </div>
    );
}

function formatDate(dateString: string): string {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}
