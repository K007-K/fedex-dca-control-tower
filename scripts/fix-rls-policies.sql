-- Complete RLS Policies Fix for FedEx DCA Control Tower
-- Run this in Supabase SQL Editor
-- This enables proper INSERT/UPDATE policies for all tables

-- ==============================================
-- CASES TABLE (Critical - was using admin workaround)
-- ==============================================

DROP POLICY IF EXISTS "Allow authenticated read cases" ON cases;
DROP POLICY IF EXISTS "Allow authenticated insert cases" ON cases;
DROP POLICY IF EXISTS "Allow authenticated update cases" ON cases;
DROP POLICY IF EXISTS "Allow authenticated delete cases" ON cases;

CREATE POLICY "Allow authenticated read cases"
ON cases FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated insert cases"
ON cases FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated update cases"
ON cases FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated delete cases"
ON cases FOR DELETE
TO authenticated
USING (true);

-- ==============================================
-- DCAs TABLE
-- ==============================================

DROP POLICY IF EXISTS "Allow authenticated read dcas" ON dcas;
DROP POLICY IF EXISTS "Allow authenticated insert dcas" ON dcas;
DROP POLICY IF EXISTS "Allow authenticated update dcas" ON dcas;
DROP POLICY IF EXISTS "Allow authenticated delete dcas" ON dcas;

CREATE POLICY "Allow authenticated read dcas"
ON dcas FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated insert dcas"
ON dcas FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated update dcas"
ON dcas FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated delete dcas"
ON dcas FOR DELETE
TO authenticated
USING (true);

-- ==============================================
-- CASE_ACTIONS TABLE
-- ==============================================

DROP POLICY IF EXISTS "Allow authenticated read case_actions" ON case_actions;
DROP POLICY IF EXISTS "Allow authenticated insert case_actions" ON case_actions;

CREATE POLICY "Allow authenticated read case_actions"
ON case_actions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated insert case_actions"
ON case_actions FOR INSERT
TO authenticated
WITH CHECK (true);

-- ==============================================
-- NOTIFICATIONS TABLE
-- ==============================================

DROP POLICY IF EXISTS "Allow authenticated read notifications" ON notifications;
DROP POLICY IF EXISTS "Allow authenticated insert notifications" ON notifications;
DROP POLICY IF EXISTS "Allow authenticated update notifications" ON notifications;

CREATE POLICY "Allow authenticated read notifications"
ON notifications FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated insert notifications"
ON notifications FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated update notifications"
ON notifications FOR UPDATE
TO authenticated
USING (true);

-- ==============================================
-- SLA TEMPLATES TABLE
-- ==============================================

DROP POLICY IF EXISTS "Allow authenticated read sla_templates" ON sla_templates;
DROP POLICY IF EXISTS "Allow authenticated insert sla_templates" ON sla_templates;
DROP POLICY IF EXISTS "Allow authenticated update sla_templates" ON sla_templates;

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
-- VERIFICATION - List all policies
-- ==============================================

SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
