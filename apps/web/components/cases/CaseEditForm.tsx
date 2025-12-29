'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { useToast } from '@/components/ui';
import { Button } from '@/components/ui/button';

interface CaseFormProps {
    caseData: {
        id: string;
        case_number: string;
        customer_name: string;
        status: string;
        priority: string;
        notes?: string;
        assigned_dca_id?: string;
        assigned_agent_id?: string;
        original_amount: number;
        outstanding_amount: number;
    };
    dcas: Array<{ id: string; name: string }>;
    agents: Array<{ id: string; full_name: string }>;
}

const STATUS_OPTIONS = [
    'PENDING_ALLOCATION',
    'ALLOCATED',
    'IN_PROGRESS',
    'CUSTOMER_CONTACTED',
    'PAYMENT_PROMISED',
    'PARTIAL_RECOVERY',
    'FULL_RECOVERY',
    'DISPUTED',
    'ESCALATED',
    'CLOSED',
];

const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export function CaseEditForm({ caseData, dcas, agents }: CaseFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const toast = useToast();

    const [formData, setFormData] = useState({
        status: caseData.status,
        priority: caseData.priority,
        notes: caseData.notes ?? '',
        assigned_dca_id: caseData.assigned_dca_id ?? '',
        assigned_agent_id: caseData.assigned_agent_id ?? '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        startTransition(async () => {
            try {
                const response = await fetch(`/api/cases/${caseData.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        status: formData.status,
                        priority: formData.priority,
                        notes: formData.notes || null,
                        assigned_dca_id: formData.assigned_dca_id || null,
                        assigned_agent_id: formData.assigned_agent_id || null,
                    }),
                });

                if (!response.ok) {
                    const data = await response.json();
                    const errorMessage = data.error?.message || data.error || 'Failed to update case';
                    throw new Error(errorMessage);
                }

                toast.success('Case Updated', 'Case has been saved successfully.');
                setTimeout(() => {
                    router.push(`/cases/${caseData.id}`);
                    router.refresh();
                }, 1000);
            } catch (err) {
                toast.error('Update Failed', err instanceof Error ? err.message : 'An error occurred');
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Case Info (Read-only) */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Case Information</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <p className="text-sm text-gray-500">Case Number</p>
                        <p className="font-medium">{caseData.case_number}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Customer</p>
                        <p className="font-medium">{caseData.customer_name}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Original Amount</p>
                        <p className="font-medium">${caseData.original_amount.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Outstanding</p>
                        <p className="font-medium text-red-600">${caseData.outstanding_amount.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Editable Fields */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Update Case</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Status */}
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
                                    {status.replace(/_/g, ' ')}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Priority */}
                    <div>
                        <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                            Priority
                        </label>
                        <select
                            id="priority"
                            name="priority"
                            value={formData.priority}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        >
                            {PRIORITY_OPTIONS.map(priority => (
                                <option key={priority} value={priority}>
                                    {priority}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Assigned DCA */}
                    <div>
                        <label htmlFor="assigned_dca_id" className="block text-sm font-medium text-gray-700 mb-2">
                            Assigned DCA
                        </label>
                        <select
                            id="assigned_dca_id"
                            name="assigned_dca_id"
                            value={formData.assigned_dca_id}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        >
                            <option value="">Not Assigned</option>
                            {dcas.map(dca => (
                                <option key={dca.id} value={dca.id}>
                                    {dca.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Assigned Agent */}
                    <div>
                        <label htmlFor="assigned_agent_id" className="block text-sm font-medium text-gray-700 mb-2">
                            Assigned Agent
                        </label>
                        <select
                            id="assigned_agent_id"
                            name="assigned_agent_id"
                            value={formData.assigned_agent_id}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        >
                            <option value="">Not Assigned</option>
                            {agents.map(agent => (
                                <option key={agent.id} value={agent.id}>
                                    {agent.full_name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Notes */}
                <div className="mt-6">
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                        Notes
                    </label>
                    <textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="Add notes about this case..."
                    />
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
