'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui';

export default function SettingsPage() {
    const toast = useToast();
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch('/api/settings/profile');
                if (res.ok) {
                    const data = await res.json();
                    setDisplayName(data.display_name || data.full_name || '');
                    setEmail(data.email || '');
                    setRole(data.role || 'ADMIN');
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
            const res = await fetch('/api/settings/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ display_name: displayName }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success('Profile updated successfully');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    const roleLabels: Record<string, string> = {
        'SUPER_ADMIN': 'Super Administrator',
        'ADMIN': 'FedEx Administrator',
        'MANAGER': 'Manager',
        'ANALYST': 'Analyst',
        'VIEWER': 'Viewer',
    };

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

                    <div className="space-y-4">
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
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                disabled
                                className="w-full px-4 py-2 border border-gray-200 dark:border-[#222] rounded-lg bg-gray-50 dark:bg-[#1a1a1a] text-gray-500 dark:text-gray-400"
                            />
                            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Email cannot be changed</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Role
                            </label>
                            <input
                                type="text"
                                value={roleLabels[role] || role}
                                disabled
                                className="w-full px-4 py-2 border border-gray-200 dark:border-[#222] rounded-lg bg-gray-50 dark:bg-[#1a1a1a] text-gray-500 dark:text-gray-400"
                            />
                        </div>
                    </div>

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
