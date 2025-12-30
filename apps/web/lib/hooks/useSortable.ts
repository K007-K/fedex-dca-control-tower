'use client';

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
    getSortIcon: (key: keyof T) => '↑' | '↓' | '↕' | null;
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

    const getSortIcon = (key: keyof T): '↑' | '↓' | '↕' | null => {
        if (sortConfig.key !== key) {
            return '↕';
        }

        if (sortConfig.direction === 'asc') {
            return '↑';
        }

        if (sortConfig.direction === 'desc') {
            return '↓';
        }

        return null;
    };

    return {
        sortedData,
        sortConfig,
        requestSort,
        getSortIcon,
    };
}
