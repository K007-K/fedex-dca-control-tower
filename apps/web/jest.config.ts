/**
 * Jest Configuration for FedEx DCA Control Tower
 * 
 * ENTERPRISE TESTING FOCUS:
 * - Core logic and governance
 * - Security boundaries
 * - No UI/styling tests
 */

import type { Config } from 'jest';
import nextJest from 'next/jest';

const createJestConfig = nextJest({
    // Path to Next.js app
    dir: './',
});

const config: Config = {
    // Test environment
    testEnvironment: 'node', // Use node for API/logic tests

    // Test file patterns - ONLY test governance-critical code
    testMatch: [
        '<rootDir>/__tests__/**/*.test.ts',
        '<rootDir>/__tests__/**/*.test.tsx',
    ],

    // Ignore patterns
    testPathIgnorePatterns: [
        '<rootDir>/node_modules/',
        '<rootDir>/.next/',
    ],

    // Module path aliases (match tsconfig.json)
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        '^@/components/(.*)$': '<rootDir>/components/$1',
        '^@/lib/(.*)$': '<rootDir>/lib/$1',
    },

    // Setup files
    setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],

    // Coverage configuration - focus on critical paths
    collectCoverageFrom: [
        'lib/auth/**/*.ts',
        'lib/case/**/*.ts',
        'lib/allocation/**/*.ts',
        'lib/sla/**/*.ts',
        'lib/audit/**/*.ts',
        '!**/*.d.ts',
        '!**/node_modules/**',
    ],

    // Coverage thresholds for critical paths
    coverageThreshold: {
        global: {
            branches: 50,
            functions: 60,
            lines: 60,
            statements: 60,
        },
    },

    // Clear mocks between tests
    clearMocks: true,

    // Verbose output
    verbose: true,

    // Transform
    transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
            useESM: true,
        }],
    },

    // Module file extensions
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
};

export default createJestConfig(config);
