'use client';

import { useState } from 'react';

interface DisabledActionHintProps {
    /** The action that is disabled */
    action: string;
    /** Reason why it's disabled */
    reason: string;
    /** Which role can perform this action (if any) */
    allowedRole?: string;
    /** Whether this is system-controlled */
    isSystemControlled?: boolean;
    /** Display mode: inline text or tooltip */
    mode?: 'inline' | 'tooltip';
    /** Additional class names */
    className?: string;
    /** Children to wrap (for tooltip mode) */
    children?: React.ReactNode;
}

/**
 * Displays an explanation for disabled actions.
 * Ensures users understand WHY something is unavailable.
 */
export function DisabledActionHint({
    action,
    reason,
    allowedRole,
    isSystemControlled = false,
    mode = 'inline',
    className = '',
    children
}: DisabledActionHintProps) {
    const [showTooltip, setShowTooltip] = useState(false);

    const hintContent = (
        <div className="text-xs">
            <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">{action}</p>
            <p className="text-gray-500 dark:text-gray-400">{reason}</p>
            {isSystemControlled && (
                <p className="text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
                    </svg>
                    SYSTEM-controlled
                </p>
            )}
            {allowedRole && !isSystemControlled && (
                <p className="text-amber-600 dark:text-amber-400 mt-1">
                    Permitted for: {allowedRole}
                </p>
            )}
        </div>
    );

    if (mode === 'tooltip') {
        return (
            <div
                className={`relative inline-block ${className}`}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
            >
                {children}
                {showTooltip && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-800 rounded-lg shadow-lg z-50 min-w-[200px] max-w-[280px]">
                        <div className="text-white">{hintContent}</div>
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900 dark:bg-gray-800" />
                    </div>
                )}
            </div>
        );
    }

    // Inline mode
    return (
        <div className={`flex items-start gap-2 px-3 py-2 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-lg ${className}`}>
            <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {hintContent}
        </div>
    );
}

/**
 * Common disabled action presets for consistency
 */
export const DISABLED_ACTIONS = {
    DCA_ALLOCATION: {
        action: 'DCA Allocation',
        reason: 'DCA allocation is performed automatically by SYSTEM. Manual assignment is not permitted.',
        isSystemControlled: true,
    },
    SLA_MODIFICATION: {
        action: 'SLA Controls',
        reason: 'SLA enforcement is system-controlled and cannot be modified by users.',
        isSystemControlled: true,
    },
    FINANCIAL_EDIT: {
        action: 'Financial Data',
        reason: 'Financial data is immutable after case creation for audit integrity.',
        isSystemControlled: false,
    },
    CASE_DELETE: {
        action: 'Delete Case',
        reason: 'Cases cannot be deleted to preserve audit trail. Contact SUPER_ADMIN for archival.',
        allowedRole: 'FEDEX_ADMIN',
    },
    WORKFLOW_TRANSITION: {
        action: 'Status Change',
        reason: 'This status transition is not available for the current case state.',
        isSystemControlled: false,
    },
    GOVERNANCE_ONLY: {
        action: 'Operational Action',
        reason: 'SUPER_ADMIN provides oversight and governance. Operational actions are intentionally restricted.',
        allowedRole: 'FEDEX_ADMIN',
    },
};
