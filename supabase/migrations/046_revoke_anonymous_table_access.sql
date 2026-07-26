-- ============================================================================
-- 046: Revoke anonymous read access to application tables  [SECURITY]
-- ============================================================================
--
-- PROBLEM
-- Ten policies of the form `anon_read_<table>` granted SELECT with USING (true)
-- to the `anon` role. The anon key is public by design — it ships in the browser
-- bundle and is visible to any visitor — so these policies exposed live data to
-- the entire internet with no authentication.
--
-- Verified against production before this migration:
--     GET /rest/v1/users?select=email,role   ->  200, full user list
--     GET /rest/v1/cases                     ->  200, customer + financial data
--     GET /rest/v1/dcas                      ->  200
--     GET /rest/v1/organizations             ->  200
--     GET /rest/v1/case_activities           ->  200
--
-- Tables that were empty at the time (audit_logs, notifications, escalations,
-- sla_logs, sla_templates, api_keys, service_actors) were equally exposed and
-- would have leaked as soon as they held rows.
--
-- These look like development conveniences that were never removed.
--
-- FIX
-- Drop every anon read policy. Authenticated access is unaffected: each table
-- retains its existing `authenticated` policies, which enforce the real
-- role/region/DCA scoping. Server-side code uses the service role and bypasses
-- RLS, so API routes are unaffected.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Drop the blanket anon read policies
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "anon_read_users"          ON public.users;
DROP POLICY IF EXISTS "anon_read_cases"          ON public.cases;
DROP POLICY IF EXISTS "anon_read_dcas"           ON public.dcas;
DROP POLICY IF EXISTS "anon_read_organizations"  ON public.organizations;
DROP POLICY IF EXISTS "anon_read_escalations"    ON public.escalations;
DROP POLICY IF EXISTS "anon_read_notifications"  ON public.notifications;
DROP POLICY IF EXISTS "anon_read_sla_logs"       ON public.sla_logs;
DROP POLICY IF EXISTS "anon_read_sla_templates"  ON public.sla_templates;
DROP POLICY IF EXISTS "anon_read_case_actions"   ON public.case_actions;

-- ----------------------------------------------------------------------------
-- 2. organizations had NO authenticated SELECT policy — it was readable only
--    through the anon hole. Grant logged-in users the read the app needs.
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "organizations_read_authenticated" ON public.organizations;
CREATE POLICY "organizations_read_authenticated" ON public.organizations
FOR SELECT TO authenticated
USING (true);

-- ----------------------------------------------------------------------------
-- 3. case_timeline was readable by `public` (which includes anon) with
--    USING (true). Narrow it to authenticated; writes stay server-side.
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "case_timeline_read_policy" ON public.case_timeline;
CREATE POLICY "case_timeline_read_policy" ON public.case_timeline
FOR SELECT TO authenticated
USING (true);

-- ----------------------------------------------------------------------------
-- 4. Belt and braces: the anon role should not hold table privileges directly.
-- ----------------------------------------------------------------------------

REVOKE SELECT ON public.users          FROM anon;
REVOKE SELECT ON public.cases          FROM anon;
REVOKE SELECT ON public.dcas           FROM anon;
REVOKE SELECT ON public.organizations  FROM anon;
REVOKE SELECT ON public.case_activities FROM anon;
