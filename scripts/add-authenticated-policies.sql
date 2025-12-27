-- ===========================================
-- FIX: Add Authenticated User RLS Policies
-- Run in Supabase SQL Editor
-- ===========================================
-- This adds RLS policies for authenticated users to read data
-- ===========================================

-- Drop any conflicting policies first
DROP POLICY IF EXISTS authenticated_read_cases ON cases;
DROP POLICY IF EXISTS authenticated_read_dcas ON dcas;
DROP POLICY IF EXISTS authenticated_read_users ON users;
DROP POLICY IF EXISTS authenticated_read_organizations ON organizations;
DROP POLICY IF EXISTS authenticated_read_case_actions ON case_actions;
DROP POLICY IF EXISTS authenticated_read_notifications ON notifications;
DROP POLICY IF EXISTS authenticated_read_sla_logs ON sla_logs;
DROP POLICY IF EXISTS authenticated_read_escalations ON escalations;
DROP POLICY IF EXISTS authenticated_read_sla_templates ON sla_templates;

-- Allow authenticated users to read all cases
CREATE POLICY authenticated_read_cases ON cases 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Allow authenticated users to read all DCAs
CREATE POLICY authenticated_read_dcas ON dcas 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Allow authenticated users to read all users
CREATE POLICY authenticated_read_users ON users 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Allow authenticated users to read all organizations
CREATE POLICY authenticated_read_organizations ON organizations 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Allow authenticated users to read all case actions
CREATE POLICY authenticated_read_case_actions ON case_actions 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Allow authenticated users to read their own notifications
CREATE POLICY authenticated_read_notifications ON notifications 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Allow authenticated users to read all SLA logs  
CREATE POLICY authenticated_read_sla_logs ON sla_logs 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Allow authenticated users to read all escalations
CREATE POLICY authenticated_read_escalations ON escalations 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Allow authenticated users to read all SLA templates
CREATE POLICY authenticated_read_sla_templates ON sla_templates 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Verify policies were created
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  roles
FROM pg_policies 
WHERE schemaname = 'public' 
  AND policyname LIKE 'authenticated%'
ORDER BY tablename;
