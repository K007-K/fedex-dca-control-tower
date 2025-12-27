-- ===========================================
-- FIX: Sync User IDs - Run in Supabase SQL Editor
-- ===========================================
-- This script syncs public.users UUIDs to match auth.users UUIDs
-- Run this in: Supabase Dashboard > SQL Editor
-- ===========================================

-- Step 1: Create a temp table with the mapping
CREATE TEMP TABLE user_id_mapping AS
SELECT 
    au.id as new_id,
    pu.id as old_id,
    au.email,
    pu.full_name,
    pu.role,
    pu.organization_id,
    pu.dca_id,
    pu.is_active,
    pu.is_verified,
    pu.timezone
FROM auth.users au
INNER JOIN public.users pu ON au.email = pu.email
WHERE au.id != pu.id;

-- Step 2: FIRST insert new users (with new IDs) using a different email temporarily
INSERT INTO public.users (id, email, full_name, role, organization_id, dca_id, is_active, is_verified, timezone)
SELECT 
    new_id, 
    email || '.new',  -- Temporary email to avoid duplicate constraint
    full_name, 
    role, 
    organization_id, 
    dca_id, 
    is_active, 
    is_verified, 
    timezone
FROM user_id_mapping;

-- Step 3: Update foreign key references to point to new user IDs
UPDATE case_actions SET performed_by = m.new_id
FROM user_id_mapping m WHERE case_actions.performed_by = m.old_id;

UPDATE cases SET assigned_agent_id = m.new_id
FROM user_id_mapping m WHERE cases.assigned_agent_id = m.old_id;

UPDATE cases SET created_by = m.new_id
FROM user_id_mapping m WHERE cases.created_by = m.old_id;

UPDATE cases SET updated_by = m.new_id
FROM user_id_mapping m WHERE cases.updated_by = m.old_id;

UPDATE notifications SET recipient_id = m.new_id
FROM user_id_mapping m WHERE notifications.recipient_id = m.old_id;

UPDATE audit_logs SET user_id = m.new_id
FROM user_id_mapping m WHERE audit_logs.user_id = m.old_id;

-- Step 4: Now delete old users (FKs now point to new users)
DELETE FROM public.users WHERE id IN (SELECT old_id FROM user_id_mapping);

-- Step 5: Fix the temporary email back to real email
UPDATE public.users SET email = REPLACE(email, '.new', '')
WHERE email LIKE '%.new';

-- Step 6: Cleanup
DROP TABLE user_id_mapping;

-- Step 7: Verify the sync worked
SELECT 
    au.email,
    au.id as auth_id,
    pu.id as public_id,
    pu.role,
    CASE WHEN au.id = pu.id THEN '✅ SYNCED' ELSE '❌ MISMATCH' END as status
FROM auth.users au
LEFT JOIN public.users pu ON au.email = pu.email
ORDER BY au.email;
