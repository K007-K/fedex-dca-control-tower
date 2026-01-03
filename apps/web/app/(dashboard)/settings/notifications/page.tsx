'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import { useToast } from '@/components/ui';
import { Button } from '@/components/ui/button';
import {
    GOVERNED_NOTIFICATIONS,
    getNotificationsForRole,
    getTierBadgeColor,
    type NotificationConfig
} from '@/lib/notifications/governance';
import { type UserRole } from '@/lib/auth/rbac';

interface NotificationPreference extends NotificationConfig {
    email: boolean;
    inApp: boolean;
}

export default function NotificationPreferencesPage() {
    const router = useRouter();
    const toast = useToast();
    const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<UserRole>('FEDEX_VIEWER');

    // Fetch saved preferences and user role on mount
    useEffect(() => {
        const fetchPreferences = async () => {
            try {
                const res = await fetch('/api/settings/notifications');
                if (res.ok) {
                    const data = await res.json();
                    setUserRole(data.userRole || 'FEDEX_VIEWER');

                    // Get notifications for this role
                    const roleNotifications = getNotificationsForRole(data.userRole || 'FEDEX_VIEWER');

                    // Merge saved preferences with defaults
                    const mergedPrefs = roleNotifications.map(notification => ({
                        ...notification,
                        email: data.preferences?.[notification.id]?.email ?? notification.defaultEmail,
                        inApp: data.preferences?.[notification.id]?.inApp ?? notification.defaultInApp,
                    }));

                    setPreferences(mergedPrefs);
                } else {
                    // Use defaults for FEDEX_VIEWER on error
                    const defaultNotifications = getNotificationsForRole('FEDEX_VIEWER');
                    setPreferences(defaultNotifications.map(n => ({
                        ...n,
                        email: n.defaultEmail,
                        inApp: n.defaultInApp,
                    })));
                }
            } catch {
                // Use defaults on error
                const defaultNotifications = getNotificationsForRole('FEDEX_VIEWER');
                setPreferences(defaultNotifications.map(n => ({
                    ...n,
                    email: n.defaultEmail,
                    inApp: n.defaultInApp,
                })));
            } finally {
                setLoading(false);
            }
        };
        fetchPreferences();
    }, []);

    const togglePreference = (id: string, type: 'email' | 'inApp') => {
        setPreferences(prev =>
            prev.map(pref => {
                // GOVERNANCE: Cannot toggle non-disableable notifications
                if (pref.id === id && !pref.isNonDisableable) {
                    return { ...pref, [type]: !pref[type] };
                }
                return pref;
            })
        );
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Convert to object format for storage
            const prefsObject = preferences.reduce((acc, pref) => ({
                ...acc,
                [pref.id]: { email: pref.email, inApp: pref.inApp },
            }), {});

            const res = await fetch('/api/settings/notifications', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ preferences: prefsObject }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success('Preferences saved successfully');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to save preferences');
        } finally {
            setSaving(false);
        }
    };

    // Group notifications by category
    const groupedPreferences = preferences.reduce((acc, pref) => {
        if (!acc[pref.category]) acc[pref.category] = [];
        acc[pref.category].push(pref);
        return acc;
    }, {} as Record<string, NotificationPreference[]>);

    const categoryLabels: Record<string, string> = {
        'SYSTEM': '🔒 System Alerts',
        'CASE': '📁 Case Notifications',
        'DCA': '🏢 DCA Updates',
        'PLATFORM': '📢 Platform',
    };

    if (loading) {
        return (
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="h-8 w-48 bg-gray-200 dark:bg-[#1a1a1a] rounded animate-pulse" />
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="flex justify-between py-4 border-b border-gray-200 dark:border-[#222] last:border-0">
                            <div className="space-y-2">
                                <div className="h-4 w-32 bg-gray-200 dark:bg-[#1a1a1a] rounded animate-pulse" />
                                <div className="h-3 w-64 bg-gray-100 dark:bg-[#222] rounded animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Breadcrumb Navigation */}
            <div>
                <nav className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                    <Link href="/settings" className="hover:text-gray-700 dark:hover:text-gray-300">Settings</Link>
                    <span className="mx-2">/</span>
                    <span className="text-gray-900 dark:text-white">Notification Preferences</span>
                </nav>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notification Preferences</h1>
                <p className="text-gray-500 dark:text-gray-400">Manage how you receive SYSTEM-generated notifications</p>
            </div>

            {/* SYSTEM Governance Notice */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300">SYSTEM-Owned Notifications</h3>
                        <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                            Notifications are emitted by SYSTEM based on real events. Critical alerts (marked with 🔒)
                            cannot be disabled as they are essential for compliance and security.
                        </p>
                    </div>
                </div>
            </div>

            {/* Role Scope Indicator */}
            <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500 dark:text-gray-400">Your Role:</span>
                <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 font-medium">
                    {userRole}
                </span>
                <span className="text-gray-400 dark:text-gray-500">•</span>
                <span className="text-gray-500 dark:text-gray-400">
                    Showing {preferences.length} notifications eligible for your role
                </span>
            </div>

            {/* Preferences by Category */}
            {Object.entries(groupedPreferences).map(([category, prefs]) => (
                <div key={category} className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] overflow-hidden">
                    {/* Category Header */}
                    <div className="px-4 py-3 bg-gray-50 dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-[#222]">
                        <h2 className="font-semibold text-gray-900 dark:text-white">
                            {categoryLabels[category] || category}
                        </h2>
                    </div>

                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-[#222]">
                        <div className="col-span-6">Notification</div>
                        <div className="col-span-3 text-center">Email</div>
                        <div className="col-span-3 text-center">In-App</div>
                    </div>

                    {/* Preference Rows */}
                    <div className="divide-y divide-gray-100 dark:divide-[#222]">
                        {prefs.map(pref => {
                            const tierColor = getTierBadgeColor(pref.tier);
                            const isLocked = pref.isNonDisableable;

                            return (
                                <div key={pref.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
                                    <div className="col-span-6">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-gray-900 dark:text-white">{pref.label}</p>
                                            {isLocked && (
                                                <span className="text-red-500 text-sm" title="Required system alert — cannot be disabled">🔒</span>
                                            )}
                                            <span className={`text-xs px-1.5 py-0.5 rounded ${tierColor.bg} ${tierColor.text}`}>
                                                {pref.tier}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{pref.description}</p>
                                    </div>
                                    <div className="col-span-3 text-center">
                                        {isLocked ? (
                                            <div className="inline-flex items-center gap-1" title="Required system alert — cannot be disabled">
                                                <div className="w-10 h-6 rounded-full bg-primary opacity-60 cursor-not-allowed relative">
                                                    <span className="block w-4 h-4 rounded-full bg-white shadow absolute top-1 right-1" />
                                                </div>
                                                <span className="text-xs text-gray-400">Required</span>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => togglePreference(pref.id, 'email')}
                                                className={`w-10 h-6 rounded-full transition-colors ${pref.email ? 'bg-primary' : 'bg-gray-300 dark:bg-[#333]'
                                                    }`}
                                            >
                                                <span
                                                    className={`block w-4 h-4 rounded-full bg-white shadow transition-transform ${pref.email ? 'translate-x-5' : 'translate-x-1'
                                                        }`}
                                                />
                                            </button>
                                        )}
                                    </div>
                                    <div className="col-span-3 text-center">
                                        {isLocked ? (
                                            <div className="inline-flex items-center gap-1" title="Required system alert — cannot be disabled">
                                                <div className="w-10 h-6 rounded-full bg-primary opacity-60 cursor-not-allowed relative">
                                                    <span className="block w-4 h-4 rounded-full bg-white shadow absolute top-1 right-1" />
                                                </div>
                                                <span className="text-xs text-gray-400">Required</span>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => togglePreference(pref.id, 'inApp')}
                                                className={`w-10 h-6 rounded-full transition-colors ${pref.inApp ? 'bg-primary' : 'bg-gray-300 dark:bg-[#333]'
                                                    }`}
                                            >
                                                <span
                                                    className={`block w-4 h-4 rounded-full bg-white shadow transition-transform ${pref.inApp ? 'translate-x-5' : 'translate-x-1'
                                                        }`}
                                                />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}

            {/* Actions */}
            <div className="flex justify-between">
                <Button variant="outline" onClick={() => router.back()}>
                    Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Preferences'}
                </Button>
            </div>

            {/* Info */}
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg p-4">
                <p className="text-sm text-amber-700 dark:text-amber-400">
                    <strong>Note:</strong> Critical alerts (🔒) are always delivered via both email and in-app
                    to ensure compliance. These cannot be disabled as they contain essential security and
                    operational information.
                </p>
            </div>
        </div>
    );
}
