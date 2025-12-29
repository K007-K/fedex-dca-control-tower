'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

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

    const togglePreference = (id: string, type: 'email' | 'inApp') => {
        setPreferences(prev =>
            prev.map(pref =>
                pref.id === id ? { ...pref, [type]: !pref[type] } : pref
            )
        );
    };

    const handleSave = async () => {
        setSaving(true);
        // Simulate save - in production this would call an API
        await new Promise(resolve => setTimeout(resolve, 500));
        toast.success('Preferences saved successfully');
        setSaving(false);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Notification Preferences</h1>
                <p className="text-gray-500">Manage how and when you receive notifications</p>
            </div>

            {/* Preferences */}
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-200">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 text-sm font-medium text-gray-500">
                    <div className="col-span-6">Notification Type</div>
                    <div className="col-span-3 text-center">Email</div>
                    <div className="col-span-3 text-center">In-App</div>
                </div>

                {/* Preference Rows */}
                {preferences.map(pref => (
                    <div key={pref.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50">
                        <div className="col-span-6">
                            <p className="font-medium text-gray-900">{pref.label}</p>
                            <p className="text-sm text-gray-500">{pref.description}</p>
                        </div>
                        <div className="col-span-3 text-center">
                            <button
                                onClick={() => togglePreference(pref.id, 'email')}
                                className={`w-10 h-6 rounded-full transition-colors ${pref.email ? 'bg-primary' : 'bg-gray-300'
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
                                className={`w-10 h-6 rounded-full transition-colors ${pref.inApp ? 'bg-primary' : 'bg-gray-300'
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
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                    <strong>Note:</strong> Email notifications are sent to your registered email address.
                    You can update your email in your profile settings.
                </p>
            </div>
        </div>
    );
}
