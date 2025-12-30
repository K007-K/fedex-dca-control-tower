import Link from 'next/link';
import { notFound } from 'next/navigation';

import { CaseActions } from '@/components/cases/CaseActions';
import { CaseDeleteButton } from '@/components/cases/CaseDeleteButton';
import { EscalationList } from '@/components/cases/EscalationList';
import { CasePredictionPanel } from '@/components/ml';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';

interface PageProps {
    params: Promise<{ id: string }>;
}

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    PENDING_ALLOCATION: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending Allocation' },
    ALLOCATED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Allocated' },
    IN_PROGRESS: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'In Progress' },
    CUSTOMER_CONTACTED: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Customer Contacted' },
    PAYMENT_PROMISED: { bg: 'bg-cyan-100', text: 'text-cyan-800', label: 'Payment Promised' },
    PARTIAL_RECOVERY: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Partial Recovery' },
    FULL_RECOVERY: { bg: 'bg-green-100', text: 'text-green-800', label: 'Full Recovery' },
    DISPUTED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Disputed' },
    ESCALATED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Escalated' },
    CLOSED: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Closed' },
};

const priorityConfig: Record<string, { bg: string; text: string }> = {
    CRITICAL: { bg: 'bg-red-100', text: 'text-red-800' },
    HIGH: { bg: 'bg-orange-100', text: 'text-orange-800' },
    MEDIUM: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    LOW: { bg: 'bg-green-100', text: 'text-green-800' },
};

export default async function CaseDetailPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createClient();

    // Fetch case details
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: caseData, error } = await (supabase as any)
        .from('cases')
        .select(`
            *,
            assigned_dca:dcas(id, name, status),
            assigned_agent:users!cases_assigned_agent_id_fkey(id, full_name, email)
        `)
        .eq('id', id)
        .single();

    if (error || !caseData) {
        notFound();
    }

    // Fetch case actions/timeline
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: actions } = await (supabase as any)
        .from('case_actions')
        .select(`
            *,
            performed_by:users!case_actions_performed_by_fkey(id, full_name)
        `)
        .eq('case_id', id)
        .order('performed_at', { ascending: false })
        .limit(20);

    // Fetch escalations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: escalations } = await (supabase as any)
        .from('escalations')
        .select('*')
        .eq('case_id', id)
        .order('created_at', { ascending: false });

    const status = statusConfig[caseData.status] ?? { bg: 'bg-gray-100', text: 'text-gray-800', label: caseData.status };
    const priority = priorityConfig[caseData.priority] ?? { bg: 'bg-gray-100', text: 'text-gray-800' };

    return (
        <div className="space-y-6">
            {/* Breadcrumb & Header */}
            <div className="flex items-center justify-between">
                <div>
                    <nav className="flex items-center text-sm text-gray-500 mb-2">
                        <Link href="/cases" className="hover:text-primary">Cases</Link>
                        <span className="mx-2">/</span>
                        <span className="text-gray-900">{caseData.case_number}</span>
                    </nav>
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold text-gray-900">{caseData.case_number}</h1>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${status.bg} ${status.text}`}>
                            {status.label}
                        </span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${priority.bg} ${priority.text}`}>
                            {caseData.priority}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <CaseActions
                        caseId={id}
                        caseNumber={caseData.case_number}
                        status={caseData.status}
                        hasAssignedDca={!!caseData.assigned_dca}
                    />
                    <CaseDeleteButton caseId={id} caseNumber={caseData.case_number} />
                    <Link href={`/cases/${id}/edit`}>
                        <Button variant="outline">Edit Case</Button>
                    </Link>
                </div>
            </div>

            {/* AI Predictions */}
            <CasePredictionPanel
                caseId={id}
                outstandingAmount={caseData.outstanding_amount ?? 0}
                daysPastDue={Math.floor((Date.now() - new Date(caseData.created_at).getTime()) / (1000 * 60 * 60 * 24))}
                segment={caseData.customer_segment ?? 'MEDIUM'}
            />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Case Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Customer Info */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <InfoItem label="Customer Name" value={caseData.customer_name} />
                            <InfoItem label="Customer ID" value={caseData.customer_id ?? '-'} />
                            <InfoItem label="Email" value={caseData.customer_email ?? '-'} />
                            <InfoItem label="Phone" value={caseData.customer_phone ?? '-'} />
                        </div>
                    </div>

                    {/* Financial Info */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Details</h2>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <p className="text-2xl font-bold text-gray-900">${caseData.original_amount?.toLocaleString()}</p>
                                <p className="text-sm text-gray-500">Original Amount</p>
                            </div>
                            <div className="text-center p-4 bg-red-50 rounded-lg">
                                <p className="text-2xl font-bold text-red-600">${caseData.outstanding_amount?.toLocaleString()}</p>
                                <p className="text-sm text-gray-500">Outstanding</p>
                            </div>
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                                <p className="text-2xl font-bold text-green-600">${(caseData.recovered_amount ?? 0).toLocaleString()}</p>
                                <p className="text-sm text-gray-500">Recovered</p>
                            </div>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Timeline</h2>
                        {actions && actions.length > 0 ? (
                            <div className="space-y-4">
                                {actions.map((action: { id: string; action_type: string; notes: string; performed_at: string; performed_by?: { full_name: string } }) => (
                                    <div key={action.id} className="flex gap-4">
                                        <div className="flex-shrink-0">
                                            <div className="w-2 h-2 mt-2 rounded-full bg-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">
                                                {action.action_type.replace(/_/g, ' ')}
                                            </p>
                                            {action.notes && (
                                                <p className="text-sm text-gray-600 mt-1">{action.notes}</p>
                                            )}
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(action.performed_at).toLocaleString()}
                                                {action.performed_by && ` • ${action.performed_by.full_name}`}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-8">No actions recorded yet.</p>
                        )}
                    </div>
                </div>

                {/* Right Column - Assignment & Dates */}
                <div className="space-y-6">
                    {/* Assignment */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Assignment</h2>
                        <div className="space-y-4">
                            <InfoItem
                                label="Assigned DCA"
                                value={caseData.assigned_dca?.name ?? 'Not assigned'}
                            />
                            <InfoItem
                                label="Assigned Agent"
                                value={caseData.assigned_agent?.full_name ?? 'Not assigned'}
                            />
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Dates</h2>
                        <div className="space-y-4">
                            <InfoItem
                                label="Created"
                                value={new Date(caseData.created_at).toLocaleDateString()}
                            />
                            <InfoItem
                                label="Due Date"
                                value={caseData.due_date ? new Date(caseData.due_date).toLocaleDateString() : '-'}
                            />
                            <InfoItem
                                label="Last Updated"
                                value={new Date(caseData.updated_at).toLocaleDateString()}
                            />
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Case Stats</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Recovery Rate</span>
                                <span className="font-medium">
                                    {caseData.original_amount > 0
                                        ? ((caseData.recovered_amount ?? 0) / caseData.original_amount * 100).toFixed(1)
                                        : 0}%
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Days Open</span>
                                <span className="font-medium">
                                    {Math.floor((Date.now() - new Date(caseData.created_at).getTime()) / (1000 * 60 * 60 * 24))}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Actions Count</span>
                                <span className="font-medium">{actions?.length ?? 0}</span>
                            </div>
                        </div>
                    </div>

                    {/* Escalations */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">Escalations</h2>
                            {escalations && escalations.length > 0 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                    {escalations.filter((e: { status: string }) => e.status === 'OPEN').length} Open
                                </span>
                            )}
                        </div>
                        <EscalationList escalations={escalations || []} />
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
