/**
 * Secure Query Builder
 * 
 * Provides region-aware, role-aware query building that automatically:
 * 1. Filters by user's accessible regions
 * 2. Filters by DCA assignment for DCA users  
 * 3. Logs cross-region access attempts
 * 
 * @module lib/auth/secure-query
 */

import { createClient } from '@/lib/supabase/server';
import { regionRBAC, type RegionAccess } from '@/lib/region';
import { isDCARole, isFedExRole, type UserRole } from '@/lib/auth/rbac';
import { logSecurityEvent } from '@/lib/audit';

export interface SecureUser {
    id: string;
    email: string;
    role: UserRole;
    dcaId?: string | null;
    accessibleRegions: string[];
    isGlobalAdmin: boolean;
}

interface QueryOptions {
    /** Column name for region filter (default: 'region_id') */
    regionColumn?: string;
    /** Column name for DCA filter (default: 'assigned_dca_id') */
    dcaColumn?: string;
    /** Skip region filtering (for global data) */
    skipRegionFilter?: boolean;
    /** Skip DCA filtering (for admin views) */
    skipDcaFilter?: boolean;
}

/**
 * SecureQueryBuilder - Creates region and DCA-aware queries
 * 
 * @example
 * const builder = new SecureQueryBuilder(user);
 * const { data } = await builder
 *   .from('cases')
 *   .select('*')
 *   .execute();
 */
export class SecureQueryBuilder {
    private user: SecureUser;
    private accessibleRegions: RegionAccess[] | null = null;
    private tableName: string = '';
    private selectColumns: string = '*';
    private options: QueryOptions = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private additionalFilters: Array<{ method: string; args: any[] }> = [];

    constructor(user: SecureUser) {
        this.user = user;
    }

    /**
     * Specify the table to query
     */
    from(tableName: string): SecureQueryBuilder {
        this.tableName = tableName;
        return this;
    }

    /**
     * Specify columns to select
     */
    select(columns: string): SecureQueryBuilder {
        this.selectColumns = columns;
        return this;
    }

    /**
     * Set query options
     */
    withOptions(options: QueryOptions): SecureQueryBuilder {
        this.options = { ...this.options, ...options };
        return this;
    }

    /**
     * Add equality filter
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    eq(column: string, value: any): SecureQueryBuilder {
        this.additionalFilters.push({ method: 'eq', args: [column, value] });
        return this;
    }

    /**
     * Add in filter
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    in(column: string, values: any[]): SecureQueryBuilder {
        this.additionalFilters.push({ method: 'in', args: [column, values] });
        return this;
    }

    /**
     * Add ordering
     */
    order(column: string, options?: { ascending?: boolean }): SecureQueryBuilder {
        this.additionalFilters.push({ method: 'order', args: [column, options] });
        return this;
    }

    /**
     * Add limit
     */
    limit(count: number): SecureQueryBuilder {
        this.additionalFilters.push({ method: 'limit', args: [count] });
        return this;
    }

    /**
     * Add range
     */
    range(from: number, to: number): SecureQueryBuilder {
        this.additionalFilters.push({ method: 'range', args: [from, to] });
        return this;
    }

    /**
     * Execute the query with security filters applied
     * SECURITY: Region filtering uses pre-validated user.accessibleRegions
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async execute(): Promise<{ data: any[]; error: any; count?: number }> {
        const supabase = await createClient();
        const regionColumn = this.options.regionColumn || 'region_id';
        const dcaColumn = this.options.dcaColumn || 'assigned_dca_id';

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let query = (supabase as any)
            .from(this.tableName)
            .select(this.selectColumns, { count: 'exact' });

        // Apply DCA filter for DCA users
        if (isDCARole(this.user.role) && this.user.dcaId && !this.options.skipDcaFilter) {
            query = query.eq(dcaColumn, this.user.dcaId);
        }

        // Apply region filter for non-global roles
        // Uses pre-validated accessibleRegions from user context (NOT re-fetched)
        if (!this.options.skipRegionFilter && !this.user.isGlobalAdmin) {
            const regionIds = this.user.accessibleRegions;

            if (!regionIds || regionIds.length === 0) {
                // No accessible regions - return empty (fail-closed)
                return { data: [], error: null, count: 0 };
            }

            query = query.in(regionColumn, regionIds);
        }

        // Apply additional filters
        for (const filter of this.additionalFilters) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            query = (query as any)[filter.method](...filter.args);
        }

        const { data, error, count } = await query;
        return { data: data || [], error, count };
    }

    /**
     * Check if user is a global admin (bypasses region filters)
     */
    private isGlobalAdmin(): boolean {
        return ['SUPER_ADMIN', 'FEDEX_ADMIN'].includes(this.user.role);
    }

    /**
     * Get accessible regions for the user
     */
    private async getAccessibleRegions(): Promise<RegionAccess[]> {
        if (this.accessibleRegions !== null) {
            return this.accessibleRegions;
        }

        this.accessibleRegions = await regionRBAC.getUserAccessibleRegions(this.user.id);
        return this.accessibleRegions;
    }

    /**
     * Validate user has access to a specific region, log violation if not
     */
    async validateRegionAccess(regionId: string, ipAddress?: string): Promise<boolean> {
        const accessCheck = await regionRBAC.hasRegionAccess(this.user.id, regionId);

        if (!accessCheck.allowed) {
            await logSecurityEvent('PERMISSION_DENIED', this.user.id, {
                type: 'CROSS_REGION_ACCESS_ATTEMPT',
                target_region_id: regionId,
                user_role: this.user.role,
                reason: accessCheck.reason,
            }, ipAddress);
            return false;
        }

        return true;
    }
}

/**
 * Factory function for creating a SecureQueryBuilder
 */
export function secureQuery(user: SecureUser): SecureQueryBuilder {
    return new SecureQueryBuilder(user);
}

/**
 * Get a region-filtered case query for a user
 */
export async function getSecureCasesQuery(user: SecureUser) {
    return secureQuery(user)
        .from('cases')
        .select('*, assigned_dca:dcas(id, name, code)')
        .order('created_at', { ascending: false });
}

/**
 * Get a region-filtered DCA query for a user
 */
export async function getSecureDCAsQuery(user: SecureUser) {
    return secureQuery(user)
        .from('dcas')
        .withOptions({ dcaColumn: 'id' }) // DCA users filter by their own DCA ID
        .select('*')
        .order('name', { ascending: true });
}

/**
 * Get a region-filtered analytics query for a user
 */
export async function getSecureAnalyticsQuery(user: SecureUser, table: string) {
    return secureQuery(user)
        .from(table)
        .select('*');
}
