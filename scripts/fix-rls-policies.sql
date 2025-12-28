-- Fix RLS Policies for SLA Templates, SLA Logs, and Users
-- Run this in Supabase SQL Editor
-- This enables authenticated users to create/update records

-- ==============================================
-- SLA TEMPLATES TABLE
-- ==============================================

-- Drop existing policies first (safe if they don't exist)
DROP POLICY IF EXISTS "Allow authenticated read sla_templates" ON sla_templates;
DROP POLICY IF EXISTS "Allow authenticated insert sla_templates" ON sla_templates;
DROP POLICY IF EXISTS "Allow authenticated update sla_templates" ON sla_templates;

-- Create new policies
CREATE POLICY "Allow authenticated read sla_templates"
ON sla_templates FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated insert sla_templates"
ON sla_templates FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated update sla_templates"
ON sla_templates FOR UPDATE
TO authenticated
USING (true);

-- ==============================================
-- SLA LOGS TABLE
-- ==============================================

DROP POLICY IF EXISTS "Allow authenticated read sla_logs" ON sla_logs;
DROP POLICY IF EXISTS "Allow authenticated insert sla_logs" ON sla_logs;

CREATE POLICY "Allow authenticated read sla_logs"
ON sla_logs FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated insert sla_logs"
ON sla_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- ==============================================
-- USERS TABLE
-- ==============================================

DROP POLICY IF EXISTS "Allow authenticated read users" ON users;
DROP POLICY IF EXISTS "Allow authenticated insert users" ON users;
DROP POLICY IF EXISTS "Allow authenticated update users" ON users;

CREATE POLICY "Allow authenticated read users"
ON users FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated insert users"
ON users FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated update users"
ON users FOR UPDATE
TO authenticated
USING (true);

-- ==============================================
-- ESCALATIONS TABLE
-- ==============================================

DROP POLICY IF EXISTS "Allow authenticated read escalations" ON escalations;
DROP POLICY IF EXISTS "Allow authenticated insert escalations" ON escalations;
DROP POLICY IF EXISTS "Allow authenticated update escalations" ON escalations;

CREATE POLICY "Allow authenticated read escalations"
ON escalations FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated insert escalations"
ON escalations FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated update escalations"
ON escalations FOR UPDATE
TO authenticated
USING (true);

-- ==============================================
-- VERIFICATION
-- ==============================================

SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('sla_templates', 'sla_logs', 'users', 'escalations')
ORDER BY tablename, policyname;
