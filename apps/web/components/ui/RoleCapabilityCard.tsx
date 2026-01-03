'use client';

import { type UserRole, ROLE_PERMISSIONS, isGovernanceRole, isOperationalRole, PERMISSIONS } from '@/lib/auth/rbac';

interface RoleCapabilityCardProps {
    role: UserRole;
    className?: string;
}

/**
 * Role capability descriptions for user-friendly display
 */
const ROLE_DESCRIPTIONS: Record<UserRole, { title: string; description: string }> = {
    SUPER_ADMIN: {
        title: 'Super Administrator',
        description: 'Governance and oversight role with global read-only visibility.',
    },
    FEDEX_ADMIN: {
        title: 'FedEx Administrator',
        description: 'Full operational control including case management and DCA oversight.',
    },
    FEDEX_MANAGER: {
        title: 'FedEx Manager',
        description: 'Manages cases, DCAs, and SLA configurations for assigned regions.',
    },
    FEDEX_ANALYST: {
        title: 'FedEx Analyst',
        description: 'Analyzes case data and generates reports.',
    },
    FEDEX_AUDITOR: {
        title: 'FedEx Auditor',
        description: 'Reviews audit logs and compliance data.',
    },
    FEDEX_VIEWER: {
        title: 'FedEx Viewer',
        description: 'Read-only access to system data.',
    },
    DCA_ADMIN: {
        title: 'DCA Administrator',
        description: 'Manages DCA operations and agent assignments.',
    },
    DCA_MANAGER: {
        title: 'DCA Manager',
        description: 'Supervises agents and monitors case progress.',
    },
    DCA_AGENT: {
        title: 'DCA Agent',
        description: 'Works on assigned cases through the workflow system.',
    },
    AUDITOR: {
        title: 'Auditor',
        description: 'Reviews audit logs and compliance data.',
    },
    READONLY: {
        title: 'Read-Only User',
        description: 'Limited read-only access.',
    },
};

/**
 * Capability groupings for clear display
 */
const CAPABILITY_GROUPS = {
    canDo: {
        'cases:read': 'View cases',
        'cases:create': 'Create cases',
        'cases:update': 'Update cases via workflow',
        'cases:export': 'Export case data',
        'dcas:read': 'View DCA information',
        'dcas:update': 'Update DCA profiles',
        'sla:read': 'View SLA configurations',
        'analytics:read': 'View analytics',
        'analytics:export': 'Export reports',
        'admin:audit': 'View audit logs',
    },
    cannotDo: {
        'cases:assign': 'Assign DCAs (SYSTEM-controlled)',
        'sla:update': 'Modify SLA rules',
        'admin:settings': 'Configure system settings',
        'admin:security': 'Manage security settings',
    },
};

/**
 * Get what a role can and cannot do
 */
function getRoleCapabilities(role: UserRole) {
    const permissions = ROLE_PERMISSIONS[role] || [];
    const allPermissions = Object.keys(PERMISSIONS) as (keyof typeof PERMISSIONS)[];

    const canDo: string[] = [];
    const cannotDo: string[] = [];

    // What they CAN do
    for (const [perm, label] of Object.entries(CAPABILITY_GROUPS.canDo)) {
        if (permissions.includes(perm as any)) {
            canDo.push(label);
        }
    }

    // What they CANNOT do (important restrictions)
    for (const [perm, label] of Object.entries(CAPABILITY_GROUPS.cannotDo)) {
        if (!permissions.includes(perm as any)) {
            cannotDo.push(label);
        }
    }

    // Add governance-specific restrictions
    if (isGovernanceRole(role)) {
        cannotDo.push('Perform operational actions (governance role)');
    }

    return { canDo, cannotDo };
}

/**
 * Displays a summary of what the current user's role can and cannot do.
 * Informational only - does not control access.
 */
export function RoleCapabilityCard({ role, className = '' }: RoleCapabilityCardProps) {
    const roleInfo = ROLE_DESCRIPTIONS[role] || { title: role, description: '' };
    const { canDo, cannotDo } = getRoleCapabilities(role);
    const isGovernance = isGovernanceRole(role);

    return (
        <div className={`bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-lg p-4 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isGovernance ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                        {isGovernance ? (
                            <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                        )}
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Your Role</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{roleInfo.title}</p>
                    </div>
                </div>
                {isGovernance && (
                    <span className="text-[10px] uppercase tracking-wide font-medium px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                        Governance
                    </span>
                )}
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{roleInfo.description}</p>

            {/* Capabilities */}
            <div className="space-y-2">
                {canDo.length > 0 && (
                    <div>
                        <p className="text-[10px] uppercase tracking-wide text-green-600 dark:text-green-400 font-medium mb-1">Can Do</p>
                        <div className="flex flex-wrap gap-1">
                            {canDo.slice(0, 4).map((item, i) => (
                                <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300">
                                    {item}
                                </span>
                            ))}
                            {canDo.length > 4 && (
                                <span className="text-xs text-gray-400">+{canDo.length - 4} more</span>
                            )}
                        </div>
                    </div>
                )}

                {cannotDo.length > 0 && (
                    <div>
                        <p className="text-[10px] uppercase tracking-wide text-red-500 dark:text-red-400 font-medium mb-1">Cannot Do</p>
                        <div className="flex flex-wrap gap-1">
                            {cannotDo.slice(0, 3).map((item, i) => (
                                <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300">
                                    {item}
                                </span>
                            ))}
                            {cannotDo.length > 3 && (
                                <span className="text-xs text-gray-400">+{cannotDo.length - 3} more</span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
