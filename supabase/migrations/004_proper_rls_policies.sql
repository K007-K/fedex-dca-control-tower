-- P0-6 FIX: Proper RLS Policies for FedEx DCA Control Tower
-- This replaces the permissive "USING (true)" policies with proper role-based access
-- Run this in Supabase SQL Editor

-- ==============================================
-- HELPER FUNCTION: Get current user's role and DCA
-- ==============================================

CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role FROM users WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_current_user_dca()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT dca_id FROM users WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_fedex_role()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_current_user_role() IN ('SUPER_ADMIN', 'FEDEX_ADMIN', 'FEDEX_MANAGER', 'FEDEX_ANALYST');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin_role()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_current_user_role() IN ('SUPER_ADMIN', 'FEDEX_ADMIN');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- CASES TABLE - DCA Isolation
-- ==============================================

DROP POLICY IF EXISTS "Allow authenticated read cases" ON cases;
DROP POLICY IF EXISTS "Allow authenticated insert cases" ON cases;
DROP POLICY IF EXISTS "Allow authenticated update cases" ON cases;
DROP POLICY IF EXISTS "Allow authenticated delete cases" ON cases;
DROP POLICY IF EXISTS "cases_select_policy" ON cases;
DROP POLICY IF EXISTS "cases_insert_policy" ON cases;
DROP POLICY IF EXISTS "cases_update_policy" ON cases;
DROP POLICY IF EXISTS "cases_delete_policy" ON cases;

-- SELECT: FedEx can see all, DCA can only see assigned cases
CREATE POLICY "cases_select_policy" ON cases
FOR SELECT TO authenticated
USING (
    is_fedex_role()
    OR get_current_user_role() IN ('AUDITOR', 'READONLY')
    OR assigned_dca_id = get_current_user_dca()
);

-- INSERT: Only FedEx roles can create cases
CREATE POLICY "cases_insert_policy" ON cases
FOR INSERT TO authenticated
WITH CHECK (
    is_fedex_role()
);

-- UPDATE: FedEx can update all, DCA can update their assigned cases
CREATE POLICY "cases_update_policy" ON cases
FOR UPDATE TO authenticated
USING (
    is_fedex_role()
    OR assigned_dca_id = get_current_user_dca()
);

-- DELETE: Only admin roles can delete
CREATE POLICY "cases_delete_policy" ON cases
FOR DELETE TO authenticated
USING (
    is_admin_role()
);

-- ==============================================
-- DCAs TABLE - Read by all, write by FedEx
-- ==============================================

DROP POLICY IF EXISTS "Allow authenticated read dcas" ON dcas;
DROP POLICY IF EXISTS "Allow authenticated insert dcas" ON dcas;
DROP POLICY IF EXISTS "Allow authenticated update dcas" ON dcas;
DROP POLICY IF EXISTS "Allow authenticated delete dcas" ON dcas;
DROP POLICY IF EXISTS "dcas_select_policy" ON dcas;
DROP POLICY IF EXISTS "dcas_insert_policy" ON dcas;
DROP POLICY IF EXISTS "dcas_update_policy" ON dcas;
DROP POLICY IF EXISTS "dcas_delete_policy" ON dcas;

-- SELECT: All authenticated users can see DCAs
CREATE POLICY "dcas_select_policy" ON dcas
FOR SELECT TO authenticated
USING (true);

-- INSERT: Only FedEx admins can create DCAs
CREATE POLICY "dcas_insert_policy" ON dcas
FOR INSERT TO authenticated
WITH CHECK (
    is_admin_role()
);

-- UPDATE: FedEx roles can update, DCA admins can update their own DCA
CREATE POLICY "dcas_update_policy" ON dcas
FOR UPDATE TO authenticated
USING (
    is_fedex_role()
    OR (get_current_user_role() = 'DCA_ADMIN' AND id = get_current_user_dca())
);

-- DELETE: Only admin roles can delete
CREATE POLICY "dcas_delete_policy" ON dcas
FOR DELETE TO authenticated
USING (
    is_admin_role()
);

-- ==============================================
-- USERS TABLE - Role-based visibility
-- ==============================================

DROP POLICY IF EXISTS "Allow authenticated read users" ON users;
DROP POLICY IF EXISTS "Allow authenticated insert users" ON users;
DROP POLICY IF EXISTS "Allow authenticated update users" ON users;
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;

-- SELECT: FedEx sees all, DCA sees own DCA users
CREATE POLICY "users_select_policy" ON users
FOR SELECT TO authenticated
USING (
    is_fedex_role()
    OR id = auth.uid()  -- Can always see own profile
    OR dca_id = get_current_user_dca()
);

-- INSERT: Admins can create, DCA_ADMIN can create for their DCA
CREATE POLICY "users_insert_policy" ON users
FOR INSERT TO authenticated
WITH CHECK (
    is_admin_role()
    OR (
        get_current_user_role() = 'DCA_ADMIN' 
        AND dca_id = get_current_user_dca()
    )
);

-- UPDATE: Can update own profile, admins can update any, DCA_ADMIN can update own DCA
CREATE POLICY "users_update_policy" ON users
FOR UPDATE TO authenticated
USING (
    id = auth.uid()  -- Own profile
    OR is_admin_role()
    OR (
        get_current_user_role() = 'DCA_ADMIN' 
        AND dca_id = get_current_user_dca()
    )
);

-- ==============================================
-- NOTIFICATIONS TABLE - User can only see own
-- ==============================================

DROP POLICY IF EXISTS "Allow authenticated read notifications" ON notifications;
DROP POLICY IF EXISTS "Allow authenticated insert notifications" ON notifications;
DROP POLICY IF EXISTS "Allow authenticated update notifications" ON notifications;
DROP POLICY IF EXISTS "notifications_select_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_update_policy" ON notifications;

-- SELECT: Users can only see their own notifications
CREATE POLICY "notifications_select_policy" ON notifications
FOR SELECT TO authenticated
USING (
    recipient_id = auth.uid()
    OR is_admin_role()
);

-- INSERT: Authenticated users can create notifications
CREATE POLICY "notifications_insert_policy" ON notifications
FOR INSERT TO authenticated
WITH CHECK (true);

-- UPDATE: Users can only update their own notifications
CREATE POLICY "notifications_update_policy" ON notifications
FOR UPDATE TO authenticated
USING (
    recipient_id = auth.uid()
);

-- ==============================================
-- SLA TEMPLATES TABLE - Read by all, write by admin
-- ==============================================

DROP POLICY IF EXISTS "Allow authenticated read sla_templates" ON sla_templates;
DROP POLICY IF EXISTS "Allow authenticated insert sla_templates" ON sla_templates;
DROP POLICY IF EXISTS "Allow authenticated update sla_templates" ON sla_templates;
DROP POLICY IF EXISTS "sla_templates_select_policy" ON sla_templates;
DROP POLICY IF EXISTS "sla_templates_insert_policy" ON sla_templates;
DROP POLICY IF EXISTS "sla_templates_update_policy" ON sla_templates;

-- SELECT: All can read SLA templates
CREATE POLICY "sla_templates_select_policy" ON sla_templates
FOR SELECT TO authenticated
USING (true);

-- INSERT: Only admins can create
CREATE POLICY "sla_templates_insert_policy" ON sla_templates
FOR INSERT TO authenticated
WITH CHECK (
    is_admin_role()
);

-- UPDATE: Only admins can update
CREATE POLICY "sla_templates_update_policy" ON sla_templates
FOR UPDATE TO authenticated
USING (
    is_admin_role()
);

-- ==============================================
-- SLA LOGS TABLE - Based on case access
-- ==============================================

DROP POLICY IF EXISTS "Allow authenticated read sla_logs" ON sla_logs;
DROP POLICY IF EXISTS "Allow authenticated insert sla_logs" ON sla_logs;
DROP POLICY IF EXISTS "sla_logs_select_policy" ON sla_logs;
DROP POLICY IF EXISTS "sla_logs_insert_policy" ON sla_logs;

-- SELECT: Based on case access
CREATE POLICY "sla_logs_select_policy" ON sla_logs
FOR SELECT TO authenticated
USING (
    is_fedex_role()
    OR EXISTS (
        SELECT 1 FROM cases c 
        WHERE c.id = sla_logs.case_id 
        AND c.assigned_dca_id = get_current_user_dca()
    )
);

-- INSERT: Authenticated can create (system creates these)
CREATE POLICY "sla_logs_insert_policy" ON sla_logs
FOR INSERT TO authenticated
WITH CHECK (true);

-- ==============================================
-- CASE_ACTIONS TABLE - Based on case access
-- ==============================================

DROP POLICY IF EXISTS "Allow authenticated read case_actions" ON case_actions;
DROP POLICY IF EXISTS "Allow authenticated insert case_actions" ON case_actions;
DROP POLICY IF EXISTS "case_actions_select_policy" ON case_actions;
DROP POLICY IF EXISTS "case_actions_insert_policy" ON case_actions;

-- SELECT: Based on case access
CREATE POLICY "case_actions_select_policy" ON case_actions
FOR SELECT TO authenticated
USING (
    is_fedex_role()
    OR EXISTS (
        SELECT 1 FROM cases c 
        WHERE c.id = case_actions.case_id 
        AND c.assigned_dca_id = get_current_user_dca()
    )
);

-- INSERT: Based on case access
CREATE POLICY "case_actions_insert_policy" ON case_actions
FOR INSERT TO authenticated
WITH CHECK (
    is_fedex_role()
    OR EXISTS (
        SELECT 1 FROM cases c 
        WHERE c.id = case_id 
        AND c.assigned_dca_id = get_current_user_dca()
    )
);

-- ==============================================
-- ESCALATIONS TABLE - Based on case access
-- ==============================================

DROP POLICY IF EXISTS "Allow authenticated read escalations" ON escalations;
DROP POLICY IF EXISTS "Allow authenticated insert escalations" ON escalations;
DROP POLICY IF EXISTS "Allow authenticated update escalations" ON escalations;
DROP POLICY IF EXISTS "escalations_select_policy" ON escalations;
DROP POLICY IF EXISTS "escalations_insert_policy" ON escalations;
DROP POLICY IF EXISTS "escalations_update_policy" ON escalations;

-- SELECT: Based on case access or if escalated to user
CREATE POLICY "escalations_select_policy" ON escalations
FOR SELECT TO authenticated
USING (
    is_fedex_role()
    OR escalated_to = auth.uid()
    OR escalated_from = auth.uid()
    OR EXISTS (
        SELECT 1 FROM cases c 
        WHERE c.id = escalations.case_id 
        AND c.assigned_dca_id = get_current_user_dca()
    )
);

-- INSERT: Authenticated can create
CREATE POLICY "escalations_insert_policy" ON escalations
FOR INSERT TO authenticated
WITH CHECK (true);

-- UPDATE: FedEx or involved users can update
CREATE POLICY "escalations_update_policy" ON escalations
FOR UPDATE TO authenticated
USING (
    is_fedex_role()
    OR escalated_to = auth.uid()
);

-- ==============================================
-- VERIFICATION - List all new policies
-- ==============================================

SELECT 
    schemaname,
    tablename, 
    policyname, 
    cmd,
    permissive
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
