import Link from 'next/link';
import { notFound } from 'next/navigation';

import { CaseActions } from '@/components/cases/CaseActions';
import { CaseDeleteButton } from '@/components/cases/CaseDeleteButton';
import { EscalationList } from '@/components/cases/EscalationList';
import { CasePredictionPanel } from '@/components/ml';
import { Button } from '@/components/ui/button';
import { RoleCapabilityCard } from '@/components/ui/RoleCapabilityCard';
import { GovernanceModeIndicator } from '@/components/ui/GovernanceModeIndicator';
import { CaseDetailDemoMessage } from '@/components/demo/CaseDemoMessages';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { isGovernanceRole, type UserRole } from '@/lib/auth/rbac';

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

    // Get current user for role-aware UX
    const currentUser = await getCurrentUser();
    const userRole = (currentUser?.role || 'FEDEX_VIEWER') as UserRole;
    const isGovernance = isGovernanceRole(userRole);

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
            {/* Demo Mode Message */}
            <CaseDetailDemoMessage />

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
                    <div className="flex items-center gap-2">
                        <CaseActions
                            caseId={id}
                            caseNumber={caseData.case_number}
                            status={caseData.status}
                            hasAssignedDca={!!caseData.assigned_dca}
                            userRole={userRole}
                        />
                        {/* Delete button - Hidden for governance roles */}
                        {!isGovernance && (
                            <CaseDeleteButton caseId={id} caseNumber={caseData.case_number} />
                        )}
                        <Link href={`/cases/${id}/lifecycle`}>
                            <Button variant="outline">
                                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                View Lifecycle
                            </Button>
                        </Link>
                        {/* Edit button - Hidden for governance roles (SUPER_ADMIN has oversight only) */}
                        {!isGovernance && (
                            <Link href={`/cases/${id}/edit`}>
                                <Button variant="outline">Edit Case</Button>
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Automation Summary */}
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
                    </svg>
                    <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 uppercase tracking-wide">Automation Summary</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <p className="text-blue-600/70 dark:text-blue-400/70 text-xs mb-0.5">Created by</p>
                        <p className="font-medium text-blue-900 dark:text-blue-200">
                            {caseData.actor_type === 'SYSTEM' ? '🤖 SYSTEM' : '👤 ' + (caseData.created_by_role || 'HUMAN')}
                        </p>
                    </div>
                    <div>
                        <p className="text-blue-600/70 dark:text-blue-400/70 text-xs mb-0.5">Assigned by</p>
                        <p className="font-medium text-blue-900 dark:text-blue-200">
                            {caseData.assigned_dca ? '🤖 SYSTEM (capacity-aware)' : '⏳ Pending'}
                        </p>
                    </div>
                    <div>
                        <p className="text-blue-600/70 dark:text-blue-400/70 text-xs mb-0.5">SLA enforced by</p>
                        <p className="font-medium text-blue-900 dark:text-blue-200">🤖 SYSTEM</p>
                    </div>
                    <div>
                        <p className="text-blue-600/70 dark:text-blue-400/70 text-xs mb-0.5">Escalation</p>
                        <p className="font-medium text-blue-900 dark:text-blue-200">
                            {escalations && escalations.length > 0 ? '🤖 SYSTEM triggered' : '—'}
                        </p>
                    </div>
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
                    <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Activity Timeline</h2>
                        {actions && actions.length > 0 ? (
                            <div className="space-y-4">
                                {actions.map((action: { id: string; action_type: string; notes: string; performed_at: string; actor_type?: string; performed_by?: { full_name: string } }) => {
                                    const isSystem = action.actor_type === 'SYSTEM' || !action.performed_by;
                                    return (
                                        <div key={action.id} className={`flex gap-4 p-3 rounded-lg ${isSystem ? 'bg-blue-50 dark:bg-blue-900/10' : 'bg-gray-50 dark:bg-[#1a1a1a]'}`}>
                                            <div className="flex-shrink-0">
                                                {isSystem ? (
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                                        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
                                                        </svg>
                                                    </div>
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                                        <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${isSystem ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                                                        {isSystem ? 'SYSTEM' : 'HUMAN'}
                                                    </span>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {action.action_type.replace(/_/g, ' ')}
                                                    </p>
                                                </div>
                                                {action.notes && (
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{action.notes}</p>
                                                )}
                                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                                    {new Date(action.performed_at).toLocaleString()}
                                                    {action.performed_by && ` • ${action.performed_by.full_name}`}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No actions recorded yet.</p>
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

                    {/* Role Capabilities - Informational */}
                    <GovernanceModeIndicator role={userRole} />
                    <RoleCapabilityCard role={userRole} />
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
