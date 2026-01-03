'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui';
import { DisabledActionHint } from '@/components/ui/DisabledActionHint';
import { isGovernanceRole } from '@/lib/auth/rbac';

export default function SettingsPage() {
    const toast = useToast();
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Governance metadata from backend
    const [editableFields, setEditableFields] = useState<string[]>([]);
    const [securityVisibility, setSecurityVisibility] = useState<string[]>([]);
    const [lastLogin, setLastLogin] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch('/api/settings/profile');
                if (res.ok) {
                    const data = await res.json();
                    setDisplayName(data.display_name || data.full_name || '');
                    setEmail(data.email || '');
                    setRole(data.role || 'FEDEX_VIEWER');
                    setPhone(data.phone || '');
                    // Governance metadata
                    setEditableFields(data.editable_fields || ['display_name']);
                    setSecurityVisibility(data.security_visibility || []);
                    setLastLogin(data.last_login || null);
                }
            } catch {
                // Use defaults
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            // Build payload with only editable fields
            const payload: Record<string, string> = {};
            if (editableFields.includes('display_name') || editableFields.includes('full_name')) {
                payload.display_name = displayName;
            }
            if (editableFields.includes('phone')) {
                payload.phone = phone;
            }

            const res = await fetch('/api/settings/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) {
                if (data.violations) {
                    toast.error(`Access denied: ${data.violations.join(', ')}`);
                } else {
                    throw new Error(data.error);
                }
                return;
            }

            toast.success('Profile updated successfully');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    const roleLabels: Record<string, string> = {
        'SUPER_ADMIN': 'Super Administrator',
        'FEDEX_ADMIN': 'FedEx Administrator',
        'FEDEX_MANAGER': 'FedEx Manager',
        'FEDEX_ANALYST': 'FedEx Analyst',
        'FEDEX_AUDITOR': 'FedEx Auditor',
        'FEDEX_VIEWER': 'FedEx Viewer',
        'DCA_ADMIN': 'DCA Administrator',
        'DCA_MANAGER': 'DCA Manager',
        'DCA_AGENT': 'DCA Agent',
        'ADMIN': 'Administrator',
        'MANAGER': 'Manager',
        'ANALYST': 'Analyst',
        'VIEWER': 'Viewer',
    };

    const canEditPhone = editableFields.includes('phone');

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 w-32 bg-gray-200 dark:bg-[#1a1a1a] rounded animate-pulse" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-4 h-48 animate-pulse" />
                    <div className="lg:col-span-2 bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6 h-64 animate-pulse" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
                <p className="text-gray-500 dark:text-gray-400">Manage your account and system preferences</p>
            </div>

            {/* Settings Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sidebar */}
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-4">
                    <nav className="space-y-1">
                        <a href="/settings" className="flex items-center px-3 py-2 text-sm font-medium text-gray-900 dark:text-white bg-gray-100 dark:bg-[#1a1a1a] rounded-lg">
                            Profile
                        </a>
                        <a href="/settings/users" className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] rounded-lg">
                            Users
                        </a>
                        <a href="/settings/notifications" className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] rounded-lg">
                            Notifications
                        </a>
                        <a href="/settings/security" className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] rounded-lg">
                            Security
                        </a>
                        <a href="/settings/integrations" className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] rounded-lg">
                            Integrations
                        </a>
                        {/* Platform Governance - SUPER_ADMIN only */}
                        {role === 'SUPER_ADMIN' && (
                            <a href="/settings/governance" className="flex items-center px-3 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg">
                                🏛️ Platform Governance
                            </a>
                        )}
                    </nav>
                </div>

                {/* Content */}
                <div className="lg:col-span-2 bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profile Settings</h3>

                    {/* Role-based edit notice */}
                    <div className="mb-4 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-[#0a0a0a] rounded-lg p-3">
                        <span className="font-medium">Editable fields for your role:</span>{' '}
                        {editableFields.length > 0 ? editableFields.join(', ') : 'Display Name only'}
                    </div>

                    <div className="space-y-4">
                        {/* Display Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Display Name
                            </label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Your name"
                                className="w-full px-4 py-2 border border-gray-200 dark:border-[#222] rounded-lg bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                        </div>

                        {/* Email - Always Read Only */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                disabled
                                className="w-full px-4 py-2 border border-gray-200 dark:border-[#222] rounded-lg bg-gray-50 dark:bg-[#1a1a1a] text-gray-500 dark:text-gray-400 cursor-not-allowed"
                            />
                            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                                Restricted for security — Email is a security identifier
                            </p>
                        </div>

                        {/* Role - Always Read Only */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Role
                            </label>
                            <input
                                type="text"
                                value={roleLabels[role] || role}
                                disabled
                                className="w-full px-4 py-2 border border-gray-200 dark:border-[#222] rounded-lg bg-gray-50 dark:bg-[#1a1a1a] text-gray-500 dark:text-gray-400 cursor-not-allowed"
                            />
                            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2A11.954 11.954 0 0110 1.944z" clipRule="evenodd" /></svg>
                                {role === 'SUPER_ADMIN'
                                    ? 'Role is system-protected — Cannot be modified'
                                    : 'Role managed by administrator — Contact admin to change'}
                            </p>
                        </div>

                        {/* Phone - Role-dependent */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Phone {!canEditPhone && <span className="text-xs text-gray-400">(view only)</span>}
                            </label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                disabled={!canEditPhone}
                                placeholder={canEditPhone ? "+1 (555) 000-0000" : "Not editable for your role"}
                                className={`w-full px-4 py-2 border border-gray-200 dark:border-[#222] rounded-lg ${canEditPhone
                                        ? 'bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
                                        : 'bg-gray-50 dark:bg-[#1a1a1a] text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                    }`}
                            />
                            {!canEditPhone && (
                                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                                    Phone editing not available for {roleLabels[role] || role}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Security Overview (Role-aware) */}
                    {securityVisibility.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-[#222]">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Security Overview</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {securityVisibility.includes('last_login') && (
                                    <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-lg p-3">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Last Login</p>
                                        <p className="text-sm text-gray-900 dark:text-white">
                                            {lastLogin ? new Date(lastLogin).toLocaleString() : 'Unknown'}
                                        </p>
                                    </div>
                                )}
                                {securityVisibility.includes('active_sessions') && (
                                    <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-lg p-3">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Active Sessions</p>
                                        <p className="text-sm text-gray-900 dark:text-white">
                                            1 (current) — <a href="/settings/security" className="text-primary hover:underline">Manage</a>
                                        </p>
                                    </div>
                                )}
                                {securityVisibility.includes('mfa_status') && (
                                    <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-lg p-3">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Two-Factor Auth</p>
                                        <p className="text-sm text-amber-600 dark:text-amber-400">Not yet enabled</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Governance mode hint for SUPER_ADMIN */}
                    {isGovernanceRole(role as any) && (
                        <div className="mt-4">
                            <DisabledActionHint
                                action="Administrative Actions"
                                reason="SUPER_ADMIN provides oversight and governance. System configuration requires FEDEX_ADMIN."
                                isSystemControlled={false}
                                allowedRole="FEDEX_ADMIN"
                                mode="inline"
                            />
                        </div>
                    )}

                    <div className="mt-6 pt-6 border-t border-gray-100 dark:border-[#222]">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
