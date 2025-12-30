'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface FormStateOptions<T> {
    /** Storage key for persisting form data */
    storageKey?: string;
    /** Debounce time in ms for auto-save */
    debounceMs?: number;
}

/**
 * Hook to preserve form state on errors
 * Prevents form reset when submission fails
 */
export function useFormState<T extends Record<string, unknown>>(
    initialValues: T,
    options: FormStateOptions<T> = {}
) {
    const { storageKey, debounceMs = 500 } = options;

    // Initialize from storage if available
    const getInitialValues = (): T => {
        if (typeof window === 'undefined' || !storageKey) return initialValues;
        try {
            const stored = sessionStorage.getItem(storageKey);
            if (stored) {
                return { ...initialValues, ...JSON.parse(stored) };
            }
        } catch {
            // Ignore storage errors
        }
        return initialValues;
    };

    const [values, setValues] = useState<T>(getInitialValues);
    const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
    const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Auto-save to session storage
    useEffect(() => {
        if (!storageKey) return;

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            try {
                sessionStorage.setItem(storageKey, JSON.stringify(values));
            } catch {
                // Ignore storage errors
            }
        }, debounceMs);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [values, storageKey, debounceMs]);

    const setValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
        setValues(prev => ({ ...prev, [field]: value }));
        // Clear field error when value changes
        setErrors(prev => {
            const next = { ...prev };
            delete next[field];
            return next;
        });
        setSubmitError(null);
    }, []);

    const setFieldError = useCallback(<K extends keyof T>(field: K, error: string) => {
        setErrors(prev => ({ ...prev, [field]: error }));
    }, []);

    const setFieldTouched = useCallback(<K extends keyof T>(field: K) => {
        setTouched(prev => ({ ...prev, [field]: true }));
    }, []);

    const handleChange = useCallback((
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        const finalValue = type === 'number' ? (value === '' ? '' : Number(value)) : value;
        setValue(name as keyof T, finalValue as T[keyof T]);
    }, [setValue]);

    const handleBlur = useCallback((
        e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        setFieldTouched(e.target.name as keyof T);
    }, [setFieldTouched]);

    const reset = useCallback((newValues?: T) => {
        setValues(newValues ?? initialValues);
        setErrors({});
        setTouched({});
        setSubmitError(null);
        if (storageKey) {
            try {
                sessionStorage.removeItem(storageKey);
            } catch {
                // Ignore
            }
        }
    }, [initialValues, storageKey]);

    const clearStorage = useCallback(() => {
        if (storageKey) {
            try {
                sessionStorage.removeItem(storageKey);
            } catch {
                // Ignore
            }
        }
    }, [storageKey]);

    const handleSubmit = useCallback((
        onSubmit: (values: T) => Promise<void>,
        onSuccess?: () => void
    ) => {
        return async (e: React.FormEvent) => {
            e.preventDefault();
            setIsSubmitting(true);
            setSubmitError(null);

            try {
                await onSubmit(values);
                // Only reset on success
                clearStorage();
                onSuccess?.();
            } catch (error) {
                // Preserve form state on error - don't reset!
                setSubmitError(
                    error instanceof Error ? error.message : 'An error occurred'
                );
            } finally {
                setIsSubmitting(false);
            }
        };
    }, [values, clearStorage]);

    return {
        values,
        errors,
        touched,
        isSubmitting,
        submitError,
        setValue,
        setValues,
        setFieldError,
        setFieldTouched,
        handleChange,
        handleBlur,
        handleSubmit,
        reset,
        clearStorage,
    };
}

/**
 * Type-safe input props generator
 */
export function getInputProps<T extends Record<string, unknown>>(
    formState: ReturnType<typeof useFormState<T>>,
    field: keyof T
) {
    return {
        name: field as string,
        value: formState.values[field] as string | number,
        onChange: formState.handleChange,
        onBlur: formState.handleBlur,
        'aria-invalid': !!formState.errors[field],
    };
}
