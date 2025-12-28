'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BulkActionBar } from './BulkActionBar';

interface CaseData {
    id: string;
    case_number: string;
    customer_name: string;
    outstanding_amount: number;
    recovered_amount: number | null;
    status: string;
    priority: string;
    created_at: string;
    assigned_dca?: {
        id: string;
        name: string;
    } | null;
}

interface DCA {
    id: string;
    name: string;
}

interface CaseTableWithSelectionProps {
    cases: CaseData[];
    dcas: DCA[];
}

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    PENDING_ALLOCATION: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
    ALLOCATED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Allocated' },
    IN_PROGRESS: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'In Progress' },
    CUSTOMER_CONTACTED: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Contacted' },
    PAYMENT_PROMISED: { bg: 'bg-cyan-100', text: 'text-cyan-800', label: 'Promised' },
    PARTIAL_RECOVERY: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Partial' },
    FULL_RECOVERY: { bg: 'bg-green-100', text: 'text-green-800', label: 'Recovered' },
    DISPUTED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Disputed' },
    ESCALATED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Escalated' },
    CLOSED: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Closed' },
};

const priorityConfig: Record<string, { bg: string; text: string }> = {
    CRITICAL: { bg: 'bg-red-100', text: 'text-red-800' },
    HIGH: { bg: 'bg-orange-100', text: 'text-orange-800' },
    MEDIUM: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    LOW: { bg: 'bg-green-100', text: 'text-green-800' },
};

export function CaseTableWithSelection({ cases, dcas }: CaseTableWithSelectionProps) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(x => x !== id)
                : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === cases.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(cases.map(c => c.id));
        }
    };

    const clearSelection = () => setSelectedIds([]);

    if (cases.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="text-gray-400 text-5xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No cases found</h3>
                <p className="text-gray-500">Try adjusting your filters or create a new case.</p>
            </div>
        );
    }

    const isAllSelected = selectedIds.length === cases.length;
    const isSomeSelected = selectedIds.length > 0 && selectedIds.length < cases.length;

    return (
        <>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 w-12">
                                    <input
                                        type="checkbox"
                                        checked={isAllSelected}
                                        ref={(el) => {
                                            if (el) el.indeterminate = isSomeSelected;
                                        }}
                                        onChange={toggleSelectAll}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Case #
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Customer
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Outstanding
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Recovered
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    DCA
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Priority
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Created
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {cases.map((caseItem) => {
                                const status = statusConfig[caseItem.status] ?? { bg: 'bg-gray-100', text: 'text-gray-800', label: caseItem.status };
                                const priority = priorityConfig[caseItem.priority] ?? { bg: 'bg-gray-100', text: 'text-gray-800' };
                                const isSelected = selectedIds.includes(caseItem.id);

                                return (
                                    <tr
                                        key={caseItem.id}
                                        className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-primary-50' : ''}`}
                                    >
                                        <td className="px-4 py-4">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleSelect(caseItem.id)}
                                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <Link
                                                href={`/cases/${caseItem.id}`}
                                                className="text-sm font-medium text-primary hover:underline"
                                            >
                                                {caseItem.case_number}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {caseItem.customer_name}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                            ${caseItem.outstanding_amount?.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-success">
                                            ${(caseItem.recovered_amount ?? 0).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {caseItem.assigned_dca?.name ?? '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priority.bg} ${priority.text}`}>
                                                {caseItem.priority}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(caseItem.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <BulkActionBar
                selectedIds={selectedIds}
                onClear={clearSelection}
                dcas={dcas}
            />
        </>
    );
}
