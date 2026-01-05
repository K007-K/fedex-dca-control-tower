-- ============================================
-- Migration: Enterprise Region Access Model
-- Date: 2026-01-05
-- Purpose: Separate region access tables for FedEx and DCA users
-- ============================================

-- ============================================
-- 1. DCA USER REGION ACCESS TABLE
-- ============================================
-- Stores explicit region assignments for DCA users
-- Separate from user_region_access (which is for FedEx users)

CREATE TABLE IF NOT EXISTS dca_user_region_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    region_id UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
    
    -- Grant tracking (for audit)
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Revocation (soft delete pattern)
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES users(id),
    revocation_reason TEXT,
    
    -- Unique constraint
    UNIQUE(user_id, region_id)
);

-- Indexes for access checks
CREATE INDEX IF NOT EXISTS idx_dca_user_region_user 
    ON dca_user_region_access(user_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_dca_user_region_region 
    ON dca_user_region_access(region_id) WHERE revoked_at IS NULL;

-- ============================================
-- 2. RLS POLICIES
-- ============================================

ALTER TABLE dca_user_region_access ENABLE ROW LEVEL SECURITY;

-- Service role bypass
CREATE POLICY dca_user_region_service_bypass 
    ON dca_user_region_access FOR ALL TO service_role 
    USING (true) WITH CHECK (true);

-- ============================================
-- 3. HELPER FUNCTION: Get user's allowed regions
-- ============================================
-- Returns region IDs a user can access based on role type

CREATE OR REPLACE FUNCTION get_user_allowed_regions(p_user_id UUID)
RETURNS UUID[] AS $$
DECLARE
    v_role TEXT;
    v_dca_id UUID;
    v_regions UUID[];
BEGIN
    -- Get user's role and dca_id
    SELECT role, dca_id INTO v_role, v_dca_id
    FROM users WHERE id = p_user_id;
    
    -- SUPER_ADMIN: All regions
    IF v_role = 'SUPER_ADMIN' THEN
        SELECT ARRAY_AGG(id) INTO v_regions FROM regions WHERE status = 'ACTIVE';
        RETURN COALESCE(v_regions, ARRAY[]::UUID[]);
    END IF;
    
    -- FedEx roles: from user_region_access
    IF v_role LIKE 'FEDEX%' THEN
        SELECT ARRAY_AGG(region_id) INTO v_regions
        FROM user_region_access
        WHERE user_id = p_user_id AND revoked_at IS NULL;
        RETURN COALESCE(v_regions, ARRAY[]::UUID[]);
    END IF;
    
    -- DCA roles: from dca_user_region_access
    IF v_role LIKE 'DCA%' THEN
        SELECT ARRAY_AGG(region_id) INTO v_regions
        FROM dca_user_region_access
        WHERE user_id = p_user_id AND revoked_at IS NULL;
        RETURN COALESCE(v_regions, ARRAY[]::UUID[]);
    END IF;
    
    -- AUDITOR/READONLY: from user_region_access
    SELECT ARRAY_AGG(region_id) INTO v_regions
    FROM user_region_access
    WHERE user_id = p_user_id AND revoked_at IS NULL;
    
    RETURN COALESCE(v_regions, ARRAY[]::UUID[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. HELPER FUNCTION: Validate region subset
-- ============================================
-- Checks if requested regions are subset of allowed

CREATE OR REPLACE FUNCTION validate_region_subset(
    p_requested_regions UUID[],
    p_allowed_regions UUID[]
) RETURNS BOOLEAN AS $$
BEGIN
    -- All requested must be in allowed
    RETURN p_requested_regions <@ p_allowed_regions;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_user_allowed_regions(UUID) IS 
'Returns array of region IDs a user can access based on their role type';

COMMENT ON FUNCTION validate_region_subset(UUID[], UUID[]) IS 
'Validates that requested regions are a subset of allowed regions';
