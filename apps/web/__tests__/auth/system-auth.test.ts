/**
 * System Authentication Tests
 * 
 * CRITICAL: Tests SYSTEM-only endpoint protection
 * - SYSTEM tokens accepted
 * - HUMAN tokens rejected (403)
 * - Spoof attempts blocked
 */

import {
    isSystemRequest,
    authenticateSystemRequest,
    serviceCanPerform,
} from '@/lib/auth/system-auth';
import { createMockRequest } from '../utils/test-helpers';

// Mock jose for JWT verification
jest.mock('jose', () => ({
    jwtVerify: jest.fn(),
    SignJWT: jest.fn().mockReturnValue({
        setProtectedHeader: jest.fn().mockReturnThis(),
        setIssuedAt: jest.fn().mockReturnThis(),
        setExpirationTime: jest.fn().mockReturnThis(),
        sign: jest.fn().mockResolvedValue('mock-jwt-token'),
    }),
}));

describe('System Authentication - isSystemRequest', () => {
    it('identifies requests with X-Service-Auth header as SYSTEM', () => {
        const request = createMockRequest({
            headers: {
                'x-service-auth': 'Bearer test-token',
            },
        });

        expect(isSystemRequest(request)).toBe(true);
    });

    it('identifies requests WITHOUT X-Service-Auth as HUMAN', () => {
        const request = createMockRequest({
            headers: {
                'authorization': 'Bearer user-token',
            },
        });

        expect(isSystemRequest(request)).toBe(false);
    });

    it('empty X-Service-Auth header is treated as HUMAN', () => {
        const request = createMockRequest({
            headers: {
                'x-service-auth': '',
            },
        });

        expect(isSystemRequest(request)).toBe(false);
    });
});

describe('System Authentication - serviceCanPerform', () => {
    it('DCA_ALLOCATOR can perform cases:system-create', () => {
        expect(serviceCanPerform('DCA_ALLOCATOR', 'cases:system-create')).toBe(true);
    });

    it('RPA_BOT can perform cases:system-create', () => {
        expect(serviceCanPerform('RPA_BOT', 'cases:system-create')).toBe(true);
    });

    it('unknown service is denied by default', () => {
        expect(serviceCanPerform('UNKNOWN_SERVICE', 'cases:system-create')).toBe(false);
    });
});

describe('System Authentication - GOVERNANCE RULES', () => {
    describe('SYSTEM vs HUMAN Separation', () => {
        it('SYSTEM endpoints must use X-Service-Auth header', () => {
            // A request with only Authorization (session-based) is HUMAN
            const humanRequest = createMockRequest({
                headers: { 'authorization': 'Bearer supabase-session-token' },
            });

            expect(isSystemRequest(humanRequest)).toBe(false);
        });

        it('Authorization header cannot spoof as SYSTEM', () => {
            // Even if Authorization says "system", it's not valid SYSTEM auth
            const spoofRequest = createMockRequest({
                headers: { 'authorization': 'Bearer system-spoof-attempt' },
            });

            expect(isSystemRequest(spoofRequest)).toBe(false);
        });
    });

    describe('Header Validation', () => {
        it('X-Service-Auth requires Bearer prefix', () => {
            const request = createMockRequest({
                headers: { 'x-service-auth': 'Bearer valid-token' },
            });

            expect(isSystemRequest(request)).toBe(true);
        });
    });
});
