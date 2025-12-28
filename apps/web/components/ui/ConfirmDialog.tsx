'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ConfirmOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
}

interface ConfirmContextType {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function useConfirm() {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmProvider');
    }
    return context;
}

interface ConfirmState extends ConfirmOptions {
    resolve: (value: boolean) => void;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
    const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

    const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            setConfirmState({ ...options, resolve });
        });
    }, []);

    const handleConfirm = () => {
        confirmState?.resolve(true);
        setConfirmState(null);
    };

    const handleCancel = () => {
        confirmState?.resolve(false);
        setConfirmState(null);
    };

    const variantStyles = {
        danger: {
            icon: '🗑️',
            button: 'bg-red-600 hover:bg-red-700',
        },
        warning: {
            icon: '⚠️',
            button: 'bg-amber-600 hover:bg-amber-700',
        },
        info: {
            icon: 'ℹ️',
            button: 'bg-primary hover:bg-primary-700',
        },
    };

    const variant = confirmState?.variant ?? 'danger';
    const styles = variantStyles[variant];

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}

            {/* Confirmation Modal */}
            {confirmState && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={handleCancel}
                    />

                    {/* Modal */}
                    <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 animate-scale-in">
                        <div className="flex items-start gap-4">
                            <div className="text-3xl">{styles.icon}</div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {confirmState.title}
                                </h3>
                                <p className="text-gray-600 mt-1">
                                    {confirmState.message}
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={handleCancel}
                                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                            >
                                {confirmState.cancelText ?? 'Cancel'}
                            </button>
                            <button
                                onClick={handleConfirm}
                                className={`px-4 py-2 text-white rounded-lg font-medium transition-colors ${styles.button}`}
                            >
                                {confirmState.confirmText ?? 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
}
