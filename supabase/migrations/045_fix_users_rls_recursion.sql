-- ============================================================================
-- 045: Fix infinite recursion in the users RLS policy
-- ============================================================================
--
-- PROBLEM
-- Migration 037 created policy "manager_read_team_agents" ON users, and its
-- USING clause selects FROM users. Evaluating the policy therefore re-triggers
-- the policy, and Postgres aborts with:
--
--     infinite recursion detected in policy for relation "users"
--
-- Because almost every read joins or filters on users, this took down real
-- features for privileged roles. Observed failing endpoints:
--     GET /api/audit-logs          500
--     GET /api/escalations         500
--     GET /api/escalations/[id]    500
--     GET /api/analytics/dashboard 500
--
-- FIX
-- Read the caller's own row through SECURITY DEFINER helpers, which run with the
-- function owner's rights and so are not themselves subject to the users policy.
-- The policy then compares plain values instead of re-querying the table.
--
-- This preserves the original intent exactly:
--   * a DCA_MANAGER may read DCA_AGENT rows inside their own DCA
--   * anyone may read their own row
--   * non-DCA roles keep their previous read access
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER: bypass RLS for the caller's own row only)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.auth_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role::text FROM public.users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.auth_user_dca_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT dca_id FROM public.users WHERE id = auth.uid();
$$;

COMMENT ON FUNCTION public.auth_user_role() IS
    'Caller''s role, read with definer rights so RLS policies on users can use it without recursing.';
COMMENT ON FUNCTION public.auth_user_dca_id() IS
    'Caller''s dca_id, read with definer rights so RLS policies on users can use it without recursing.';

-- Only the authenticated role needs these.
REVOKE ALL ON FUNCTION public.auth_user_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.auth_user_dca_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.auth_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.auth_user_dca_id() TO authenticated;

-- ----------------------------------------------------------------------------
-- Replace the recursive policy
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "manager_read_team_agents" ON public.users;

CREATE POLICY "manager_read_team_agents" ON public.users
FOR SELECT TO authenticated
USING (
    -- Self access
    id = auth.uid()
    OR
    -- A DCA_MANAGER may read DCA_AGENT rows within their own DCA
    (
        public.auth_user_role() = 'DCA_MANAGER'
        AND users.role = 'DCA_AGENT'
        AND users.dca_id = public.auth_user_dca_id()
    )
    OR
    -- Non-DCA roles retain their previous read access
    public.auth_user_role() NOT IN ('DCA_AGENT', 'DCA_MANAGER')
);

COMMENT ON POLICY "manager_read_team_agents" ON public.users IS
    'Replaces the self-referencing version from migration 037 that caused infinite recursion.';
