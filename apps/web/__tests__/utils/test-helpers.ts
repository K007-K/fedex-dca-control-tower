/**
 * Test Utilities - Mock Factories and Helpers
 * 
 * Provides consistent test data and mock factories for governance testing.
 */

import type { UserRole, Permission } from '@/lib/auth/rbac';
import { ROLE_PERMISSIONS } from '@/lib/auth/rbac';

// ===========================================
// EXTENDED USER TYPE (matches api-wrapper context)
// ===========================================

export interface TestUser {
    id: string;
    email: string;
    role: UserRole;
    organizationId: string | null;
    dcaId: string | null;
    permissions: Permission[];
    // Extended fields from API wrapper
    accessibleRegions: string[];
    isGlobalAdmin: boolean;
    isActive: boolean;
}

// ===========================================
// USER FACTORIES
// ===========================================

export const createMockUser = (overrides: Partial<TestUser> = {}): TestUser => ({
    id: 'user-123',
    email: 'test@fedex.com',
    role: 'FEDEX_ADMIN',
    organizationId: null,
    dcaId: null,
    permissions: ROLE_PERMISSIONS['FEDEX_ADMIN'],
    isActive: true,
    accessibleRegions: ['region-americas'],
    isGlobalAdmin: false,
    ...overrides,
});

export const createSuperAdmin = (): TestUser => createMockUser({
    id: 'super-admin-1',
    email: 'admin@fedex.com',
    role: 'SUPER_ADMIN',
    permissions: ROLE_PERMISSIONS['SUPER_ADMIN'],
    accessibleRegions: [],
    isGlobalAdmin: true,
});

export const createFedExAdmin = (regions: string[] = ['region-americas']): TestUser => createMockUser({
    id: 'fedex-admin-1',
    email: 'fedex.admin@fedex.com',
    role: 'FEDEX_ADMIN',
    permissions: ROLE_PERMISSIONS['FEDEX_ADMIN'],
    accessibleRegions: regions,
    isGlobalAdmin: false,
});

export const createDCAAdmin = (dcaId: string, regions: string[] = ['region-india']): TestUser => createMockUser({
    id: 'dca-admin-1',
    email: 'admin@dca.com',
    role: 'DCA_ADMIN',
    dcaId,
    permissions: ROLE_PERMISSIONS['DCA_ADMIN'],
    accessibleRegions: regions,
    isGlobalAdmin: false,
});

export const createDCAAgent = (dcaId: string, regions: string[] = ['region-india']): TestUser => createMockUser({
    id: 'dca-agent-1',
    email: 'agent@dca.com',
    role: 'DCA_AGENT',
    dcaId,
    permissions: ROLE_PERMISSIONS['DCA_AGENT'],
    accessibleRegions: regions,
    isGlobalAdmin: false,
});

// ===========================================
// SYSTEM ACTOR FACTORIES
// ===========================================

export const createSystemActor = (serviceName: string = 'TEST_SERVICE') => ({
    actor_type: 'SYSTEM' as const,
    actor_id: `system-${serviceName.toLowerCase()}`,
    service_name: serviceName,
});

// ===========================================
// CASE FACTORIES
// ===========================================

export const createSystemCasePayload = (overrides = {}) => ({
    case_type: 'INVOICE',
    source_system: 'TEST_RPA',
    source_reference_id: `REF-${Date.now()}`,
    region: 'INDIA',
    currency: 'INR',
    principal_amount: 10000,
    tax_amount: 1800,
    total_due: 11800,
    customer_id: 'CUST-001',
    customer_name: 'Test Customer',
    customer_contact: {
        email: 'customer@test.com',
        phone: '+91-9876543210',
    },
    customer_address: {
        country: 'IN',
        state: 'MH',
        city: 'Mumbai',
    },
    ...overrides,
});

// ===========================================
// REQUEST FACTORIES
// ===========================================

export const createMockRequest = (options: {
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
    url?: string;
} = {}) => {
    const { method = 'GET', headers = {}, body, url = 'http://localhost:3000/api/test' } = options;

    return {
        method,
        url,
        headers: new Headers(headers),
        json: async () => body,
        text: async () => JSON.stringify(body),
    } as unknown as Request;
};

// ===========================================
// MOCK SUPABASE CLIENT
// ===========================================

export const createMockSupabaseClient = (options: {
    data?: unknown;
    error?: { message: string; code?: string } | null;
    count?: number;
} = {}) => {
    const { data = [], error = null, count = 0 } = options;

    const mockQuery = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data, error }),
        execute: jest.fn().mockResolvedValue({ data, error, count }),
    };

    return {
        from: jest.fn().mockReturnValue(mockQuery),
        auth: {
            getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
        },
    };
};

// ===========================================
// ASSERTION HELPERS
// ===========================================

export const expectForbidden = (response: { status: number }) => {
    expect(response.status).toBe(403);
};

export const expectUnauthorized = (response: { status: number }) => {
    expect(response.status).toBe(401);
};

export const expectSuccess = (response: { status: number }) => {
    expect(response.status).toBeGreaterThanOrEqual(200);
    expect(response.status).toBeLessThan(300);
};
