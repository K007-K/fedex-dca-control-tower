'use client';

/**
 * Account Deletion Requests Page
 * 
 * Managers can view and handle deletion requests from their team members.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/ui';

interface DeletionRequest {
    id: string;
    user_id: string;
    requester_email: string;
    requester_name: string;
    requester_role: string;
    reason: string | null;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
    created_at: string;
}

export default function DeletionRequestsPage() {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [pendingRequests, setPendingRequests] = useState<DeletionRequest[]>([]);
    const [handlingRequest, setHandlingRequest] = useState<string | null>(null);
    const [canApprove, setCanApprove] = useState(false);

    // Fetch deletion requests on mount
    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const res = await fetch('/api/account-deletion');
                if (res.ok) {
                    const data = await res.json();
                    setPendingRequests(data.pendingRequests || []);
                    setCanApprove(data.canApprove);
                }
            } catch (error) {
                console.error('Failed to fetch deletion requests:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchRequests();
    }, []);

    // Handle (approve/reject) a deletion request
    const handleDeletionAction = async (requestId: string, action: 'approve' | 'reject') => {
        setHandlingRequest(requestId);
        try {
            const res = await fetch(`/api/account-deletion/${requestId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success(`Request ${action}d successfully`);
            setPendingRequests(prev => prev.filter(r => r.id !== requestId));
        } catch (error) {
            toast.error(error instanceof Error ? error.message : `Failed to ${action} request`);
        } finally {
            setHandlingRequest(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Loading requests...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Breadcrumb Navigation */}
            <div>
                <nav className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                    <Link href="/settings/security" className="hover:text-gray-700 dark:hover:text-gray-300">Settings</Link>
                    <span className="mx-2">/</span>
                    <span className="text-gray-900 dark:text-white">Deletion Requests</span>
                </nav>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Account Deletion Requests</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Review and handle account deletion requests from your team members
                </p>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300">How This Works</h3>
                        <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                            When a team member requests account deletion, it appears here for your approval.
                            Approving will deactivate their account. Rejecting will notify them and allow them to continue using the system.
                        </p>
                    </div>
                </div>
            </div>

            {/* Pending Requests */}
            {!canApprove ? (
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-[#222] rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Approval Permission</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                        You don&apos;t have permission to approve account deletion requests.
                    </p>
                </div>
            ) : pendingRequests.length === 0 ? (
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">All Clear!</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                        No pending deletion requests from your team members.
                    </p>
                </div>
            ) : (
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-[#222]">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            Pending Requests ({pendingRequests.length})
                        </h3>
                    </div>
                    <div className="divide-y divide-gray-200 dark:divide-[#222]">
                        {pendingRequests.map((request) => (
                            <div key={request.id} className="p-6 flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                                            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {request.requester_name || request.requester_email}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {request.requester_email}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="ml-13 space-y-1">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            <span className="font-medium">Role:</span> {request.requester_role}
                                        </p>
                                        {request.reason && (
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                <span className="font-medium">Reason:</span> {request.reason}
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-400 dark:text-gray-500">
                                            Requested: {new Date(request.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => handleDeletionAction(request.id, 'approve')}
                                        disabled={handlingRequest === request.id}
                                        className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                    >
                                        {handlingRequest === request.id ? 'Processing...' : 'Approve Deletion'}
                                    </button>
                                    <button
                                        onClick={() => handleDeletionAction(request.id, 'reject')}
                                        disabled={handlingRequest === request.id}
                                        className="px-4 py-2 bg-gray-200 dark:bg-[#333] text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-[#444] transition-colors disabled:opacity-50"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Warning Notice */}
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                        <h4 className="text-sm font-medium text-amber-800 dark:text-amber-300">Important</h4>
                        <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                            Approving a deletion request will immediately deactivate the user&apos;s account.
                            This action is logged and auditable. The user will not be able to log in after approval.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
