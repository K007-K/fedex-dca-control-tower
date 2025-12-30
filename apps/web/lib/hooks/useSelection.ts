'use client';

import { useState } from 'react';

interface UseSelectionReturn<T> {
    selected: Set<T>;
    isSelected: (item: T) => boolean;
    toggleSelection: (item: T) => void;
    toggleAll: (items: T[]) => void;
    selectedCount: number;
    clearSelection: () => void;
}

/**
 * P3-5: Bulk Selection Hook for Tables
 */
export function useSelection<T>(): UseSelectionReturn<T> {
    const [selected, setSelected] = useState<Set<T>>(new Set());

    const isSelected = (item: T) => selected.has(item);

    const toggleSelection = (item: T) => {
        const newSelected = new Set(selected);
        if (newSelected.has(item)) {
            newSelected.delete(item);
        } else {
            newSelected.add(item);
        }
        setSelected(newSelected);
    };

    const toggleAll = (items: T[]) => {
        if (selected.size === items.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(items));
        }
    };

    const clearSelection = () => {
        setSelected(new Set());
    };

    return {
        selected,
        isSelected,
        toggleSelection,
        toggleAll,
        selectedCount: selected.size,
        clearSelection,
    };
}
