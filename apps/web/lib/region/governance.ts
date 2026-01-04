/**
 * Region Governance Utility
 * 
 * CRITICAL: Prevents region mutation at API level
 * This is a defense-in-depth layer - database triggers are primary enforcement
 */

// Fields that are IMMUTABLE after creation
const IMMUTABLE_REGION_FIELDS = ['region', 'region_id'] as const;

/**
 * Strip region fields from update payload
 * Call this before any UPDATE operation on cases, dcas, sla_templates
 */
export function stripRegionFields<T extends Record<string, unknown>>(payload: T): Omit<T, 'region' | 'region_id'> {
    const sanitized = { ...payload };

    for (const field of IMMUTABLE_REGION_FIELDS) {
        if (field in sanitized) {
            console.warn(`REGION_GOVERNANCE: Blocked attempt to modify immutable field '${field}'`);
            delete sanitized[field];
        }
    }

    return sanitized as Omit<T, 'region' | 'region_id'>;
}

/**
 * Check if payload attempts to modify region
 * Returns true if region mutation is attempted
 */
export function hasRegionMutationAttempt(payload: Record<string, unknown>): boolean {
    return IMMUTABLE_REGION_FIELDS.some(field => field in payload);
}

/**
 * Validate region is provided for insert operations
 * Returns error message if invalid, null if valid
 */
export function validateRegionForInsert(payload: Record<string, unknown>): string | null {
    if (!payload.region_id && !payload.region) {
        return 'Region is required for new records. Provide region_id (UUID) or region (ENUM).';
    }
    return null;
}

/**
 * Reject update if it contains region fields
 * Use this in API handlers before processing updates
 */
export function rejectIfRegionMutation(payload: Record<string, unknown>): {
    isBlocked: boolean;
    error?: string
} {
    if (hasRegionMutationAttempt(payload)) {
        return {
            isBlocked: true,
            error: 'REGION_IMMUTABLE: Region cannot be modified after creation. This field is protected by governance policy.',
        };
    }
    return { isBlocked: false };
}
