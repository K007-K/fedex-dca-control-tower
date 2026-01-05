'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, useEffect } from 'react';

import { useToast } from '@/components/ui';
import { Button } from '@/components/ui/button';

interface RegionAssignment {
    region_id: string;
    region_name: string;
    capacity: number;
    priority: number;
    is_active: boolean;
}

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
        license_number?: string;
        license_authority?: string;
        region_dca_assignments?: RegionAssignment[];
    };
}

const STATUS_OPTIONS = ['ACTIVE', 'SUSPENDED', 'TERMINATED', 'PENDING_APPROVAL'];

// Lock icon SVG component
const LockIcon = () => (
    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
);

export function DCAEditForm({ dca }: DCAFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const toast = useToast();

    // Region assignments (read-only display)
    const [regionAssignments, setRegionAssignments] = useState<RegionAssignment[]>([]);

    // Load region assignments
    useEffect(() => {
        async function fetchRegionAssignments() {
            try {
                const res = await fetch(`/api/dcas/${dca.id}/regions`);
                if (res.ok) {
                    const data = await res.json();
                    setRegionAssignments(data.data || []);
                }
            } catch (error) {
                console.error('Failed to fetch region assignments:', error);
            }
        }
        fetchRegionAssignments();
    }, [dca.id]);

    // EDITABLE fields only
    const [formData, setFormData] = useState({
        // Editable
        status: dca.status,
        commission_rate: dca.commission_rate ?? 0,
        min_case_value: dca.min_case_value ?? '',
        max_case_value: dca.max_case_value ?? '',
        primary_contact_name: dca.primary_contact_name ?? '',
        primary_contact_email: dca.primary_contact_email ?? '',
        primary_contact_phone: dca.primary_contact_phone ?? '',
        contract_end_date: dca.contract_end_date ?? '',
        license_expiry: dca.license_expiry ?? '',
        license_authority: dca.license_authority ?? '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Status transition validation
    const canActivate = () => {
        // INACTIVE → ACTIVE requires valid license and capacity
        if (dca.status !== 'ACTIVE' && formData.status === 'ACTIVE') {
            const hasValidLicense = formData.license_expiry && new Date(formData.license_expiry) > new Date();
            const hasCapacity = regionAssignments.some(r => r.capacity > 0);
            return hasValidLicense && hasCapacity;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate status transition
        if (!canActivate()) {
            toast.error('Validation Error', 'Cannot activate DCA without valid license and capacity');
            return;
        }

        startTransition(async () => {
            try {
                // Only send EDITABLE fields - immutable fields are stripped
                const payload = {
                    status: formData.status,
                    commission_rate: parseFloat(String(formData.commission_rate)),
                    min_case_value: formData.min_case_value ? parseFloat(String(formData.min_case_value)) : null,
                    max_case_value: formData.max_case_value ? parseFloat(String(formData.max_case_value)) : null,
                    primary_contact_name: formData.primary_contact_name || null,
                    primary_contact_email: formData.primary_contact_email || null,
                    primary_contact_phone: formData.primary_contact_phone || null,
                    contract_end_date: formData.contract_end_date || null,
                    license_expiry: formData.license_expiry || null,
                    license_authority: formData.license_authority || null,
                };

                const response = await fetch(`/api/dcas/${dca.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
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
            {/* Governance Notice */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-center gap-2">
                    <LockIcon />
                    <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
                        Governance Protected
                    </span>
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                    Core identity fields (Name, Registration, Region) are immutable after creation.
                </p>
            </div>

            {/* IMMUTABLE: Basic Information (READ-ONLY) */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Identity (Immutable)</h2>
                    <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <LockIcon /> Locked
                    </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                            DCA Name
                        </label>
                        <div className="px-3 py-2 bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-lg text-gray-700 dark:text-gray-300">
                            {dca.name}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                            Legal Name
                        </label>
                        <div className="px-3 py-2 bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-lg text-gray-700 dark:text-gray-300">
                            {dca.legal_name || '—'}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                            Registration Number
                        </label>
                        <div className="px-3 py-2 bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-lg text-gray-700 dark:text-gray-300">
                            {dca.registration_number || '—'}
                        </div>
                    </div>
                </div>
            </div>

            {/* IMMUTABLE: Region Assignments (READ-ONLY) */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Region Assignments (Immutable)</h2>
                    <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <LockIcon /> Locked
                    </span>
                </div>
                {regionAssignments.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-[#333]">
                            <thead className="bg-gray-50 dark:bg-[#0a0a0a]">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Region</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Capacity</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Priority</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-[#333]">
                                {regionAssignments.map(ra => (
                                    <tr key={ra.region_id}>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{ra.region_name}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{ra.capacity} cases</td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{ra.priority}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-xs rounded ${ra.is_active ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                                                {ra.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No region assignments found.</p>
                )}
            </div>

            {/* EDITABLE: Status */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Status Management</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Status
                        </label>
                        <select
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                        >
                            {STATUS_OPTIONS.map(status => (
                                <option key={status} value={status}>
                                    {status.replace('_', ' ')}
                                </option>
                            ))}
                        </select>
                        {formData.status === 'ACTIVE' && dca.status !== 'ACTIVE' && !canActivate() && (
                            <p className="mt-1 text-xs text-red-500">
                                ⚠️ Cannot activate: Requires valid license and capacity
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* EDITABLE: License & Compliance */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">License & Compliance</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                            License Number <span className="text-xs">(Immutable)</span>
                        </label>
                        <div className="px-3 py-2 bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-lg text-gray-700 dark:text-gray-300">
                            {dca.license_number || '—'}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="license_authority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Issuing Authority
                        </label>
                        <input
                            type="text"
                            id="license_authority"
                            name="license_authority"
                            value={formData.license_authority}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <div>
                        <label htmlFor="license_expiry" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            License Expiry Date
                        </label>
                        <input
                            type="date"
                            id="license_expiry"
                            name="license_expiry"
                            value={formData.license_expiry}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                        {formData.license_expiry && new Date(formData.license_expiry) < new Date() && (
                            <p className="mt-1 text-xs text-red-500">⚠️ License expired</p>
                        )}
                    </div>
                </div>
            </div>

            {/* EDITABLE: Contract Terms */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contract Terms</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                            Contract Start Date <span className="text-xs">(Immutable)</span>
                        </label>
                        <div className="px-3 py-2 bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-lg text-gray-700 dark:text-gray-300">
                            {dca.contract_start_date || '—'}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="contract_end_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Contract End Date
                        </label>
                        <input
                            type="date"
                            id="contract_end_date"
                            name="contract_end_date"
                            value={formData.contract_end_date}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <div>
                        <label htmlFor="commission_rate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                            className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                    </div>
                </div>
            </div>

            {/* EDITABLE: Primary Contact */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Primary Contact</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label htmlFor="primary_contact_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Contact Name
                        </label>
                        <input
                            type="text"
                            id="primary_contact_name"
                            name="primary_contact_name"
                            value={formData.primary_contact_name}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <div>
                        <label htmlFor="primary_contact_email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Contact Email
                        </label>
                        <input
                            type="email"
                            id="primary_contact_email"
                            name="primary_contact_email"
                            value={formData.primary_contact_email}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <div>
                        <label htmlFor="primary_contact_phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Contact Phone
                        </label>
                        <input
                            type="tel"
                            id="primary_contact_phone"
                            name="primary_contact_phone"
                            value={formData.primary_contact_phone}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
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
