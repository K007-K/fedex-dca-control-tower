-- ===========================================
-- FedEx DCA Control Tower - Region Master Schema
-- Migration: 020_region_master.sql
-- ===========================================
-- Enterprise Region Governance - Phase 1
-- This migration creates the core region management tables
-- ===========================================

-- ===========================================
-- 1. REGIONS MASTER TABLE
-- ===========================================
-- Central table for all region definitions
-- Regions control SLA, DCAs, escalation, and access

CREATE TABLE IF NOT EXISTS regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Region Identity
    region_code VARCHAR(20) UNIQUE NOT NULL,      -- e.g., IN-SOUTH, US-WEST, EU-CENTRAL
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Geography Configuration
    country_codes VARCHAR(2)[] NOT NULL,          -- ISO 3166-1 alpha-2 codes: ['IN'], ['US', 'CA']
    state_codes VARCHAR(10)[],                    -- State/province codes: ['MH', 'KA'], ['CA', 'NY']
    
    -- Operational Settings
    default_currency VARCHAR(3) NOT NULL DEFAULT 'USD',  -- ISO 4217 currency code
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',         -- IANA timezone
    business_hours JSONB DEFAULT '{"start": "09:00", "end": "18:00", "days": [1,2,3,4,5]}',
    
    -- SLA & Workflow Links
    default_sla_template_id UUID,                 -- FK added after checking table exists
    escalation_matrix_id UUID,                    -- FK added after matrix table creation
    
    -- Operational Status
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'PENDING')),
    
    -- Audit Fields (MANDATORY for enterprise governance)
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Soft delete support
    deleted_at TIMESTAMPTZ,
    deleted_by UUID
);

-- Index for fast lookup by code and status
CREATE INDEX IF NOT EXISTS idx_regions_code ON regions(region_code);
CREATE INDEX IF NOT EXISTS idx_regions_status ON regions(status) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_regions_country ON regions USING GIN(country_codes);

-- ===========================================
-- 2. GEOGRAPHY REGION RULES TABLE
-- ===========================================
-- Configurable rules for automatic region assignment
-- Priority-based matching from customer/shipment geography

CREATE TABLE IF NOT EXISTS geography_region_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_id UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
    
    -- Rule Name (for admin UI)
    rule_name VARCHAR(100) NOT NULL,
    
    -- Matching Criteria (evaluated in priority order)
    country_code VARCHAR(2),                      -- ISO country code: 'IN', 'US'
    state_code VARCHAR(10),                       -- State/province: 'MH', 'CA'
    city_pattern VARCHAR(100),                    -- ILIKE pattern: '%Mumbai%', '%New York%'
    postal_code_pattern VARCHAR(50),              -- Pattern: '4000%' (Mumbai), '1001%' (NYC)
    
    -- Rule Configuration
    priority INT DEFAULT 100,                     -- Lower number = higher priority
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Audit
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient rule matching
CREATE INDEX IF NOT EXISTS idx_geography_rules_region ON geography_region_rules(region_id);
CREATE INDEX IF NOT EXISTS idx_geography_rules_priority ON geography_region_rules(priority) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_geography_rules_country ON geography_region_rules(country_code) WHERE is_active = TRUE;

-- ===========================================
-- 3. REGION-DCA ASSIGNMENTS TABLE
-- ===========================================
-- Maps which DCAs can handle cases for which regions
-- Includes region-specific performance metrics

CREATE TABLE IF NOT EXISTS region_dca_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_id UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
    dca_id UUID NOT NULL REFERENCES dcas(id) ON DELETE CASCADE,
    
    -- Assignment Configuration
    is_primary BOOLEAN DEFAULT FALSE,             -- Primary DCA for this region
    allocation_priority INT DEFAULT 1,            -- 1 = highest priority for allocation
    capacity_allocation_pct INT DEFAULT 100       -- % of DCA capacity available for this region
        CHECK (capacity_allocation_pct >= 0 AND capacity_allocation_pct <= 100),
    
    -- Region-Specific Performance (updated by analytics jobs)
    region_recovery_rate DECIMAL(5,2) DEFAULT 0   -- Recovery rate for this DCA in this region
        CHECK (region_recovery_rate >= 0 AND region_recovery_rate <= 100),
    region_sla_compliance DECIMAL(5,2) DEFAULT 0  -- SLA compliance for this region
        CHECK (region_sla_compliance >= 0 AND region_sla_compliance <= 100),
    region_avg_recovery_days INT,                 -- Average days to recover in this region
    region_cases_handled INT DEFAULT 0,           -- Total cases handled in this region
    region_amount_recovered DECIMAL(15,2) DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    suspended_at TIMESTAMPTZ,
    suspension_reason TEXT,
    
    -- Audit
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint: One DCA can be assigned to a region only once
    UNIQUE(region_id, dca_id)
);

-- Indexes for DCA allocation queries
CREATE INDEX IF NOT EXISTS idx_region_dca_region ON region_dca_assignments(region_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_region_dca_dca ON region_dca_assignments(dca_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_region_dca_priority ON region_dca_assignments(allocation_priority);

-- ===========================================
-- 4. USER REGION ACCESS TABLE
-- ===========================================
-- Controls which users can access which regions
-- Enforced at API, DB (RLS), and UI levels

CREATE TABLE IF NOT EXISTS user_region_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    region_id UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
    
    -- Access Level
    access_level VARCHAR(20) DEFAULT 'READ' 
        CHECK (access_level IN ('READ', 'WRITE', 'ADMIN')),
    
    -- Primary region flag (for default filtering)
    is_primary_region BOOLEAN DEFAULT FALSE,
    
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
CREATE INDEX IF NOT EXISTS idx_user_region_user ON user_region_access(user_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_region_region ON user_region_access(region_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_region_primary ON user_region_access(user_id, is_primary_region) 
    WHERE is_primary_region = TRUE AND revoked_at IS NULL;

-- ===========================================
-- 5. REGION AUDIT LOG TABLE
-- ===========================================
-- Immutable log of all region-related changes
-- Critical for compliance and governance

CREATE TABLE IF NOT EXISTS region_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- What changed
    entity_type VARCHAR(50) NOT NULL,             -- 'REGION', 'GEOGRAPHY_RULE', 'DCA_ASSIGNMENT', 'USER_ACCESS'
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,                  -- 'CREATE', 'UPDATE', 'DELETE', 'OVERRIDE', 'GRANT', 'REVOKE'
    
    -- Who changed it
    performed_by UUID REFERENCES users(id),
    performed_by_role VARCHAR(50),
    performed_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Change details
    old_values JSONB,
    new_values JSONB,
    change_reason TEXT,
    
    -- Request context
    request_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT
);

-- Immutability rules (no updates or deletes)
CREATE RULE region_audit_no_update AS ON UPDATE TO region_audit_log DO INSTEAD NOTHING;
CREATE RULE region_audit_no_delete AS ON DELETE TO region_audit_log DO INSTEAD NOTHING;

-- Index for searching audit logs
CREATE INDEX IF NOT EXISTS idx_region_audit_entity ON region_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_region_audit_user ON region_audit_log(performed_by);
CREATE INDEX IF NOT EXISTS idx_region_audit_time ON region_audit_log(performed_at DESC);

-- ===========================================
-- 6. ADD REGION_ID TO EXISTING TABLES
-- ===========================================

-- Add region_id to cases table (replaces simple enum)
ALTER TABLE cases ADD COLUMN IF NOT EXISTS region_id UUID REFERENCES regions(id);
CREATE INDEX IF NOT EXISTS idx_cases_region_id ON cases(region_id);

-- Add primary_region_id to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS primary_region_id UUID REFERENCES regions(id);
CREATE INDEX IF NOT EXISTS idx_users_primary_region ON users(primary_region_id);

-- Add region_id to SLA templates (region-specific SLAs)
ALTER TABLE sla_templates ADD COLUMN IF NOT EXISTS region_id UUID REFERENCES regions(id);
CREATE INDEX IF NOT EXISTS idx_sla_templates_region ON sla_templates(region_id);

-- ===========================================
-- 7. FUNCTIONS FOR REGION ASSIGNMENT
-- ===========================================

-- Function to resolve region from geography
CREATE OR REPLACE FUNCTION resolve_region_from_geography(
    p_country_code VARCHAR(2),
    p_state_code VARCHAR(10) DEFAULT NULL,
    p_city VARCHAR(100) DEFAULT NULL,
    p_postal_code VARCHAR(20) DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_region_id UUID;
BEGIN
    -- Find matching rule by priority
    SELECT gr.region_id INTO v_region_id
    FROM geography_region_rules gr
    JOIN regions r ON r.id = gr.region_id
    WHERE gr.is_active = TRUE
      AND r.status = 'ACTIVE'
      AND (gr.country_code IS NULL OR gr.country_code = p_country_code)
      AND (gr.state_code IS NULL OR gr.state_code = p_state_code)
      AND (gr.city_pattern IS NULL OR p_city ILIKE gr.city_pattern)
      AND (gr.postal_code_pattern IS NULL OR p_postal_code ILIKE gr.postal_code_pattern)
    ORDER BY 
        -- More specific rules have higher priority
        CASE WHEN gr.postal_code_pattern IS NOT NULL THEN 0 ELSE 1 END,
        CASE WHEN gr.city_pattern IS NOT NULL THEN 0 ELSE 1 END,
        CASE WHEN gr.state_code IS NOT NULL THEN 0 ELSE 1 END,
        gr.priority
    LIMIT 1;
    
    RETURN v_region_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check if user has access to region
CREATE OR REPLACE FUNCTION user_has_region_access(
    p_user_id UUID,
    p_region_id UUID,
    p_required_level VARCHAR(20) DEFAULT 'READ'
) RETURNS BOOLEAN AS $$
DECLARE
    v_user_role VARCHAR(50);
    v_access_level VARCHAR(20);
BEGIN
    -- Get user role
    SELECT role::TEXT INTO v_user_role FROM users WHERE id = p_user_id;
    
    -- Super admins and FedEx admins have global access
    IF v_user_role IN ('SUPER_ADMIN', 'FEDEX_ADMIN') THEN
        RETURN TRUE;
    END IF;
    
    -- Check explicit region access
    SELECT access_level INTO v_access_level
    FROM user_region_access
    WHERE user_id = p_user_id 
      AND region_id = p_region_id
      AND revoked_at IS NULL;
    
    IF v_access_level IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check access level hierarchy
    RETURN CASE 
        WHEN p_required_level = 'READ' THEN TRUE
        WHEN p_required_level = 'WRITE' THEN v_access_level IN ('WRITE', 'ADMIN')
        WHEN p_required_level = 'ADMIN' THEN v_access_level = 'ADMIN'
        ELSE FALSE
    END;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ===========================================
-- 8. TRIGGER FOR AUTO-REGION ASSIGNMENT
-- ===========================================

CREATE OR REPLACE FUNCTION auto_assign_region_on_case_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_region_id UUID;
    v_country VARCHAR(2);
    v_state VARCHAR(10);
    v_city VARCHAR(100);
    v_postal_code VARCHAR(20);
BEGIN
    -- Only auto-assign if region_id is not provided
    IF NEW.region_id IS NOT NULL THEN
        RETURN NEW;
    END IF;
    
    -- Extract geography from customer_contact JSONB
    IF NEW.customer_contact IS NOT NULL THEN
        v_country := NEW.customer_contact->>'country';
        v_state := NEW.customer_contact->>'state';
        v_city := NEW.customer_contact->>'city';
        v_postal_code := NEW.customer_contact->>'postal_code';
    END IF;
    
    -- Fallback to customer_country column
    IF v_country IS NULL THEN
        v_country := NEW.customer_country;
    END IF;
    
    -- Resolve region
    v_region_id := resolve_region_from_geography(v_country, v_state, v_city, v_postal_code);
    
    IF v_region_id IS NOT NULL THEN
        NEW.region_id := v_region_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (drop if exists to allow re-running)
DROP TRIGGER IF EXISTS trigger_auto_assign_region ON cases;
CREATE TRIGGER trigger_auto_assign_region
    BEFORE INSERT ON cases
    FOR EACH ROW
    EXECUTE FUNCTION auto_assign_region_on_case_insert();

-- ===========================================
-- 9. ROW LEVEL SECURITY FOR REGIONS
-- ===========================================

-- Enable RLS on region-related tables
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_region_access ENABLE ROW LEVEL SECURITY;

-- Service role bypass
CREATE POLICY regions_service_bypass ON regions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY user_region_access_service_bypass ON user_region_access FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authenticated users can read active regions
CREATE POLICY regions_read_active ON regions FOR SELECT TO authenticated
    USING (status = 'ACTIVE' AND deleted_at IS NULL);

-- Only admins can modify regions
CREATE POLICY regions_admin_modify ON regions FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('SUPER_ADMIN', 'FEDEX_ADMIN')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('SUPER_ADMIN', 'FEDEX_ADMIN')
        )
    );

-- ===========================================
-- MIGRATION COMPLETE
-- ===========================================

SELECT 'Region Master Schema migration completed successfully!' AS result;
