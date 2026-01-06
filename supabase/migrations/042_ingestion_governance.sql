-- ===========================================
-- Migration 042: INGESTION GOVERNANCE HARDENING
-- ===========================================
-- PURPOSE: Enforce SYSTEM-ONLY ingestion model at database level
-- CRITICAL: These constraints ensure upstream ingestion compliance
-- DATE: 2026-01-06
-- ===========================================

-- ===========================================
-- STEP 1: Add external_case_id column
-- This is the IDEMPOTENCY KEY from upstream systems
-- ===========================================

DO $$
BEGIN
    -- Add column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cases' AND column_name = 'external_case_id'
    ) THEN
        ALTER TABLE cases ADD COLUMN external_case_id VARCHAR(255);
        RAISE NOTICE 'Added external_case_id column to cases';
    END IF;
END $$;

-- Create unique index for idempotency (partial - allows NULL for manual cases)
CREATE UNIQUE INDEX IF NOT EXISTS idx_cases_external_case_id 
    ON cases(external_case_id) 
    WHERE external_case_id IS NOT NULL;

COMMENT ON COLUMN cases.external_case_id IS 
    'IMMUTABLE upstream reference ID. UNIQUE constraint ensures idempotent ingestion.';

-- ===========================================
-- STEP 2: Add source_system column
-- Tracks which upstream system created the case
-- ===========================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cases' AND column_name = 'source_system'
    ) THEN
        ALTER TABLE cases ADD COLUMN source_system VARCHAR(100);
        RAISE NOTICE 'Added source_system column to cases';
    END IF;
END $$;

COMMENT ON COLUMN cases.source_system IS 
    'Upstream system identifier (e.g., RPA_BOT, LEGACY_SYNC, SAP_INTEGRATION)';

-- ===========================================
-- STEP 3: Add ingestion_timestamp column
-- Records when case was ingested from upstream
-- ===========================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cases' AND column_name = 'ingestion_timestamp'
    ) THEN
        ALTER TABLE cases ADD COLUMN ingestion_timestamp TIMESTAMPTZ;
        RAISE NOTICE 'Added ingestion_timestamp column to cases';
    END IF;
END $$;

COMMENT ON COLUMN cases.ingestion_timestamp IS 
    'Timestamp when case was ingested via SYSTEM API';

-- ===========================================
-- STEP 4: Region Immutability Trigger
-- CRITICAL: region_id CANNOT be changed after insert
-- ===========================================

CREATE OR REPLACE FUNCTION enforce_region_immutability()
RETURNS TRIGGER AS $$
BEGIN
    -- Allow NULL to non-NULL (initial assignment)
    IF OLD.region_id IS NOT NULL AND NEW.region_id IS DISTINCT FROM OLD.region_id THEN
        RAISE EXCEPTION 'GOVERNANCE VIOLATION: region_id is IMMUTABLE after case creation. Attempted change from % to %', 
            OLD.region_id, NEW.region_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate to ensure latest version
DROP TRIGGER IF EXISTS cases_enforce_region_immutability ON cases;

CREATE TRIGGER cases_enforce_region_immutability
BEFORE UPDATE ON cases
FOR EACH ROW
EXECUTE FUNCTION enforce_region_immutability();

-- ===========================================
-- STEP 5: External Case ID Immutability
-- Once set, external_case_id cannot be changed
-- ===========================================

CREATE OR REPLACE FUNCTION enforce_external_case_id_immutability()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.external_case_id IS NOT NULL AND NEW.external_case_id IS DISTINCT FROM OLD.external_case_id THEN
        RAISE EXCEPTION 'GOVERNANCE VIOLATION: external_case_id is IMMUTABLE. Attempted change from % to %', 
            OLD.external_case_id, NEW.external_case_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cases_enforce_external_id_immutability ON cases;

CREATE TRIGGER cases_enforce_external_id_immutability
BEFORE UPDATE ON cases
FOR EACH ROW
EXECUTE FUNCTION enforce_external_case_id_immutability();

-- ===========================================
-- STEP 6: Source System Immutability
-- Once set, source_system cannot be changed
-- ===========================================

CREATE OR REPLACE FUNCTION enforce_source_system_immutability()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.source_system IS NOT NULL AND NEW.source_system IS DISTINCT FROM OLD.source_system THEN
        RAISE EXCEPTION 'GOVERNANCE VIOLATION: source_system is IMMUTABLE. Attempted change from % to %', 
            OLD.source_system, NEW.source_system;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cases_enforce_source_system_immutability ON cases;

CREATE TRIGGER cases_enforce_source_system_immutability
BEFORE UPDATE ON cases
FOR EACH ROW
EXECUTE FUNCTION enforce_source_system_immutability();

-- ===========================================
-- STEP 7: Actor Type Immutability
-- Cannot change actor_type after creation
-- ===========================================

CREATE OR REPLACE FUNCTION enforce_actor_type_immutability()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.actor_type IS NOT NULL AND NEW.actor_type IS DISTINCT FROM OLD.actor_type THEN
        RAISE EXCEPTION 'GOVERNANCE VIOLATION: actor_type is IMMUTABLE. Attempted change from % to %', 
            OLD.actor_type, NEW.actor_type;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cases_enforce_actor_type_immutability ON cases;

CREATE TRIGGER cases_enforce_actor_type_immutability
BEFORE UPDATE ON cases
FOR EACH ROW
EXECUTE FUNCTION enforce_actor_type_immutability();

-- ===========================================
-- STEP 8: Indexes for Performance
-- ===========================================

CREATE INDEX IF NOT EXISTS idx_cases_source_system ON cases(source_system);
CREATE INDEX IF NOT EXISTS idx_cases_actor_type ON cases(actor_type);
CREATE INDEX IF NOT EXISTS idx_cases_ingestion_timestamp ON cases(ingestion_timestamp);

-- ===========================================
-- VERIFICATION
-- ===========================================

SELECT 
    'INGESTION GOVERNANCE' AS status,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'external_case_id') > 0 AS has_external_case_id,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'source_system') > 0 AS has_source_system,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'ingestion_timestamp') > 0 AS has_ingestion_timestamp,
    (SELECT COUNT(*) FROM pg_trigger WHERE tgname = 'cases_enforce_region_immutability') > 0 AS has_region_trigger,
    (SELECT COUNT(*) FROM pg_trigger WHERE tgname = 'cases_enforce_external_id_immutability') > 0 AS has_external_id_trigger,
    (SELECT COUNT(*) FROM pg_trigger WHERE tgname = 'cases_enforce_source_system_immutability') > 0 AS has_source_trigger,
    (SELECT COUNT(*) FROM pg_trigger WHERE tgname = 'cases_enforce_actor_type_immutability') > 0 AS has_actor_trigger;
