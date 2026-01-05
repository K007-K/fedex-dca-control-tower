'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useTransition } from 'react';

import { useToast } from '@/components/ui';
import { Button } from '@/components/ui/button';

const STATUS_OPTIONS = ['PENDING_APPROVAL', 'ACTIVE'];

interface Region {
    id: string;
    name: string;
    code: string;
    status: string;
}

interface RegionCapacity {
    region_id: string;
    region_name: string;
    capacity: number;
    priority: number;
    is_active: boolean;
}

export function DCACreateForm() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const toast = useToast();

    // Available regions from backend
    const [availableRegions, setAvailableRegions] = useState<Region[]>([]);
    const [loadingRegions, setLoadingRegions] = useState(true);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        legal_name: '',
        registration_number: '',
        status: 'PENDING_APPROVAL',
        commission_rate: 15,
        min_case_value: '',
        max_case_value: '',
        primary_contact_name: '',
        primary_contact_email: '',
        primary_contact_phone: '',
        // Compliance fields
        license_number: '',
        license_authority: '',
        license_expiry: '',
        contract_start_date: '',
        contract_end_date: '',
    });

    // Per-region capacity configuration
    const [regionCapacities, setRegionCapacities] = useState<RegionCapacity[]>([]);

    // Fetch available regions on mount
    useEffect(() => {
        async function fetchRegions() {
            try {
                const res = await fetch('/api/regions');
                if (res.ok) {
                    const data = await res.json();
                    const regions = data.data || [];
                    // Filter for active regions or use all if none marked ACTIVE
                    const activeRegions = regions.filter((r: Region) => r.status === 'ACTIVE');

                    if (activeRegions.length > 0) {
                        setAvailableRegions(activeRegions);
                    } else if (regions.length > 0) {
                        // Use all regions if none explicitly ACTIVE
                        setAvailableRegions(regions);
                    } else {
                        // Fallback: Standard global regions
                        setAvailableRegions([
                            { id: 'india', name: 'India', code: 'INDIA', status: 'ACTIVE' },
                            { id: 'americas', name: 'Americas', code: 'AMERICAS', status: 'ACTIVE' },
                            { id: 'emea', name: 'EMEA', code: 'EMEA', status: 'ACTIVE' },
                            { id: 'apac', name: 'APAC', code: 'APAC', status: 'ACTIVE' },
                        ]);
                    }
                } else {
                    // API error - use fallback regions
                    setAvailableRegions([
                        { id: 'india', name: 'India', code: 'INDIA', status: 'ACTIVE' },
                        { id: 'americas', name: 'Americas', code: 'AMERICAS', status: 'ACTIVE' },
                        { id: 'emea', name: 'EMEA', code: 'EMEA', status: 'ACTIVE' },
                        { id: 'apac', name: 'APAC', code: 'APAC', status: 'ACTIVE' },
                    ]);
                }
            } catch (error) {
                console.error('Failed to fetch regions:', error);
                // Fallback on error
                setAvailableRegions([
                    { id: 'india', name: 'India', code: 'INDIA', status: 'ACTIVE' },
                    { id: 'americas', name: 'Americas', code: 'AMERICAS', status: 'ACTIVE' },
                    { id: 'emea', name: 'EMEA', code: 'EMEA', status: 'ACTIVE' },
                    { id: 'apac', name: 'APAC', code: 'APAC', status: 'ACTIVE' },
                ]);
            } finally {
                setLoadingRegions(false);
            }
        }
        fetchRegions();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Toggle region selection
    const toggleRegion = (region: Region) => {
        const existing = regionCapacities.find(rc => rc.region_id === region.id);
        if (existing) {
            // Remove region
            setRegionCapacities(prev => prev.filter(rc => rc.region_id !== region.id));
        } else {
            // Add region with default capacity
            setRegionCapacities(prev => [
                ...prev,
                {
                    region_id: region.id,
                    region_name: region.name,
                    capacity: 50, // Default absolute capacity
                    priority: prev.length + 1, // Tie-breaker priority
                    is_active: true,
                },
            ]);
        }
    };

    // Update region capacity
    const updateRegionCapacity = (regionId: string, field: keyof RegionCapacity, value: number | boolean) => {
        setRegionCapacities(prev =>
            prev.map(rc =>
                rc.region_id === regionId ? { ...rc, [field]: value } : rc
            )
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.name.trim()) {
            toast.error('Validation Error', 'DCA name is required');
            return;
        }

        if (regionCapacities.length === 0) {
            toast.error('Validation Error', 'At least one region must be selected');
            return;
        }

        startTransition(async () => {
            try {
                const response = await fetch('/api/dcas', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: formData.name.trim(),
                        legal_name: formData.legal_name.trim() || null,
                        registration_number: formData.registration_number.trim() || null,
                        status: formData.status,
                        commission_rate: parseFloat(String(formData.commission_rate)),
                        min_case_value: formData.min_case_value ? parseFloat(String(formData.min_case_value)) : null,
                        max_case_value: formData.max_case_value ? parseFloat(String(formData.max_case_value)) : null,
                        primary_contact_name: formData.primary_contact_name.trim() || null,
                        primary_contact_email: formData.primary_contact_email.trim() || null,
                        primary_contact_phone: formData.primary_contact_phone.trim() || null,
                        // Compliance fields
                        license_number: formData.license_number.trim() || null,
                        license_authority: formData.license_authority.trim() || null,
                        license_expiry: formData.license_expiry || null,
                        contract_start_date: formData.contract_start_date || null,
                        contract_end_date: formData.contract_end_date || null,
                        // Region assignments with per-region capacity
                        region_assignments: regionCapacities.map(rc => ({
                            region_id: rc.region_id,
                            capacity: rc.capacity,
                            priority: rc.priority,
                            is_active: rc.is_active,
                        })),
                    }),
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error?.message || 'Failed to create DCA');
                }

                const { data } = await response.json();
                toast.success('DCA Created', 'DCA has been created successfully with region assignments');
                setTimeout(() => {
                    router.push(`/dcas/${data.id}`);
                    router.refresh();
                }, 1000);
            } catch (err) {
                toast.error('Creation Failed', err instanceof Error ? err.message : 'An error occurred');
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            DCA Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="e.g., ABC Collections"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <div>
                        <label htmlFor="legal_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Legal Name
                        </label>
                        <input
                            type="text"
                            id="legal_name"
                            name="legal_name"
                            value={formData.legal_name}
                            onChange={handleChange}
                            placeholder="e.g., ABC Collections LLC"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <div>
                        <label htmlFor="registration_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Registration Number
                        </label>
                        <input
                            type="text"
                            id="registration_number"
                            name="registration_number"
                            value={formData.registration_number}
                            onChange={handleChange}
                            placeholder="e.g., DCA-2024-001"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Initial Status
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
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Default: PENDING_APPROVAL. DCA cannot receive cases until ACTIVE.
                        </p>
                    </div>
                </div>
            </div>

            {/* Region Assignment (CRITICAL) */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Region Assignment <span className="text-red-500">*</span>
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Select regions where this DCA will operate. Region assignment is immutable after creation.
                        </p>
                    </div>
                    <span className="px-2 py-1 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded">
                        GOVERNANCE REQUIRED
                    </span>
                </div>

                {/* Region Selection */}
                {loadingRegions ? (
                    <div className="text-center py-4 text-gray-500">Loading regions...</div>
                ) : availableRegions.length === 0 ? (
                    <div className="text-center py-4 text-red-500">No active regions available</div>
                ) : (
                    <div className="space-y-4">
                        {/* Region Checkboxes */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {availableRegions.map(region => {
                                const isSelected = regionCapacities.some(rc => rc.region_id === region.id);
                                return (
                                    <button
                                        key={region.id}
                                        type="button"
                                        onClick={() => toggleRegion(region)}
                                        className={`p-3 rounded-lg border-2 text-left transition-all ${isSelected
                                            ? 'border-primary bg-primary/10 dark:bg-primary/20'
                                            : 'border-gray-200 dark:border-[#333] hover:border-gray-300 dark:hover:border-[#444]'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-gray-300 dark:border-[#444]'
                                                }`}>
                                                {isSelected && (
                                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                            </div>
                                            <span className="font-medium text-gray-900 dark:text-white">{region.name}</span>
                                        </div>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">{region.code}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Per-Region Capacity Table */}
                        {regionCapacities.length > 0 && (
                            <div className="mt-6">
                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    Per-Region Capacity Configuration
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                    Capacity = absolute case limit per region. Priority = tie-breaker for allocation (1 = highest).
                                </p>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-[#333]">
                                        <thead className="bg-gray-50 dark:bg-[#0a0a0a]">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Region</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Capacity (Cases)</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Priority</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Active</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-[#333]">
                                            {regionCapacities.map(rc => (
                                                <tr key={rc.region_id}>
                                                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                                                        {rc.region_name}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max="10000"
                                                            value={rc.capacity}
                                                            onChange={(e) => updateRegionCapacity(rc.region_id, 'capacity', parseInt(e.target.value) || 0)}
                                                            className="w-24 px-2 py-1 border border-gray-300 dark:border-[#333] rounded bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white text-sm"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max="10"
                                                            value={rc.priority}
                                                            onChange={(e) => updateRegionCapacity(rc.region_id, 'priority', parseInt(e.target.value) || 1)}
                                                            className="w-16 px-2 py-1 border border-gray-300 dark:border-[#333] rounded bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white text-sm"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => updateRegionCapacity(rc.region_id, 'is_active', !rc.is_active)}
                                                            className={`w-10 h-6 rounded-full transition-colors ${rc.is_active ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                                                                }`}
                                                        >
                                                            <span className={`block w-4 h-4 rounded-full bg-white shadow transform transition-transform ${rc.is_active ? 'translate-x-5' : 'translate-x-1'
                                                                }`} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {regionCapacities.length === 0 && (
                            <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                                ⚠️ Select at least one region to continue
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Contract Terms */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contract Terms</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    <div>
                        <label htmlFor="min_case_value" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                            placeholder="Optional"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <div>
                        <label htmlFor="max_case_value" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                            placeholder="Optional"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                    </div>
                </div>
            </div>

            {/* License & Compliance */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">License & Compliance</h2>
                    <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded">
                        COMPLIANCE
                    </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label htmlFor="license_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            License Number
                        </label>
                        <input
                            type="text"
                            id="license_number"
                            name="license_number"
                            value={formData.license_number}
                            onChange={handleChange}
                            placeholder="e.g., DCA-LIC-2024-001"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                        />
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
                            placeholder="e.g., State Regulatory Board"
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
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            DCA cannot be ACTIVE with expired license
                        </p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div>
                        <label htmlFor="contract_start_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Contract Start Date
                        </label>
                        <input
                            type="date"
                            id="contract_start_date"
                            name="contract_start_date"
                            value={formData.contract_start_date}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                        />
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
                </div>
            </div>

            {/* Contact Information */}
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
                            placeholder="John Doe"
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
                            placeholder="john@example.com"
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
                            placeholder="+1 (555) 000-0000"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                    </div>
                </div>
            </div>

            {/* Governance Notice */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                        <p className="font-medium">Governance Rules Applied:</p>
                        <ul className="mt-1 list-disc list-inside text-xs space-y-1">
                            <li>Region assignment is <strong>immutable</strong> after creation</li>
                            <li>Case assignment is <strong>SYSTEM-only</strong> based on capacity and performance</li>
                            <li>DCA cannot receive cases until status is <strong>ACTIVE</strong></li>
                            <li>All actions are <strong>audit-logged</strong></li>
                        </ul>
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
                <Button
                    type="submit"
                    disabled={isPending || regionCapacities.length === 0}
                >
                    {isPending ? 'Creating...' : 'Create DCA'}
                </Button>
            </div>
        </form>
    );
}
