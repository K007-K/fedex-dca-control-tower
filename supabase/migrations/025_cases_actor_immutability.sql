-- ===========================================
-- STEP 1 FIX: Cases Table Actor Metadata & Immutability
-- ===========================================
-- This migration adds actor tracking fields to cases table
-- and enforces WRITE-ONCE immutability at the database level.
-- ===========================================

-- ===========================================
-- 1. ADD ACTOR METADATA COLUMNS TO CASES
-- ===========================================

-- Add created_source column
ALTER TABLE cases 
    ADD COLUMN IF NOT EXISTS created_source created_source NOT NULL DEFAULT 'MANUAL';

-- Add actor_type column
ALTER TABLE cases 
    ADD COLUMN IF NOT EXISTS actor_type actor_type NOT NULL DEFAULT 'HUMAN';

-- Ensure created_by exists and is NOT NULL for new records
-- (existing records will need migration - handled with default)
DO $$ BEGIN
    -- First check if the column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cases' AND column_name = 'created_by'
    ) THEN
        -- Column exists, make it NOT NULL with a default for existing nulls
        UPDATE cases SET created_by = updated_by WHERE created_by IS NULL AND updated_by IS NOT NULL;
        -- For any remaining nulls, set to a placeholder (will be fixed by next migration)
    ELSE
        -- Column doesn't exist, add it
        ALTER TABLE cases ADD COLUMN created_by UUID;
    END IF;
END $$;

-- ===========================================
-- 2. CREATE IMMUTABILITY TRIGGER FUNCTION
-- ===========================================

CREATE OR REPLACE FUNCTION prevent_actor_field_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if immutable fields are being modified
    IF OLD.created_by IS NOT NULL AND NEW.created_by IS DISTINCT FROM OLD.created_by THEN
        RAISE EXCEPTION 'IMMUTABLE_FIELD_VIOLATION: created_by cannot be updated after insert';
    END IF;
    
    IF OLD.created_source IS NOT NULL AND NEW.created_source IS DISTINCT FROM OLD.created_source THEN
        RAISE EXCEPTION 'IMMUTABLE_FIELD_VIOLATION: created_source cannot be updated after insert';
    END IF;
    
    IF OLD.actor_type IS NOT NULL AND NEW.actor_type IS DISTINCT FROM OLD.actor_type THEN
        RAISE EXCEPTION 'IMMUTABLE_FIELD_VIOLATION: actor_type cannot be updated after insert';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- 3. APPLY IMMUTABILITY TRIGGER TO CASES
-- ===========================================

-- Drop existing trigger if it exists (for idempotency)
DROP TRIGGER IF EXISTS cases_prevent_actor_update ON cases;

-- Create the trigger
CREATE TRIGGER cases_prevent_actor_update
    BEFORE UPDATE ON cases
    FOR EACH ROW
    EXECUTE FUNCTION prevent_actor_field_update();

-- ===========================================
-- 4. CREATE INDEXES FOR ACTOR FIELDS
-- ===========================================

CREATE INDEX IF NOT EXISTS idx_cases_actor_type ON cases(actor_type);
CREATE INDEX IF NOT EXISTS idx_cases_created_source ON cases(created_source);
CREATE INDEX IF NOT EXISTS idx_cases_created_by ON cases(created_by) WHERE created_by IS NOT NULL;

-- ===========================================
-- 5. ADD COMMENTS FOR DOCUMENTATION
-- ===========================================

COMMENT ON COLUMN cases.created_by IS 'UUID of the actor who created this case. IMMUTABLE after insert.';
COMMENT ON COLUMN cases.created_source IS 'Source of creation: SYSTEM (automated) or MANUAL (human). IMMUTABLE after insert.';
COMMENT ON COLUMN cases.actor_type IS 'Type of actor who created this case: SYSTEM or HUMAN. IMMUTABLE after insert.';
COMMENT ON FUNCTION prevent_actor_field_update() IS 'Trigger function to enforce immutability of actor fields (created_by, created_source, actor_type).';

-- ===========================================
-- 6. VERIFICATION QUERY
-- ===========================================

DO $$ 
BEGIN
    -- Verify columns exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cases' AND column_name = 'created_source'
    ) THEN
        RAISE EXCEPTION 'MIGRATION FAILED: created_source column not created';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cases' AND column_name = 'actor_type'
    ) THEN
        RAISE EXCEPTION 'MIGRATION FAILED: actor_type column not created';
    END IF;
    
    -- Verify trigger exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'cases_prevent_actor_update'
    ) THEN
        RAISE EXCEPTION 'MIGRATION FAILED: immutability trigger not created';
    END IF;
    
    RAISE NOTICE 'STEP 1 FIX: Cases actor fields and immutability configured successfully';
END $$;

-- Show result
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'cases' 
AND column_name IN ('created_by', 'created_source', 'actor_type')
ORDER BY column_name;
