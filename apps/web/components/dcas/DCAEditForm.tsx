'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui';

interface DCAFormProps {
    dca: {
        id: string;
        name: string;
        legal_name?: string;
        registration_number?: string;
        status: string;
        capacity_limit: number;
        commission_rate?: number;
        min_case_value?: number;
        max_case_value?: number;
        primary_contact_name?: string;
        primary_contact_email?: string;
        primary_contact_phone?: string;
        contract_start_date?: string;
        contract_end_date?: string;
        license_expiry?: string;
    };
}

const STATUS_OPTIONS = ['ACTIVE', 'SUSPENDED', 'TERMINATED', 'PENDING_APPROVAL'];

export function DCAEditForm({ dca }: DCAFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const toast = useToast();

    const [formData, setFormData] = useState({
        name: dca.name,
        legal_name: dca.legal_name || '',
        registration_number: dca.registration_number || '',
        status: dca.status,
        capacity_limit: dca.capacity_limit || 100,
        commission_rate: dca.commission_rate || 0,
        min_case_value: dca.min_case_value || '',
        max_case_value: dca.max_case_value || '',
        primary_contact_name: dca.primary_contact_name || '',
        primary_contact_email: dca.primary_contact_email || '',
        primary_contact_phone: dca.primary_contact_phone || '',
        contract_start_date: dca.contract_start_date || '',
        contract_end_date: dca.contract_end_date || '',
        license_expiry: dca.license_expiry || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        startTransition(async () => {
            try {
                const response = await fetch(`/api/dcas/${dca.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...formData,
                        capacity_limit: parseInt(String(formData.capacity_limit)),
                        commission_rate: parseFloat(String(formData.commission_rate)),
                        min_case_value: formData.min_case_value ? parseFloat(String(formData.min_case_value)) : null,
                        max_case_value: formData.max_case_value ? parseFloat(String(formData.max_case_value)) : null,
                    }),
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error?.message || 'Failed to update DCA');
                }

                toast.success('DCA Updated', 'DCA has been saved successfully');
                setTimeout(() => {
                    router.push(`/dcas/${dca.id}`);
                    router.refresh();
                }, 1000);
            } catch (err) {
                toast.error('Update Failed', err instanceof Error ? err.message : 'An error occurred');
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                            DCA Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <div>
                        <label htmlFor="legal_name" className="block text-sm font-medium text-gray-700 mb-2">
                            Legal Name
                        </label>
                        <input
                            type="text"
                            id="legal_name"
                            name="legal_name"
                            value={formData.legal_name}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <div>
                        <label htmlFor="registration_number" className="block text-sm font-medium text-gray-700 mb-2">
                            Registration Number
                        </label>
                        <input
                            type="text"
                            id="registration_number"
                            name="registration_number"
                            value={formData.registration_number}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                            Status
                        </label>
                        <select
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        >
                            {STATUS_OPTIONS.map(status => (
                                <option key={status} value={status}>
                                    {status.replace('_', ' ')}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Capacity & Contract */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Capacity & Contract</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label htmlFor="capacity_limit" className="block text-sm font-medium text-gray-700 mb-2">
                            Capacity Limit
                        </label>
                        <input
                            type="number"
                            id="capacity_limit"
                            name="capacity_limit"
                            value={formData.capacity_limit}
                            onChange={handleChange}
                            min="0"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <div>
                        <label htmlFor="commission_rate" className="block text-sm font-medium text-gray-700 mb-2">
                            Commission Rate (%)
                        </label>
                        <input
                            type="number"
                            id="commission_rate"
                            name="commission_rate"
                            value={formData.commission_rate}
                            onChange={handleChange}
                            min="0"
                            max="100"
                            step="0.1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <div>
                        <label htmlFor="license_expiry" className="block text-sm font-medium text-gray-700 mb-2">
                            License Expiry
                        </label>
                        <input
                            type="date"
                            id="license_expiry"
                            name="license_expiry"
                            value={formData.license_expiry}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <div>
                        <label htmlFor="min_case_value" className="block text-sm font-medium text-gray-700 mb-2">
                            Min Case Value ($)
                        </label>
                        <input
                            type="number"
                            id="min_case_value"
                            name="min_case_value"
                            value={formData.min_case_value}
                            onChange={handleChange}
                            min="0"
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <div>
                        <label htmlFor="max_case_value" className="block text-sm font-medium text-gray-700 mb-2">
                            Max Case Value ($)
                        </label>
                        <input
                            type="number"
                            id="max_case_value"
                            name="max_case_value"
                            value={formData.max_case_value}
                            onChange={handleChange}
                            min="0"
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                    </div>
                </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Primary Contact</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label htmlFor="primary_contact_name" className="block text-sm font-medium text-gray-700 mb-2">
                            Contact Name
                        </label>
                        <input
                            type="text"
                            id="primary_contact_name"
                            name="primary_contact_name"
                            value={formData.primary_contact_name}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <div>
                        <label htmlFor="primary_contact_email" className="block text-sm font-medium text-gray-700 mb-2">
                            Contact Email
                        </label>
                        <input
                            type="email"
                            id="primary_contact_email"
                            name="primary_contact_email"
                            value={formData.primary_contact_email}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <div>
                        <label htmlFor="primary_contact_phone" className="block text-sm font-medium text-gray-700 mb-2">
                            Contact Phone
                        </label>
                        <input
                            type="tel"
                            id="primary_contact_phone"
                            name="primary_contact_phone"
                            value={formData.primary_contact_phone}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isPending}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                    {isPending ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
        </form>
    );
}
