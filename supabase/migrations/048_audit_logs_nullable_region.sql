-- ============================================================================
-- 048: Allow region-less audit events  [GOVERNANCE]
-- ============================================================================
--
-- PROBLEM
-- audit_logs.region_id was NOT NULL with no default, so any event without a
-- region context was rejected outright:
--
--     23502  null value in column "region_id" violates not-null constraint
--
-- That covers a large and important class of governance events — permission
-- denials, failed authentication, SYSTEM actions, impersonation attempts, and
-- any action by a user who has no region assigned.
--
-- Combined with the column-name bug fixed in lib/audit/index.ts (it wrote
-- `changes`/`user_ip` instead of `details`/`ip_address`) and the fact that
-- writeAuditLog() swallows failures and returns null, the audit trail recorded
-- NOTHING. audit_logs held 0 rows despite extensive privileged activity.
--
-- FIX
-- Make region_id nullable. An audit record must never be lost because the event
-- had no region — the whole point is that it is written unconditionally.
-- ============================================================================

ALTER TABLE public.audit_logs
    ALTER COLUMN region_id DROP NOT NULL;

COMMENT ON COLUMN public.audit_logs.region_id IS
    'Region the audited action related to, when applicable. Nullable: security and SYSTEM events are not region-scoped and must still be recorded.';
