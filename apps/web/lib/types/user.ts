// ===========================================
// User Types
// ===========================================

export type UserRole =
    | 'SUPER_ADMIN'
    | 'FEDEX_ADMIN'
    | 'FEDEX_MANAGER'
    | 'FEDEX_ANALYST'
    | 'FEDEX_AUDITOR'
    | 'DCA_ADMIN'
    | 'DCA_MANAGER'
    | 'DCA_AGENT'
    | 'AUDITOR'   // Legacy - maps to FEDEX_AUDITOR
    | 'READONLY';

export interface User {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;

    // Organization Links
    organizationId: string | null;
    dcaId: string | null;

    // Profile
    phone: string | null;
    avatarUrl: string | null;
    timezone: string;
    locale: string;

    // Permissions
    permissions: string[] | null;

    // Status
    isActive: boolean;
    isVerified: boolean;
    mfaEnabled: boolean;
    lastLoginAt: string | null;
    lastLoginIp: string | null;

    // Preferences
    notificationPreferences: NotificationPreferences | null;
    uiPreferences: UIPreferences | null;

    // Metadata
    metadata: unknown | null;
    createdAt: string;
    updatedAt: string;

    // Relations
    dca?: import('./dca').DCA;
}

export interface NotificationPreferences {
    email: boolean;
    sms: boolean;
    inApp: boolean;
    slaWarnings: boolean;
    slaBreaches: boolean;
    caseAssignments: boolean;
    escalations: boolean;
}

export interface UIPreferences {
    theme: 'light' | 'dark' | 'system';
    sidebarCollapsed: boolean;
    defaultPageSize: number;
    dashboardLayout: string | null;
}

export interface UserFilters {
    role?: UserRole[];
    isActive?: boolean;
    dcaId?: string;
    search?: string;
}

export interface UserCreateInput {
    email: string;
    fullName: string;
    role: UserRole;
    organizationId?: string;
    dcaId?: string;
    phone?: string;
    permissions?: string[];
}

export interface UserUpdateInput {
    fullName?: string;
    role?: UserRole;
    phone?: string;
    avatarUrl?: string;
    timezone?: string;
    locale?: string;
    permissions?: string[];
    isActive?: boolean;
    notificationPreferences?: NotificationPreferences;
    uiPreferences?: UIPreferences;
}

// ===========================================
// Auth Types
// ===========================================

export interface AuthUser {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
    permissions: string[];
    dcaId: string | null;
    organizationId: string | null;
    avatarUrl: string | null;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface AuthSession {
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
}
