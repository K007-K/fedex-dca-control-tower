'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui';

interface PasswordRequirements {
    requirements: string[];
    minLength: number;
    maxLength: number;
}

export default function SecuritySettingsPage() {
    const toast = useToast();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [saving, setSaving] = useState(false);
    const [requirements, setRequirements] = useState<PasswordRequirements | null>(null);

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

    // Validate password as user types
    useEffect(() => {
        setPasswordChecks({
            minLength: newPassword.length >= 12,
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
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="Enter current password"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                New Password
                            </label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="Enter new password"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="Confirm new password"
                            />
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
                                At least 12 characters
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

            {/* Danger Zone */}
            <div className="bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-200 dark:border-red-500/30 p-6">
                <h3 className="text-lg font-medium text-red-800 dark:text-red-400 mb-2">Danger Zone</h3>
                <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                    Account deletion is permanent. All your data will be removed and cannot be recovered.
                </p>
                <button
                    onClick={() => toast.error('Please contact your administrator to request account deletion')}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                    Request Account Deletion
                </button>
            </div>
        </div>
    );
}
