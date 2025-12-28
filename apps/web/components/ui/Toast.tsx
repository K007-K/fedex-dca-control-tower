'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

const TOAST_ICONS: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
};

const TOAST_STYLES: Record<ToastType, { bg: string; border: string; icon: string }> = {
    success: { bg: 'bg-green-50', border: 'border-green-200', icon: 'text-green-600 bg-green-100' },
    error: { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-600 bg-red-100' },
    warning: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-600 bg-amber-100' },
    info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600 bg-blue-100' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substr(2, 9);
        const duration = toast.duration ?? 4000;

        setToasts((prev) => [...prev, { ...toast, id }]);

        if (duration > 0) {
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, duration);
        }
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const success = useCallback((title: string, message?: string) => {
        addToast({ type: 'success', title, message });
    }, [addToast]);

    const error = useCallback((title: string, message?: string) => {
        addToast({ type: 'error', title, message, duration: 6000 });
    }, [addToast]);

    const warning = useCallback((title: string, message?: string) => {
        addToast({ type: 'warning', title, message });
    }, [addToast]);

    const info = useCallback((title: string, message?: string) => {
        addToast({ type: 'info', title, message });
    }, [addToast]);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
            {children}

            {/* Toast Container */}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
                {toasts.map((toast) => {
                    const styles = TOAST_STYLES[toast.type];
                    return (
                        <div
                            key={toast.id}
                            className={`${styles.bg} ${styles.border} border rounded-lg shadow-lg p-4 animate-slide-in flex items-start gap-3`}
                            role="alert"
                        >
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${styles.icon}`}>
                                {TOAST_ICONS[toast.type]}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900">{toast.title}</p>
                                {toast.message && (
                                    <p className="text-sm text-gray-600 mt-0.5">{toast.message}</p>
                                )}
                            </div>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}
