/**
 * Region-Based Access Control (RBAC)
 * 
 * Enforces region-based access control at:
 * 1. API level (middleware)
 * 2. Query level (filtering)
 * 3. UI level (context)
 * 
 * @module lib/region/RegionRBAC
 */

import { createClient } from '@/lib/supabase/server';
import type { UserRole } from '@/lib/auth/rbac';

// ===========================================
// TYPES
// ===========================================

export interface UserWithRegions {
    id: string;
    email: string;
    role: UserRole;
    dca_id?: string;
    primary_region_id?: string;
    accessible_regions: RegionAccess[];
}

export interface RegionAccess {
    region_id: string;
    region_code: string;
    region_name: string;
    access_level: 'READ' | 'WRITE' | 'ADMIN';
    is_primary: boolean;
}

export interface AccessCheckResult {
    allowed: boolean;
    reason: string;
    access_level?: string;
}

// Global roles that bypass region checks
const GLOBAL_ROLES: UserRole[] = ['SUPER_ADMIN', 'FEDEX_ADMIN'];

// Roles that can have region-specific access
const REGIONAL_ROLES: UserRole[] = ['FEDEX_MANAGER', 'FEDEX_ANALYST', 'DCA_ADMIN', 'DCA_MANAGER', 'DCA_AGENT'];

// ===========================================
// REGION RBAC CLASS
// ===========================================

export class RegionRBAC {

    /**
     * Checks if user has access to a specific region.
     */
    async hasRegionAccess(
        userId: string,
        regionId: string,
        requiredLevel: 'READ' | 'WRITE' | 'ADMIN' = 'READ'
    ): Promise<AccessCheckResult> {
        const supabase = await createClient();

        // Get user role
        const { data: user } = await supabase
            .from('users')
            .select('role, dca_id')
            .eq('id', userId)
            .single();

        if (!user) {
            return { allowed: false, reason: 'User not found' };
        }

        // Global roles have full access
        if (GLOBAL_ROLES.includes(user.role as UserRole)) {
            return {
                allowed: true,
                reason: 'Global admin access',
                access_level: 'ADMIN'
            };
        }

        // Check explicit region access
        const { data: access } = await supabase
            .from('user_region_access')
            .select('access_level')
            .eq('user_id', userId)
            .eq('region_id', regionId)
            .is('revoked_at', null)
            .single();

        if (!access) {
            return {
                allowed: false,
                reason: 'No access granted for this region'
            };
        }

        // Check access level hierarchy
        const levelHierarchy = { 'READ': 1, 'WRITE': 2, 'ADMIN': 3 };
        const userLevel = levelHierarchy[access.access_level as keyof typeof levelHierarchy] || 0;
        const requiredLevelNum = levelHierarchy[requiredLevel] || 1;

        if (userLevel >= requiredLevelNum) {
            return {
                allowed: true,
                reason: 'Region access granted',
                access_level: access.access_level
            };
        }

        return {
            allowed: false,
            reason: `Requires ${requiredLevel} access, user has ${access.access_level}`
        };
    }

    /**
     * Checks if user can access a specific case based on region.
     */
    async canAccessCase(userId: string, caseId: string): Promise<AccessCheckResult> {
        const supabase = await createClient();

        // Get case region
        const { data: caseData } = await supabase
            .from('cases')
            .select('region_id, assigned_dca_id')
            .eq('id', caseId)
            .single();

        if (!caseData) {
            return { allowed: false, reason: 'Case not found' };
        }

        // Get user
        const { data: user } = await supabase
            .from('users')
            .select('role, dca_id')
            .eq('id', userId)
            .single();

        if (!user) {
            return { allowed: false, reason: 'User not found' };
        }

        // Global roles have full access
        if (GLOBAL_ROLES.includes(user.role as UserRole)) {
            return { allowed: true, reason: 'Global admin access' };
        }

        // DCA users can only access their assigned cases
        if (['DCA_ADMIN', 'DCA_MANAGER', 'DCA_AGENT'].includes(user.role)) {
            if (user.dca_id && user.dca_id === caseData.assigned_dca_id) {
                return { allowed: true, reason: 'DCA assignment match' };
            }
            return { allowed: false, reason: 'Case not assigned to user\'s DCA' };
        }

        // Check region access for other roles
        if (caseData.region_id) {
            return this.hasRegionAccess(userId, caseData.region_id);
        }

        // No region assigned - allow for FedEx roles
        if (['FEDEX_MANAGER', 'FEDEX_ANALYST'].includes(user.role)) {
            return { allowed: true, reason: 'FedEx role - unassigned region case' };
        }

        return { allowed: false, reason: 'Access denied' };
    }

    /**
     * Gets all regions accessible by a user.
     */
    async getUserAccessibleRegions(userId: string): Promise<RegionAccess[]> {
        const supabase = await createClient();

        // Get user role
        const { data: user } = await supabase
            .from('users')
            .select('role')
            .eq('id', userId)
            .single();

        if (!user) return [];

        // Global roles see all regions
        if (GLOBAL_ROLES.includes(user.role as UserRole)) {
            const { data: allRegions } = await supabase
                .from('regions')
                .select('id, region_code, name')
                .eq('status', 'ACTIVE')
                .is('deleted_at', null);

            return (allRegions || []).map(r => ({
                region_id: r.id,
                region_code: r.region_code,
                region_name: r.name,
                access_level: 'ADMIN' as const,
                is_primary: false,
            }));
        }

        // Get explicit region access
        const { data: access } = await supabase
            .from('user_region_access')
            .select(`
                region_id,
                access_level,
                is_primary_region,
                region:regions(region_code, name)
            `)
            .eq('user_id', userId)
            .is('revoked_at', null);

        return (access || []).map((a: {
            region_id: string;
            access_level: string;
            is_primary_region: boolean;
            region: { region_code: string; name: string } | null;
        }) => ({
            region_id: a.region_id,
            region_code: a.region?.region_code || '',
            region_name: a.region?.name || '',
            access_level: a.access_level as 'READ' | 'WRITE' | 'ADMIN',
            is_primary: a.is_primary_region,
        }));
    }

    /**
     * Filters a Supabase query to only include accessible regions.
     * Use this for any query that returns region-specific data.
     */
    async applyRegionFilter(
        userId: string,
        query: any,
        regionIdColumn: string = 'region_id'
    ): Promise<any> {
        const supabase = await createClient();

        // Get user role
        const { data: user } = await supabase
            .from('users')
            .select('role')
            .eq('id', userId)
            .single();

        if (!user) {
            // No user - return empty result
            return query.eq(regionIdColumn, '00000000-0000-0000-0000-000000000000');
        }

        // Global roles - no filter
        if (GLOBAL_ROLES.includes(user.role as UserRole)) {
            return query;
        }

        // Get accessible regions
        const accessibleRegions = await this.getUserAccessibleRegions(userId);
        const regionIds = accessibleRegions.map(r => r.region_id);

        if (regionIds.length === 0) {
            // No access - return empty result
            return query.eq(regionIdColumn, '00000000-0000-0000-0000-000000000000');
        }

        // Apply filter
        return query.in(regionIdColumn, regionIds);
    }

    /**
     * Grants region access to a user.
     */
    async grantRegionAccess(
        userId: string,
        regionId: string,
        accessLevel: 'READ' | 'WRITE' | 'ADMIN',
        grantedBy: string,
        isPrimary: boolean = false
    ): Promise<void> {
        const supabase = await createClient();

        await supabase
            .from('user_region_access')
            .upsert({
                user_id: userId,
                region_id: regionId,
                access_level: accessLevel,
                is_primary_region: isPrimary,
                granted_by: grantedBy,
                granted_at: new Date().toISOString(),
                revoked_at: null,
            }, {
                onConflict: 'user_id,region_id',
            });

        // If primary, unset other primaries
        if (isPrimary) {
            await supabase
                .from('user_region_access')
                .update({ is_primary_region: false })
                .eq('user_id', userId)
                .neq('region_id', regionId);
        }
    }

    /**
     * Revokes region access from a user.
     */
    async revokeRegionAccess(
        userId: string,
        regionId: string,
        revokedBy: string,
        reason: string
    ): Promise<void> {
        const supabase = await createClient();

        await supabase
            .from('user_region_access')
            .update({
                revoked_at: new Date().toISOString(),
                revoked_by: revokedBy,
                revocation_reason: reason,
            })
            .eq('user_id', userId)
            .eq('region_id', regionId);
    }

    /**
     * Checks if user is a global admin.
     */
    isGlobalRole(role: UserRole): boolean {
        return GLOBAL_ROLES.includes(role);
    }

    /**
     * Checks if user is a regional role (needs region access).
     */
    isRegionalRole(role: UserRole): boolean {
        return REGIONAL_ROLES.includes(role);
    }
}

// Singleton instance
export const regionRBAC = new RegionRBAC();
