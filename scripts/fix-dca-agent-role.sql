-- Fix DCA Agent Role
-- Run this in Supabase SQL Editor

-- Step 1: Check current users
SELECT id, email, role FROM public.users;

-- Step 2: Fix the DCA Agent role
UPDATE public.users 
SET role = 'DCA_AGENT' 
WHERE email = 'agent1@tatarecovery.in';

-- Step 3: Verify the fix
SELECT id, email, role FROM public.users WHERE email = 'agent1@tatarecovery.in';

-- Step 4: Also make sure there's a region linked (for governance)
-- First get the region ID
-- SELECT id FROM regions WHERE region_code = 'INDIA';

-- Then update if needed:
-- UPDATE public.users 
-- SET primary_region_id = '<REGION_ID>'
-- WHERE email = 'agent1@tatarecovery.in';
