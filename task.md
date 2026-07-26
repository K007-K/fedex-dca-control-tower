# Remediation Tasks

## Batch 1: Auth Guards
- [ ] Add shared API auth guard/helper
- [ ] Add tests for unauthenticated requests returning 401

## Batch 2: Critical Unauthenticated API Routes

- [ ] Block unauth access: `/api/dcas`
- [ ] Block unauth access: `/api/dcas/[id]`
- [ ] Block unauth access: `/api/dcas/[id]/regions`
- [ ] Block unauth access: `/api/v1/cases`
- [ ] Block unauth access: `/api/v1/cases/[id]`
- [ ] Block unauth access: `/api/v1/governance/audit-logs`
- [ ] Block unauth access: `/api/v1/governance/security`
- [ ] Block unauth access: `/api/v1/analytics`
- [ ] Block unauth access: `/api/escalations`
- [ ] Block unauth access: `/api/escalations/[id]`
- [ ] Block unauth access: `/api/audit-logs`
- [ ] Block unauth access: `/api/settings/api-keys`
- [ ] Block unauth access: `/api/settings/profile`
- [ ] Block unauth access: `/api/settings/notifications`
- [ ] Block unauth access: `/api/regions`
- [ ] Block unauth access: `/api/regions/[id]`
- [ ] Block unauth access: `/api/regions/[id]/dcas`
- [ ] Block unauth access: `/api/auth/me`
- [ ] Block unauth access: `/api/cases`
- [ ] Block unauth access: `/api/cases/bulk`
- [ ] Block unauth access: `/api/cases/[id]`
- [ ] Block unauth access: `/api/dashboard`
- [ ] Block unauth access: `/api/integrations/status`
- [ ] Block unauth access: `/api/manager/agents`
- [ ] Block unauth access: `/api/ml/insights`
- [ ] Block unauth access: `/api/users`
- [ ] Block unauth access: `/api/users/[id]`
- [ ] Block unauth access: `/api/sla`
- [ ] Block unauth access: `/api/sla/[id]`
- [ ] Block unauth access: `/api/sla/breach-check`
- [ ] Block unauth access: `/api/webhooks`
- [ ] Block unauth access: `/api/webhooks/[id]`
- [ ] Block unauth access: `/api/notifications`
- [ ] Block unauth access: `/api/notifications/delete-all`
- [ ] Block unauth access: `/api/notifications/mark-all-read`
- [ ] Block unauth access: `/api/notifications/[id]`
- [ ] Block unauth access: `/api/analytics/dashboard`
- [ ] Block unauth access: `/api/reports/generate`

## Batch 3: High RBAC/Ownership Gaps

- [ ] Enforce RBAC: `/api/admin/cases`
- [ ] Enforce RBAC: `/api/admin/dashboard`
- [ ] Enforce RBAC: `/api/admin/team`
- [ ] Enforce RBAC: `/api/admin/notifications`
- [ ] Enforce RBAC: `/api/agent/calendar`
- [ ] Enforce RBAC: `/api/agent/cases`
- [ ] Enforce RBAC: `/api/agent/cases/[id]`
- [ ] Enforce RBAC: `/api/agent/cases/[id]/activity`
- [ ] Enforce RBAC: `/api/agent/cases/[id]/payment`
- [ ] Enforce RBAC: `/api/agent/cases/[id]/status`
- [ ] Enforce RBAC: `/api/agent/dashboard`
- [ ] Enforce RBAC: `/api/agent/notifications`
- [ ] Enforce RBAC: `/api/agent/stats`
- [ ] Enforce RBAC: `/api/manager/cases`
- [ ] Enforce RBAC: `/api/manager/cases/[id]`
- [ ] Enforce RBAC: `/api/manager/cases/[id]/reassign`
- [ ] Enforce RBAC: `/api/manager/cases/[id]/escalate`
- [ ] Enforce RBAC: `/api/manager/dashboard`
- [ ] Enforce RBAC: `/api/manager/team`
- [ ] Enforce RBAC: `/api/manager/notifications`

## Batch 4: RLS Policies

- [ ] Fix RLS in 003_fix_rls_policies.sql: `cases`
- [ ] Fix RLS in 003_fix_rls_policies.sql: `dcas`
- [ ] Fix RLS in 003_fix_rls_policies.sql: `users`
- [ ] Fix RLS in 003_fix_rls_policies.sql: `sla_logs`
- [ ] Fix RLS in 003_fix_rls_policies.sql: `case_actions`
- [ ] Fix RLS in 003_fix_rls_policies.sql: `notifications`
- [ ] Fix RLS in 003_fix_rls_policies.sql: `escalations`
- [ ] Fix RLS in 003_fix_rls_policies.sql: `sla_templates`
- [ ] Fix RLS in 004_proper_rls_policies.sql: `dcas`
- [ ] Fix RLS in 004_proper_rls_policies.sql: `notifications`
- [ ] Fix RLS in 004_proper_rls_policies.sql: `sla_templates`
- [ ] Fix RLS in 004_proper_rls_policies.sql: `sla_logs`
- [ ] Fix RLS in 004_proper_rls_policies.sql: `escalations`
- [ ] Fix RLS in 005_audit_logs.sql: `audit_logs`
- [ ] Fix RLS in 007_api_keys_webhooks.sql: `api_keys`
- [ ] Fix RLS in 007_api_keys_webhooks.sql: `webhook_deliveries`
- [ ] Fix RLS in 036_complete_activity_fix.sql: `case_activities`
- [ ] Fix RLS in 036_complete_activity_fix.sql: `scheduled_callbacks`
- [ ] Fix RLS in 036_complete_activity_fix.sql: `agent_notifications`
- [ ] Fix RLS in 043_security_fixes.sql: `region_audit_log`
- [ ] Fix RLS in 043_security_fixes.sql: `region_dca_assignments`
- [ ] Fix RLS in 044_fix_api_keys.sql: `api_keys`
- [ ] Fix RLS in 001_initial_schema.sql: `cases`
- [ ] Fix RLS in 001_initial_schema.sql: `dcas`
- [ ] Fix RLS in 001_initial_schema.sql: `users`
- [ ] Fix RLS in 001_initial_schema.sql: `case_actions`
- [ ] Fix RLS in 001_initial_schema.sql: `notifications`
- [ ] Fix RLS in 001_initial_schema.sql: `sla_logs`
- [ ] Fix RLS in 001_initial_schema.sql: `escalations`
- [ ] Fix RLS in 003_fix_rls_policies.sql: `organizations`
- [ ] Fix RLS in 003_fix_rls_policies.sql: `organizations`
- [ ] Fix RLS in 003_fix_rls_policies.sql: `sla_templates`
- [ ] Fix RLS in 007_api_keys_webhooks.sql: `webhooks`
- [ ] Fix RLS in 020_region_master.sql: `regions`
- [ ] Fix RLS in 020_region_master.sql: `user_region_access`
- [ ] Fix RLS in 024_system_actor.sql: `service_actors`
- [ ] Fix RLS in 031_enterprise_region_access.sql: `dca_user_region_access`
- [ ] Fix RLS in 043_security_fixes.sql: `region_audit_log`
- [ ] Fix RLS in 043_security_fixes.sql: `escalation_matrices`
- [ ] Fix RLS in 043_security_fixes.sql: `escalation_matrices`
- [ ] Fix RLS in 043_security_fixes.sql: `escalation_matrix_levels`
- [ ] Fix RLS in 043_security_fixes.sql: `escalation_matrix_levels`
- [ ] Fix RLS in 043_security_fixes.sql: `message_templates`
- [ ] Fix RLS in 043_security_fixes.sql: `message_templates`
- [ ] Fix RLS in 043_security_fixes.sql: `geography_region_rules`
- [ ] Fix RLS in 043_security_fixes.sql: `geography_region_rules`
- [ ] Fix RLS in 043_security_fixes.sql: `region_dca_assignments`

## Batch 5: Validation & Rate Limiting

- [ ] Add validation: `/api/health`
- [ ] Add validation: `/api/admin/cases`
- [ ] Add validation: `/api/admin/dashboard`
- [ ] Add validation: `/api/admin/team`
- [ ] Add validation: `/api/admin/notifications`
- [ ] Add validation: `/api/agent/calendar`
- [ ] Add validation: `/api/agent/cases`
- [ ] Add validation: `/api/agent/cases/[id]`
- [ ] Add validation: `/api/agent/cases/[id]/activity`
- [ ] Add validation: `/api/agent/cases/[id]/payment`
- [ ] Add validation: `/api/agent/cases/[id]/status`
- [ ] Add validation: `/api/agent/dashboard`
- [ ] Add validation: `/api/agent/notifications`
- [ ] Add validation: `/api/agent/stats`
- [ ] Add validation: `/api/manager/cases`
- [ ] Add validation: `/api/manager/cases/[id]`
- [ ] Add validation: `/api/manager/cases/[id]/reassign`
- [ ] Add validation: `/api/manager/cases/[id]/escalate`
- [ ] Add validation: `/api/manager/dashboard`
- [ ] Add validation: `/api/manager/team`
- [ ] Add validation: `/api/manager/notifications`
- [ ] Add validation: `/api/auth/check-active`
- [ ] Add validation: `/api/auth/forgot-password`
- [ ] Add validation: `/api/health/email`
- [ ] Add validation: `/api/ml/health`

## Batch 6: Verification
- [ ] Run security regression tests