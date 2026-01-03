-- ===========================================
-- STEP 3 FIX: Case Core Fields Immutability
-- ===========================================
-- This migration enforces WRITE-ONCE immutability 
-- for CORE BUSINESS FACTS in the cases table.
-- 
-- IMMUTABLE FIELDS (after INSERT):
-- - original_amount (financial)
-- - currency (financial)
-- - region (geography)
-- - region_id (geography)
--
-- Any attempt to UPDATE these fields will:
--   → RAISE AN EXCEPTION
--   → ABORT THE TRANSACTION
-- ===========================================

-- ===========================================
-- 1. CREATE IMMUTABILITY TRIGGER FUNCTION
-- ===========================================

CREATE OR REPLACE FUNCTION prevent_case_core_mutation()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if CORE FINANCIAL fields are being modified
    IF OLD.original_amount IS NOT NULL AND NEW.original_amount IS DISTINCT FROM OLD.original_amount THEN
        RAISE EXCEPTION 'IMMUTABLE_FIELD_VIOLATION: original_amount cannot be updated after insert. Case: %, Attempted: % -> %',
            OLD.case_number, OLD.original_amount, NEW.original_amount;
    END IF;
    
    IF OLD.currency IS NOT NULL AND NEW.currency IS DISTINCT FROM OLD.currency THEN
        RAISE EXCEPTION 'IMMUTABLE_FIELD_VIOLATION: currency cannot be updated after insert. Case: %, Attempted: % -> %',
            OLD.case_number, OLD.currency, NEW.currency;
    END IF;
    
    -- Check if CORE GEOGRAPHY fields are being modified
    IF OLD.region IS NOT NULL AND NEW.region IS DISTINCT FROM OLD.region THEN
        RAISE EXCEPTION 'IMMUTABLE_FIELD_VIOLATION: region cannot be updated after insert. Case: %, Attempted: % -> %',
            OLD.case_number, OLD.region, NEW.region;
    END IF;
    
    IF OLD.region_id IS NOT NULL AND NEW.region_id IS DISTINCT FROM OLD.region_id THEN
        RAISE EXCEPTION 'IMMUTABLE_FIELD_VIOLATION: region_id cannot be updated after insert. Case: %, Attempted: % -> %',
            OLD.case_number, OLD.region_id, NEW.region_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- 2. APPLY TRIGGER TO CASES TABLE
-- ===========================================

-- Drop existing trigger if exists (for idempotency)
DROP TRIGGER IF EXISTS cases_prevent_core_mutation ON cases;

-- Create the trigger - runs BEFORE UPDATE
CREATE TRIGGER cases_prevent_core_mutation
    BEFORE UPDATE ON cases
    FOR EACH ROW
    EXECUTE FUNCTION prevent_case_core_mutation();

-- ===========================================
-- 3. ADD DOCUMENTATION
-- ===========================================

COMMENT ON FUNCTION prevent_case_core_mutation() IS 
    'Trigger function to enforce immutability of core business fields: original_amount, currency, region, region_id. These fields cannot be modified after initial INSERT.';

COMMENT ON COLUMN cases.original_amount IS 
    'Original debt amount at case creation. IMMUTABLE after insert.';
COMMENT ON COLUMN cases.currency IS 
    'ISO 4217 currency code. IMMUTABLE after insert.';

-- region column comment (only if column exists)
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cases' AND column_name = 'region'
    ) THEN
        COMMENT ON COLUMN cases.region IS 'Region code for case governance. IMMUTABLE after insert.';
    END IF;
END $$;

-- region_id column comment (only if column exists)
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cases' AND column_name = 'region_id'
    ) THEN
        COMMENT ON COLUMN cases.region_id IS 'Region UUID reference for case governance. IMMUTABLE after insert.';
    END IF;
END $$;

-- ===========================================
-- 4. VERIFICATION
-- ===========================================

DO $$ 
BEGIN
    -- Verify trigger exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'cases_prevent_core_mutation'
    ) THEN
        RAISE EXCEPTION 'MIGRATION FAILED: cases_prevent_core_mutation trigger not created';
    END IF;
    
    -- Verify function exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'prevent_case_core_mutation'
    ) THEN
        RAISE EXCEPTION 'MIGRATION FAILED: prevent_case_core_mutation function not created';
    END IF;
    
    RAISE NOTICE 'STEP 3 FIX: Case core field immutability configured successfully';
    RAISE NOTICE 'Protected fields: original_amount, currency, region, region_id';
END $$;

-- ===========================================
-- 5. LIST ALL IMMUTABILITY TRIGGERS
-- ===========================================

SELECT 
    tgname AS trigger_name,
    tgtype,
    tgenabled,
    pg_get_triggerdef(oid) AS definition
FROM pg_trigger
WHERE tgrelid = 'cases'::regclass
AND tgname LIKE '%immutable%' OR tgname LIKE '%prevent%'
ORDER BY tgname;
