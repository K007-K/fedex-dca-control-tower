-- ============================================
-- Migration: Add created_by_role to cases table
-- Date: 2026-01-05
-- Purpose: Track which role created each case for audit purposes
-- ============================================

-- Add created_by_role column to cases table
ALTER TABLE cases 
ADD COLUMN IF NOT EXISTS created_by_role TEXT;

COMMENT ON COLUMN cases.created_by_role IS 
'The role of the user who created this case. Used for audit and governance tracking.';

-- Create index for filtering by creator role
CREATE INDEX IF NOT EXISTS idx_cases_created_by_role ON cases(created_by_role);
