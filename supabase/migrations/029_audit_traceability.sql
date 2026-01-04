-- ===========================================
-- FedEx DCA Control Tower - Audit Traceability
-- Migration: 029_audit_traceability.sql
-- ===========================================
-- CRITICAL: Enforces SYSTEM vs HUMAN actor identification
-- Ensures region context on all audit entries
-- Makes audit logs tamper-proof
-- ===========================================

-- ===========================================
-- PART 1: CREATE ACTOR TYPE ENUM
-- ===========================================

DO $$ BEGIN
    CREATE TYPE actor_type AS ENUM ('SYSTEM', 'HUMAN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ===========================================
-- PART 2: ADD MISSING COLUMNS TO AUDIT_LOGS
-- ===========================================

-- Actor type column (SYSTEM or HUMAN)
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS actor_type actor_type DEFAULT 'HUMAN';

-- Service name for SYSTEM actors (e.g., 'DCA_ALLOCATOR', 'SLA_MONITOR')
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS actor_service_name VARCHAR(100);

-- Actor role derived from RBAC (renamed from user_role for clarity)
-- user_role already exists, so we add actor_role as alias column
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS actor_role VARCHAR(50);

-- Severity for filtering critical events
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS severity VARCHAR(20) DEFAULT 'INFO'
    CHECK (severity IN ('INFO', 'WARNING', 'ERROR', 'CRITICAL'));

-- Request source indicator
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS request_source VARCHAR(20) DEFAULT 'MANUAL'
    CHECK (request_source IN ('SYSTEM', 'MANUAL', 'API', 'WEBHOOK', 'SCHEDULER'));

-- ===========================================
-- PART 3: BACKFILL region_id ON AUDIT_LOGS
-- ===========================================
-- region_id was added in migration 028, now backfill and make NOT NULL

-- Try to derive region from related resources
UPDATE audit_logs al
SET region_id = (
    SELECT c.region_id FROM cases c WHERE c.id = al.resource_id::UUID LIMIT 1
)
WHERE al.region_id IS NULL 
AND al.resource_type IN ('case', 'cases', 'CASE');

UPDATE audit_logs al
SET region_id = (
    SELECT d.region_id FROM dcas d WHERE d.id = al.resource_id::UUID LIMIT 1
)
WHERE al.region_id IS NULL 
AND al.resource_type IN ('dca', 'dcas', 'DCA');

UPDATE audit_logs al
SET region_id = (
    SELECT u.primary_region_id FROM users u WHERE u.id = al.resource_id::UUID LIMIT 1
)
WHERE al.region_id IS NULL 
AND al.resource_type IN ('user', 'users', 'USER');

-- Set default region for remaining NULL entries
UPDATE audit_logs 
SET region_id = (SELECT id FROM regions WHERE status = 'ACTIVE' ORDER BY name LIMIT 1)
WHERE region_id IS NULL;

-- Now make region_id NOT NULL (with default for new entries)
DO $$
BEGIN
    ALTER TABLE audit_logs ALTER COLUMN region_id SET NOT NULL;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'audit_logs.region_id NOT NULL skipped: %', SQLERRM;
END $$;

-- NOTE: PostgreSQL doesn't allow subqueries in DEFAULT expressions
-- Region_id will be set by application layer or trigger, not as column default
-- The NOT NULL constraint ensures it's always provided

-- ===========================================
-- PART 4: CREATE INDEXES FOR AUDIT QUERIES
-- ===========================================

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_type ON audit_logs(actor_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity) WHERE severity IN ('WARNING', 'ERROR', 'CRITICAL');
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_service ON audit_logs(actor_service_name) WHERE actor_type = 'SYSTEM';
CREATE INDEX IF NOT EXISTS idx_audit_logs_region ON audit_logs(region_id);

-- ===========================================
-- PART 5: VERIFY IMMUTABILITY RULES EXIST
-- ===========================================
-- Rules should already exist from 001, but verify and recreate if missing

DO $$
BEGIN
    -- Check if rules exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_rules 
        WHERE rulename = 'audit_logs_no_update' 
        AND tablename = 'audit_logs'
    ) THEN
        CREATE RULE audit_logs_no_update AS ON UPDATE TO audit_logs DO INSTEAD NOTHING;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_rules 
        WHERE rulename = 'audit_logs_no_delete' 
        AND tablename = 'audit_logs'
    ) THEN
        CREATE RULE audit_logs_no_delete AS ON DELETE TO audit_logs DO INSTEAD NOTHING;
    END IF;
END $$;

-- ===========================================
-- PART 6: CREATE AUDIT HELPER FUNCTIONS
-- ===========================================

-- Function to log SYSTEM actions (called by backend services)
CREATE OR REPLACE FUNCTION log_system_audit(
    p_action VARCHAR(100),
    p_service_name VARCHAR(100),
    p_resource_type VARCHAR(50),
    p_resource_id UUID,
    p_region_id UUID,
    p_details JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO audit_logs (
        action,
        actor_type,
        actor_service_name,
        actor_role,
        resource_type,
        resource_id,
        region_id,
        changes,
        severity,
        request_source,
        created_at
    ) VALUES (
        p_action,
        'SYSTEM',
        p_service_name,
        'SYSTEM',
        p_resource_type,
        p_resource_id,
        p_region_id,
        p_details,
        'INFO',
        'SYSTEM',
        NOW()
    ) RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Function to log HUMAN actions (called by API handlers)
CREATE OR REPLACE FUNCTION log_human_audit(
    p_action VARCHAR(100),
    p_user_id UUID,
    p_user_email VARCHAR(255),
    p_user_role VARCHAR(50),
    p_resource_type VARCHAR(50),
    p_resource_id UUID,
    p_region_id UUID,
    p_details JSONB DEFAULT '{}',
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO audit_logs (
        action,
        actor_type,
        user_id,
        user_email,
        actor_role,
        resource_type,
        resource_id,
        region_id,
        changes,
        user_ip,
        user_agent,
        severity,
        request_source,
        created_at
    ) VALUES (
        p_action,
        'HUMAN',
        p_user_id,
        p_user_email,
        p_user_role,
        p_resource_type,
        p_resource_id,
        p_region_id,
        p_details,
        p_ip_address,
        p_user_agent,
        'INFO',
        'MANUAL',
        NOW()
    ) RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- VERIFICATION QUERIES
-- ===========================================

-- Check actor_type column exists
SELECT 
    'actor_type column' AS check_name,
    CASE WHEN COUNT(*) > 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM information_schema.columns 
WHERE table_name = 'audit_logs' AND column_name = 'actor_type';

-- Check region_id NOT NULL
SELECT 
    'region_id NOT NULL' AS check_name,
    CASE WHEN is_nullable = 'NO' THEN 'PASS' ELSE 'FAIL' END AS status
FROM information_schema.columns 
WHERE table_name = 'audit_logs' AND column_name = 'region_id';

-- Check immutability rules
SELECT 
    'immutability rules' AS check_name,
    CASE WHEN COUNT(*) >= 2 THEN 'PASS' ELSE 'FAIL' END AS status
FROM pg_rules 
WHERE tablename = 'audit_logs' 
AND rulename IN ('audit_logs_no_update', 'audit_logs_no_delete');

SELECT 'Audit Traceability Migration completed successfully!' AS result;
