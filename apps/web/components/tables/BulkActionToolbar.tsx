import { buttonVariants } from '@/components/ui/button';
import Link from 'next/link';

interface BulkActionToolbarProps {
    selectedCount: number;
    onClearSelection: () => void;
    actions?: {
        label: string;
        onClick: () => void;
        icon?: React.ReactNode;
        variant?: 'default' | 'danger';
    }[];
}

/**
 * P3-5: Bulk Action Toolbar Component
 */
export function BulkActionToolbar({ selectedCount, onClearSelection, actions = [] }: BulkActionToolbarProps) {
    if (selectedCount === 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-elevated border border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                        {selectedCount}
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
                    </span>
                </div>

                <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

                <div className="flex items-center gap-2">
                    {actions.map((action, index) => (
                        <button
                            key={index}
                            onClick={action.onClick}
                            className={buttonVariants({
                                variant: action.variant === 'danger' ? 'danger' : 'default',
                                size: 'sm',
                            })}
                        >
                            {action.icon}
                            {action.label}
                        </button>
                    ))}

                    <button
                        onClick={onClearSelection}
                        className={buttonVariants({ variant: 'outline', size: 'sm' })}
                    >
                        Clear
                    </button>
                </div>
            </div>
        </div>
    );
}
