'use client';

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

import { useToast, useConfirm } from '@/components/ui';
import { Button } from '@/components/ui/button';

const slaTypes = [
    { value: 'FIRST_CONTACT', label: 'First Contact' },
    { value: 'WEEKLY_UPDATE', label: 'Weekly Update' },
    { value: 'MONTHLY_REPORT', label: 'Monthly Report' },
    { value: 'RESPONSE_TO_DISPUTE', label: 'Dispute Response' },
    { value: 'RECOVERY_TARGET', label: 'Recovery Target' },
    { value: 'DOCUMENTATION_SUBMISSION', label: 'Documentation' },
];

interface SLATemplate {
    id: string;
    name: string;
    sla_type: string;
    description: string | null;
    duration_hours: number;
    business_hours_only: boolean;
    auto_escalate_on_breach: boolean;
    is_active: boolean;
}

export default function EditSLATemplatePage() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();
    const toast = useToast();
    const { confirm } = useConfirm();

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        sla_type: 'FIRST_CONTACT',
        description: '',
        duration_hours: 24,
        business_hours_only: false,
        auto_escalate_on_breach: true,
        is_active: true,
    });

    useEffect(() => {
        const fetchTemplate = async () => {
            try {
                const res = await fetch(`/api/sla/${id}`);
                if (!res.ok) throw new Error('Failed to fetch template');

                const { data } = await res.json() as { data: SLATemplate };
                setFormData({
                    name: data.name,
                    sla_type: data.sla_type,
                    description: data.description ?? '',
                    duration_hours: data.duration_hours,
                    business_hours_only: data.business_hours_only,
                    auto_escalate_on_breach: data.auto_escalate_on_breach,
                    is_active: data.is_active,
                });
            } catch (error) {
                toast.error('Failed to load template');
                console.error(error);
            } finally {
                setFetching(false);
            }
        };
        fetchTemplate();
    }, [id, toast]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`/api/sla/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to update template');
            }

            toast.success('SLA template updated successfully');
            router.push('/sla');
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update template');
        } finally {
            setLoading(false);
        }
    };

    const handleDeactivate = async () => {
        const confirmed = await confirm({
            title: 'Deactivate SLA Template',
            message: 'This will prevent the template from being applied to new cases. Existing SLA logs will not be affected.',
            confirmText: 'Deactivate',
            variant: 'danger',
        });

        if (!confirmed) return;

        try {
            const res = await fetch(`/api/sla/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to deactivate');

            toast.success('SLA template deactivated');
            router.push('/sla');
            router.refresh();
        } catch (error) {
            toast.error('Failed to deactivate template');
            console.error(error);
        }
    };

    if (fetching) {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <Link href="/sla" className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block">
                    ← Back to SLA Management
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Edit SLA Template</h1>
                <p className="text-gray-500">Modify service level agreement settings</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
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
                    />
                </div>

                {/* SLA Type (readonly) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        SLA Type
                    </label>
                    <select
                        disabled
                        value={formData.sla_type}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                    >
                        {slaTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                    <p className="text-sm text-gray-500 mt-1">SLA type cannot be changed after creation</p>
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
                            <p className="text-sm text-gray-500">Only count hours during business days</p>
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
                            <p className="text-sm text-gray-500">Automatically escalate when breached</p>
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
                <div className="flex justify-between pt-4 border-t border-gray-200">
                    <div className="flex gap-3">
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Link href="/sla">
                            <Button variant="secondary" type="button">Cancel</Button>
                        </Link>
                    </div>

                    {formData.is_active && (
                        <Button
                            type="button"
                            variant="danger"
                            onClick={handleDeactivate}
                        >
                            Deactivate
                        </Button>
                    )}
                </div>
            </form>
        </div>
    );
}
