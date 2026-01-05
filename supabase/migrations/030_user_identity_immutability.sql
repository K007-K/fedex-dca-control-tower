-- ============================================
-- Migration: User Identity Immutability
-- Date: 2026-01-05
-- Purpose: Enforce immutability of critical user fields
-- ============================================

-- ============================================
-- 1. Add allowed_email_domains to DCAs
-- ============================================
ALTER TABLE dcas
ADD COLUMN IF NOT EXISTS allowed_email_domains TEXT[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN dcas.allowed_email_domains IS 
'List of email domains allowed for users in this DCA. E.g., {acme.com, acme-collections.com}';

-- ============================================
-- 2. User Identity Immutability Trigger
-- ============================================
-- Prevents modification of: email, role, dca_id

CREATE OR REPLACE FUNCTION prevent_user_identity_mutation()
RETURNS trigger AS $$
BEGIN
    -- Check if any immutable field is being changed
    IF OLD.email IS DISTINCT FROM NEW.email THEN
        RAISE EXCEPTION 'USER_IDENTITY_IMMUTABLE: email cannot be changed after user creation';
    END IF;
    
    IF OLD.role IS DISTINCT FROM NEW.role THEN
        RAISE EXCEPTION 'USER_IDENTITY_IMMUTABLE: role cannot be changed after user creation';
    END IF;
    
    IF OLD.dca_id IS DISTINCT FROM NEW.dca_id THEN
        RAISE EXCEPTION 'USER_IDENTITY_IMMUTABLE: DCA assignment cannot be changed after user creation';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS users_identity_immutable ON users;

-- Create trigger
CREATE TRIGGER users_identity_immutable
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION prevent_user_identity_mutation();

COMMENT ON FUNCTION prevent_user_identity_mutation() IS 
'Enforces immutability of email, role, and dca_id fields on users table';

-- ============================================
-- 3. Create User Update Audit Log Type
-- ============================================
-- Add USER_UPDATE to audit action types if not exists

DO $$
BEGIN
    -- Check if USER_UPDATE exists in the enum, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid 
        WHERE t.typname = 'audit_action_type' 
        AND e.enumlabel = 'USER_UPDATE'
    ) THEN
        -- Add USER_UPDATE to audit action enum if the type exists
        BEGIN
            ALTER TYPE audit_action_type ADD VALUE IF NOT EXISTS 'USER_UPDATE';
        EXCEPTION WHEN OTHERS THEN
            -- Type might not exist, that's OK
            NULL;
        END;
    END IF;
END $$;

-- ============================================
-- 4. Grant execute permissions
-- ============================================
GRANT EXECUTE ON FUNCTION prevent_user_identity_mutation() TO service_role;
