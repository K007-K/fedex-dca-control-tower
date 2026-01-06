'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui';

interface PasswordRequirements {
    requirements: string[];
    minLength: number;
    maxLength: number;
}

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

export default function SecuritySettingsPage() {
    const toast = useToast();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [saving, setSaving] = useState(false);
    const [requirements, setRequirements] = useState<PasswordRequirements | null>(null);

    // Show/hide password visibility
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Deletion request state
    const [deletionReason, setDeletionReason] = useState('');
    const [submittingDeletion, setSubmittingDeletion] = useState(false);
    const [showDeletionDialog, setShowDeletionDialog] = useState(false);
    const [ownDeletionRequest, setOwnDeletionRequest] = useState<DeletionRequest | null>(null);
    const [pendingRequests, setPendingRequests] = useState<DeletionRequest[]>([]);
    const [canApprove, setCanApprove] = useState(false);
    const [handlingRequest, setHandlingRequest] = useState<string | null>(null);

    // Password validation state
    const [passwordChecks, setPasswordChecks] = useState({
        minLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecial: false,
        passwordsMatch: false,
    });

    // Fetch password requirements
    useEffect(() => {
        fetch('/api/settings/security/password')
            .then(res => res.json())
            .then(data => setRequirements(data))
            .catch(() => { });
    }, []);

    // Fetch deletion requests on mount
    useEffect(() => {
        const fetchDeletionRequests = async () => {
            try {
                const res = await fetch('/api/account-deletion');
                if (res.ok) {
                    const data = await res.json();
                    setOwnDeletionRequest(data.ownRequest);
                    setPendingRequests(data.pendingRequests || []);
                    setCanApprove(data.canApprove);
                }
            } catch { }
        };
        fetchDeletionRequests();
    }, []);

    // Submit deletion request
    const handleSubmitDeletionRequest = async () => {
        setSubmittingDeletion(true);
        try {
            const res = await fetch('/api/account-deletion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: deletionReason }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success('Deletion request submitted. Awaiting approval from your manager.');
            setOwnDeletionRequest(data.request);
            setShowDeletionDialog(false);
            setDeletionReason('');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to submit request');
        } finally {
            setSubmittingDeletion(false);
        }
    };

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

    // Validate password as user types
    useEffect(() => {
        setPasswordChecks({
            minLength: newPassword.length >= 7,
            hasUppercase: /[A-Z]/.test(newPassword),
            hasLowercase: /[a-z]/.test(newPassword),
            hasNumber: /[0-9]/.test(newPassword),
            hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword),
            passwordsMatch: newPassword === confirmPassword && newPassword.length > 0,
        });
    }, [newPassword, confirmPassword]);

    const allChecksPass = Object.values(passwordChecks).every(Boolean);

    const handlePasswordChange = async () => {
        if (!allChecksPass) {
            toast.error('Please meet all password requirements');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch('/api/settings/security/password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
            });

            const data = await res.json();
            if (!res.ok) {
                if (data.details) {
                    toast.error(data.details.join(', '));
                } else {
                    throw new Error(data.error);
                }
                return;
            }

            toast.success('Password updated successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update password');
        } finally {
            setSaving(false);
        }
    };

    const CheckIcon = ({ passed }: { passed: boolean }) => (
        <span className={`mr-2 ${passed ? 'text-green-500' : 'text-gray-400'}`}>
            {passed ? '✓' : '○'}
        </span>
    );

    // Professional SVG icons for show/hide password
    const EyeIcon = () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
    );

    const EyeOffIcon = () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
    );

    return (
        <div className="space-y-6">
            {/* Breadcrumb Navigation */}
            <div>
                <nav className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                    <Link href="/settings" className="hover:text-gray-700 dark:hover:text-gray-300">Settings</Link>
                    <span className="mx-2">/</span>
                    <span className="text-gray-900 dark:text-white">Security</span>
                </nav>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Security Settings</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your personal account security</p>
            </div>

            {/* Personal Security Notice */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300">Personal Security Only</h3>
                        <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                            This page manages YOUR account security. You cannot change other users&apos; passwords or
                            manage their sessions here. All security changes are logged.
                        </p>
                    </div>
                </div>
            </div>

            {/* Password Section */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Change Password</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Form */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Current Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showCurrentPassword ? 'text' : 'password'}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="Enter current password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1"
                                >
                                    {showCurrentPassword ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showNewPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="Enter new password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1"
                                >
                                    {showNewPassword ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="Confirm new password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1"
                                >
                                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                            </div>
                        </div>
                        <button
                            onClick={handlePasswordChange}
                            disabled={saving || !currentPassword || !allChecksPass}
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? 'Updating...' : 'Update Password'}
                        </button>
                    </div>

                    {/* Requirements Checklist */}
                    <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-lg p-4 border border-gray-200 dark:border-[#222]">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Password Requirements</h4>
                        <ul className="space-y-2 text-sm">
                            <li className={passwordChecks.minLength ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
                                <CheckIcon passed={passwordChecks.minLength} />
                                At least 7 characters
                            </li>
                            <li className={passwordChecks.hasUppercase ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
                                <CheckIcon passed={passwordChecks.hasUppercase} />
                                At least one uppercase letter (A-Z)
                            </li>
                            <li className={passwordChecks.hasLowercase ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
                                <CheckIcon passed={passwordChecks.hasLowercase} />
                                At least one lowercase letter (a-z)
                            </li>
                            <li className={passwordChecks.hasNumber ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
                                <CheckIcon passed={passwordChecks.hasNumber} />
                                At least one number (0-9)
                            </li>
                            <li className={passwordChecks.hasSpecial ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
                                <CheckIcon passed={passwordChecks.hasSpecial} />
                                At least one special character (!@#$%^&*...)
                            </li>
                            <li className={passwordChecks.passwordsMatch ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
                                <CheckIcon passed={passwordChecks.passwordsMatch} />
                                Passwords match
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Two-Factor Authentication */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Two-Factor Authentication</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Add an extra layer of security to your account</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/20 px-3 py-1.5 rounded-lg font-medium">
                            Feature Not Yet Enabled
                        </span>
                    </div>
                </div>
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                    Two-factor authentication will add an additional layer of security by requiring a code from your
                    authenticator app when signing in. This feature is planned for a future release.
                </p>
                {/* No fake toggle - just informational */}
            </div>

            {/* Active Sessions */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Active Sessions</h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center">
                                <span className="text-lg">💻</span>
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">Current Session</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Active now on this browser</p>
                            </div>
                        </div>
                        <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 rounded-full font-medium">Current</span>
                    </div>
                </div>
                <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                    Session management for multiple devices will be available in a future update.
                </p>
            </div>

            {/* Danger Zone - Account Deletion */}
            <div className="bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-200 dark:border-red-500/30 p-6">
                <h3 className="text-lg font-medium text-red-800 dark:text-red-400 mb-2">Danger Zone</h3>
                <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                    Account deletion is permanent. All your data will be removed and cannot be recovered.
                </p>

                {/* Show existing request status */}
                {ownDeletionRequest && (
                    <div className={`p-4 rounded-lg mb-4 ${ownDeletionRequest.status === 'PENDING'
                        ? 'bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/30'
                        : ownDeletionRequest.status === 'APPROVED'
                            ? 'bg-green-100 dark:bg-green-500/20 border border-green-300 dark:border-green-500/30'
                            : 'bg-gray-100 dark:bg-gray-500/20 border border-gray-300 dark:border-gray-500/30'
                        }`}>
                        <div className="flex items-center gap-2">
                            <span className="text-lg">
                                {ownDeletionRequest.status === 'PENDING' ? '⏳' : ownDeletionRequest.status === 'APPROVED' ? '✅' : '❌'}
                            </span>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    Your deletion request is {ownDeletionRequest.status.toLowerCase()}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Submitted on {new Date(ownDeletionRequest.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Request deletion button */}
                {!ownDeletionRequest || ownDeletionRequest.status === 'REJECTED' ? (
                    !showDeletionDialog ? (
                        <button
                            onClick={() => setShowDeletionDialog(true)}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Request Account Deletion
                        </button>
                    ) : (
                        <div className="space-y-3">
                            <textarea
                                value={deletionReason}
                                onChange={(e) => setDeletionReason(e.target.value)}
                                placeholder="Please provide a reason for account deletion (optional)"
                                className="w-full px-3 py-2 border border-red-300 dark:border-red-500/30 rounded-lg bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white"
                                rows={3}
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSubmitDeletionRequest}
                                    disabled={submittingDeletion}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                >
                                    {submittingDeletion ? 'Submitting...' : 'Submit Request'}
                                </button>
                                <button
                                    onClick={() => { setShowDeletionDialog(false); setDeletionReason(''); }}
                                    className="px-4 py-2 bg-gray-200 dark:bg-[#222] text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-[#333] transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                            <p className="text-xs text-red-600 dark:text-red-400">
                                Your request will be sent to your manager/admin for approval.
                            </p>
                        </div>
                    )
                ) : null}
            </div>

            {/* Pending Deletion Requests - For Managers/Admins */}
            {canApprove && pendingRequests.length > 0 && (
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        ⚠️ Pending Deletion Requests ({pendingRequests.length})
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        The following users have requested account deletion. Review and approve or reject each request.
                    </p>
                    <div className="space-y-3">
                        {pendingRequests.map((request) => (
                            <div key={request.id} className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg">
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {request.requester_name || request.requester_email}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {request.requester_email} • {request.requester_role}
                                    </p>
                                    {request.reason && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            Reason: {request.reason}
                                        </p>
                                    )}
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                        Requested: {new Date(request.created_at).toLocaleString()}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleDeletionAction(request.id, 'approve')}
                                        disabled={handlingRequest === request.id}
                                        className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                    >
                                        {handlingRequest === request.id ? '...' : 'Approve'}
                                    </button>
                                    <button
                                        onClick={() => handleDeletionAction(request.id, 'reject')}
                                        disabled={handlingRequest === request.id}
                                        className="px-3 py-1.5 bg-gray-200 dark:bg-[#333] text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-300 dark:hover:bg-[#444] transition-colors disabled:opacity-50"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
