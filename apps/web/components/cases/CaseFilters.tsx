'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CaseFiltersProps {
    dcas: { id: string; name: string }[];
}

const STATUS_OPTIONS = [
    { value: '', label: 'All Statuses' },
    { value: 'PENDING_ALLOCATION', label: 'Pending Allocation' },
    { value: 'ALLOCATED', label: 'Allocated' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'CUSTOMER_CONTACTED', label: 'Customer Contacted' },
    { value: 'PAYMENT_PROMISED', label: 'Payment Promised' },
    { value: 'PARTIAL_RECOVERY', label: 'Partial Recovery' },
    { value: 'FULL_RECOVERY', label: 'Full Recovery' },
    { value: 'DISPUTED', label: 'Disputed' },
    { value: 'ESCALATED', label: 'Escalated' },
    { value: 'CLOSED', label: 'Closed' },
];

const PRIORITY_OPTIONS = [
    { value: '', label: 'All Priorities' },
    { value: 'CRITICAL', label: 'Critical' },
    { value: 'HIGH', label: 'High' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'LOW', label: 'Low' },
];

export function CaseFilters({ dcas }: CaseFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const [search, setSearch] = useState(searchParams.get('search') ?? '');
    const [status, setStatus] = useState(searchParams.get('status') ?? '');
    const [priority, setPriority] = useState(searchParams.get('priority') ?? '');
    const [dcaId, setDcaId] = useState(searchParams.get('dca_id') ?? '');

    const applyFilters = () => {
        startTransition(() => {
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            if (status) params.set('status', status);
            if (priority) params.set('priority', priority);
            if (dcaId) params.set('dca_id', dcaId);
            params.set('page', '1');
            router.push(`/cases?${params.toString()}`);
        });
    };

    const resetFilters = () => {
        setSearch('');
        setStatus('');
        setPriority('');
        setDcaId('');
        startTransition(() => {
            router.push('/cases');
        });
    };

    const hasFilters = search || status || priority || dcaId;

    return (
        <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div className="lg:col-span-1">
                    <Input
                        placeholder="Search cases..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                    />
                </div>

                {/* Status */}
                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                    {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>

                {/* Priority */}
                <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                    {PRIORITY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>

                {/* DCA */}
                <select
                    value={dcaId}
                    onChange={(e) => setDcaId(e.target.value)}
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                    <option value="">All DCAs</option>
                    {dcas.map((dca) => (
                        <option key={dca.id} value={dca.id}>
                            {dca.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-4">
                <Button onClick={applyFilters} disabled={isPending}>
                    {isPending ? 'Applying...' : 'Apply Filters'}
                </Button>
                {hasFilters && (
                    <Button variant="outline" onClick={resetFilters} disabled={isPending}>
                        Reset
                    </Button>
                )}
            </div>
        </div>
    );
}

export default CaseFilters;
