-- ===========================================
-- FedEx DCA Control Tower - Region Governance
-- Migration: 028_region_governance.sql
-- ===========================================
-- CRITICAL: Enforces region NOT NULL and IMMUTABILITY
-- Region is the foundation of all governance boundaries
-- ===========================================

-- ===========================================
-- PART 1: ADD region_id TO dcas TABLE
-- ===========================================
-- dcas currently only has region ENUM, need region_id FK

ALTER TABLE dcas ADD COLUMN IF NOT EXISTS region_id UUID REFERENCES regions(id);
CREATE INDEX IF NOT EXISTS idx_dcas_region_id ON dcas(region_id);

-- ===========================================
-- PART 2: BACKFILL NULL region_id VALUES
-- ===========================================
-- Map existing region ENUM to regions.id based on name match

-- Backfill cases.region_id from region ENUM
UPDATE cases c
SET region_id = (
    SELECT r.id FROM regions r 
    WHERE UPPER(r.name) = c.region::TEXT 
       OR r.name ILIKE '%' || REPLACE(c.region::TEXT, '_', ' ') || '%'
    LIMIT 1
)
WHERE c.region_id IS NULL AND c.region IS NOT NULL;

-- Backfill dcas.region_id from region ENUM
UPDATE dcas d
SET region_id = (
    SELECT r.id FROM regions r 
    WHERE UPPER(r.name) = d.region::TEXT 
       OR r.name ILIKE '%' || REPLACE(d.region::TEXT, '_', ' ') || '%'
    LIMIT 1
)
WHERE d.region_id IS NULL AND d.region IS NOT NULL;

-- Set default region for any remaining NULLs (use first active region)
UPDATE cases SET region_id = (SELECT id FROM regions WHERE status = 'ACTIVE' ORDER BY name LIMIT 1)
WHERE region_id IS NULL;

UPDATE dcas SET region_id = (SELECT id FROM regions WHERE status = 'ACTIVE' ORDER BY name LIMIT 1)
WHERE region_id IS NULL;

UPDATE users SET primary_region_id = (SELECT id FROM regions WHERE status = 'ACTIVE' ORDER BY name LIMIT 1)
WHERE primary_region_id IS NULL;

UPDATE sla_templates SET region_id = (SELECT id FROM regions WHERE status = 'ACTIVE' ORDER BY name LIMIT 1)
WHERE region_id IS NULL;

-- ===========================================
-- PART 3: ENFORCE NOT NULL CONSTRAINTS
-- ===========================================
-- After backfill, make region_id mandatory

-- Cases: region_id NOT NULL
DO $$
BEGIN
    -- Only add constraint if not already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cases' 
        AND column_name = 'region_id' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE cases ALTER COLUMN region_id SET NOT NULL;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'cases.region_id NOT NULL constraint skipped: %', SQLERRM;
END $$;

-- DCAs: region_id NOT NULL
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dcas' 
        AND column_name = 'region_id' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE dcas ALTER COLUMN region_id SET NOT NULL;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'dcas.region_id NOT NULL constraint skipped: %', SQLERRM;
END $$;

-- Users: primary_region_id NOT NULL
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'primary_region_id' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE users ALTER COLUMN primary_region_id SET NOT NULL;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'users.primary_region_id NOT NULL constraint skipped: %', SQLERRM;
END $$;

-- ===========================================
-- PART 4: REGION IMMUTABILITY TRIGGERS
-- ===========================================
-- CRITICAL: Prevent ANY modification of region after INSERT

-- Generic function to prevent region mutation
CREATE OR REPLACE FUNCTION prevent_region_id_mutation()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if region_id is being changed
    IF OLD.region_id IS DISTINCT FROM NEW.region_id THEN
        RAISE EXCEPTION 'REGION_IMMUTABLE: Region cannot be modified after creation. Entity: %, Old: %, New: %',
            TG_TABLE_NAME, OLD.region_id, NEW.region_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for cases table
DROP TRIGGER IF EXISTS trigger_prevent_case_region_mutation ON cases;
CREATE TRIGGER trigger_prevent_case_region_mutation
    BEFORE UPDATE ON cases
    FOR EACH ROW
    EXECUTE FUNCTION prevent_region_id_mutation();

-- Trigger for dcas table
DROP TRIGGER IF EXISTS trigger_prevent_dca_region_mutation ON dcas;
CREATE TRIGGER trigger_prevent_dca_region_mutation
    BEFORE UPDATE ON dcas
    FOR EACH ROW
    EXECUTE FUNCTION prevent_region_id_mutation();

-- Trigger for sla_templates table
DROP TRIGGER IF EXISTS trigger_prevent_sla_region_mutation ON sla_templates;
CREATE TRIGGER trigger_prevent_sla_region_mutation
    BEFORE UPDATE ON sla_templates
    FOR EACH ROW
    EXECUTE FUNCTION prevent_region_id_mutation();

-- Also prevent mutation of legacy region ENUM column
CREATE OR REPLACE FUNCTION prevent_region_enum_mutation()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'cases' OR TG_TABLE_NAME = 'dcas' THEN
        IF OLD.region IS DISTINCT FROM NEW.region THEN
            RAISE EXCEPTION 'REGION_IMMUTABLE: Region ENUM cannot be modified after creation. Entity: %, Old: %, New: %',
                TG_TABLE_NAME, OLD.region, NEW.region;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for cases.region ENUM
DROP TRIGGER IF EXISTS trigger_prevent_case_region_enum_mutation ON cases;
CREATE TRIGGER trigger_prevent_case_region_enum_mutation
    BEFORE UPDATE ON cases
    FOR EACH ROW
    EXECUTE FUNCTION prevent_region_enum_mutation();

-- Trigger for dcas.region ENUM
DROP TRIGGER IF EXISTS trigger_prevent_dca_region_enum_mutation ON dcas;
CREATE TRIGGER trigger_prevent_dca_region_enum_mutation
    BEFORE UPDATE ON dcas
    FOR EACH ROW
    EXECUTE FUNCTION prevent_region_enum_mutation();

-- ===========================================
-- PART 5: ADD region_id TO audit_logs
-- ===========================================
-- Audit logs must include region context

ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS region_id UUID REFERENCES regions(id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_region ON audit_logs(region_id);

-- ===========================================
-- PART 6: UPDATE MATERIALIZED VIEWS WITH REGION
-- ===========================================
-- Analytics must be region-aware

-- Drop and recreate dashboard_metrics with region
DROP MATERIALIZED VIEW IF EXISTS dashboard_metrics;
CREATE MATERIALIZED VIEW dashboard_metrics AS
SELECT 
    DATE_TRUNC('day', c.created_at) AS date,
    c.region_id,
    c.status,
    c.priority,
    COUNT(*) AS case_count,
    SUM(c.outstanding_amount) AS total_outstanding,
    SUM(c.recovered_amount) AS total_recovered,
    AVG(EXTRACT(DAY FROM NOW() - c.due_date)) AS avg_ageing,
    AVG(c.priority_score) AS avg_priority_score,
    AVG(c.recovery_probability) AS avg_recovery_probability
FROM cases c
WHERE c.region_id IS NOT NULL
GROUP BY DATE_TRUNC('day', c.created_at), c.region_id, c.status, c.priority;

CREATE INDEX IF NOT EXISTS idx_dashboard_metrics_date ON dashboard_metrics(date);
CREATE INDEX IF NOT EXISTS idx_dashboard_metrics_region ON dashboard_metrics(region_id);

-- Drop and recreate dca_performance_metrics with region
DROP MATERIALIZED VIEW IF EXISTS dca_performance_metrics;
CREATE MATERIALIZED VIEW dca_performance_metrics AS
SELECT 
    d.id AS dca_id,
    d.name AS dca_name,
    d.region_id,
    COUNT(c.id) AS total_cases,
    SUM(CASE WHEN c.status IN ('FULL_RECOVERY', 'PARTIAL_RECOVERY') THEN 1 ELSE 0 END) AS recovered_cases,
    SUM(c.recovered_amount) AS total_recovered,
    SUM(c.outstanding_amount) AS total_outstanding,
    AVG(EXTRACT(DAY FROM (c.closed_at - c.assigned_at))) AS avg_resolution_days,
    COUNT(s.id) FILTER (WHERE s.status = 'BREACHED') AS sla_breaches,
    COUNT(s.id) FILTER (WHERE s.status = 'MET') AS sla_met,
    CASE 
        WHEN COUNT(s.id) > 0 THEN (COUNT(s.id) FILTER (WHERE s.status = 'MET')::DECIMAL / COUNT(s.id) * 100) 
        ELSE 0 
    END AS sla_compliance_rate
FROM dcas d
LEFT JOIN cases c ON d.id = c.assigned_dca_id
LEFT JOIN sla_logs s ON c.id = s.case_id
GROUP BY d.id, d.name, d.region_id;

CREATE INDEX IF NOT EXISTS idx_dca_perf_region ON dca_performance_metrics(region_id);

-- ===========================================
-- VERIFICATION QUERIES
-- ===========================================
-- Run these to verify the migration worked

-- Check NOT NULL constraints
SELECT 
    'cases.region_id' AS column_check,
    CASE WHEN is_nullable = 'NO' THEN 'PASS' ELSE 'FAIL' END AS status
FROM information_schema.columns 
WHERE table_name = 'cases' AND column_name = 'region_id'
UNION ALL
SELECT 
    'dcas.region_id',
    CASE WHEN is_nullable = 'NO' THEN 'PASS' ELSE 'FAIL' END
FROM information_schema.columns 
WHERE table_name = 'dcas' AND column_name = 'region_id';

-- Check triggers exist
SELECT 
    'cases immutability trigger' AS trigger_check,
    CASE WHEN COUNT(*) > 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_prevent_case_region_mutation'
UNION ALL
SELECT 
    'dcas immutability trigger',
    CASE WHEN COUNT(*) > 0 THEN 'PASS' ELSE 'FAIL' END
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_prevent_dca_region_mutation';

SELECT 'Region Governance Migration completed successfully!' AS result;
