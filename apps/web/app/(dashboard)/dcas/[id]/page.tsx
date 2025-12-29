import Link from 'next/link';
import { notFound } from 'next/navigation';

import { DCADeleteButton } from '@/components/dcas/DCADeleteButton';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';

interface PageProps {
    params: Promise<{ id: string }>;
}

const statusColors: Record<string, { bg: string; text: string }> = {
    ACTIVE: { bg: 'bg-green-100', text: 'text-green-800' },
    SUSPENDED: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    TERMINATED: { bg: 'bg-red-100', text: 'text-red-800' },
    PENDING_APPROVAL: { bg: 'bg-blue-100', text: 'text-blue-800' },
};

export default async function DCADetailPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createClient();

    // Fetch DCA details
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: dca, error } = await (supabase as any)
        .from('dcas')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !dca) {
        notFound();
    }

    // Fetch assigned cases with count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: cases, count: caseCount } = await (supabase as any)
        .from('cases')
        .select('*', { count: 'exact' })
        .eq('assigned_dca_id', id)
        .order('created_at', { ascending: false })
        .limit(10);

    // Fetch agents at this DCA
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: agents } = await (supabase as any)
        .from('users')
        .select('*')
        .eq('dca_id', id)
        .eq('is_active', true);

    const statusColor = statusColors[dca.status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
    const capacityPercent = dca.capacity_limit > 0
        ? Math.round((dca.capacity_used / dca.capacity_limit) * 100)
        : 0;

    return (
        <div className="space-y-6">
            {/* Breadcrumb & Header */}
            <div className="flex items-center justify-between">
                <div>
                    <nav className="flex items-center text-sm text-gray-500 mb-2">
                        <Link href="/dcas" className="hover:text-primary">DCAs</Link>
                        <span className="mx-2">/</span>
                        <span className="text-gray-900">{dca.name}</span>
                    </nav>
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold text-gray-900">{dca.name}</h1>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColor.bg} ${statusColor.text}`}>
                            {dca.status.replace('_', ' ')}
                        </span>
                    </div>
                    {dca.legal_name && (
                        <p className="text-gray-500 mt-1">{dca.legal_name}</p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <DCADeleteButton dcaId={id} dcaName={dca.name} />
                    <Link href={`/dcas/${id}/edit`}>
                        <Button variant="outline">Edit DCA</Button>
                    </Link>
                    <Button>Allocate Cases</Button>
                </div>
            </div>

            {/* Performance Score Card */}
            <div className="bg-gradient-to-r from-primary to-primary-700 rounded-xl p-6 text-white">
                <div className="grid grid-cols-4 gap-6">
                    <div className="text-center">
                        <p className="text-4xl font-bold">{dca.performance_score || 0}</p>
                        <p className="text-sm opacity-80">Performance Score</p>
                    </div>
                    <div className="text-center">
                        <p className="text-4xl font-bold">{dca.recovery_rate || 0}%</p>
                        <p className="text-sm opacity-80">Recovery Rate</p>
                    </div>
                    <div className="text-center">
                        <p className="text-4xl font-bold">{dca.sla_compliance_rate || 0}%</p>
                        <p className="text-sm opacity-80">SLA Compliance</p>
                    </div>
                    <div className="text-center">
                        <p className="text-4xl font-bold">${((dca.total_amount_recovered || 0) / 1000).toFixed(0)}K</p>
                        <p className="text-sm opacity-80">Total Recovered</p>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Capacity */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Capacity Management</h2>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div>
                                <p className="text-sm text-gray-500">Current Load</p>
                                <p className="text-2xl font-bold text-gray-900">{dca.capacity_used || 0}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Capacity Limit</p>
                                <p className="text-2xl font-bold text-gray-900">{dca.capacity_limit || 100}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Available</p>
                                <p className="text-2xl font-bold text-green-600">{(dca.capacity_limit || 100) - (dca.capacity_used || 0)}</p>
                            </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4">
                            <div
                                className={`h-4 rounded-full ${capacityPercent >= 90 ? 'bg-red-500' : capacityPercent >= 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                style={{ width: `${Math.min(capacityPercent, 100)}%` }}
                            />
                        </div>
                        <p className="text-sm text-gray-500 mt-2">{capacityPercent}% capacity utilized</p>
                    </div>

                    {/* Recent Cases */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Assigned Cases {caseCount ? `(${caseCount})` : ''}
                            </h2>
                            {caseCount && caseCount > 10 && (
                                <Link href={`/cases?dca_id=${id}`} className="text-sm text-primary hover:underline">
                                    View All {caseCount} →
                                </Link>
                            )}
                        </div>
                        {cases && cases.length > 0 ? (
                            <div className="space-y-3">
                                {cases.map((c: { id: string; case_number: string; customer_name: string; outstanding_amount: number; status: string }) => (
                                    <Link
                                        key={c.id}
                                        href={`/cases/${c.id}`}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                        <div>
                                            <p className="font-medium text-gray-900">{c.case_number}</p>
                                            <p className="text-sm text-gray-500">{c.customer_name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-gray-900">${c.outstanding_amount?.toLocaleString()}</p>
                                            <p className="text-xs text-gray-500">{c.status.replace('_', ' ')}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-8">No cases assigned yet.</p>
                        )}
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Contact Information */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
                        <div className="space-y-4">
                            <InfoItem label="Primary Contact" value={dca.primary_contact_name || '-'} />
                            <InfoItem label="Email" value={dca.primary_contact_email || '-'} />
                            <InfoItem label="Phone" value={dca.primary_contact_phone || '-'} />
                            <InfoItem label="Registration #" value={dca.registration_number || '-'} />
                        </div>
                    </div>

                    {/* Contract Details */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Contract Details</h2>
                        <div className="space-y-4">
                            <InfoItem label="Commission Rate" value={`${dca.commission_rate || 0}%`} />
                            <InfoItem label="Contract Start" value={dca.contract_start_date ? new Date(dca.contract_start_date).toLocaleDateString() : '-'} />
                            <InfoItem label="Contract End" value={dca.contract_end_date ? new Date(dca.contract_end_date).toLocaleDateString() : '-'} />
                            <InfoItem label="Min Case Value" value={dca.min_case_value ? `$${dca.min_case_value?.toLocaleString()}` : '-'} />
                            <InfoItem label="Max Case Value" value={dca.max_case_value ? `$${dca.max_case_value?.toLocaleString()}` : '-'} />
                        </div>
                    </div>

                    {/* Compliance */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Compliance</h2>
                        <div className="space-y-4">
                            <InfoItem label="License Expiry" value={dca.license_expiry ? new Date(dca.license_expiry).toLocaleDateString() : '-'} />
                            <InfoItem label="Insurance Valid" value={dca.insurance_valid_until ? new Date(dca.insurance_valid_until).toLocaleDateString() : '-'} />
                            <InfoItem label="Last Audit" value={dca.last_audit_date ? new Date(dca.last_audit_date).toLocaleDateString() : '-'} />
                            <InfoItem label="Audit Score" value={dca.audit_score ? `${dca.audit_score}/100` : '-'} />
                        </div>
                    </div>

                    {/* Agents */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Agents ({agents?.length || 0})</h2>
                        {agents && agents.length > 0 ? (
                            <div className="space-y-3">
                                {agents.map((agent: { id: string; full_name: string; email: string; role: string }) => (
                                    <div key={agent.id} className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium text-sm">
                                            {agent.full_name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{agent.full_name}</p>
                                            <p className="text-xs text-gray-500">{agent.role.replace('_', ' ')}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">No agents assigned.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function InfoItem({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-sm font-medium text-gray-900">{value}</p>
        </div>
    );
}
