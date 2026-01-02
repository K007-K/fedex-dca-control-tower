/**
 * Role-Based Access Control (RBAC) Configuration
 * Defines permissions for each user role in the FedEx DCA Control Tower
 */

// All available permissions in the system
export const PERMISSIONS = {
    // Case permissions
    'cases:read': 'View cases',
    'cases:create': 'Create new cases',
    'cases:update': 'Update case information',
    'cases:delete': 'Delete cases',
    'cases:assign': 'Assign cases to DCAs',
    'cases:bulk': 'Perform bulk operations on cases',
    'cases:export': 'Export case data',

    // DCA permissions
    'dcas:read': 'View DCAs',
    'dcas:create': 'Add new DCAs',
    'dcas:update': 'Update DCA information',
    'dcas:delete': 'Remove DCAs',
    'dcas:performance': 'View DCA performance metrics',
    'dcas:manage': 'Manage DCA capacity and settings',

    // User permissions
    'users:read': 'View users',
    'users:create': 'Create new users',
    'users:update': 'Update user information',
    'users:delete': 'Delete users',
    'users:roles': 'Manage user roles',

    // Region permissions (ENTERPRISE GOVERNANCE)
    'regions:read': 'View regions',
    'regions:create': 'Create regions (Global Admin)',
    'regions:update': 'Update regions',
    'regions:delete': 'Delete/deactivate regions',
    'regions:assign-users': 'Assign users to regions',
    'regions:assign-dcas': 'Assign DCAs to regions',
    'regions:override': 'Override region assignment (audit logged)',

    // SLA permissions
    'sla:read': 'View SLA templates and logs',
    'sla:create': 'Create SLA templates',
    'sla:update': 'Update SLA settings',
    'sla:exempt': 'Exempt cases from SLA',

    // Analytics permissions
    'analytics:read': 'View analytics',
    'analytics:export': 'Export reports',
    'analytics:custom': 'Create custom reports',

    // Admin permissions
    'admin:settings': 'Manage system settings',
    'admin:audit': 'View audit logs',
    'admin:security': 'Manage security settings',
} as const;

export type Permission = keyof typeof PERMISSIONS;

// User roles in the system
export type UserRole =
    | 'SUPER_ADMIN'
    | 'FEDEX_ADMIN'
    | 'FEDEX_MANAGER'
    | 'FEDEX_ANALYST'
    | 'DCA_ADMIN'
    | 'DCA_MANAGER'
    | 'DCA_AGENT'
    | 'AUDITOR'
    | 'READONLY';

// Role hierarchy (higher roles inherit permissions from lower)
export const ROLE_HIERARCHY: Record<UserRole, number> = {
    'SUPER_ADMIN': 100,
    'FEDEX_ADMIN': 90,
    'FEDEX_MANAGER': 70,
    'FEDEX_ANALYST': 50,
    'DCA_ADMIN': 60,
    'DCA_MANAGER': 40,
    'DCA_AGENT': 20,
    'AUDITOR': 30,
    'READONLY': 10,
};

// Define permissions for each role
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    SUPER_ADMIN: Object.keys(PERMISSIONS) as Permission[],

    FEDEX_ADMIN: [
        'cases:read', 'cases:create', 'cases:update', 'cases:delete', 'cases:assign', 'cases:bulk', 'cases:export',
        'dcas:read', 'dcas:create', 'dcas:update', 'dcas:delete', 'dcas:performance', 'dcas:manage',
        'users:read', 'users:create', 'users:update', 'users:delete', 'users:roles',
        'sla:read', 'sla:create', 'sla:update', 'sla:exempt',
        'analytics:read', 'analytics:export', 'analytics:custom',
        'admin:settings', 'admin:audit',
    ],

    FEDEX_MANAGER: [
        'cases:read', 'cases:create', 'cases:update', 'cases:assign', 'cases:bulk', 'cases:export',
        'dcas:read', 'dcas:update', 'dcas:performance', 'dcas:manage',
        'users:read', 'users:create', 'users:update',
        'sla:read', 'sla:update', 'sla:exempt',
        'analytics:read', 'analytics:export',
    ],

    FEDEX_ANALYST: [
        'cases:read', 'cases:export',
        'dcas:read', 'dcas:performance',
        'users:read',
        'sla:read',
        'analytics:read', 'analytics:export', 'analytics:custom',
    ],

    DCA_ADMIN: [
        'cases:read', 'cases:update',
        'dcas:read', 'dcas:performance',
        'users:read', 'users:create', 'users:update',
        'sla:read',
        'analytics:read',
    ],

    DCA_MANAGER: [
        'cases:read', 'cases:update',
        'dcas:read', 'dcas:performance',
        'users:read',
        'sla:read',
        'analytics:read',
    ],

    DCA_AGENT: [
        'cases:read', 'cases:update',
        'dcas:read',
        'sla:read',
    ],

    AUDITOR: [
        'cases:read',
        'dcas:read', 'dcas:performance',
        'users:read',
        'sla:read',
        'analytics:read',
        'admin:audit',
    ],

    READONLY: [
        'cases:read',
        'dcas:read',
        'sla:read',
        'analytics:read',
    ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
    return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
    return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
    return permissions.every(permission => hasPermission(role, permission));
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: UserRole): Permission[] {
    return ROLE_PERMISSIONS[role] ?? [];
}

/**
 * Check if role A has higher or equal hierarchy than role B
 */
export function canManageRole(managerRole: UserRole, targetRole: UserRole): boolean {
    return ROLE_HIERARCHY[managerRole] > ROLE_HIERARCHY[targetRole];
}

/**
 * Get roles that can be assigned by a given role
 */
export function getAssignableRoles(role: UserRole): UserRole[] {
    const hierarchy = ROLE_HIERARCHY[role];
    return (Object.keys(ROLE_HIERARCHY) as UserRole[]).filter(
        r => ROLE_HIERARCHY[r] < hierarchy
    );
}

/**
 * Check if a role is a FedEx internal role
 */
export function isFedExRole(role: UserRole): boolean {
    return ['SUPER_ADMIN', 'FEDEX_ADMIN', 'FEDEX_MANAGER', 'FEDEX_ANALYST'].includes(role);
}

/**
 * Check if a role is a DCA role
 */
export function isDCARole(role: UserRole): boolean {
    return ['DCA_ADMIN', 'DCA_MANAGER', 'DCA_AGENT'].includes(role);
}

/**
 * Check if a role is a governance/oversight role (not operational)
 * Governance roles should NOT see operational controls like case assignment buttons
 * They have view-only access for oversight purposes
 */
export function isGovernanceRole(role: UserRole): boolean {
    return ['SUPER_ADMIN', 'AUDITOR', 'READONLY'].includes(role);
}

/**
 * Check if a role is an operational role that can perform day-to-day actions
 */
export function isOperationalRole(role: UserRole): boolean {
    return !isGovernanceRole(role);
}
