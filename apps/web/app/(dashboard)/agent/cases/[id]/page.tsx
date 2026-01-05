'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

/**
 * Agent Case Detail Page
 * 
 * PURPOSE: Work on a specific assigned case
 * SCOPE: Only cases assigned to the current agent
 * 
 * Actions available:
 * - Update status (valid transitions only)
 * - Add activity note
 * - Log contact attempt
 * - Record payment
 */

interface CaseDetail {
    id: string;
    case_number: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    outstanding_amount: number;
    original_amount: number;
    currency: string;
    status: string;
    priority: string;
    created_at: string;
    updated_at: string;
    description: string;
}

interface ActivityLog {
    id: string;
    activity_type: string;
    description: string;
    created_at: string;
    created_by_name: string;
}

interface SLAInfo {
    status: string;
    due_at: string;
    hours_remaining: number;
}

// Valid status transitions for agent
const STATUS_TRANSITIONS: Record<string, string[]> = {
    'ALLOCATED': ['IN_PROGRESS', 'CUSTOMER_CONTACTED'],
    'IN_PROGRESS': ['CUSTOMER_CONTACTED', 'DISPUTED'],
    'CUSTOMER_CONTACTED': ['PAYMENT_PROMISED', 'DISPUTED', 'IN_PROGRESS'],
    'PAYMENT_PROMISED': ['PARTIAL_RECOVERY', 'FULL_RECOVERY', 'DISPUTED'],
    'PARTIAL_RECOVERY': ['FULL_RECOVERY', 'PAYMENT_PROMISED'],
    'DISPUTED': ['IN_PROGRESS', 'CUSTOMER_CONTACTED'],
};

export default function AgentCaseDetailPage() {
    const params = useParams();
    const router = useRouter();
    const caseId = params.id as string;

    const [caseData, setCaseData] = useState<CaseDetail | null>(null);
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [slaInfo, setSlaInfo] = useState<SLAInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal states
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showCallbackModal, setShowCallbackModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchCaseData = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/agent/cases/${caseId}`);
            if (response.ok) {
                const data = await response.json();
                setCaseData(data.case);
                setActivities(data.activities || []);
                setSlaInfo(data.sla || null);
            } else if (response.status === 403) {
                setError('This case is not assigned to you.');
            } else if (response.status === 404) {
                setError('Case not found.');
            } else {
                setError('Failed to load case data.');
            }
        } catch (e) {
            console.error('Fetch error:', e);
            setError('Failed to connect to server.');
        } finally {
            setIsLoading(false);
        }
    }, [caseId]);

    useEffect(() => {
        fetchCaseData();
    }, [fetchCaseData]);

    const handleStatusUpdate = async (newStatus: string) => {
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/agent/cases/${caseId}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                await fetchCaseData();
                setShowStatusModal(false);
            } else {
                alert('Failed to update status');
            }
        } catch {
            alert('Error updating status');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddNote = async (note: string) => {
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/agent/cases/${caseId}/activity`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ activity_type: 'NOTE', description: note }),
            });
            if (res.ok) {
                await fetchCaseData();
                setShowNoteModal(false);
            } else {
                alert('Failed to add note');
            }
        } catch {
            alert('Error adding note');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogContact = async (method: string, outcome: string, notes: string) => {
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/agent/cases/${caseId}/activity`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    activity_type: 'CONTACT_ATTEMPT',
                    description: `${method}: ${outcome}. ${notes}`,
                }),
            });
            if (res.ok) {
                await fetchCaseData();
                setShowContactModal(false);
            } else {
                alert('Failed to log contact');
            }
        } catch {
            alert('Error logging contact');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRecordPayment = async (amount: number, method: string, reference: string) => {
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/agent/cases/${caseId}/payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount, method, reference }),
            });
            if (res.ok) {
                await fetchCaseData();
                setShowPaymentModal(false);
            } else {
                alert('Failed to record payment');
            }
        } catch {
            alert('Error recording payment');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleScheduleCallback = async (scheduledFor: string, notes: string) => {
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/agent/calendar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    case_id: caseId,
                    scheduled_for: scheduledFor,
                    notes
                }),
            });
            if (res.ok) {
                await fetchCaseData();
                setShowCallbackModal(false);
            } else {
                alert('Failed to schedule callback');
            }
        } catch {
            alert('Error scheduling callback');
        } finally {
            setIsSubmitting(false);
        }
    };

    const currencySymbol = caseData?.currency === 'USD' ? '$' : '₹';


    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Loading case...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="text-4xl mb-4">🚫</div>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                    <Link href="/agent/cases" className="text-primary hover:underline">
                        ← Back to My Cases
                    </Link>
                </div>
            </div>
        );
    }

    if (!caseData) return null;

    const availableTransitions = STATUS_TRANSITIONS[caseData.status] || [];

    // Check if case is completed (no actions allowed)
    const isCompleted = ['FULL_RECOVERY', 'PARTIAL_RECOVERY', 'CLOSED', 'WRITTEN_OFF'].includes(caseData.status);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link href={isCompleted ? "/agent/history" : "/agent/cases"} className="text-sm text-gray-500 hover:text-primary mb-2 inline-block">
                        ← Back to {isCompleted ? 'Case History' : 'My Cases'}
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{caseData.case_number}</h1>
                    <p className="text-gray-500 dark:text-gray-400">{caseData.customer_name}</p>
                </div>
                <div className="flex items-center gap-2">
                    <StatusBadge status={caseData.status} />
                    <PriorityBadge priority={caseData.priority} />
                </div>
            </div>

            {/* Completed Case Notice */}
            {isCompleted && (
                <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-xl p-4 flex items-center gap-3">
                    <span className="text-2xl">✅</span>
                    <div>
                        <p className="font-medium text-green-700 dark:text-green-400">Case Completed</p>
                        <p className="text-sm text-green-600 dark:text-green-300">
                            This case has been resolved. View-only mode.
                        </p>
                    </div>
                </div>
            )}

            {/* SLA Alert - Only for active cases */}
            {!isCompleted && slaInfo && (
                <SLABanner sla={slaInfo} />
            )}

            {/* Action Buttons - Only for active cases */}
            {!isCompleted && (
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-4">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-3">Actions</h3>
                    <div className="flex flex-wrap gap-2">
                        {availableTransitions.length > 0 && (
                            <button
                                onClick={() => setShowStatusModal(true)}
                                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm"
                            >
                                📋 Update Status
                            </button>
                        )}
                        <button
                            onClick={() => setShowContactModal(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                            📞 Log Contact
                        </button>
                        <button
                            onClick={() => setShowNoteModal(true)}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                        >
                            📝 Add Note
                        </button>
                        <button
                            onClick={() => setShowPaymentModal(true)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                            💰 Record Payment
                        </button>
                    </div>
                </div>
            )}

            {/* Quick Navigation */}
            <div className="flex flex-wrap gap-3">
                <Link
                    href={`/agent/cases/${caseId}/timeline`}
                    className="px-4 py-2 border border-gray-200 dark:border-[#333] rounded-lg hover:bg-gray-100 dark:hover:bg-[#222] transition-colors text-sm flex items-center gap-2"
                >
                    📋 Full Timeline
                </Link>
                <Link
                    href={`/agent/cases/${caseId}/customer`}
                    className="px-4 py-2 border border-gray-200 dark:border-[#333] rounded-lg hover:bg-gray-100 dark:hover:bg-[#222] transition-colors text-sm flex items-center gap-2"
                >
                    👤 Customer Profile
                </Link>
                {/* Schedule Callback - Only for active cases */}
                {!isCompleted && (
                    <button
                        onClick={() => setShowCallbackModal(true)}
                        className="px-4 py-2 border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors text-sm flex items-center gap-2"
                    >
                        📅 Schedule Callback
                    </button>
                )}
            </div>

            {/* Case Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Case Summary */}
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Case Summary</h3>
                    <dl className="space-y-3">
                        <DetailRow label="Outstanding Amount" value={`${currencySymbol}${caseData.outstanding_amount?.toLocaleString()}`} highlight />
                        <DetailRow label="Original Amount" value={`${currencySymbol}${caseData.original_amount?.toLocaleString()}`} />
                        <DetailRow label="Status" value={caseData.status.replace(/_/g, ' ')} />
                        <DetailRow label="Priority" value={caseData.priority} />
                        <DetailRow label="Created" value={new Date(caseData.created_at).toLocaleDateString()} />
                        <DetailRow label="Last Updated" value={new Date(caseData.updated_at).toLocaleDateString()} />
                    </dl>
                </div>

                {/* Customer Details */}
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Customer Details</h3>
                    <dl className="space-y-3">
                        <DetailRow label="Name" value={caseData.customer_name} />
                        <DetailRow label="Email" value={caseData.customer_email || '—'} />
                        <DetailRow label="Phone" value={caseData.customer_phone || '—'} />
                    </dl>
                    {caseData.description && (
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-[#222]">
                            <p className="text-sm text-gray-500 dark:text-gray-400">{caseData.description}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Activity Timeline */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Activity Timeline</h3>
                {activities.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">No activity recorded yet</p>
                ) : (
                    <div className="space-y-4">
                        {activities.map((activity) => (
                            <div key={activity.id} className="flex gap-4 pb-4 border-b border-gray-100 dark:border-[#222] last:border-0">
                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center text-sm">
                                    {getActivityIcon(activity.activity_type)}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-900 dark:text-white">{activity.description}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {activity.created_by_name} • {formatRelativeTime(activity.created_at)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modals */}
            {showStatusModal && (
                <Modal title="Update Status" onClose={() => setShowStatusModal(false)}>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Select the new status for this case:
                    </p>
                    <div className="space-y-2">
                        {availableTransitions.map((status) => (
                            <button
                                key={status}
                                onClick={() => handleStatusUpdate(status)}
                                disabled={isSubmitting}
                                className="w-full px-4 py-3 text-left rounded-lg border border-gray-200 dark:border-[#333] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
                            >
                                {status.replace(/_/g, ' ')}
                            </button>
                        ))}
                    </div>
                </Modal>
            )}

            {showNoteModal && (
                <NoteModal
                    onSubmit={handleAddNote}
                    onClose={() => setShowNoteModal(false)}
                    isSubmitting={isSubmitting}
                />
            )}

            {showContactModal && (
                <ContactModal
                    onSubmit={handleLogContact}
                    onClose={() => setShowContactModal(false)}
                    isSubmitting={isSubmitting}
                />
            )}

            {showPaymentModal && (
                <PaymentModal
                    onSubmit={handleRecordPayment}
                    onClose={() => setShowPaymentModal(false)}
                    isSubmitting={isSubmitting}
                    currency={caseData.currency}
                />
            )}

            {showCallbackModal && (
                <CallbackModal
                    onSubmit={handleScheduleCallback}
                    onClose={() => setShowCallbackModal(false)}
                    isSubmitting={isSubmitting}
                    customerName={caseData.customer_name}
                />
            )}
        </div>
    );
}

// Helper components
function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div className="flex justify-between">
            <dt className="text-sm text-gray-500 dark:text-gray-400">{label}</dt>
            <dd className={`text-sm font-medium ${highlight ? 'text-primary text-lg' : 'text-gray-900 dark:text-white'}`}>
                {value}
            </dd>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const colors: Record<string, string> = {
        ALLOCATED: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
        IN_PROGRESS: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
        CUSTOMER_CONTACTED: 'bg-indigo-500/20 text-indigo-500 border-indigo-500/30',
        PAYMENT_PROMISED: 'bg-cyan-500/20 text-cyan-500 border-cyan-500/30',
        PARTIAL_RECOVERY: 'bg-orange-500/20 text-orange-500 border-orange-500/30',
        FULL_RECOVERY: 'bg-green-500/20 text-green-500 border-green-500/30',
        DISPUTED: 'bg-red-500/20 text-red-500 border-red-500/30',
    };
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${colors[status] || 'bg-gray-500/20 text-gray-500'}`}>
            {status.replace(/_/g, ' ')}
        </span>
    );
}

function PriorityBadge({ priority }: { priority: string }) {
    const colors: Record<string, string> = {
        CRITICAL: 'text-red-500',
        HIGH: 'text-orange-500',
        MEDIUM: 'text-yellow-500',
        LOW: 'text-green-500',
    };
    return (
        <span className={`text-xs font-medium ${colors[priority] || 'text-gray-500'}`}>
            {priority}
        </span>
    );
}

function SLABanner({ sla }: { sla: SLAInfo }) {
    if (sla.status === 'BREACHED' || sla.hours_remaining < 0) {
        return (
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl p-4 flex items-center gap-3">
                <span className="text-2xl">🔴</span>
                <div>
                    <p className="font-medium text-red-700 dark:text-red-400">SLA Breached</p>
                    <p className="text-sm text-red-600 dark:text-red-300">Immediate action required</p>
                </div>
            </div>
        );
    }

    if (sla.hours_remaining < 24) {
        return (
            <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 rounded-xl p-4 flex items-center gap-3">
                <span className="text-2xl">⏰</span>
                <div>
                    <p className="font-medium text-yellow-700 dark:text-yellow-400">SLA Due Soon</p>
                    <p className="text-sm text-yellow-600 dark:text-yellow-300">
                        Due in {formatTimeRemaining(sla.hours_remaining)}
                    </p>
                </div>
            </div>
        );
    }

    return null;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6 w-full max-w-md mx-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>
                {children}
            </div>
        </div>
    );
}

function NoteModal({ onSubmit, onClose, isSubmitting }: { onSubmit: (note: string) => void; onClose: () => void; isSubmitting: boolean }) {
    const [note, setNote] = useState('');
    return (
        <Modal title="Add Note" onClose={onClose}>
            <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Enter your note..."
                className="w-full h-32 px-3 py-2 rounded-lg border border-gray-200 dark:border-[#333] bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white resize-none"
            />
            <div className="flex justify-end gap-2 mt-4">
                <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-900">Cancel</button>
                <button
                    onClick={() => onSubmit(note)}
                    disabled={!note.trim() || isSubmitting}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                    {isSubmitting ? 'Saving...' : 'Save Note'}
                </button>
            </div>
        </Modal>
    );
}

function ContactModal({ onSubmit, onClose, isSubmitting }: { onSubmit: (method: string, outcome: string, notes: string) => void; onClose: () => void; isSubmitting: boolean }) {
    const [method, setMethod] = useState('Phone');
    const [outcome, setOutcome] = useState('Answered');
    const [notes, setNotes] = useState('');
    return (
        <Modal title="Log Contact Attempt" onClose={onClose}>
            <div className="space-y-4">
                <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Method</label>
                    <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-[#333] bg-white dark:bg-[#1a1a1a]">
                        <option>Phone</option>
                        <option>Email</option>
                        <option>SMS</option>
                        <option>In Person</option>
                    </select>
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Outcome</label>
                    <select value={outcome} onChange={(e) => setOutcome(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-[#333] bg-white dark:bg-[#1a1a1a]">
                        <option>Answered</option>
                        <option>No Answer</option>
                        <option>Voicemail</option>
                        <option>Wrong Number</option>
                        <option>Promised Payment</option>
                        <option>Disputed</option>
                    </select>
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Additional notes..."
                        className="w-full mt-1 h-20 px-3 py-2 rounded-lg border border-gray-200 dark:border-[#333] bg-white dark:bg-[#1a1a1a] resize-none"
                    />
                </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
                <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-900">Cancel</button>
                <button onClick={() => onSubmit(method, outcome, notes)} disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                    {isSubmitting ? 'Logging...' : 'Log Contact'}
                </button>
            </div>
        </Modal>
    );
}

function PaymentModal({ onSubmit, onClose, isSubmitting, currency }: { onSubmit: (amount: number, method: string, reference: string) => void; onClose: () => void; isSubmitting: boolean; currency: string }) {
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('Bank Transfer');
    const [reference, setReference] = useState('');
    const symbol = currency === 'USD' ? '$' : '₹';
    return (
        <Modal title="Record Payment" onClose={onClose}>
            <div className="space-y-4">
                <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Amount ({symbol})</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-[#333] bg-white dark:bg-[#1a1a1a]"
                    />
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Payment Method</label>
                    <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-[#333] bg-white dark:bg-[#1a1a1a]">
                        <option>Bank Transfer</option>
                        <option>Credit Card</option>
                        <option>Cash</option>
                        <option>Cheque</option>
                        <option>UPI</option>
                    </select>
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Reference Number</label>
                    <input
                        type="text"
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        placeholder="Transaction ID..."
                        className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-[#333] bg-white dark:bg-[#1a1a1a]"
                    />
                </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
                <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-900">Cancel</button>
                <button onClick={() => onSubmit(parseFloat(amount) || 0, method, reference)} disabled={!amount || isSubmitting} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                    {isSubmitting ? 'Recording...' : 'Record Payment'}
                </button>
            </div>
        </Modal>
    );
}

function CallbackModal({ onSubmit, onClose, isSubmitting, customerName }: { onSubmit: (scheduledFor: string, notes: string) => void; onClose: () => void; isSubmitting: boolean; customerName: string }) {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [notes, setNotes] = useState('');

    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];

    const handleSubmit = () => {
        if (!date || !time) return;
        const isoDate = new Date(`${date}T${time}`).toISOString();
        onSubmit(isoDate, notes);
    };

    return (
        <Modal title="Schedule Callback" onClose={onClose}>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Schedule a callback reminder for <span className="font-medium text-gray-900 dark:text-white">{customerName}</span>
            </p>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                        <input
                            type="date"
                            value={date}
                            min={today}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-[#333] bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Time</label>
                        <input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-[#333] bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                        />
                    </div>
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes (optional)</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Callback purpose, talking points..."
                        className="w-full mt-1 h-20 px-3 py-2 rounded-lg border border-gray-200 dark:border-[#333] bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white resize-none"
                    />
                </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
                <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Cancel</button>
                <button
                    onClick={handleSubmit}
                    disabled={!date || !time || isSubmitting}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                >
                    {isSubmitting ? 'Scheduling...' : '📅 Schedule Callback'}
                </button>
            </div>
        </Modal>
    );
}

function getActivityIcon(type: string): string {
    switch (type) {
        case 'CONTACT_ATTEMPT': return '📞';
        case 'NOTE': return '📝';
        case 'PAYMENT': return '💰';
        case 'STATUS_CHANGE': return '📋';
        default: return '📌';
    }
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

function formatTimeRemaining(hours: number): string {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${Math.floor(hours)}h ${Math.round((hours % 1) * 60)}m`;
    return `${Math.floor(hours / 24)}d ${Math.round(hours % 24)}h`;
}
