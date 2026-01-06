/**
 * Case Ingestion Validation Tests
 * 
 * CRITICAL GOVERNANCE TESTS:
 * - Payload schema enforcement
 * - Required fields validation
 * - Forbidden fields rejection
 * - Idempotency (external_case_id)
 */

import { validateSystemCasePayload, SystemCaseCreateSchema } from '@/lib/case/system-case-creation';
import { createSystemCasePayload } from '../utils/test-helpers';

describe('Case Ingestion - Payload Validation', () => {
    // ===========================================
    // VALID PAYLOADS
    // ===========================================

    describe('Valid Payloads', () => {
        it('accepts complete valid payload', () => {
            const payload = createSystemCasePayload();
            const result = validateSystemCasePayload(payload);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.source_system).toBe('TEST_RPA');
                expect(result.data.region).toBe('INDIA');
            }
        });

        it('accepts all valid currencies', () => {
            const currencies = ['USD', 'INR', 'EUR', 'GBP', 'AED', 'SGD', 'HKD', 'JPY', 'CNY', 'AUD'];

            for (const currency of currencies) {
                const payload = createSystemCasePayload({ currency });
                const result = validateSystemCasePayload(payload);
                expect(result.success).toBe(true);
            }
        });

        it('accepts all valid case types', () => {
            const caseTypes = ['INVOICE', 'CONTRACT', 'SERVICE', 'OTHER'];

            for (const case_type of caseTypes) {
                const payload = createSystemCasePayload({ case_type });
                const result = validateSystemCasePayload(payload);
                expect(result.success).toBe(true);
            }
        });
    });

    // ===========================================
    // REQUIRED FIELDS ENFORCEMENT
    // ===========================================

    describe('Required Fields', () => {
        it('rejects missing source_system', () => {
            const payload = createSystemCasePayload();
            delete (payload as Record<string, unknown>).source_system;

            const result = validateSystemCasePayload(payload);
            expect(result.success).toBe(false);
        });

        it('rejects missing source_reference_id (external_case_id)', () => {
            const payload = createSystemCasePayload();
            delete (payload as Record<string, unknown>).source_reference_id;

            const result = validateSystemCasePayload(payload);
            expect(result.success).toBe(false);
        });

        it('rejects missing region', () => {
            const payload = createSystemCasePayload();
            delete (payload as Record<string, unknown>).region;

            const result = validateSystemCasePayload(payload);
            expect(result.success).toBe(false);
        });

        it('rejects missing customer_id', () => {
            const payload = createSystemCasePayload();
            delete (payload as Record<string, unknown>).customer_id;

            const result = validateSystemCasePayload(payload);
            expect(result.success).toBe(false);
        });

        it('rejects missing currency', () => {
            const payload = createSystemCasePayload();
            delete (payload as Record<string, unknown>).currency;

            const result = validateSystemCasePayload(payload);
            expect(result.success).toBe(false);
        });

        it('rejects missing total_due', () => {
            const payload = createSystemCasePayload();
            delete (payload as Record<string, unknown>).total_due;

            const result = validateSystemCasePayload(payload);
            expect(result.success).toBe(false);
        });
    });

    // ===========================================
    // FORBIDDEN FIELDS (SYSTEM-ONLY)
    // ===========================================

    describe('Forbidden Fields - Schema Rejects Assignment Fields', () => {
        it('schema does NOT include assigned_dca_id field', () => {
            // The schema should not have these fields at all
            const schemaShape = SystemCaseCreateSchema.shape;

            expect('assigned_dca_id' in schemaShape).toBe(false);
            expect('assigned_agent_id' in schemaShape).toBe(false);
            expect('case_status' in schemaShape).toBe(false);
            expect('sla_due_at' in schemaShape).toBe(false);
            expect('escalation_level' in schemaShape).toBe(false);
        });

        it('extra fields are stripped (not causing validation failure)', () => {
            const payload = {
                ...createSystemCasePayload(),
                assigned_dca_id: 'should-be-ignored',
                assigned_agent_id: 'should-be-ignored',
                status: 'should-be-ignored',
            };

            // Validation still succeeds - extra fields ignored by Zod
            const result = validateSystemCasePayload(payload);
            expect(result.success).toBe(true);

            // But the validated data should NOT contain these fields
            if (result.success) {
                expect('assigned_dca_id' in result.data).toBe(false);
                expect('assigned_agent_id' in result.data).toBe(false);
                expect('status' in result.data).toBe(false);
            }
        });
    });

    // ===========================================
    // DATA VALIDATION
    // ===========================================

    describe('Data Validation Rules', () => {
        it('rejects negative total_due', () => {
            const payload = createSystemCasePayload({ total_due: -100 });
            const result = validateSystemCasePayload(payload);
            expect(result.success).toBe(false);
        });

        it('rejects zero total_due', () => {
            const payload = createSystemCasePayload({ total_due: 0 });
            const result = validateSystemCasePayload(payload);
            expect(result.success).toBe(false);
        });

        it('rejects invalid currency code', () => {
            const payload = createSystemCasePayload({ currency: 'INVALID' });
            const result = validateSystemCasePayload(payload);
            expect(result.success).toBe(false);
        });

        it('rejects invalid case_type', () => {
            const payload = createSystemCasePayload({ case_type: 'INVALID' });
            const result = validateSystemCasePayload(payload);
            expect(result.success).toBe(false);
        });

        it('rejects empty region', () => {
            const payload = createSystemCasePayload({ region: '' });
            const result = validateSystemCasePayload(payload);
            expect(result.success).toBe(false);
        });

        it('rejects empty source_system', () => {
            const payload = createSystemCasePayload({ source_system: '' });
            const result = validateSystemCasePayload(payload);
            expect(result.success).toBe(false);
        });

        it('rejects invalid customer_address.country (must be 2 chars)', () => {
            const payload = createSystemCasePayload({
                customer_address: { country: 'INDIA', state: 'MH', city: 'Mumbai' },
            });
            const result = validateSystemCasePayload(payload);
            expect(result.success).toBe(false);
        });
    });

    // ===========================================
    // IDEMPOTENCY KEY VALIDATION
    // ===========================================

    describe('source_reference_id (Idempotency Key)', () => {
        it('accepts valid source_reference_id', () => {
            const payload = createSystemCasePayload({
                source_reference_id: 'INV-2026-001234',
            });
            const result = validateSystemCasePayload(payload);
            expect(result.success).toBe(true);
        });

        it('rejects empty source_reference_id', () => {
            const payload = createSystemCasePayload({
                source_reference_id: '',
            });
            const result = validateSystemCasePayload(payload);
            expect(result.success).toBe(false);
        });

        it('accepts long source_reference_id up to 255 chars', () => {
            const payload = createSystemCasePayload({
                source_reference_id: 'A'.repeat(255),
            });
            const result = validateSystemCasePayload(payload);
            expect(result.success).toBe(true);
        });
    });
});
