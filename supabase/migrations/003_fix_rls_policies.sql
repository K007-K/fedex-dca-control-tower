-- ===========================================
-- FedEx DCA Control Tower - RLS Policy Fix
-- ===========================================
-- Run this to enable public read access for API endpoints
-- ===========================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS anon_deny_cases ON cases;
DROP POLICY IF EXISTS anon_deny_dcas ON dcas;
DROP POLICY IF EXISTS anon_deny_users ON users;

-- Allow public read access for cases (in development/demo mode)
CREATE POLICY anon_read_cases ON cases 
  FOR SELECT 
  TO anon 
  USING (true);

-- Allow public read access for DCAs
CREATE POLICY anon_read_dcas ON dcas 
  FOR SELECT 
  TO anon 
  USING (true);

-- Allow public read access for users (for demo)
CREATE POLICY anon_read_users ON users 
  FOR SELECT 
  TO anon 
  USING (true);

-- Allow public read for organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY anon_read_organizations ON organizations 
  FOR SELECT 
  TO anon 
  USING (true);

CREATE POLICY service_role_bypass_organizations ON organizations 
  FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- Allow anonymous read for SLA logs
CREATE POLICY anon_read_sla_logs ON sla_logs 
  FOR SELECT 
  TO anon 
  USING (true);

-- Allow anonymous read for case actions
CREATE POLICY anon_read_case_actions ON case_actions 
  FOR SELECT 
  TO anon 
  USING (true);

-- Allow anonymous read for notifications (for demo)
CREATE POLICY anon_read_notifications ON notifications 
  FOR SELECT 
  TO anon 
  USING (true);

-- Allow anonymous read for escalations
CREATE POLICY anon_read_escalations ON escalations 
  FOR SELECT 
  TO anon 
  USING (true);

-- Allow anonymous read for SLA templates
ALTER TABLE sla_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY anon_read_sla_templates ON sla_templates 
  FOR SELECT 
  TO anon 
  USING (true);

CREATE POLICY service_role_bypass_sla_templates ON sla_templates 
  FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

SELECT 'RLS policies updated successfully!' AS result;
