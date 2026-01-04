import Link from 'next/link';
import { Suspense } from 'react';

import { SkeletonCard } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { DCAsPageHeader } from '@/components/dcas/DCAsPageHeader';

const statusColors: Record<string, { bg: string; text: string }> = {
    ACTIVE: { bg: 'bg-green-500/20 border border-green-500/30', text: 'text-green-400' },
    SUSPENDED: { bg: 'bg-yellow-500/20 border border-yellow-500/30', text: 'text-yellow-400' },
    TERMINATED: { bg: 'bg-red-500/20 border border-red-500/30', text: 'text-red-400' },
    PENDING_APPROVAL: { bg: 'bg-blue-500/20 border border-blue-500/30', text: 'text-blue-400' },
};

function DCAsLoading() {
    return (
        <div className="space-y-6">
            {/* Stats skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-4">
                        <div className="h-4 w-20 bg-gray-200 dark:bg-[#1a1a1a] rounded animate-pulse mb-2" />
                        <div className="h-8 w-16 bg-gray-200 dark:bg-[#1a1a1a] rounded animate-pulse" />
                    </div>
                ))}
            </div>
            {/* Cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                    <SkeletonCard key={i} />
                ))}
            </div>
        </div>
    );
}

async function DCAsContent({ region }: { region?: string }) {
    const supabase = await createClient();

    // Fetch DCAs with optional region filter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let dcasQuery = (supabase as any)
        .from('dcas')
        .select('*')
        .order('name');

    // Apply region filter if specified
    if (region && region !== 'ALL') {
        dcasQuery = dcasQuery.eq('region', region);
    }

    const { data: dcas, error } = await dcasQuery;

    // Fetch case counts per DCA
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: caseCounts } = await (supabase as any)
        .from('cases')
        .select('assigned_dca_id')
        .not('assigned_dca_id', 'is', null);

    // Calculate stats
    const totalDCAs = dcas?.length || 0;
    const activeDCAs = dcas?.filter((d: { status: string }) => d.status === 'ACTIVE').length || 0;
    const avgRecoveryRate = dcas?.length
        ? dcas.reduce((sum: number, d: { recovery_rate: number }) => sum + (d.recovery_rate || 0), 0) / dcas.length
        : 0;
    const totalCasesAssigned = caseCounts?.length || 0;

    // Count cases per DCA
    const caseCountByDCA: Record<string, number> = {};
    caseCounts?.forEach((c: { assigned_dca_id: string }) => {
        if (c.assigned_dca_id) {
            caseCountByDCA[c.assigned_dca_id] = (caseCountByDCA[c.assigned_dca_id] || 0) + 1;
        }
    });

    if (error) {
        console.error('Error fetching DCAs:', error);
    }

    return (
        <>
            {/* SYSTEM Metrics Notice */}
            <div className="bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] rounded-lg p-3 flex items-center gap-3">
                <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                    All performance metrics are <strong>SYSTEM-calculated</strong> and updated automatically based on case outcomes, SLA compliance, and recovery rates.
                </p>
            </div>

            {/* Search Bar */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-4">
                <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Search DCAs by name, status, or contact..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-[#333] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                        />
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <select className="px-4 py-2 border border-gray-200 dark:border-[#333] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white">
                        <option value="">All Status</option>
                        <option value="ACTIVE">Active</option>
                        <option value="SUSPENDED">Suspended</option>
                        <option value="PENDING_APPROVAL">Pending</option>
                    </select>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total DCAs</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalDCAs}</p>
                </div>
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{activeDCAs}</p>
                </div>
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Avg Recovery Rate</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{avgRecoveryRate.toFixed(1)}%</p>
                </div>
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Cases Assigned</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalCasesAssigned}</p>
                </div>
            </div>


            {/* DCA Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dcas?.map((dca: {
                    id: string;
                    name: string;
                    status: string;
                    performance_score: number;
                    recovery_rate: number;
                    sla_compliance_rate: number;
                    capacity_limit: number;
                    capacity_used: number;
                    primary_contact_name: string;
                    primary_contact_email: string;
                    commission_rate: number;
                }) => {
                    const statusColor = statusColors[dca.status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
                    const casesAssigned = caseCountByDCA[dca.id] || 0;
                    const capacityPercent = dca.capacity_limit > 0
                        ? Math.round((dca.capacity_used / dca.capacity_limit) * 100)
                        : 0;

                    return (
                        <Link
                            key={dca.id}
                            href={`/dcas/${dca.id}`}
                            className="block bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6 hover:shadow-lg hover:border-gray-300 dark:hover:border-[#333] transition-all"
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{dca.name}</h3>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${statusColor.bg} ${statusColor.text}`}>
                                        {dca.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{dca.performance_score || 0}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Score</p>
                                </div>
                            </div>

                            {/* Metrics */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Recovery Rate</p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{dca.recovery_rate || 0}%</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">SLA Compliance</p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{dca.sla_compliance_rate || 0}%</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Cases Assigned</p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{casesAssigned}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Commission</p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{dca.commission_rate || 0}%</p>
                                </div>
                            </div>

                            {/* Capacity Bar */}
                            <div className="mb-4">
                                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                                    <span>Capacity</span>
                                    <span>{dca.capacity_used || 0} / {dca.capacity_limit || 100}</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-[#1a1a1a] rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full ${capacityPercent >= 90 ? 'bg-red-500' : capacityPercent >= 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                        style={{ width: `${Math.min(capacityPercent, 100)}%` }}
                                    />
                                </div>
                            </div>

                            {/* Contact */}
                            {dca.primary_contact_name && (
                                <div className="pt-4 border-t border-gray-100 dark:border-[#222]">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Primary Contact</p>
                                    <p className="text-sm text-gray-900 dark:text-white">{dca.primary_contact_name}</p>
                                    {dca.primary_contact_email && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{dca.primary_contact_email}</p>
                                    )}
                                </div>
                            )}
                        </Link>
                    );
                })}
            </div>

            {/* Empty State */}
            {(!dcas || dcas.length === 0) && (
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-12 text-center">
                    <div className="text-6xl mb-4">🏢</div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No DCAs Found</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                        Get started by adding your first debt collection agency.
                    </p>
                </div>
            )}
        </>
    );
}

interface PageProps {
    searchParams: Promise<{ region?: string; status?: string }>;
}

export default async function DCAsPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const region = params.region;
    const user = await getCurrentUser();
    const canManageDCAs = user && ['SUPER_ADMIN', 'FEDEX_ADMIN'].includes(user.role);

    return (
        <div className="space-y-6">
            {/* Page Header with Region Filter */}
            <DCAsPageHeader canManageDCAs={canManageDCAs ?? false} />

            <Suspense fallback={<DCAsLoading />}>
                <DCAsContent region={region} />
            </Suspense>
        </div>
    );
}


