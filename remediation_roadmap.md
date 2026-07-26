# Remediation Roadmap

## Current Audit Status

| Area | Status | Source File |
|---|---|---|
| Repository Inventory | Complete | repo_inventory.md |
| Security Surface Map | Complete | security_surface_map.md |
| Route Evidence Matrix | Complete | route_evidence_matrix.md |
| API/Auth Audit | Complete | api_audit.md |
| Database/RLS Audit | Draft-complete after final patch | database_rls_audit.md |

## Priority 1: Block Unauthenticated Sensitive API Access

| Route | File | Methods | Sensitive Tables | Required Fix | Test |
|---|---|---|---|---|---|
| `/api/dcas` | `/apps/web/app/api/dcas/route.ts` | GET, POST | `regions` L163), `dcas` L36), `dcas` L178), `region_dca_assignments` L231), `dcas` L237) | Add `guardAPI()` check | Assert 401 |
| `/api/dcas/[id]` | `/apps/web/app/api/dcas/[id]/route.ts` | GET, PATCH, DELETE | `cases` L155), `dcas` L169), `cases` L43), `dcas` L113), `dcas` L21) | Add `guardAPI()` check | Assert 401 |
| `/api/dcas/[id]/regions` | `/apps/web/app/api/dcas/[id]/regions/route.ts` | GET | `region_dca_assignments` L24) | Add `guardAPI()` check | Assert 401 |
| `/api/v1/cases` | `/apps/web/app/api/v1/cases/route.ts` | GET | `cases` L62) | Add `guardAPI()` check | Assert 401 |
| `/api/v1/cases/[id]` | `/apps/web/app/api/v1/cases/[id]/route.ts` | GET | `cases` L38) | Add `guardAPI()` check | Assert 401 |
| `/api/v1/governance/audit-logs` | `/apps/web/app/api/v1/governance/audit-logs/route.ts` | GET | `audit_logs` L56) | Add `guardAPI()` check | Assert 401 |
| `/api/v1/governance/security` | `/apps/web/app/api/v1/governance/security/route.ts` | GET, POST | `system_settings` L59), `system_settings` L136) | Add `guardAPI()` check | Assert 401 |
| `/api/v1/analytics` | `/apps/web/app/api/v1/analytics/route.ts` | GET | `cases` L77), `cases` L65), `cases` L84), `cases` L54), `cases` L71), `cases` L59) | Add `guardAPI()` check | Assert 401 |
| `/api/escalations` | `/apps/web/app/api/escalations/route.ts` | GET, POST | `escalations` L43), `cases` L164), `escalations` L138), `cases` L172) | Add `guardAPI()` check | Assert 401 |
| `/api/escalations/[id]` | `/apps/web/app/api/escalations/[id]/route.ts` | GET, PATCH, DELETE | `escalations` L109), `escalations` L19), `escalations` L85), `escalations` L147) | Add `guardAPI()` check | Assert 401 |
| `/api/audit-logs` | `/apps/web/app/api/audit-logs/route.ts` | GET | `audit_logs` L30) | Add `guardAPI()` check | Assert 401 |
| `/api/settings/api-keys` | `/apps/web/app/api/settings/api-keys/route.ts` | GET, POST | `api_keys` L34), `api_keys` L87), `users` L67), `api_keys` L110), `region_audit_log` L124) | Add `guardAPI()` check | Assert 401 |
| `/api/settings/profile` | `/apps/web/app/api/settings/profile/route.ts` | GET, PUT | `users` L32), `users` L51), `users` L41), `users` L109), `users` L192) | Add `guardAPI()` check | Assert 401 |
| `/api/settings/notifications` | `/apps/web/app/api/settings/notifications/route.ts` | GET, PUT | `users` L29) | Add `guardAPI()` check | Assert 401 |
| `/api/regions` | `/apps/web/app/api/regions/route.ts` | GET, POST | `region_audit_log` L145), `regions` L65), `regions` L117), `regions` L31) | Add `guardAPI()` check | Assert 401 |
| `/api/regions/[id]` | `/apps/web/app/api/regions/[id]/route.ts` | GET, DELETE, PUT | `region_audit_log` L176), `regions` L39), `cases` L148), `regions` L162), `regions` L79), `regions` L93), `region_audit_log` L118) | Add `guardAPI()` check | Assert 401 |
| `/api/regions/[id]/dcas` | `/apps/web/app/api/regions/[id]/dcas/route.ts` | GET, DELETE, POST | `region_audit_log` L141), `cases` L179), `region_dca_assignments` L194), `region_dca_assignments` L111), `region_dca_assignments` L119), `region_dca_assignments` L44), `dcas` L92), `region_audit_log` L209) | Add `guardAPI()` check | Assert 401 |
| `/api/auth/me` | `/apps/web/app/api/auth/me/route.ts` | GET | `users` L40), `users` L50), `users` L31) | Add `guardAPI()` check | Assert 401 |
| `/api/cases` | `/apps/web/app/api/cases/route.ts` | GET, POST | `cases` L35), `cases` L236), `regions` L219) | Add `guardAPI()` check | Assert 401 |
| `/api/cases/bulk` | `/apps/web/app/api/cases/bulk/route.ts` | POST | `dcas` L128), `cases` L51), `cases` L113) | Add `guardAPI()` check | Assert 401 |
| `/api/cases/[id]` | `/apps/web/app/api/cases/[id]/route.ts` | GET, PATCH, DELETE | `cases` L218), `cases` L33), `cases` L88), `cases` L275) | Add `guardAPI()` check | Assert 401 |
| `/api/dashboard` | `/apps/web/app/api/dashboard/route.ts` | GET | `dcas` L61), `cases` L45) | Add `guardAPI()` check | Assert 401 |
| `/api/integrations/status` | `/apps/web/app/api/integrations/status/route.ts` | GET, POST | `api_keys` L179), `users` L35), `users` L221), `regions` L64) | Add `guardAPI()` check | Assert 401 |
| `/api/manager/agents` | `/apps/web/app/api/manager/agents/route.ts` | POST | `users` L38), `users` L87), `audit_logs` L157), `users` L124) | Add `guardAPI()` check | Assert 401 |
| `/api/ml/insights` | `/apps/web/app/api/ml/insights/route.ts` | GET | `cases` L39) | Add `guardAPI()` check | Assert 401 |
| `/api/users` | `/apps/web/app/api/users/route.ts` | GET, POST | `region_dca_assignments` L486), `dca_user_region_access` L608), `users` L687), `users` L243), `dcas` L546), `audit_logs` L203), `regions` L658), `region_dca_assignments` L517), `regions` L634), `dcas` L593), `dcas` L452), `users` L559), `users` L794) | Add `guardAPI()` check | Assert 401 |
| `/api/users/[id]` | `/apps/web/app/api/users/[id]/route.ts` | GET, PATCH, DELETE | `users` L274), `cases` L420), `users` L86), `case_actions` L415), `cases` L418), `audit_logs` L432), `users` L454), `dcas` L438), `users` L205), `escalations` L427), `dcas` L439), `notifications` L412), `escalations` L426), `sla_logs` L423), `escalations` L428), `cases` L419), `users` L351), `audit_logs` L47) | Add `guardAPI()` check | Assert 401 |
| `/api/sla` | `/apps/web/app/api/sla/route.ts` | GET, POST | `sla_templates` L23), `sla_templates` L86) | Add `guardAPI()` check | Assert 401 |
| `/api/sla/[id]` | `/apps/web/app/api/sla/[id]/route.ts` | GET, PATCH, DELETE | `sla_logs` L46), `sla_templates` L165), `sla_logs` L58), `sla_templates` L127), `sla_templates` L27) | Add `guardAPI()` check | Assert 401 |
| `/api/sla/breach-check` | `/apps/web/app/api/sla/breach-check/route.ts` | GET | `sla_templates` L42), `cases` L113), `sla_logs` L63) | Add `guardAPI()` check | Assert 401 |
| `/api/webhooks` | `/apps/web/app/api/webhooks/route.ts` | GET, POST | `webhooks` L18), `users` L58), `webhooks` L73) | Add `guardAPI()` check | Assert 401 |
| `/api/webhooks/[id]` | `/apps/web/app/api/webhooks/[id]/route.ts` | PATCH, DELETE | `webhooks` L56), `webhooks` L27) | Add `guardAPI()` check | Assert 401 |
| `/api/notifications` | `/apps/web/app/api/notifications/route.ts` | GET | `notifications` L24) | Add `guardAPI()` check | Assert 401 |
| `/api/notifications/delete-all` | `/apps/web/app/api/notifications/delete-all/route.ts` | DELETE | `notifications` L31) | Add `guardAPI()` check | Assert 401 |
| `/api/notifications/mark-all-read` | `/apps/web/app/api/notifications/mark-all-read/route.ts` | POST | `notifications` L31) | Add `guardAPI()` check | Assert 401 |
| `/api/notifications/[id]` | `/apps/web/app/api/notifications/[id]/route.ts` | GET, PATCH, DELETE | `notifications` L19), `notifications` L78), `notifications` L116) | Add `guardAPI()` check | Assert 401 |
| `/api/analytics/dashboard` | `/apps/web/app/api/analytics/dashboard/route.ts` | GET | `dcas` L85), `cases` L22), `sla_logs` L101) | Add `guardAPI()` check | Assert 401 |
| `/api/reports/generate` | `/apps/web/app/api/reports/generate/route.ts` | GET, POST | `cases` L267), `cases` L356), `cases` L137), `sla_logs` L225), `dcas` L191) | Add `guardAPI()` check | Assert 401 |

## Priority 2: Add RBAC / Ownership / Region Checks

| Route | File | Current Auth | Missing Control | Required Role/Ownership Rule | Test |
|---|---|---|---|---|---|
| `/api/admin/cases` | `/apps/web/app/api/admin/cases/route.ts` | `getCurrentUser` (L14) | None | Add `requireRole()` / Ownership | Assert 403 for unauthorized users |
| `/api/admin/dashboard` | `/apps/web/app/api/admin/dashboard/route.ts` | `getCurrentUser` (L14) | None | Add `requireRole()` / Ownership | Assert 403 for unauthorized users |
| `/api/admin/team` | `/apps/web/app/api/admin/team/route.ts` | `getCurrentUser` (L14) | None | Add `requireRole()` / Ownership | Assert 403 for unauthorized users |
| `/api/admin/notifications` | `/apps/web/app/api/admin/notifications/route.ts` | `getCurrentUser` (L16) | None | Add `requireRole()` / Ownership | Assert 403 for unauthorized users |
| `/api/agent/calendar` | `/apps/web/app/api/agent/calendar/route.ts` | `getCurrentUser` (L15) `getCurrentUser` (L93) | None | Add `requireRole()` / Ownership | Assert 403 for unauthorized users |
| `/api/agent/cases` | `/apps/web/app/api/agent/cases/route.ts` | `getCurrentUser` (L15) | None | Add `requireRole()` / Ownership | Assert 403 for unauthorized users |
| `/api/agent/cases/[id]` | `/apps/web/app/api/agent/cases/[id]/route.ts` | `getCurrentUser` (L18) | None | Add `requireRole()` / Ownership | Assert 403 for unauthorized users |
| `/api/agent/cases/[id]/activity` | `/apps/web/app/api/agent/cases/[id]/activity/route.ts` | `getCurrentUser` (L17) | None | Add `requireRole()` / Ownership | Assert 403 for unauthorized users |
| `/api/agent/cases/[id]/payment` | `/apps/web/app/api/agent/cases/[id]/payment/route.ts` | `getCurrentUser` (L17) | None | Add `requireRole()` / Ownership | Assert 403 for unauthorized users |
| `/api/agent/cases/[id]/status` | `/apps/web/app/api/agent/cases/[id]/status/route.ts` | `getCurrentUser` (L26) | None | Add `requireRole()` / Ownership | Assert 403 for unauthorized users |
| `/api/agent/dashboard` | `/apps/web/app/api/agent/dashboard/route.ts` | `getCurrentUser` (L15) `getCurrentUser` (L11) | None | Add `requireRole()` / Ownership | Assert 403 for unauthorized users |
| `/api/agent/notifications` | `/apps/web/app/api/agent/notifications/route.ts` | `getCurrentUser` (L14) | None | Add `requireRole()` / Ownership | Assert 403 for unauthorized users |
| `/api/agent/stats` | `/apps/web/app/api/agent/stats/route.ts` | `getCurrentUser` (L34) | None | Add `requireRole()` / Ownership | Assert 403 for unauthorized users |
| `/api/manager/cases` | `/apps/web/app/api/manager/cases/route.ts` | `getCurrentUser` (L15) | None | Add `requireRole()` / Ownership | Assert 403 for unauthorized users |
| `/api/manager/cases/[id]` | `/apps/web/app/api/manager/cases/[id]/route.ts` | `getCurrentUser` (L23) | None | Add `requireRole()` / Ownership | Assert 403 for unauthorized users |
| `/api/manager/cases/[id]/reassign` | `/apps/web/app/api/manager/cases/[id]/reassign/route.ts` | `getCurrentUser` (L23) | None | Add `requireRole()` / Ownership | Assert 403 for unauthorized users |
| `/api/manager/cases/[id]/escalate` | `/apps/web/app/api/manager/cases/[id]/escalate/route.ts` | `getCurrentUser` (L35) | None | Add `requireRole()` / Ownership | Assert 403 for unauthorized users |
| `/api/manager/dashboard` | `/apps/web/app/api/manager/dashboard/route.ts` | `getCurrentUser` (L15) | None | Add `requireRole()` / Ownership | Assert 403 for unauthorized users |
| `/api/manager/team` | `/apps/web/app/api/manager/team/route.ts` | `getCurrentUser` (L19) | None | Add `requireRole()` / Ownership | Assert 403 for unauthorized users |
| `/api/manager/notifications` | `/apps/web/app/api/manager/notifications/route.ts` | `getCurrentUser` (L14) `getCurrentUser` (L70) | None | Add `requireRole()` / Ownership | Assert 403 for unauthorized users |

## Priority 3: Fix RLS Policies

| Migration | Table/Function | Policy/Function | Current Risk | Required Fix | Verification |
|---|---|---|---|---|---|
| 003_fix_rls_policies.sql | `cases` | `anon_read_cases` (Anon) | Critical - Public Access | Replace TO anon with auth checks | Verify API 401 |
| 003_fix_rls_policies.sql | `dcas` | `anon_read_dcas` (Anon) | Critical - Public Access | Replace TO anon with auth checks | Verify API 401 |
| 003_fix_rls_policies.sql | `users` | `anon_read_users` (Anon) | Critical - Public Access | Replace TO anon with auth checks | Verify API 401 |
| 003_fix_rls_policies.sql | `sla_logs` | `anon_read_sla_logs` (Anon) | Critical - Public Access | Replace TO anon with auth checks | Verify API 401 |
| 003_fix_rls_policies.sql | `case_actions` | `anon_read_case_actions` (Anon) | Critical - Public Access | Replace TO anon with auth checks | Verify API 401 |
| 003_fix_rls_policies.sql | `notifications` | `anon_read_notifications` (Anon) | Critical - Public Access | Replace TO anon with auth checks | Verify API 401 |
| 003_fix_rls_policies.sql | `escalations` | `anon_read_escalations` (Anon) | Critical - Public Access | Replace TO anon with auth checks | Verify API 401 |
| 003_fix_rls_policies.sql | `sla_templates` | `anon_read_sla_templates` (Anon) | Critical - Public Access | Replace TO anon with auth checks | Verify API 401 |
| 004_proper_rls_policies.sql | `dcas` | `dcas_select_policy` (Auth) | High - Unrestricted | Add ownership/role checks | Verify API 403 |
| 004_proper_rls_policies.sql | `notifications` | `notifications_insert_policy` (Auth) | High - Unrestricted | Add ownership/role checks | Verify API 403 |
| 004_proper_rls_policies.sql | `sla_templates` | `sla_templates_select_policy` (Auth) | High - Unrestricted | Add ownership/role checks | Verify API 403 |
| 004_proper_rls_policies.sql | `sla_logs` | `sla_logs_insert_policy` (Auth) | High - Unrestricted | Add ownership/role checks | Verify API 403 |
| 004_proper_rls_policies.sql | `escalations` | `escalations_insert_policy` (Auth) | High - Unrestricted | Add ownership/role checks | Verify API 403 |
| 005_audit_logs.sql | `audit_logs` | `audit_logs_insert_policy` (Auth) | High - Unrestricted | Add ownership/role checks | Verify API 403 |
| 007_api_keys_webhooks.sql | `api_keys` | `api_keys_admin_all` (Auth) | High - Unrestricted | Add ownership/role checks | Verify API 403 |
| 007_api_keys_webhooks.sql | `webhook_deliveries` | `webhook_deliveries_read` (Auth) | High - Unrestricted | Add ownership/role checks | Verify API 403 |
| 036_complete_activity_fix.sql | `case_activities` | `authenticated_full_access_activities` (Auth) | High - Unrestricted | Add ownership/role checks | Verify API 403 |
| 036_complete_activity_fix.sql | `scheduled_callbacks` | `authenticated_full_access_callbacks` (Auth) | High - Unrestricted | Add ownership/role checks | Verify API 403 |
| 036_complete_activity_fix.sql | `agent_notifications` | `authenticated_full_access_notifications` (Auth) | High - Unrestricted | Add ownership/role checks | Verify API 403 |
| 043_security_fixes.sql | `region_audit_log` | `region_audit_log_insert` (Auth) | High - Unrestricted | Add ownership/role checks | Verify API 403 |
| 043_security_fixes.sql | `region_dca_assignments` | `rda_read` (Auth) | High - Unrestricted | Add ownership/role checks | Verify API 403 |
| 044_fix_api_keys.sql | `api_keys` | `api_keys_admin_all` (Auth) | High - Unrestricted | Add ownership/role checks | Verify API 403 |
| 001_initial_schema.sql | `cases` | `service_role_bypass` (Service Role) | Low/Manual | Document as service-only | N/A |
| 001_initial_schema.sql | `dcas` | `service_role_bypass` (Service Role) | Low/Manual | Document as service-only | N/A |
| 001_initial_schema.sql | `users` | `service_role_bypass` (Service Role) | Low/Manual | Document as service-only | N/A |
| 001_initial_schema.sql | `case_actions` | `service_role_bypass` (Service Role) | Low/Manual | Document as service-only | N/A |
| 001_initial_schema.sql | `notifications` | `service_role_bypass` (Service Role) | Low/Manual | Document as service-only | N/A |
| 001_initial_schema.sql | `sla_logs` | `service_role_bypass` (Service Role) | Low/Manual | Document as service-only | N/A |
| 001_initial_schema.sql | `escalations` | `service_role_bypass` (Service Role) | Low/Manual | Document as service-only | N/A |
| 003_fix_rls_policies.sql | `organizations` | `anon_read_organizations` (Anon) | Critical - Public Access | Replace TO anon with auth checks | Verify API 401 |
| 003_fix_rls_policies.sql | `organizations` | `service_role_bypass_organizations` (Service Role) | Low/Manual | Document as service-only | N/A |
| 003_fix_rls_policies.sql | `sla_templates` | `service_role_bypass_sla_templates` (Service Role) | Low/Manual | Document as service-only | N/A |
| 007_api_keys_webhooks.sql | `webhooks` | `webhooks_admin_all` (Auth) | High - Unrestricted | Add ownership/role checks | Verify API 403 |
| 020_region_master.sql | `regions` | `regions_service_bypass` (Service Role) | Low/Manual | Document as service-only | N/A |
| 020_region_master.sql | `user_region_access` | `user_region_access_service_bypass` (Service Role) | Low/Manual | Document as service-only | N/A |
| 024_system_actor.sql | `service_actors` | `service_actors_service_role` (Service Role) | Low/Manual | Document as service-only | N/A |
| 031_enterprise_region_access.sql | `dca_user_region_access` | `dca_user_region_service_bypass` (Service Role) | Low/Manual | Document as service-only | N/A |
| 043_security_fixes.sql | `region_audit_log` | `region_audit_log_service_bypass` (Service Role) | Low/Manual | Document as service-only | N/A |
| 043_security_fixes.sql | `escalation_matrices` | `escalation_matrices_service_bypass` (Service Role) | Low/Manual | Document as service-only | N/A |
| 043_security_fixes.sql | `escalation_matrices` | `escalation_matrices_read` (Auth) | High - Unrestricted | Add ownership/role checks | Verify API 403 |
| 043_security_fixes.sql | `escalation_matrix_levels` | `escalation_matrix_levels_service_bypass` (Service Role) | Low/Manual | Document as service-only | N/A |
| 043_security_fixes.sql | `escalation_matrix_levels` | `escalation_matrix_levels_read` (Auth) | High - Unrestricted | Add ownership/role checks | Verify API 403 |
| 043_security_fixes.sql | `message_templates` | `message_templates_service_bypass` (Service Role) | Low/Manual | Document as service-only | N/A |
| 043_security_fixes.sql | `message_templates` | `message_templates_read` (Auth) | High - Unrestricted | Add ownership/role checks | Verify API 403 |
| 043_security_fixes.sql | `geography_region_rules` | `geography_region_rules_service_bypass` (Service Role) | Low/Manual | Document as service-only | N/A |
| 043_security_fixes.sql | `geography_region_rules` | `geography_region_rules_read` (Auth) | High - Unrestricted | Add ownership/role checks | Verify API 403 |
| 043_security_fixes.sql | `region_dca_assignments` | `rda_service_bypass` (Service Role) | Low/Manual | Document as service-only | N/A |

## Priority 4: Reduce Unsafe Admin Client / Service Role Usage

| Route | File | Admin Client Evidence | Safer Pattern |
|---|---|---|---|
| `/api/dcas` | `/apps/web/app/api/dcas/route.ts` | `createAdminClient` (L125) | Remove or add strict RBAC wrapper |
| `/api/dcas/[id]` | `/apps/web/app/api/dcas/[id]/route.ts` | `createAdminClient` (L151) `createAdminClient` (L18) `createAdminClient` (L85) | Remove or add strict RBAC wrapper |
| `/api/dcas/[id]/regions` | `/apps/web/app/api/dcas/[id]/regions/route.ts` | `createAdminClient` (L12) | Remove or add strict RBAC wrapper |
| `/api/v1/cases` | `/apps/web/app/api/v1/cases/route.ts` | `createAdminClient` (L51) | Remove or add strict RBAC wrapper |
| `/api/v1/cases/[id]` | `/apps/web/app/api/v1/cases/[id]/route.ts` | `createAdminClient` (L34) | Remove or add strict RBAC wrapper |
| `/api/v1/governance/audit-logs` | `/apps/web/app/api/v1/governance/audit-logs/route.ts` | `createAdminClient` (L41) | Remove or add strict RBAC wrapper |
| `/api/v1/governance/security` | `/apps/web/app/api/v1/governance/security/route.ts` | `createAdminClient` (L120) `createAdminClient` (L54) | Remove or add strict RBAC wrapper |
| `/api/v1/analytics` | `/apps/web/app/api/v1/analytics/route.ts` | `createAdminClient` (L49) | Remove or add strict RBAC wrapper |
| `/api/settings/profile` | `/apps/web/app/api/settings/profile/route.ts` | `createAdminClient` (L26) | Remove or add strict RBAC wrapper |
| `/api/settings/notifications` | `/apps/web/app/api/settings/notifications/route.ts` | `createAdminClient` (L24) | Remove or add strict RBAC wrapper |
| `/api/auth/me` | `/apps/web/app/api/auth/me/route.ts` | `createAdminClient` (L28) | Remove or add strict RBAC wrapper |
| `/api/cases/bulk` | `/apps/web/app/api/cases/bulk/route.ts` | `createAdminClient` (L108) | Remove or add strict RBAC wrapper |
| `/api/integrations/status` | `/apps/web/app/api/integrations/status/route.ts` | `createAdminClient` (L58) `createAdminClient` (L32) | Remove or add strict RBAC wrapper |
| `/api/manager/agents` | `/apps/web/app/api/manager/agents/route.ts` | `createAdminClient` (L27) | Remove or add strict RBAC wrapper |
| `/api/users` | `/apps/web/app/api/users/route.ts` | `service_role_key` (L17) | Remove or add strict RBAC wrapper |
| `/api/users/[id]` | `/apps/web/app/api/users/[id]/route.ts` | `service_role_key` (L13) | Remove or add strict RBAC wrapper |
| `/api/sla` | `/apps/web/app/api/sla/route.ts` | `createAdminClient` (L15) `createAdminClient` (L62) | Remove or add strict RBAC wrapper |
| `/api/sla/[id]` | `/apps/web/app/api/sla/[id]/route.ts` | `createAdminClient` (L161) `createAdminClient` (L100) `createAdminClient` (L20) | Remove or add strict RBAC wrapper |
| `/api/notifications/delete-all` | `/apps/web/app/api/notifications/delete-all/route.ts` | `service_role_key` (L14) | Remove or add strict RBAC wrapper |
| `/api/notifications/mark-all-read` | `/apps/web/app/api/notifications/mark-all-read/route.ts` | `service_role_key` (L14) | Remove or add strict RBAC wrapper |
| `/api/reports/generate` | `/apps/web/app/api/reports/generate/route.ts` | `createAdminClient` (L34) `createAdminClient` (L345) | Remove or add strict RBAC wrapper |
| `/api/health` | `/apps/web/app/api/health/route.ts` | `service_role_key` (L177) `createAdminClient` (L185) | Remove or add strict RBAC wrapper |
| `/api/admin/cases` | `/apps/web/app/api/admin/cases/route.ts` | `createAdminClient` (L25) | Remove or add strict RBAC wrapper |
| `/api/admin/dashboard` | `/apps/web/app/api/admin/dashboard/route.ts` | `createAdminClient` (L26) | Remove or add strict RBAC wrapper |
| `/api/admin/team` | `/apps/web/app/api/admin/team/route.ts` | `createAdminClient` (L25) | Remove or add strict RBAC wrapper |
| `/api/admin/notifications` | `/apps/web/app/api/admin/notifications/route.ts` | `createAdminClient` (L27) | Remove or add strict RBAC wrapper |
| `/api/agent/calendar` | `/apps/web/app/api/agent/calendar/route.ts` | `createAdminClient` (L28) `createAdminClient` (L110) | Remove or add strict RBAC wrapper |
| `/api/agent/cases` | `/apps/web/app/api/agent/cases/route.ts` | `createAdminClient` (L26) | Remove or add strict RBAC wrapper |
| `/api/agent/cases/[id]` | `/apps/web/app/api/agent/cases/[id]/route.ts` | `createAdminClient` (L29) | Remove or add strict RBAC wrapper |
| `/api/agent/cases/[id]/activity` | `/apps/web/app/api/agent/cases/[id]/activity/route.ts` | `createAdminClient` (L36) | Remove or add strict RBAC wrapper |
| `/api/agent/cases/[id]/payment` | `/apps/web/app/api/agent/cases/[id]/payment/route.ts` | `createAdminClient` (L35) | Remove or add strict RBAC wrapper |
| `/api/agent/cases/[id]/status` | `/apps/web/app/api/agent/cases/[id]/status/route.ts` | `createAdminClient` (L44) | Remove or add strict RBAC wrapper |
| `/api/agent/dashboard` | `/apps/web/app/api/agent/dashboard/route.ts` | `createAdminClient` (L26) | Remove or add strict RBAC wrapper |
| `/api/agent/notifications` | `/apps/web/app/api/agent/notifications/route.ts` | `createAdminClient` (L27) | Remove or add strict RBAC wrapper |
| `/api/agent/stats` | `/apps/web/app/api/agent/stats/route.ts` | `createAdminClient` (L44) | Remove or add strict RBAC wrapper |
| `/api/manager/cases` | `/apps/web/app/api/manager/cases/route.ts` | `createAdminClient` (L31) | Remove or add strict RBAC wrapper |
| `/api/manager/cases/[id]` | `/apps/web/app/api/manager/cases/[id]/route.ts` | `createAdminClient` (L33) | Remove or add strict RBAC wrapper |
| `/api/manager/cases/[id]/reassign` | `/apps/web/app/api/manager/cases/[id]/reassign/route.ts` | `createAdminClient` (L41) | Remove or add strict RBAC wrapper |
| `/api/manager/cases/[id]/escalate` | `/apps/web/app/api/manager/cases/[id]/escalate/route.ts` | `createAdminClient` (L53) | Remove or add strict RBAC wrapper |
| `/api/manager/dashboard` | `/apps/web/app/api/manager/dashboard/route.ts` | `createAdminClient` (L26) | Remove or add strict RBAC wrapper |
| `/api/manager/team` | `/apps/web/app/api/manager/team/route.ts` | `createAdminClient` (L29) | Remove or add strict RBAC wrapper |
| `/api/manager/notifications` | `/apps/web/app/api/manager/notifications/route.ts` | `createAdminClient` (L27) `createAdminClient` (L83) | Remove or add strict RBAC wrapper |
| `/api/auth/check-active` | `/apps/web/app/api/auth/check-active/route.ts` | `createAdminClient` (L22) | Remove or add strict RBAC wrapper |
| `/api/account-deletion` | `/apps/web/app/api/account-deletion/route.ts` | `createAdminClient` (L140) `createAdminClient` (L54) | Remove or add strict RBAC wrapper |
| `/api/account-deletion/[id]` | `/apps/web/app/api/account-deletion/[id]/route.ts` | `createAdminClient` (L52) | Remove or add strict RBAC wrapper |

## Priority 5: Validation, Rate Limiting, and Safe Errors

- `/api/health` (`/apps/web/app/api/health/route.ts`)
- `/api/admin/cases` (`/apps/web/app/api/admin/cases/route.ts`)
- `/api/admin/dashboard` (`/apps/web/app/api/admin/dashboard/route.ts`)
- `/api/admin/team` (`/apps/web/app/api/admin/team/route.ts`)
- `/api/admin/notifications` (`/apps/web/app/api/admin/notifications/route.ts`)
- `/api/agent/calendar` (`/apps/web/app/api/agent/calendar/route.ts`)
- `/api/agent/cases` (`/apps/web/app/api/agent/cases/route.ts`)
- `/api/agent/cases/[id]` (`/apps/web/app/api/agent/cases/[id]/route.ts`)
- `/api/agent/cases/[id]/activity` (`/apps/web/app/api/agent/cases/[id]/activity/route.ts`)
- `/api/agent/cases/[id]/payment` (`/apps/web/app/api/agent/cases/[id]/payment/route.ts`)
- `/api/agent/cases/[id]/status` (`/apps/web/app/api/agent/cases/[id]/status/route.ts`)
- `/api/agent/dashboard` (`/apps/web/app/api/agent/dashboard/route.ts`)
- `/api/agent/notifications` (`/apps/web/app/api/agent/notifications/route.ts`)
- `/api/agent/stats` (`/apps/web/app/api/agent/stats/route.ts`)
- `/api/manager/cases` (`/apps/web/app/api/manager/cases/route.ts`)
- `/api/manager/cases/[id]` (`/apps/web/app/api/manager/cases/[id]/route.ts`)
- `/api/manager/cases/[id]/reassign` (`/apps/web/app/api/manager/cases/[id]/reassign/route.ts`)
- `/api/manager/cases/[id]/escalate` (`/apps/web/app/api/manager/cases/[id]/escalate/route.ts`)
- `/api/manager/dashboard` (`/apps/web/app/api/manager/dashboard/route.ts`)
- `/api/manager/team` (`/apps/web/app/api/manager/team/route.ts`)
- `/api/manager/notifications` (`/apps/web/app/api/manager/notifications/route.ts`)
- `/api/auth/check-active` (`/apps/web/app/api/auth/check-active/route.ts`)
- `/api/auth/forgot-password` (`/apps/web/app/api/auth/forgot-password/route.ts`)
- `/api/health/email` (`/apps/web/app/api/health/email/route.ts`)
- `/api/ml/health` (`/apps/web/app/api/ml/health/route.ts`)

## Fix Execution Order

### Batch 1
* Add shared API auth guard/helper.
* Add tests for unauthenticated requests returning 401.

### Batch 2
* Patch Critical unauthenticated API routes.

### Batch 3
* Patch High RBAC/ownership gaps.

### Batch 4
* Patch RLS policies.

### Batch 5
* Patch validation/rate limiting.

### Batch 6
* Run security regression tests.


## Do Not Do Yet

* Do not start frontend audit.
* Do not start UI/UX audit.
* Do not start ML audit.
* Do not start deployment audit.
* Do not refactor unrelated code.
* Do not patch code until this roadmap is accepted.
