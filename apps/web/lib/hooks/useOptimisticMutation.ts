/**
 * Optimistic Mutation Hook
 * P2-6 FIX: Provides optimistic updates for mutations
 * 
 * This hook enables instant UI feedback while mutations are in progress,
 * with automatic rollback on failure.
 */

import { useState, useCallback, useRef } from 'react';

interface OptimisticMutationOptions<TData, TVariables> {
    /** Function that performs the actual mutation */
    mutationFn: (variables: TVariables) => Promise<TData>;

    /** Optional callback on success */
    onSuccess?: (data: TData, variables: TVariables) => void;

    /** Optional callback on error */
    onError?: (error: Error, variables: TVariables, rollback: () => void) => void;

    /** Optional callback when mutation settles (success or error) */
    onSettled?: (data: TData | undefined, error: Error | null, variables: TVariables) => void;
}

interface OptimisticState<TData> {
    data: TData | null;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    isSuccess: boolean;
}

interface UseOptimisticMutationReturn<TData, TVariables> extends OptimisticState<TData> {
    mutate: (variables: TVariables, optimisticData?: Partial<TData>) => Promise<TData | undefined>;
    mutateAsync: (variables: TVariables, optimisticData?: Partial<TData>) => Promise<TData>;
    reset: () => void;
}

/**
 * Hook for performing mutations with optimistic updates
 */
export function useOptimisticMutation<TData, TVariables = void>(
    options: OptimisticMutationOptions<TData, TVariables>
): UseOptimisticMutationReturn<TData, TVariables> {
    const { mutationFn, onSuccess, onError, onSettled } = options;

    const [state, setState] = useState<OptimisticState<TData>>({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: false,
    });

    const previousDataRef = useRef<TData | null>(null);

    const reset = useCallback(() => {
        setState({
            data: null,
            isLoading: false,
            isError: false,
            error: null,
            isSuccess: false,
        });
        previousDataRef.current = null;
    }, []);

    const mutateAsync = useCallback(
        async (variables: TVariables, optimisticData?: Partial<TData>): Promise<TData> => {
            // Store previous data for rollback
            previousDataRef.current = state.data;

            // Apply optimistic update immediately
            if (optimisticData) {
                setState(prev => ({
                    ...prev,
                    data: { ...prev.data, ...optimisticData } as TData,
                    isLoading: true,
                    isError: false,
                    error: null,
                }));
            } else {
                setState(prev => ({
                    ...prev,
                    isLoading: true,
                    isError: false,
                    error: null,
                }));
            }

            try {
                const result = await mutationFn(variables);

                setState({
                    data: result,
                    isLoading: false,
                    isError: false,
                    error: null,
                    isSuccess: true,
                });

                onSuccess?.(result, variables);
                onSettled?.(result, null, variables);

                return result;
            } catch (err) {
                const error = err instanceof Error ? err : new Error('Unknown error');

                // Rollback to previous data
                const rollback = () => {
                    setState(prev => ({
                        ...prev,
                        data: previousDataRef.current,
                        isLoading: false,
                        isError: true,
                        error,
                        isSuccess: false,
                    }));
                };

                // Rollback automatically
                rollback();

                onError?.(error, variables, rollback);
                onSettled?.(undefined, error, variables);

                throw error;
            }
        },
        [mutationFn, onSuccess, onError, onSettled, state.data]
    );

    const mutate = useCallback(
        async (variables: TVariables, optimisticData?: Partial<TData>): Promise<TData | undefined> => {
            try {
                return await mutateAsync(variables, optimisticData);
            } catch {
                // Error already handled in mutateAsync
                return undefined;
            }
        },
        [mutateAsync]
    );

    return {
        ...state,
        mutate,
        mutateAsync,
        reset,
    };
}

/**
 * Hook for managing a list with optimistic updates
 */
export function useOptimisticList<TItem extends { id: string | number }>(
    initialItems: TItem[] = []
) {
    const [items, setItems] = useState<TItem[]>(initialItems);
    const [pendingChanges, setPendingChanges] = useState<Map<string | number, 'add' | 'update' | 'delete'>>(new Map());

    const addOptimistic = useCallback((item: TItem) => {
        setItems(prev => [...prev, item]);
        setPendingChanges(prev => new Map(prev).set(item.id, 'add'));
    }, []);

    const updateOptimistic = useCallback((id: string | number, updates: Partial<TItem>) => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, ...updates } : item
        ));
        setPendingChanges(prev => {
            const newMap = new Map(prev);
            if (!newMap.has(id)) {
                newMap.set(id, 'update');
            }
            return newMap;
        });
    }, []);

    const removeOptimistic = useCallback((id: string | number) => {
        setItems(prev => prev.filter(item => item.id !== id));
        setPendingChanges(prev => new Map(prev).set(id, 'delete'));
    }, []);

    const confirmChange = useCallback((id: string | number) => {
        setPendingChanges(prev => {
            const newMap = new Map(prev);
            newMap.delete(id);
            return newMap;
        });
    }, []);

    const rollbackChange = useCallback((id: string | number, originalItem?: TItem) => {
        const changeType = pendingChanges.get(id);

        if (changeType === 'add') {
            setItems(prev => prev.filter(item => item.id !== id));
        } else if (changeType === 'delete' && originalItem) {
            setItems(prev => [...prev, originalItem]);
        } else if (changeType === 'update' && originalItem) {
            setItems(prev => prev.map(item =>
                item.id === id ? originalItem : item
            ));
        }

        setPendingChanges(prev => {
            const newMap = new Map(prev);
            newMap.delete(id);
            return newMap;
        });
    }, [pendingChanges]);

    const isPending = useCallback((id: string | number) => {
        return pendingChanges.has(id);
    }, [pendingChanges]);

    const setItemsFromServer = useCallback((serverItems: TItem[]) => {
        // Only update items that don't have pending changes
        setItems(prev => {
            const pendingIds = new Set(pendingChanges.keys());
            const nonPendingFromServer = serverItems.filter(item => !pendingIds.has(item.id));
            const pendingItems = prev.filter(item => pendingIds.has(item.id));

            return [...nonPendingFromServer, ...pendingItems];
        });
    }, [pendingChanges]);

    return {
        items,
        setItems,
        setItemsFromServer,
        addOptimistic,
        updateOptimistic,
        removeOptimistic,
        confirmChange,
        rollbackChange,
        isPending,
        hasPendingChanges: pendingChanges.size > 0,
    };
}

export default useOptimisticMutation;
