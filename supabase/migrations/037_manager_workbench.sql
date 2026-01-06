-- Migration: 037_manager_workbench.sql
-- Description: RLS policies for DCA Manager to access team cases and agents

-- Allow DCA_MANAGER to see cases assigned to agents in their DCA
CREATE POLICY "manager_read_team_cases" ON cases FOR SELECT TO authenticated
USING (
    -- Manager can see cases where assigned agent is in their DCA
    EXISTS (
        SELECT 1 FROM users u1
        JOIN users u2 ON u1.dca_id = u2.dca_id
        WHERE u1.id = auth.uid()
        AND u1.role = 'DCA_MANAGER'
        AND u2.id = cases.assigned_agent_id
    )
    OR
    -- Standard access for other roles
    (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role NOT IN ('DCA_AGENT', 'DCA_MANAGER')
        )
    )
);

-- Allow DCA_MANAGER to update cases for reassignment
CREATE POLICY "manager_update_team_cases" ON cases FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users u1
        JOIN users u2 ON u1.dca_id = u2.dca_id
        WHERE u1.id = auth.uid()
        AND u1.role = 'DCA_MANAGER'
        AND u2.id = cases.assigned_agent_id
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users u1
        JOIN users u2 ON u1.dca_id = u2.dca_id
        WHERE u1.id = auth.uid()
        AND u1.role = 'DCA_MANAGER'
        AND u2.id = cases.assigned_agent_id
    )
);

-- Allow DCA_MANAGER to see agents in their DCA
CREATE POLICY "manager_read_team_agents" ON users FOR SELECT TO authenticated
USING (
    -- Manager can see users in their DCA
    EXISTS (
        SELECT 1 FROM users manager
        WHERE manager.id = auth.uid()
        AND manager.role = 'DCA_MANAGER'
        AND manager.dca_id = users.dca_id
        AND users.role = 'DCA_AGENT'
    )
    OR
    -- Self access
    id = auth.uid()
    OR
    -- Standard access for non-DCA roles
    EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role NOT IN ('DCA_AGENT', 'DCA_MANAGER')
    )
);

-- Allow DCA_MANAGER to read case activities for team cases
CREATE POLICY "manager_read_team_activities" ON case_activities FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users u1
        JOIN cases c ON c.id = case_activities.case_id
        JOIN users u2 ON u2.id = c.assigned_agent_id
        WHERE u1.id = auth.uid()
        AND u1.role = 'DCA_MANAGER'
        AND u1.dca_id = u2.dca_id
    )
);

-- Allow DCA_MANAGER to insert case activities (for reassign/escalate actions)
CREATE POLICY "manager_insert_team_activities" ON case_activities FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users u1
        JOIN cases c ON c.id = case_activities.case_id
        JOIN users u2 ON u2.id = c.assigned_agent_id
        WHERE u1.id = auth.uid()
        AND u1.role = 'DCA_MANAGER'
        AND u1.dca_id = u2.dca_id
    )
);

-- Add escalated_by_manager column to cases if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'cases' AND column_name = 'escalated_by_manager') THEN
        ALTER TABLE cases ADD COLUMN escalated_by_manager BOOLEAN DEFAULT FALSE;
        ALTER TABLE cases ADD COLUMN escalated_at TIMESTAMPTZ;
        ALTER TABLE cases ADD COLUMN escalated_reason TEXT;
        ALTER TABLE cases ADD COLUMN escalation_priority TEXT DEFAULT 'NORMAL';
    END IF;
END $$;

COMMENT ON POLICY "manager_read_team_cases" ON cases IS 'DCA Manager can read all cases assigned to agents in their DCA';
COMMENT ON POLICY "manager_update_team_cases" ON cases IS 'DCA Manager can update cases for reassignment within their DCA';
COMMENT ON POLICY "manager_read_team_agents" ON users IS 'DCA Manager can see agents in their own DCA';
