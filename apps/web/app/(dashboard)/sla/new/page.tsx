'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useToast } from '@/components/ui';
import { Button } from '@/components/ui/button';

const slaTypes = [
    { value: 'FIRST_CONTACT', label: 'First Contact' },
    { value: 'WEEKLY_UPDATE', label: 'Weekly Update' },
    { value: 'MONTHLY_REPORT', label: 'Monthly Report' },
    { value: 'RESPONSE_TO_DISPUTE', label: 'Dispute Response' },
    { value: 'RECOVERY_TARGET', label: 'Recovery Target' },
    { value: 'DOCUMENTATION_SUBMISSION', label: 'Documentation' },
];

export default function NewSLATemplatePage() {
    const router = useRouter();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        sla_type: 'FIRST_CONTACT',
        description: '',
        duration_hours: 24,
        business_hours_only: false,
        auto_escalate_on_breach: true,
        is_active: true,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/sla', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to create template');
            }

            toast.success('SLA template created successfully');
            router.push('/sla');
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to create template');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <Link href="/sla" className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-2 inline-block">
                    ← Back to SLA Management
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New SLA Template</h1>
                <p className="text-gray-500 dark:text-gray-400">Define a new service level agreement template</p>
            </div>

            {/* Governance Context Banner */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300">SYSTEM-Enforced Contract</h3>
                        <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                            SLA templates define enforcement contracts. Once a case starts an SLA timer,
                            it cannot be paused, reset, or bypassed. Breaches are detected and escalated automatically by SYSTEM.
                        </p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6 space-y-6">
                {/* Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Template Name *
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="e.g., Standard First Contact SLA"
                    />
                </div>

                {/* SLA Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        SLA Type *
                    </label>
                    <select
                        required
                        value={formData.sla_type}
                        onChange={(e) => setFormData({ ...formData, sla_type: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                        {slaTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                    </label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        rows={3}
                        placeholder="Describe when this SLA applies..."
                    />
                </div>

                {/* Duration */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duration (Hours) *
                    </label>
                    <input
                        type="number"
                        required
                        min={1}
                        value={formData.duration_hours}
                        onChange={(e) => setFormData({ ...formData, duration_hours: parseInt(e.target.value) || 1 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                        Time allowed before SLA is breached
                    </p>
                </div>

                {/* Checkboxes */}
                <div className="space-y-4">
                    <label className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            checked={formData.business_hours_only}
                            onChange={(e) => setFormData({ ...formData, business_hours_only: e.target.checked })}
                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <div>
                            <span className="font-medium text-gray-700">Business Hours Only</span>
                            <p className="text-sm text-gray-500">Only count hours during business days (Mon-Fri, 9am-5pm)</p>
                        </div>
                    </label>

                    <label className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            checked={formData.auto_escalate_on_breach}
                            onChange={(e) => setFormData({ ...formData, auto_escalate_on_breach: e.target.checked })}
                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <div>
                            <span className="font-medium text-gray-700">Auto-Escalate on Breach</span>
                            <p className="text-sm text-gray-500">Automatically escalate when SLA is breached</p>
                        </div>
                    </label>

                    <label className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <div>
                            <span className="font-medium text-gray-700">Active</span>
                            <p className="text-sm text-gray-500">Template will be applied to new cases</p>
                        </div>
                    </label>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <Button type="submit" disabled={loading}>
                        {loading ? 'Creating...' : 'Create Template'}
                    </Button>
                    <Link href="/sla">
                        <Button variant="secondary" type="button">Cancel</Button>
                    </Link>
                </div>
            </form>
        </div>
    );
}
