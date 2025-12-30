'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';

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
    PENDING_ALLOCATION: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-300', label: 'Pending' },
    ALLOCATED: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-300', label: 'Allocated' },
    IN_PROGRESS: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-300', label: 'In Progress' },
    CUSTOMER_CONTACTED: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-800 dark:text-indigo-300', label: 'Contacted' },
    PAYMENT_PROMISED: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-800 dark:text-cyan-300', label: 'Promised' },
    PARTIAL_RECOVERY: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-300', label: 'Partial' },
    FULL_RECOVERY: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300', label: 'Recovered' },
    DISPUTED: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-300', label: 'Disputed' },
    ESCALATED: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-300', label: 'Escalated' },
    CLOSED: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-300', label: 'Closed' },
};

const priorityConfig: Record<string, { bg: string; text: string }> = {
    CRITICAL: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-300' },
    HIGH: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-300' },
    MEDIUM: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-300' },
    LOW: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300' },
};

type SortDirection = 'asc' | 'desc' | null;
type SortKey = keyof CaseData | null;

export function CaseTableWithSelection({ cases, dcas }: CaseTableWithSelectionProps) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [sortKey, setSortKey] = useState<SortKey>('created_at');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    // Sort the data
    const sortedData = useMemo(() => {
        if (!sortKey || !sortDirection) {
            return cases;
        }

        return [...cases].sort((a, b) => {
            const aValue = a[sortKey];
            const bValue = b[sortKey];

            if (aValue == null && bValue == null) return 0;
            if (aValue == null) return 1;
            if (bValue == null) return -1;

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortDirection === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }

            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return sortDirection === 'asc'
                    ? aValue - bValue
                    : bValue - aValue;
            }

            return sortDirection === 'asc'
                ? String(aValue).localeCompare(String(bValue))
                : String(bValue).localeCompare(String(aValue));
        });
    }, [cases, sortKey, sortDirection]);

    // Handle sort request
    const handleSort = (key: keyof CaseData) => {
        if (sortKey === key) {
            if (sortDirection === 'asc') {
                setSortDirection('desc');
            } else if (sortDirection === 'desc') {
                setSortKey(null);
                setSortDirection(null);
            }
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };

    // Get sort icon
    const getSortIcon = (key: keyof CaseData): string => {
        if (sortKey !== key) return '↕';
        if (sortDirection === 'asc') return '↑';
        if (sortDirection === 'desc') return '↓';
        return '↕';
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(x => x !== id)
                : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === sortedData.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(sortedData.map(c => c.id));
        }
    };

    const clearSelection = () => setSelectedIds([]);

    if (cases.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                <div className="text-gray-400 text-5xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No cases found</h3>
                <p className="text-gray-500 dark:text-gray-400">Try adjusting your filters or create a new case.</p>
            </div>
        );
    }

    const isAllSelected = selectedIds.length === sortedData.length;
    const isSomeSelected = selectedIds.length > 0 && selectedIds.length < sortedData.length;

    // Render sortable header
    const renderSortHeader = (key: keyof CaseData, label: string) => (
        <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <button
                onClick={() => handleSort(key)}
                className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100 transition-colors group"
            >
                {label}
                <span className={`text-sm ${sortKey !== key ? 'opacity-40 group-hover:opacity-70' : 'opacity-100'}`}>
                    {getSortIcon(key)}
                </span>
            </button>
        </th>
    );

    return (
        <>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-4 py-3 w-12">
                                    <input
                                        type="checkbox"
                                        checked={isAllSelected}
                                        ref={(el) => {
                                            if (el) el.indeterminate = isSomeSelected;
                                        }}
                                        onChange={toggleSelectAll}
                                        className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary"
                                    />
                                </th>
                                {renderSortHeader('case_number', 'Case #')}
                                {renderSortHeader('customer_name', 'Customer')}
                                {renderSortHeader('outstanding_amount', 'Outstanding')}
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Recovered
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    DCA
                                </th>
                                {renderSortHeader('status', 'Status')}
                                {renderSortHeader('priority', 'Priority')}
                                {renderSortHeader('created_at', 'Created')}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {sortedData.map((caseItem) => {
                                const status = statusConfig[caseItem.status] ?? { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-300', label: caseItem.status };
                                const priority = priorityConfig[caseItem.priority] ?? { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-300' };
                                const isSelected = selectedIds.includes(caseItem.id);

                                return (
                                    <tr
                                        key={caseItem.id}
                                        className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${isSelected ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
                                    >
                                        <td className="px-4 py-4">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleSelect(caseItem.id)}
                                                className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary"
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
                                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                                            {caseItem.customer_name}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                                            ${caseItem.outstanding_amount?.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-success">
                                            ${(caseItem.recovered_amount ?? 0).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
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
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
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
