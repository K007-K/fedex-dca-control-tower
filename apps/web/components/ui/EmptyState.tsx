import { ReactNode } from 'react';

interface EmptyStateProps {
    icon?: string | ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
    className?: string;
}

/**
 * Reusable Empty State Component
 * P2-7 FIX: Add empty states for lists and tables
 */
export function EmptyState({
    icon = '📭',
    title,
    description,
    action,
    className = '',
}: EmptyStateProps) {
    return (
        <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
            <div className="text-5xl mb-4">{icon}</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
            {description && (
                <p className="text-sm text-gray-500 max-w-sm mb-4">{description}</p>
            )}
            {action && <div className="mt-2">{action}</div>}
        </div>
    );
}

/**
 * Pre-configured empty states for common scenarios
 */
export function NoDataEmptyState({ message }: { message?: string }) {
    return (
        <EmptyState
            icon="📊"
            title="No Data Available"
            description={message || "There's no data to display at the moment."}
        />
    );
}

export function NoResultsEmptyState({
    searchTerm,
    onClear,
}: {
    searchTerm?: string;
    onClear?: () => void;
}) {
    return (
        <EmptyState
            icon="🔍"
            title="No Results Found"
            description={searchTerm
                ? `No results found for "${searchTerm}". Try adjusting your search.`
                : "No results match your filters."}
            action={onClear && (
                <button
                    onClick={onClear}
                    className="text-sm text-primary hover:underline"
                >
                    Clear filters
                </button>
            )}
        />
    );
}

export function NoCasesEmptyState() {
    return (
        <EmptyState
            icon="📁"
            title="No Cases Yet"
            description="Cases will appear here once they are created or assigned."
        />
    );
}

export function NoNotificationsEmptyState() {
    return (
        <EmptyState
            icon="🔔"
            title="All Caught Up!"
            description="You have no notifications at the moment."
        />
    );
}

export function ErrorEmptyState({
    message,
    onRetry,
}: {
    message?: string;
    onRetry?: () => void;
}) {
    return (
        <EmptyState
            icon="⚠️"
            title="Something Went Wrong"
            description={message || "We couldn't load this content. Please try again."}
            action={onRetry && (
                <button
                    onClick={onRetry}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-600"
                >
                    Try Again
                </button>
            )}
        />
    );
}

export default EmptyState;
