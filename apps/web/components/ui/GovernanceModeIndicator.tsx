'use client';

import { type UserRole, isGovernanceRole } from '@/lib/auth/rbac';

interface GovernanceModeIndicatorProps {
    role: UserRole;
    className?: string;
}

/**
 * Visual indicator for SUPER_ADMIN and other governance roles.
 * Clearly labels the view as "Governance View (Read-only)" and explains restrictions.
 */
export function GovernanceModeIndicator({ role, className = '' }: GovernanceModeIndicatorProps) {
    if (!isGovernanceRole(role)) {
        return null;
    }

    return (
        <div className={`bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800/30 rounded-lg p-3 ${className}`}>
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-purple-900 dark:text-purple-200">
                            Governance View
                        </span>
                        <span className="text-[10px] uppercase tracking-wide font-medium px-1.5 py-0.5 rounded bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-300">
                            Read-only
                        </span>
                    </div>
                    <p className="text-xs text-purple-700 dark:text-purple-300 mt-0.5">
                        {role === 'SUPER_ADMIN'
                            ? 'SUPER_ADMIN provides oversight and governance. Operational actions are intentionally restricted.'
                            : 'This role has read-only access for oversight and audit purposes.'}
                    </p>
                </div>
            </div>
        </div>
    );
}

/**
 * Smaller inline governance badge for headers
 */
export function GovernanceBadge({ role }: { role: UserRole }) {
    if (!isGovernanceRole(role)) {
        return null;
    }

    return (
        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2A11.954 11.954 0 0110 1.944z" clipRule="evenodd" />
            </svg>
            Governance Mode
        </span>
    );
}
