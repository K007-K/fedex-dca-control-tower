-- ============================================================================
-- 047: Add sla_templates.created_by
-- ============================================================================
--
-- PROBLEM
-- POST /api/sla inserts `created_by: user.id`, but sla_templates has no such
-- column, so every SLA template creation failed:
--
--     500 {"error":"Failed to create SLA template",
--          "details":"Could not find the 'created_by' column of 'sla_templates'"}
--
-- SLA templates could therefore never be created through the application, which
-- is why the table is empty and every SLA-dependent feature has no data to work
-- with.
--
-- FIX
-- Add the column rather than dropping the field from the insert: this platform
-- records an actor for every governed object, and an SLA template is a governance
-- artefact. Nullable so the existing (empty) table and any SYSTEM-created rows
-- remain valid.
-- ============================================================================

ALTER TABLE public.sla_templates
    ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.sla_templates.created_by IS
    'User who created this template. Added in 047 — POST /api/sla always wrote this field but the column did not exist.';

CREATE INDEX IF NOT EXISTS idx_sla_templates_created_by
    ON public.sla_templates(created_by);
