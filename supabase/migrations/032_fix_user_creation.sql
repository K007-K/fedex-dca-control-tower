-- ============================================
-- Migration: Fix User Creation - Drop NOT NULL on primary_region_id
-- Date: 2026-01-05
-- Purpose: Allow users table to accept NULL primary_region_id
-- ============================================
-- 
-- ROOT CAUSE:
-- Migration 028_region_governance.sql added NOT NULL constraint to users.primary_region_id
-- But when Supabase Auth creates a user via auth.admin.createUser(), there's an automatic
-- trigger that inserts a row into public.users without providing primary_region_id,
-- causing: "null value in column 'primary_region_id' of relation 'users' violates not-null constraint"
--
-- FIX: Make primary_region_id nullable since:
-- 1. Region access is now determined by region_dca_assignments (for DCA users)
-- 2. FedEx users use user_region_access table for explicit region grants
-- 3. Users should NOT store region directly (governance model)
-- ============================================

-- Drop the NOT NULL constraint from primary_region_id
ALTER TABLE users ALTER COLUMN primary_region_id DROP NOT NULL;

-- Add comment explaining the nullable nature
COMMENT ON COLUMN users.primary_region_id IS 
'Optional region assignment. For DCA users, region is derived from dca_id via region_dca_assignments. 
For FedEx users, region access is granted via user_region_access table. 
This column is nullable because the auth trigger creates users before region assignment.';
