import { useState, useMemo } from 'react';

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig<T> {
    key: keyof T | null;
    direction: SortDirection;
}

export interface UseSortableReturn<T> {
    sortedData: T[];
    sortConfig: SortConfig<T>;
    requestSort: (key: keyof T) => void;
    getSortIndicator: (key: keyof T) => React.ReactNode;
}

/**
 * P3-4: Sortable Tables Hook
 * Provides sorting functionality for table data
 */
export function useSortable<T>(
    data: T[],
    defaultSortKey?: keyof T,
    defaultDirection: SortDirection = 'asc'
): UseSortableReturn<T> {
    const [sortConfig, setSortConfig] = useState<SortConfig<T>>({
        key: defaultSortKey ?? null,
        direction: defaultDirection,
    });

    const sortedData = useMemo(() => {
        if (!sortConfig.key || !sortConfig.direction) {
            return data;
        }

        const sorted = [...data].sort((a, b) => {
            const aValue = a[sortConfig.key!];
            const bValue = b[sortConfig.key!];

            // Handle null/undefined
            if (aValue == null && bValue == null) return 0;
            if (aValue == null) return 1;
            if (bValue == null) return -1;

            // Handle different data types
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortConfig.direction === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }

            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return sortConfig.direction === 'asc'
                    ? aValue - bValue
                    : bValue - aValue;
            }

            // Handle dates
            if (aValue instanceof Date && bValue instanceof Date) {
                return sortConfig.direction === 'asc'
                    ? aValue.getTime() - bValue.getTime()
                    : bValue.getTime() - aValue.getTime();
            }

            // Fallback to string comparison
            return sortConfig.direction === 'asc'
                ? String(aValue).localeCompare(String(bValue))
                : String(bValue).localeCompare(String(aValue));
        });

        return sorted;
    }, [data, sortConfig]);

    const requestSort = (key: keyof T) => {
        let direction: SortDirection = 'asc';

        if (sortConfig.key === key) {
            if (sortConfig.direction === 'asc') {
                direction = 'desc';
            } else if (sortConfig.direction === 'desc') {
                direction = null;
            }
        }

        setSortConfig({ key: direction ? key : null, direction });
    };

    const getSortIndicator = (key: keyof T): React.ReactNode => {
        if (sortConfig.key !== key) {
            return (
                <svg className= "w-4 h-4 text-gray-300" fill = "none" viewBox = "0 0 24 24" stroke = "currentColor" >
                    <path strokeLinecap="round" strokeLinejoin = "round" strokeWidth = { 2} d = "M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
      );
}

if (sortConfig.direction === 'asc') {
    return (
        <svg className= "w-4 h-4 text-primary" fill = "none" viewBox = "0 0 24 24" stroke = "currentColor" >
            <path strokeLinecap="round" strokeLinejoin = "round" strokeWidth = { 2} d = "M5 15l7-7 7 7" />
                </svg>
      );
}

if (sortConfig.direction === 'desc') {
    return (
        <svg className= "w-4 h-4 text-primary" fill = "none" viewBox = "0 0 24 24" stroke = "currentColor" >
            <path strokeLinecap="round" strokeLinejoin = "round" strokeWidth = { 2} d = "M19 9l-7 7-7-7" />
                </svg>
      );
}

return null;
  };

return {
    sortedData,
    sortConfig,
    requestSort,
    getSortIndicator,
};
}

/**
 * Sortable Table Header Component
 * Use this in table headers for sortable columns
 */
export function SortableHeader<T>({
    label,
    sortKey,
    requestSort,
    getSortIndicator,
    className = '',
}: {
    label: string;
    sortKey: keyof T;
    requestSort: (key: keyof T) => void;
    getSortIndicator: (key: keyof T) => React.ReactNode;
    className?: string;
}) {
    return (
        <th
      className= {`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none ${className}`
}
onClick = {() => requestSort(sortKey)}
    >
    <div className="flex items-center gap-2" >
        <span>{ label } </span>
{ getSortIndicator(sortKey) }
</div>
    </th>
  );
}
