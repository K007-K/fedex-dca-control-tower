/**
 * Test Setup - Enterprise Testing Infrastructure
 * 
 * Provides mock utilities for testing governance-critical paths.
 */

import '@testing-library/jest-dom';

// ===========================================
// GLOBAL TEST UTILITIES
// ===========================================

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.SERVICE_SECRET = 'test-service-secret-minimum-32-characters-long';
process.env.NODE_ENV = 'test';

// ===========================================
// CONSOLE SUPPRESSION (reduce noise)
// ===========================================

const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
    // Suppress expected console errors/warnings during tests
    console.error = (...args: unknown[]) => {
        const message = args[0]?.toString() || '';
        // Allow security-related logs through
        if (message.includes('GOVERNANCE') || message.includes('SECURITY')) {
            originalConsoleError(...args);
        }
    };
    console.warn = (...args: unknown[]) => {
        const message = args[0]?.toString() || '';
        if (message.includes('GOVERNANCE') || message.includes('SECURITY')) {
            originalConsoleWarn(...args);
        }
    };
});

afterAll(() => {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
});

// ===========================================
// GLOBAL TEST TIMEOUT
// ===========================================

jest.setTimeout(10000);
