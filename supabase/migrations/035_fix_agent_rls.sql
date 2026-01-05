-- 035_fix_agent_rls.sql
-- Purpose: Fix RLS policies to allow service_role to bypass
-- Note: Run this after 034_agent_workbench.sql

-- Drop existing policies that block service_role
DROP POLICY IF EXISTS "Agents can view activities for their cases" ON case_activities;
DROP POLICY IF EXISTS "Agents can create activities for their cases" ON case_activities;

-- Re-create with service_role bypass
CREATE POLICY "service_role_bypass_case_activities" ON case_activities
    FOR ALL USING (true) WITH CHECK (true);

-- Same for scheduled_callbacks  
DROP POLICY IF EXISTS "Agents can view their own callbacks" ON scheduled_callbacks;
DROP POLICY IF EXISTS "Agents can create their own callbacks" ON scheduled_callbacks;
DROP POLICY IF EXISTS "Agents can update their own callbacks" ON scheduled_callbacks;

CREATE POLICY "service_role_bypass_scheduled_callbacks" ON scheduled_callbacks
    FOR ALL USING (true) WITH CHECK (true);

-- Same for agent_notifications
DROP POLICY IF EXISTS "Agents can view their own notifications" ON agent_notifications;
DROP POLICY IF EXISTS "Agents can update their own notifications" ON agent_notifications;

CREATE POLICY "service_role_bypass_agent_notifications" ON agent_notifications
    FOR ALL USING (true) WITH CHECK (true);

-- Grant explicit permissions to service_role
GRANT ALL ON case_activities TO service_role;
GRANT ALL ON scheduled_callbacks TO service_role;
GRANT ALL ON agent_notifications TO service_role;

-- Also grant to authenticated for client-side access
GRANT SELECT, INSERT ON case_activities TO authenticated;
GRANT SELECT, INSERT, UPDATE ON scheduled_callbacks TO authenticated;
GRANT SELECT, UPDATE ON agent_notifications TO authenticated;
