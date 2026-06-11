-- ===========================================
-- FedEx DCA Control Tower - Security Fixes
-- Migration: 043_security_fixes.sql
-- ===========================================
-- Fixes 8 Supabase security vulnerabilities:
--   1. SECURITY DEFINER views → SECURITY INVOKER
--   2. RLS enabled on 6 unprotected tables
-- ===========================================


-- ================================================
-- FIX 1: Recreate views with SECURITY INVOKER
-- ================================================
-- These views previously ran as the view creator (service role),
-- bypassing RLS on the underlying tables. SECURITY INVOKER
-- ensures RLS applies to the querying user.

-- 1a. cases_with_dpd (originally in 006_days_past_due.sql)
DROP VIEW IF EXISTS cases_with_dpd;
CREATE VIEW cases_with_dpd
WITH (security_invoker = true)
AS
SELECT 
    c.*,
    GREATEST(0, EXTRACT(DAY FROM NOW() - COALESCE(c.due_date, c.created_at + INTERVAL '30 days'))) AS days_past_due,
    CASE 
        WHEN COALESCE(c.due_date, c.created_at + INTERVAL '30 days') > NOW() THEN 'NOT_DUE'
        WHEN EXTRACT(DAY FROM NOW() - COALESCE(c.due_date, c.created_at + INTERVAL '30 days')) <= 30 THEN 'EARLY'
        WHEN EXTRACT(DAY FROM NOW() - COALESCE(c.due_date, c.created_at + INTERVAL '30 days')) <= 60 THEN 'MID'
        WHEN EXTRACT(DAY FROM NOW() - COALESCE(c.due_date, c.created_at + INTERVAL '30 days')) <= 90 THEN 'LATE'
        ELSE 'VERY_LATE'
    END AS aging_bucket
FROM cases c;

GRANT SELECT ON cases_with_dpd TO authenticated;

-- 1b. audit_logs_with_users (originally in 005_audit_logs.sql)
DROP VIEW IF EXISTS audit_logs_with_users;
CREATE VIEW audit_logs_with_users
WITH (security_invoker = true)
AS
SELECT 
    al.*,
    u.full_name as user_name,
    u.role as user_role
FROM audit_logs al
LEFT JOIN users u ON al.user_id = u.id;

GRANT SELECT ON audit_logs_with_users TO authenticated;


-- ================================================
-- FIX 2: Enable RLS on unprotected tables
-- ================================================

-- ------------------------------------------------
-- 2a. region_audit_log (from 020_region_master.sql)
-- ------------------------------------------------
-- Immutable audit log — read-only for admins/auditors
ALTER TABLE region_audit_log ENABLE ROW LEVEL SECURITY;

-- Service role bypass
CREATE POLICY region_audit_log_service_bypass
    ON region_audit_log FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- Admins and auditors can read
CREATE POLICY region_audit_log_admin_read
    ON region_audit_log FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('SUPER_ADMIN', 'FEDEX_ADMIN', 'AUDITOR')
        )
    );

-- Insert only (for logging functions) — no UPDATE/DELETE
CREATE POLICY region_audit_log_insert
    ON region_audit_log FOR INSERT TO authenticated
    WITH CHECK (true);


-- ------------------------------------------------
-- 2b. escalation_matrices (from 021_escalation_matrix.sql)
-- ------------------------------------------------
ALTER TABLE escalation_matrices ENABLE ROW LEVEL SECURITY;

-- Service role bypass
CREATE POLICY escalation_matrices_service_bypass
    ON escalation_matrices FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- Authenticated users can read active matrices
CREATE POLICY escalation_matrices_read
    ON escalation_matrices FOR SELECT TO authenticated
    USING (true);

-- Only admins can modify
CREATE POLICY escalation_matrices_admin_write
    ON escalation_matrices FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('SUPER_ADMIN', 'FEDEX_ADMIN')
        )
    );

CREATE POLICY escalation_matrices_admin_update
    ON escalation_matrices FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('SUPER_ADMIN', 'FEDEX_ADMIN')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('SUPER_ADMIN', 'FEDEX_ADMIN')
        )
    );

CREATE POLICY escalation_matrices_admin_delete
    ON escalation_matrices FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('SUPER_ADMIN', 'FEDEX_ADMIN')
        )
    );


-- ------------------------------------------------
-- 2c. escalation_matrix_levels (from 021_escalation_matrix.sql)
-- ------------------------------------------------
ALTER TABLE escalation_matrix_levels ENABLE ROW LEVEL SECURITY;

-- Service role bypass
CREATE POLICY escalation_matrix_levels_service_bypass
    ON escalation_matrix_levels FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- Authenticated users can read
CREATE POLICY escalation_matrix_levels_read
    ON escalation_matrix_levels FOR SELECT TO authenticated
    USING (true);

-- Only admins can modify
CREATE POLICY escalation_matrix_levels_admin_write
    ON escalation_matrix_levels FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('SUPER_ADMIN', 'FEDEX_ADMIN')
        )
    );

CREATE POLICY escalation_matrix_levels_admin_update
    ON escalation_matrix_levels FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('SUPER_ADMIN', 'FEDEX_ADMIN')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('SUPER_ADMIN', 'FEDEX_ADMIN')
        )
    );

CREATE POLICY escalation_matrix_levels_admin_delete
    ON escalation_matrix_levels FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('SUPER_ADMIN', 'FEDEX_ADMIN')
        )
    );


-- ------------------------------------------------
-- 2d. message_templates (from 034_agent_workbench.sql)
-- ------------------------------------------------
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

-- Service role bypass
CREATE POLICY message_templates_service_bypass
    ON message_templates FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- Authenticated users can read active templates
CREATE POLICY message_templates_read
    ON message_templates FOR SELECT TO authenticated
    USING (true);

-- Admins and DCA admins can modify templates
CREATE POLICY message_templates_admin_write
    ON message_templates FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('SUPER_ADMIN', 'FEDEX_ADMIN', 'DCA_ADMIN')
        )
    );

CREATE POLICY message_templates_admin_update
    ON message_templates FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('SUPER_ADMIN', 'FEDEX_ADMIN', 'DCA_ADMIN')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('SUPER_ADMIN', 'FEDEX_ADMIN', 'DCA_ADMIN')
        )
    );

CREATE POLICY message_templates_admin_delete
    ON message_templates FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('SUPER_ADMIN', 'FEDEX_ADMIN', 'DCA_ADMIN')
        )
    );


-- ------------------------------------------------
-- 2e. geography_region_rules (from 020_region_master.sql)
-- ------------------------------------------------
ALTER TABLE geography_region_rules ENABLE ROW LEVEL SECURITY;

-- Service role bypass
CREATE POLICY geography_region_rules_service_bypass
    ON geography_region_rules FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- Authenticated users can read rules
CREATE POLICY geography_region_rules_read
    ON geography_region_rules FOR SELECT TO authenticated
    USING (true);

-- Only admins can modify geography rules
CREATE POLICY geography_region_rules_admin_write
    ON geography_region_rules FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('SUPER_ADMIN', 'FEDEX_ADMIN')
        )
    );

CREATE POLICY geography_region_rules_admin_update
    ON geography_region_rules FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('SUPER_ADMIN', 'FEDEX_ADMIN')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('SUPER_ADMIN', 'FEDEX_ADMIN')
        )
    );

CREATE POLICY geography_region_rules_admin_delete
    ON geography_region_rules FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('SUPER_ADMIN', 'FEDEX_ADMIN')
        )
    );


-- ------------------------------------------------
-- 2f. region_dca_assignments (from 020_region_master.sql)
-- ------------------------------------------------
ALTER TABLE region_dca_assignments ENABLE ROW LEVEL SECURITY;

-- Service role bypass
CREATE POLICY rda_service_bypass
    ON region_dca_assignments FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- Authenticated users can read assignments
CREATE POLICY rda_read
    ON region_dca_assignments FOR SELECT TO authenticated
    USING (true);

-- Only admins can modify DCA-region assignments
CREATE POLICY rda_admin_write
    ON region_dca_assignments FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('SUPER_ADMIN', 'FEDEX_ADMIN')
        )
    );

CREATE POLICY rda_admin_update
    ON region_dca_assignments FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('SUPER_ADMIN', 'FEDEX_ADMIN')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('SUPER_ADMIN', 'FEDEX_ADMIN')
        )
    );

CREATE POLICY rda_admin_delete
    ON region_dca_assignments FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('SUPER_ADMIN', 'FEDEX_ADMIN')
        )
    );


-- ================================================
-- VERIFICATION
-- ================================================

SELECT 'Security fixes migration completed successfully!' AS result;
SELECT '  - 2 views recreated with SECURITY INVOKER' AS detail
UNION ALL
SELECT '  - 6 tables now have RLS enabled with policies';
