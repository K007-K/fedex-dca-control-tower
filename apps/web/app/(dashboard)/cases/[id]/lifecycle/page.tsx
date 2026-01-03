import Link from 'next/link';
import { notFound } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { CaseLifecycleDemoMessage } from '@/components/demo/CaseDemoMessages';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function CaseLifecyclePage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createClient();
    const currentUser = await getCurrentUser();

    // Fetch case with all related data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: caseData, error } = await (supabase as any)
        .from('cases')
        .select(`
            *,
            assigned_dca:dcas(id, name, status, performance_score),
            assigned_agent:users!cases_assigned_agent_id_fkey(id, full_name, email, role)
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
            performed_by:users!case_actions_performed_by_fkey(id, full_name, role)
        `)
        .eq('case_id', id)
        .order('performed_at', { ascending: true });

    // Fetch escalations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: escalations } = await (supabase as any)
        .from('escalations')
        .select('*')
        .eq('case_id', id)
        .order('created_at', { ascending: true });

    // Fetch SLA logs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: slaLogs } = await (supabase as any)
        .from('sla_breach_log')
        .select('*')
        .eq('case_id', id)
        .order('breach_timestamp', { ascending: true });

    // Determine case status details
    const isBreached = slaLogs && slaLogs.length > 0;
    const hasEscalations = escalations && escalations.length > 0;
    const isClosed = ['CLOSED', 'FULL_RECOVERY', 'WRITTEN_OFF'].includes(caseData.status);
    const isEscalated = caseData.status === 'ESCALATED';

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Demo Mode Message */}
            <CaseLifecycleDemoMessage />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link
                            href={`/cases/${id}`}
                            className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors"
                        >
                            ← Back to Case
                        </Link>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Case Lifecycle Story
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Complete journey of case <span className="font-mono text-primary">{caseData.case_number}</span>
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wide font-medium px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        Read-Only View
                    </span>
                </div>
            </div>

            {/* Lifecycle Timeline */}
            <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl p-6">
                <div className="relative">
                    {/* Timeline Line */}
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-green-500 dark:from-blue-400 dark:via-purple-400 dark:to-green-400" />

                    {/* SECTION 1: Case Origin */}
                    <LifecycleSection
                        number={1}
                        title="Case Origin (Upstream)"
                        icon="📥"
                        actorType="SYSTEM"
                        isFirst={true}
                    >
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <InfoField label="Source System" value={caseData.created_source || 'Billing Platform'} />
                            <InfoField label="Source Reference ID" value={caseData.invoice_number || caseData.case_number} />
                            <InfoField label="Event Type" value="Invoice Overdue" />
                            <InfoField label="Received Timestamp" value={new Date(caseData.created_at).toLocaleString()} />
                            <InfoField label="Created By" value={caseData.actor_type === 'SYSTEM' ? '🤖 SYSTEM' : '👤 ' + (caseData.created_by_role || 'Manual')} highlight={caseData.actor_type === 'SYSTEM'} />
                            <InfoField label="Customer" value={caseData.customer_name} />
                        </div>
                        <ExplanationNote>
                            {caseData.actor_type === 'SYSTEM'
                                ? 'This case was created automatically by SYSTEM based on upstream business data.'
                                : 'This case was created manually by a user.'}
                        </ExplanationNote>
                    </LifecycleSection>

                    {/* SECTION 2: System Enrichment */}
                    <LifecycleSection
                        number={2}
                        title="System Enrichment"
                        icon="🧠"
                        actorType="SYSTEM"
                    >
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <InfoField label="Priority" value={caseData.priority} highlight={caseData.priority === 'CRITICAL' || caseData.priority === 'HIGH'} />
                            <InfoField label="Risk Level" value={caseData.ml_priority_score ? 'ML-Assessed' : 'Rule-Based'} />
                            <InfoField label="Priority Score" value={caseData.ml_priority_score?.toString() || 'N/A'} />
                            <InfoField label="Confidence" value={caseData.ml_confidence ? `${(caseData.ml_confidence * 100).toFixed(0)}%` : 'N/A'} />
                            <InfoField label="Original Amount" value={formatCurrency(caseData.original_amount, caseData.region)} />
                            <InfoField label="Outstanding Amount" value={formatCurrency(caseData.outstanding_amount, caseData.region)} />
                        </div>
                        <ExplanationNote type={caseData.ml_priority_score ? 'system' : 'fallback'}>
                            {caseData.ml_priority_score
                                ? 'Calculated automatically by SYSTEM using AI assistance.'
                                : 'Fallback values used — priority assigned by business rules.'}
                        </ExplanationNote>
                    </LifecycleSection>

                    {/* SECTION 3: Automated Allocation */}
                    <LifecycleSection
                        number={3}
                        title="Automated Allocation"
                        icon="🎯"
                        actorType="SYSTEM"
                    >
                        {caseData.assigned_dca ? (
                            <>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <InfoField label="Assigned DCA" value={caseData.assigned_dca.name} highlight={true} />
                                    <InfoField label="DCA Status" value={caseData.assigned_dca.status} />
                                    <InfoField label="Assignment Timestamp" value={caseData.allocated_at ? new Date(caseData.allocated_at).toLocaleString() : new Date(caseData.updated_at).toLocaleString()} />
                                    <InfoField label="Assignment Method" value="🤖 SYSTEM — capacity & performance based" highlight={true} />
                                    {caseData.assigned_dca.performance_score && (
                                        <InfoField label="DCA Performance Score" value={`${caseData.assigned_dca.performance_score}%`} />
                                    )}
                                    <InfoField label="Region" value={caseData.region} />
                                </div>
                                <ExplanationNote type="system">
                                    No human was involved in this decision. DCA selected based on capacity, performance score, and regional expertise.
                                </ExplanationNote>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-4">
                                    <span className="text-xl">⏳</span>
                                    <span className="font-medium">Pending Allocation</span>
                                </div>
                                <ExplanationNote type="pending">
                                    This case is awaiting automated DCA assignment by the SYSTEM allocation engine.
                                </ExplanationNote>
                            </>
                        )}
                    </LifecycleSection>

                    {/* SECTION 4: DCA Execution (Workflow) */}
                    <LifecycleSection
                        number={4}
                        title="DCA Execution (Workflow)"
                        icon="⚙️"
                        actorType="HUMAN"
                    >
                        {actions && actions.length > 0 ? (
                            <>
                                <div className="space-y-3 mb-4">
                                    {actions.slice(0, 5).map((action: any, index: number) => (
                                        <div key={action.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-[#1a1a1a]">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${action.actor_type === 'SYSTEM'
                                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                                }`}>
                                                {index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] uppercase tracking-wide font-medium px-1.5 py-0.5 rounded ${action.actor_type === 'SYSTEM'
                                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                                        }`}>
                                                        {action.actor_type === 'SYSTEM' ? 'SYSTEM' : action.performed_by?.role || 'HUMAN'}
                                                    </span>
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {action.action_type.replace(/_/g, ' ')}
                                                    </span>
                                                </div>
                                                {action.notes && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{action.notes}</p>
                                                )}
                                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                                    {new Date(action.performed_at).toLocaleString()}
                                                    {action.performed_by && ` • ${action.performed_by.full_name}`}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {actions.length > 5 && (
                                        <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                                            +{actions.length - 5} more actions
                                        </p>
                                    )}
                                </div>
                                <ExplanationNote>
                                    DCAs operate within a governed workflow. They can update status and add notes, but cannot edit financial data or bypass SLA controls.
                                </ExplanationNote>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-4">
                                    <span className="text-xl">📝</span>
                                    <span>No workflow actions recorded yet</span>
                                </div>
                                <ExplanationNote>
                                    DCAs operate within a governed workflow. Actions will appear here as the case progresses.
                                </ExplanationNote>
                            </>
                        )}
                    </LifecycleSection>

                    {/* SECTION 5: SLA Monitoring & Escalation */}
                    <LifecycleSection
                        number={5}
                        title="SLA Monitoring & Escalation"
                        icon="⏱️"
                        actorType="SYSTEM"
                    >
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <InfoField label="SLA Start Time" value={new Date(caseData.created_at).toLocaleString()} />
                            <InfoField label="SLA Due Time" value={caseData.due_date ? new Date(caseData.due_date).toLocaleString() : 'Not Set'} />
                            <InfoField
                                label="SLA Status"
                                value={isBreached ? '❌ BREACHED' : (caseData.due_date && new Date(caseData.due_date) < new Date() ? '⚠️ At Risk' : '✅ On Track')}
                                highlight={isBreached}
                            />
                            {isBreached && slaLogs[0] && (
                                <InfoField label="Breach Time" value={new Date(slaLogs[0].breach_timestamp).toLocaleString()} highlight={true} />
                            )}
                        </div>

                        {hasEscalations && (
                            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30">
                                <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-2">
                                    🚨 Escalation Triggered by SYSTEM
                                </p>
                                {escalations.slice(0, 2).map((esc: any) => (
                                    <div key={esc.id} className="text-xs text-red-600 dark:text-red-400">
                                        Level {esc.escalation_level}: {esc.reason} ({new Date(esc.created_at).toLocaleDateString()})
                                    </div>
                                ))}
                            </div>
                        )}

                        <ExplanationNote type="system">
                            SLA enforcement and escalation are fully system-controlled. No manual intervention can pause or reset SLA timers.
                        </ExplanationNote>
                    </LifecycleSection>

                    {/* SECTION 6: Outcome */}
                    <LifecycleSection
                        number={6}
                        title="Outcome"
                        icon={isClosed ? '✅' : (isEscalated ? '🚨' : '🔄')}
                        actorType="SYSTEM"
                        isLast={true}
                    >
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <InfoField
                                label="Current Status"
                                value={caseData.status.replace(/_/g, ' ')}
                                highlight={isClosed || isEscalated}
                            />
                            <InfoField label="Final State" value={isClosed ? 'Closed' : (isEscalated ? 'Escalated' : 'Ongoing')} />
                            {caseData.closure_reason && (
                                <InfoField label="Closure Reason" value={caseData.closure_reason} />
                            )}
                            <InfoField label="Last Updated" value={new Date(caseData.updated_at).toLocaleString()} />
                            <InfoField label="Recovered Amount" value={formatCurrency(caseData.recovered_amount || 0, caseData.region)} />
                            <InfoField
                                label="Recovery Rate"
                                value={`${caseData.original_amount > 0 ? ((caseData.recovered_amount || 0) / caseData.original_amount * 100).toFixed(1) : 0}%`}
                            />
                        </div>
                        <ExplanationNote type="audit">
                            All actions in this lifecycle are audit logged and immutable. This case history cannot be altered.
                        </ExplanationNote>
                    </LifecycleSection>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-gray-400 dark:text-gray-500 py-4">
                <p>This lifecycle view is read-only and reflects the current state of case data.</p>
                <p className="mt-1">
                    Viewed by: {(currentUser as any)?.full_name || currentUser?.email || 'Unknown'} ({currentUser?.role || 'Unknown'}) at {new Date().toLocaleString()}
                </p>
            </div>
        </div>
    );
}

// Helper Components
function LifecycleSection({
    number,
    title,
    icon,
    actorType,
    isFirst = false,
    isLast = false,
    children
}: {
    number: number;
    title: string;
    icon: string;
    actorType: 'SYSTEM' | 'HUMAN';
    isFirst?: boolean;
    isLast?: boolean;
    children: React.ReactNode;
}) {
    const isSystem = actorType === 'SYSTEM';

    return (
        <div className={`relative pl-16 ${isFirst ? '' : 'pt-8'} ${isLast ? '' : 'pb-8'}`}>
            {/* Timeline Node */}
            <div className={`absolute left-0 w-12 h-12 rounded-xl flex items-center justify-center text-xl ${isSystem
                ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500 dark:border-blue-400'
                : 'bg-gray-100 dark:bg-gray-800 border-2 border-gray-400 dark:border-gray-600'
                }`}>
                {icon}
            </div>

            {/* Section Header */}
            <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-bold text-gray-400 dark:text-gray-500">STEP {number}</span>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
                <span className={`text-[10px] uppercase tracking-wide font-medium px-2 py-0.5 rounded ${isSystem
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                    {isSystem ? '🤖 SYSTEM' : '👤 HUMAN'}
                </span>
            </div>

            {/* Section Content */}
            <div className="bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] rounded-lg p-4">
                {children}
            </div>
        </div>
    );
}

function InfoField({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
            <p className={`text-sm font-medium ${highlight ? 'text-primary dark:text-primary' : 'text-gray-900 dark:text-white'}`}>
                {value}
            </p>
        </div>
    );
}

function ExplanationNote({ children, type = 'default' }: { children: React.ReactNode; type?: 'default' | 'system' | 'fallback' | 'pending' | 'audit' }) {
    const styles = {
        default: 'bg-gray-100 dark:bg-[#1a1a1a] border-gray-200 dark:border-[#333] text-gray-600 dark:text-gray-400',
        system: 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/30 text-blue-700 dark:text-blue-300',
        fallback: 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30 text-amber-700 dark:text-amber-300',
        pending: 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30 text-amber-700 dark:text-amber-300',
        audit: 'bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800/30 text-purple-700 dark:text-purple-300',
    };

    return (
        <div className={`flex items-start gap-2 px-3 py-2 rounded-lg border text-xs ${styles[type]}`}>
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{children}</span>
        </div>
    );
}

function formatCurrency(amount: number, region: string): string {
    const isIndia = region === 'INDIA';
    const symbol = isIndia ? '₹' : '$';
    return `${symbol}${amount.toLocaleString()}`;
}
