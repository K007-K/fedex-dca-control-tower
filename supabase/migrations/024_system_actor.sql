-- ===========================================
-- STEP 1: SYSTEM Identity Schema
-- ===========================================
-- Creates database support for SYSTEM actors (non-human service identities)
-- SYSTEM actors are NOT users - they authenticate via service-to-service auth
-- ===========================================

-- Actor type enum: distinguishes SYSTEM from HUMAN actors
DO $$ BEGIN
    CREATE TYPE actor_type AS ENUM ('SYSTEM', 'HUMAN');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Source of creation enum: tracks how records were created
DO $$ BEGIN
    CREATE TYPE created_source AS ENUM ('SYSTEM', 'MANUAL');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ===========================================
-- SERVICE ACTORS TABLE
-- ===========================================
-- Registry of authorized SYSTEM services (NOT in users table)
-- Each service has a unique name and can be enabled/disabled

CREATE TABLE IF NOT EXISTS service_actors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Service identification
    service_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    
    -- Status and access control
    is_active BOOLEAN DEFAULT TRUE,
    allowed_operations TEXT[] DEFAULT '{}',
    
    -- Security: IP whitelist (optional)
    ip_whitelist INET[],
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT service_name_not_empty CHECK (service_name <> ''),
    CONSTRAINT service_name_format CHECK (service_name ~ '^[a-z][a-z0-9_-]*$')
);

-- Index for quick lookup by service name
CREATE INDEX IF NOT EXISTS idx_service_actors_name ON service_actors(service_name);
CREATE INDEX IF NOT EXISTS idx_service_actors_active ON service_actors(is_active) WHERE is_active = TRUE;

-- ===========================================
-- EXTEND AUDIT_LOGS FOR ACTOR SUPPORT
-- ===========================================

-- Add actor metadata columns to audit_logs
ALTER TABLE audit_logs 
    ADD COLUMN IF NOT EXISTS actor_type actor_type DEFAULT 'HUMAN',
    ADD COLUMN IF NOT EXISTS service_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS request_source VARCHAR(20) DEFAULT 'MANUAL';

-- Create index for filtering by actor type
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_type ON audit_logs(actor_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_service_name ON audit_logs(service_name) WHERE service_name IS NOT NULL;

-- ===========================================
-- SEED DEFAULT SERVICE ACTORS
-- ===========================================
-- Pre-register known internal services

INSERT INTO service_actors (service_name, description, allowed_operations, is_active)
VALUES 
    ('case-automation', 'Automated case creation and management service', 
     ARRAY['cases:create', 'cases:update', 'cases:assign'], TRUE),
    ('sla-monitor', 'SLA monitoring and breach detection service', 
     ARRAY['sla:read', 'sla:update', 'notifications:create'], TRUE),
    ('ml-service', 'ML prediction and scoring service', 
     ARRAY['cases:read', 'dcas:read', 'analytics:read'], TRUE),
    ('scheduler', 'Background job scheduler service', 
     ARRAY['cases:read', 'cases:update', 'notifications:create'], TRUE)
ON CONFLICT (service_name) DO UPDATE SET
    description = EXCLUDED.description,
    allowed_operations = EXCLUDED.allowed_operations,
    updated_at = NOW();

-- ===========================================
-- ROW LEVEL SECURITY
-- ===========================================

ALTER TABLE service_actors ENABLE ROW LEVEL SECURITY;

-- Only super admins can view service actors
CREATE POLICY service_actors_select_admin ON service_actors
FOR SELECT TO authenticated
USING (
    (SELECT role FROM users WHERE id = auth.uid()) IN ('SUPER_ADMIN', 'FEDEX_ADMIN')
);

-- Service role bypasses RLS (for backend use)
CREATE POLICY service_actors_service_role ON service_actors
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- ===========================================
-- TRIGGER: Update updated_at on service_actors
-- ===========================================

CREATE TRIGGER update_service_actors_updated_at
    BEFORE UPDATE ON service_actors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- VERIFICATION
-- ===========================================

SELECT 'SYSTEM Actor schema created successfully!' AS result;

-- Show created service actors
SELECT service_name, description, is_active, allowed_operations 
FROM service_actors 
ORDER BY service_name;
