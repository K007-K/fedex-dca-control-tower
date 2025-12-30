'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import { useToast } from '@/components/ui';
import { Button } from '@/components/ui/button';

interface NotificationPreference {
    id: string;
    label: string;
    description: string;
    email: boolean;
    inApp: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreference[] = [
    {
        id: 'case_updates',
        label: 'Case Updates',
        description: 'Receive notifications when cases are updated or status changes',
        email: true,
        inApp: true,
    },
    {
        id: 'sla_alerts',
        label: 'SLA Alerts',
        description: 'Get alerted when SLA deadlines are approaching or breached',
        email: true,
        inApp: true,
    },
    {
        id: 'dca_performance',
        label: 'DCA Performance',
        description: 'Weekly updates on DCA performance metrics',
        email: false,
        inApp: true,
    },
    {
        id: 'escalations',
        label: 'Escalations',
        description: 'Immediate notification for case escalations',
        email: true,
        inApp: true,
    },
    {
        id: 'system_updates',
        label: 'System Updates',
        description: 'Platform updates, maintenance notices, and new features',
        email: false,
        inApp: true,
    },
];

export default function NotificationPreferencesPage() {
    const router = useRouter();
    const toast = useToast();
    const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    // Fetch saved preferences on mount
    useEffect(() => {
        const fetchPreferences = async () => {
            try {
                const res = await fetch('/api/settings/notifications');
                if (res.ok) {
                    const data = await res.json();
                    // Merge saved preferences with defaults
                    setPreferences(prev => prev.map(pref => ({
                        ...pref,
                        email: data[pref.id]?.email ?? pref.email,
                        inApp: data[pref.id]?.inApp ?? pref.inApp,
                    })));
                }
            } catch {
                // Use defaults on error
            } finally {
                setLoading(false);
            }
        };
        fetchPreferences();
    }, []);

    const togglePreference = (id: string, type: 'email' | 'inApp') => {
        setPreferences(prev =>
            prev.map(pref =>
                pref.id === id ? { ...pref, [type]: !pref[type] } : pref
            )
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
                <p className="text-gray-500 dark:text-gray-400">Manage how and when you receive notifications</p>
            </div>

            {/* Preferences */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] divide-y divide-gray-200 dark:divide-[#222]">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 dark:bg-[#0a0a0a] text-sm font-medium text-gray-500 dark:text-gray-400">
                    <div className="col-span-6">Notification Type</div>
                    <div className="col-span-3 text-center">Email</div>
                    <div className="col-span-3 text-center">In-App</div>
                </div>

                {/* Preference Rows */}
                {preferences.map(pref => (
                    <div key={pref.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
                        <div className="col-span-6">
                            <p className="font-medium text-gray-900 dark:text-white">{pref.label}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{pref.description}</p>
                        </div>
                        <div className="col-span-3 text-center">
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
                        </div>
                        <div className="col-span-3 text-center">
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
                        </div>
                    </div>
                ))}
            </div>

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
            <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg p-4">
                <p className="text-sm text-blue-700 dark:text-blue-400">
                    <strong>Note:</strong> Email notifications are sent to your registered email address.
                    You can update your email in your profile settings.
                </p>
            </div>
        </div>
    );
}
