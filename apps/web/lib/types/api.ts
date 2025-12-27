// ===========================================
// API Types
// ===========================================

/**
 * Standard API response wrapper
 */
export interface APIResponse<T> {
    data: T;
    message?: string;
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> {
    data: T[];
    pagination: Pagination;
}

/**
 * Pagination metadata
 */
export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
}

/**
 * API error response
 */
export interface APIError {
    error: {
        code: string;
        message: string;
        details?: ErrorDetail[];
        requestId?: string;
        timestamp?: string;
    };
}

export interface ErrorDetail {
    field: string;
    issue: string;
}

/**
 * Sort options
 */
export interface SortOptions {
    sortBy: string;
    sortOrder: 'asc' | 'desc';
}

/**
 * Query params for list endpoints
 */
export interface ListQueryParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
}

// ===========================================
// Notification Types
// ===========================================

export type NotificationType =
    | 'SLA_WARNING'
    | 'SLA_BREACH'
    | 'CASE_ASSIGNED'
    | 'PAYMENT_RECEIVED'
    | 'ESCALATION_CREATED'
    | 'DISPUTE_RAISED'
    | 'PERFORMANCE_ALERT'
    | 'SYSTEM_ALERT';

export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH';

export interface Notification {
    id: string;
    recipientId: string;
    notificationType: NotificationType;

    // Content
    title: string;
    message: string;
    actionUrl: string | null;

    // Context
    relatedCaseId: string | null;
    relatedEscalationId: string | null;
    relatedDcaId: string | null;

    // Delivery
    channels: NotificationChannel[];

    // Status
    isRead: boolean;
    readAt: string | null;
    isDismissed: boolean;

    // Priority
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

    expiresAt: string | null;
    createdAt: string;
}

// ===========================================
// Analytics Types
// ===========================================

export interface DashboardMetrics {
    totalCases: number;
    pendingAllocation: number;
    inProgress: number;
    recovered: number;
    totalOutstanding: number;
    totalRecovered: number;
    recoveryRate: number;
    avgAgeingDays: number;
    slaCompliance: number;
    activeDcas: number;
}

export interface TrendDataPoint {
    date: string;
    value: number;
    previousValue?: number;
}

export interface RecoveryTrend {
    period: string;
    recovered: number;
    outstanding: number;
    newCases: number;
    closedCases: number;
}

export interface AgeingDistribution {
    bucket: string;
    count: number;
    amount: number;
    percentage: number;
}

export interface DCAComparison {
    dcaId: string;
    dcaName: string;
    recoveryRate: number;
    slaCompliance: number;
    avgResolutionDays: number;
    totalCases: number;
    performanceScore: number;
}
