import { Suspense } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { SkeletonCard } from '@/components/ui';
import { createClient } from '@/lib/supabase/server';

const statusColors: Record<string, { bg: string; text: string }> = {
    ACTIVE: { bg: 'bg-green-100', text: 'text-green-800' },
    SUSPENDED: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    TERMINATED: { bg: 'bg-red-100', text: 'text-red-800' },
    PENDING_APPROVAL: { bg: 'bg-blue-100', text: 'text-blue-800' },
};

function DCAsLoading() {
    return (
        <div className="space-y-6">
            {/* Stats skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2" />
                        <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
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

async function DCAsContent() {
    const supabase = await createClient();

    // Fetch DCAs with case counts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: dcas, error } = await (supabase as any)
        .from('dcas')
        .select('*')
        .order('name');

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
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">Total DCAs</p>
                    <p className="text-2xl font-bold text-gray-900">{totalDCAs}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">Active</p>
                    <p className="text-2xl font-bold text-green-600">{activeDCAs}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">Avg Recovery Rate</p>
                    <p className="text-2xl font-bold text-primary">{avgRecoveryRate.toFixed(1)}%</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">Cases Assigned</p>
                    <p className="text-2xl font-bold text-gray-900">{totalCasesAssigned}</p>
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
                            className="block bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-primary/50 transition-all"
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">{dca.name}</h3>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${statusColor.bg} ${statusColor.text}`}>
                                        {dca.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-primary">{dca.performance_score || 0}</p>
                                    <p className="text-xs text-gray-500">Score</p>
                                </div>
                            </div>

                            {/* Metrics */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <p className="text-xs text-gray-500">Recovery Rate</p>
                                    <p className="text-sm font-semibold text-gray-900">{dca.recovery_rate || 0}%</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">SLA Compliance</p>
                                    <p className="text-sm font-semibold text-gray-900">{dca.sla_compliance_rate || 0}%</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Cases Assigned</p>
                                    <p className="text-sm font-semibold text-gray-900">{casesAssigned}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Commission</p>
                                    <p className="text-sm font-semibold text-gray-900">{dca.commission_rate || 0}%</p>
                                </div>
                            </div>

                            {/* Capacity Bar */}
                            <div className="mb-4">
                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                    <span>Capacity</span>
                                    <span>{dca.capacity_used || 0} / {dca.capacity_limit || 100}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full ${capacityPercent >= 90 ? 'bg-red-500' : capacityPercent >= 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                        style={{ width: `${Math.min(capacityPercent, 100)}%` }}
                                    />
                                </div>
                            </div>

                            {/* Contact */}
                            {dca.primary_contact_name && (
                                <div className="pt-4 border-t border-gray-100">
                                    <p className="text-xs text-gray-500">Primary Contact</p>
                                    <p className="text-sm text-gray-900">{dca.primary_contact_name}</p>
                                    {dca.primary_contact_email && (
                                        <p className="text-xs text-gray-500">{dca.primary_contact_email}</p>
                                    )}
                                </div>
                            )}
                        </Link>
                    );
                })}
            </div>

            {/* Empty State */}
            {(!dcas || dcas.length === 0) && (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <div className="text-6xl mb-4">🏢</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No DCAs Found</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                        Get started by adding your first debt collection agency.
                    </p>
                    <Link href="/dcas/new" className="inline-block mt-4">
                        <Button>+ Add DCA</Button>
                    </Link>
                </div>
            )}
        </>
    );
}

export default async function DCAsPage() {
    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">DCAs</h1>
                    <p className="text-gray-500">Manage debt collection agencies and their performance</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/dcas/compare">
                        <Button variant="outline">📊 Compare</Button>
                    </Link>
                    <Link href="/dcas/new">
                        <Button>+ Add DCA</Button>
                    </Link>
                </div>
            </div>

            <Suspense fallback={<DCAsLoading />}>
                <DCAsContent />
            </Suspense>
        </div>
    );
}

