/**
 * Governance Invariant: Case Creation Authority
 *
 * Case creation is machine-only, with a single audited break-glass path:
 * - SYSTEM actors create cases via /api/v1/cases/system-create
 * - FEDEX_ADMIN is the ONLY human role permitted to create a case, and only via
 *   an exception path that requires written justification
 *
 * Both creation handlers guard with an explicit `user.role !== 'FEDEX_ADMIN'`
 * check, so a stray permission grant is not currently exploitable — but it makes
 * the UI advertise capabilities the backend denies (see RoleCapabilityCard), and
 * it would become exploitable the moment a new route trusts the permission alone.
 * These tests lock the grant itself.
 */

import {
    ROLE_PERMISSIONS,
    hasPermission,
    type UserRole,
} from '@/lib/auth/rbac';

const ALL_ROLES = Object.keys(ROLE_PERMISSIONS) as UserRole[];

describe('Governance - Case Creation Authority', () => {
    it('FEDEX_ADMIN is the only role holding cases:create', () => {
        const holders = ALL_ROLES.filter(role => hasPermission(role, 'cases:create'));

        expect(holders).toEqual(['FEDEX_ADMIN']);
    });

    it('no DCA role can create cases', () => {
        for (const role of ['DCA_ADMIN', 'DCA_MANAGER', 'DCA_AGENT'] as UserRole[]) {
            expect(hasPermission(role, 'cases:create')).toBe(false);
        }
    });

    it('SUPER_ADMIN is governance-only and cannot create cases', () => {
        expect(hasPermission('SUPER_ADMIN', 'cases:create')).toBe(false);
    });

    it('read-only roles cannot create cases', () => {
        for (const role of [
            'FEDEX_AUDITOR',
            'FEDEX_VIEWER',
            'FEDEX_ANALYST',
            'AUDITOR',
            'READONLY',
        ] as UserRole[]) {
            expect(hasPermission(role, 'cases:create')).toBe(false);
        }
    });

    it('no role can assign cases — allocation is SYSTEM-only', () => {
        const holders = ALL_ROLES.filter(role => hasPermission(role, 'cases:assign'));

        expect(holders).toEqual([]);
    });
});
