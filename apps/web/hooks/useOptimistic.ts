'use client';

import { useState, useCallback, useRef } from 'react';

interface OptimisticState<T> {
    data: T;
    isLoading: boolean;
    error: string | null;
    isOptimistic: boolean;
}

interface UseOptimisticOptions<T> {
    onError?: (error: Error, rollback: () => void) => void;
    onSuccess?: (data: T) => void;
}

/**
 * Optimistic Updates Hook
 * P2-6 FIX: Add optimistic updates after mutations
 * 
 * Allows immediate UI updates while the API request is in progress,
 * with automatic rollback on failure.
 */
export function useOptimistic<T>(
    initialData: T,
    options: UseOptimisticOptions<T> = {}
) {
    const [state, setState] = useState<OptimisticState<T>>({
        data: initialData,
        isLoading: false,
        error: null,
        isOptimistic: false,
    });

    const previousDataRef = useRef<T>(initialData);

    /**
     * Optimistically update the data and perform an async operation
     */
    const optimisticUpdate = useCallback(
        async (
            optimisticData: T | ((prev: T) => T),
            asyncOperation: () => Promise<T>
        ): Promise<T | null> => {
            // Store previous data for rollback
            previousDataRef.current = state.data;

            // Apply optimistic update immediately
            const newData = typeof optimisticData === 'function'
                ? (optimisticData as (prev: T) => T)(state.data)
                : optimisticData;

            setState({
                data: newData,
                isLoading: true,
                error: null,
                isOptimistic: true,
            });

            try {
                // Perform the actual async operation
                const result = await asyncOperation();

                // Update with actual result
                setState({
                    data: result,
                    isLoading: false,
                    error: null,
                    isOptimistic: false,
                });

                options.onSuccess?.(result);
                return result;
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Operation failed';

                // Rollback to previous data
                setState({
                    data: previousDataRef.current,
                    isLoading: false,
                    error: errorMessage,
                    isOptimistic: false,
                });

                const rollback = () => {
                    setState(prev => ({
                        ...prev,
                        data: previousDataRef.current,
                        error: null,
                    }));
                };

                options.onError?.(error instanceof Error ? error : new Error(errorMessage), rollback);
                return null;
            }
        },
        [state.data, options]
    );

    /**
     * Update data without async operation (for direct state updates)
     */
    const setData = useCallback((newData: T | ((prev: T) => T)) => {
        setState(prev => ({
            ...prev,
            data: typeof newData === 'function'
                ? (newData as (prev: T) => T)(prev.data)
                : newData,
            isOptimistic: false,
        }));
    }, []);

    /**
     * Clear any error state
     */
    const clearError = useCallback(() => {
        setState(prev => ({ ...prev, error: null }));
    }, []);

    return {
        data: state.data,
        isLoading: state.isLoading,
        error: state.error,
        isOptimistic: state.isOptimistic,
        optimisticUpdate,
        setData,
        clearError,
    };
}

/**
 * Optimistic list operations helper
 */
export function useOptimisticList<T extends { id: string | number }>(
    initialItems: T[],
    options: UseOptimisticOptions<T[]> = {}
) {
    const { data, isLoading, error, optimisticUpdate, setData, clearError } =
        useOptimistic(initialItems, options);

    const addItem = useCallback(
        (newItem: T, asyncOperation: () => Promise<T[]>) => {
            return optimisticUpdate(
                items => [...items, newItem],
                asyncOperation
            );
        },
        [optimisticUpdate]
    );

    const updateItem = useCallback(
        (id: string | number, updates: Partial<T>, asyncOperation: () => Promise<T[]>) => {
            return optimisticUpdate(
                items => items.map(item =>
                    item.id === id ? { ...item, ...updates } : item
                ),
                asyncOperation
            );
        },
        [optimisticUpdate]
    );

    const removeItem = useCallback(
        (id: string | number, asyncOperation: () => Promise<T[]>) => {
            return optimisticUpdate(
                items => items.filter(item => item.id !== id),
                asyncOperation
            );
        },
        [optimisticUpdate]
    );

    return {
        items: data,
        isLoading,
        error,
        addItem,
        updateItem,
        removeItem,
        setItems: setData,
        clearError,
    };
}

export default useOptimistic;
