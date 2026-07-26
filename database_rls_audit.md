# Phase 4: Database & RLS Audit

> [!NOTE]
> This audit report is generated strictly from the line-by-line evidence in the SQL migration files. All vulnerabilities are based exclusively on proven SQL patterns.

## Summary Table

| Severity | Count | Main Pattern |
|---|---:|---|
| Critical | 0 | Confirmed anon access to sensitive tables or Prod Hardcoded Secrets |
| High | 23 | Authenticated broad access / unsafe SECURITY DEFINER / missing RLS / seed secrets |
| Medium | 0 | Broad access on reference tables or incomplete policy scoping |
| Needs Manual Review | 30 | Unclear table sensitivity or policy target |


## Fix Order

**Priority 1:**
* Ensure hardcoded static seed credentials NEVER run in production.
* Confirm and fix any broad RLS policies on sensitive tables: `users`, `cases`, `dcas`, `api_keys`, `audit_logs`, `region_dca_assignments`, `user_region_access`, `dca_user_region_access`


**Priority 2:**
* Fix unsafe `SECURITY DEFINER` functions missing `SET search_path` or using unsafe privileges


**Priority 3:**
* Enable RLS on newly created sensitive tables where no later migration enables it


**Priority 4:**
* Review non-sensitive/reference tables and decide whether public read is intentional

---

## Confirmed Dangerous Anon Policies

### Migration: `003_fix_rls_policies.sql` (Anon Exposure)
- **Severity: High**
- **Impact:** `anon` users have broad `SELECT` access to sensitive workflow/business table `cases`. Unauthenticated users can access/mutate records.
- **Fix:** Replace `TO anon USING (true)` with authenticated/role/ownership/region-scoped policy or remove public access.

#### Evidence
Policy `anon_read_cases` on `cases` (L13)
  - Command: SELECT
  - Target: anon
  - USING: true
  - WITH CHECK: None

---

### Migration: `003_fix_rls_policies.sql` (Anon Exposure)
- **Severity: High**
- **Impact:** `anon` users have broad `SELECT` access to sensitive workflow/business table `dcas`. Unauthenticated users can access/mutate records.
- **Fix:** Replace `TO anon USING (true)` with authenticated/role/ownership/region-scoped policy or remove public access.

#### Evidence
Policy `anon_read_dcas` on `dcas` (L19)
  - Command: SELECT
  - Target: anon
  - USING: true
  - WITH CHECK: None

---

### Migration: `003_fix_rls_policies.sql` (Anon Exposure)
- **Severity: High**
- **Impact:** `anon` users have broad `SELECT` access to sensitive workflow/business table `users`. Unauthenticated users can access/mutate records.
- **Fix:** Replace `TO anon USING (true)` with authenticated/role/ownership/region-scoped policy or remove public access.

#### Evidence
Policy `anon_read_users` on `users` (L25)
  - Command: SELECT
  - Target: anon
  - USING: true
  - WITH CHECK: None

---

### Migration: `003_fix_rls_policies.sql` (Anon Exposure)
- **Severity: High**
- **Impact:** `anon` users have broad `SELECT` access to sensitive workflow/business table `sla_logs`. Unauthenticated users can access/mutate records.
- **Fix:** Replace `TO anon USING (true)` with authenticated/role/ownership/region-scoped policy or remove public access.

#### Evidence
Policy `anon_read_sla_logs` on `sla_logs` (L45)
  - Command: SELECT
  - Target: anon
  - USING: true
  - WITH CHECK: None

---

### Migration: `003_fix_rls_policies.sql` (Anon Exposure)
- **Severity: High**
- **Impact:** `anon` users have broad `SELECT` access to sensitive workflow/business table `case_actions`. Unauthenticated users can access/mutate records.
- **Fix:** Replace `TO anon USING (true)` with authenticated/role/ownership/region-scoped policy or remove public access.

#### Evidence
Policy `anon_read_case_actions` on `case_actions` (L51)
  - Command: SELECT
  - Target: anon
  - USING: true
  - WITH CHECK: None

---

### Migration: `003_fix_rls_policies.sql` (Anon Exposure)
- **Severity: High**
- **Impact:** `anon` users have broad `SELECT` access to sensitive workflow/business table `notifications`. Unauthenticated users can access/mutate records.
- **Fix:** Replace `TO anon USING (true)` with authenticated/role/ownership/region-scoped policy or remove public access.

#### Evidence
Policy `anon_read_notifications` on `notifications` (L57)
  - Command: SELECT
  - Target: anon
  - USING: true
  - WITH CHECK: None

---

### Migration: `003_fix_rls_policies.sql` (Anon Exposure)
- **Severity: High**
- **Impact:** `anon` users have broad `SELECT` access to sensitive workflow/business table `escalations`. Unauthenticated users can access/mutate records.
- **Fix:** Replace `TO anon USING (true)` with authenticated/role/ownership/region-scoped policy or remove public access.

#### Evidence
Policy `anon_read_escalations` on `escalations` (L63)
  - Command: SELECT
  - Target: anon
  - USING: true
  - WITH CHECK: None

---

### Migration: `003_fix_rls_policies.sql` (Anon Exposure)
- **Severity: High**
- **Impact:** `anon` users have broad `SELECT` access to sensitive workflow/business table `sla_templates`. Unauthenticated users can access/mutate records.
- **Fix:** Replace `TO anon USING (true)` with authenticated/role/ownership/region-scoped policy or remove public access.

#### Evidence
Policy `anon_read_sla_templates` on `sla_templates` (L71)
  - Command: SELECT
  - Target: anon
  - USING: true
  - WITH CHECK: None

---

## 1. Critical Severity Vulnerabilities

No critical database vulnerabilities found.

## 2. High Severity Vulnerabilities

### Hardcoded Seed/Demo Credentials Found
- **Severity: High**
- **Impact:** Seed/demo credentials found in migration file. These must never be executed in a production environment as they grant known backdoor access.
- **Fix:** Ensure seed files are strictly omitted from production CI/CD pipelines.

#### Evidence
- `041_seed_governed_users.sql`: L34 (Seed plain password comment), L36 (Seed password hash), L40 (Seed password hash), L41 (Seed plain password comment), L489 (Seed plain password comment)
---

### Migration: `004_proper_rls_policies.sql` (Broad Authenticated Access)
- **Severity: High**
- **Impact:** Any authenticated user may access or mutate records in `dcas` without ownership/role/tenant/region restriction.
- **Fix:** Replace `USING (true)` with ownership/role/tenant/region checks.

#### Evidence
Policy `dcas_select_policy` on `dcas` (L99)
  - Command: SELECT
  - Target: authenticated
  - USING: true
  - WITH CHECK: None

---

### Migration: `004_proper_rls_policies.sql` (Broad Authenticated Access)
- **Severity: High**
- **Impact:** Any authenticated user may access or mutate records in `notifications` without ownership/role/tenant/region restriction.
- **Fix:** Replace `USING (true)` with ownership/role/tenant/region checks.

#### Evidence
Policy `notifications_insert_policy` on `notifications` (L188)
  - Command: INSERT
  - Target: authenticated
  - USING: None
  - WITH CHECK: true

---

### Migration: `004_proper_rls_policies.sql` (Broad Authenticated Access)
- **Severity: High**
- **Impact:** Any authenticated user may access or mutate records in `sla_templates` without ownership/role/tenant/region restriction.
- **Fix:** Replace `USING (true)` with ownership/role/tenant/region checks.

#### Evidence
Policy `sla_templates_select_policy` on `sla_templates` (L211)
  - Command: SELECT
  - Target: authenticated
  - USING: true
  - WITH CHECK: None

---

### Migration: `004_proper_rls_policies.sql` (Broad Authenticated Access)
- **Severity: High**
- **Impact:** Any authenticated user may access or mutate records in `sla_logs` without ownership/role/tenant/region restriction.
- **Fix:** Replace `USING (true)` with ownership/role/tenant/region checks.

#### Evidence
Policy `sla_logs_insert_policy` on `sla_logs` (L251)
  - Command: INSERT
  - Target: authenticated
  - USING: None
  - WITH CHECK: true

---

### Migration: `004_proper_rls_policies.sql` (Broad Authenticated Access)
- **Severity: High**
- **Impact:** Any authenticated user may access or mutate records in `escalations` without ownership/role/tenant/region restriction.
- **Fix:** Replace `USING (true)` with ownership/role/tenant/region checks.

#### Evidence
Policy `escalations_insert_policy` on `escalations` (L314)
  - Command: INSERT
  - Target: authenticated
  - USING: None
  - WITH CHECK: true

---

### Migration: `005_audit_logs.sql` (Broad Authenticated Access)
- **Severity: High**
- **Impact:** Any authenticated user may access or mutate records in `audit_logs` without ownership/role/tenant/region restriction.
- **Fix:** Replace `USING (true)` with ownership/role/tenant/region checks.

#### Evidence
Policy `audit_logs_insert_policy` on `audit_logs` (L53)
  - Command: INSERT
  - Target: authenticated
  - USING: None
  - WITH CHECK: true

---

### Migration: `007_api_keys_webhooks.sql` (Broad Authenticated Access)
- **Severity: High**
- **Impact:** Any authenticated user may access or mutate records in `api_keys` without ownership/role/tenant/region restriction.
- **Fix:** Replace `USING (true)` with ownership/role/tenant/region checks.

#### Evidence
Policy `api_keys_admin_all` on `api_keys` (L56)
  - Command: ALL
  - Target: authenticated
  - USING: TRUE
  - WITH CHECK: None

---

### Migration: `007_api_keys_webhooks.sql` (Broad Authenticated Access)
- **Severity: High**
- **Impact:** Any authenticated user may access or mutate records in `webhook_deliveries` without ownership/role/tenant/region restriction.
- **Fix:** Replace `USING (true)` with ownership/role/tenant/region checks.

#### Evidence
Policy `webhook_deliveries_read` on `webhook_deliveries` (L66)
  - Command: SELECT
  - Target: authenticated
  - USING: TRUE
  - WITH CHECK: None

---

### Migration: `036_complete_activity_fix.sql` (Broad Authenticated Access)
- **Severity: High**
- **Impact:** Any authenticated user may access or mutate records in `case_activities` without ownership/role/tenant/region restriction.
- **Fix:** Replace `USING (true)` with ownership/role/tenant/region checks.

#### Evidence
Policy `authenticated_full_access_activities` on `case_activities` (L106)
  - Command: ALL
  - Target: authenticated
  - USING: true
  - WITH CHECK: true

---

### Migration: `036_complete_activity_fix.sql` (Broad Authenticated Access)
- **Severity: High**
- **Impact:** Any authenticated user may access or mutate records in `scheduled_callbacks` without ownership/role/tenant/region restriction.
- **Fix:** Replace `USING (true)` with ownership/role/tenant/region checks.

#### Evidence
Policy `authenticated_full_access_callbacks` on `scheduled_callbacks` (L113)
  - Command: ALL
  - Target: authenticated
  - USING: true
  - WITH CHECK: true

---

### Migration: `036_complete_activity_fix.sql` (Broad Authenticated Access)
- **Severity: High**
- **Impact:** Any authenticated user may access or mutate records in `agent_notifications` without ownership/role/tenant/region restriction.
- **Fix:** Replace `USING (true)` with ownership/role/tenant/region checks.

#### Evidence
Policy `authenticated_full_access_notifications` on `agent_notifications` (L120)
  - Command: ALL
  - Target: authenticated
  - USING: true
  - WITH CHECK: true

---

### Migration: `043_security_fixes.sql` (Broad Authenticated Access)
- **Severity: High**
- **Impact:** Any authenticated user may access or mutate records in `region_audit_log` without ownership/role/tenant/region restriction.
- **Fix:** Replace `USING (true)` with ownership/role/tenant/region checks.

#### Evidence
Policy `region_audit_log_insert` on `region_audit_log` (L79)
  - Command: INSERT
  - Target: authenticated
  - USING: None
  - WITH CHECK: true

---

### Migration: `043_security_fixes.sql` (Broad Authenticated Access)
- **Severity: High**
- **Impact:** Any authenticated user may access or mutate records in `region_dca_assignments` without ownership/role/tenant/region restriction.
- **Fix:** Replace `USING (true)` with ownership/role/tenant/region checks.

#### Evidence
Policy `rda_read` on `region_dca_assignments` (L311)
  - Command: SELECT
  - Target: authenticated
  - USING: true
  - WITH CHECK: None

---

### Migration: `044_fix_api_keys.sql` (Broad Authenticated Access)
- **Severity: High**
- **Impact:** Any authenticated user may access or mutate records in `api_keys` without ownership/role/tenant/region restriction.
- **Fix:** Replace `USING (true)` with ownership/role/tenant/region checks.

#### Evidence
Policy `api_keys_admin_all` on `api_keys` (L31)
  - Command: ALL
  - Target: authenticated
  - USING: true
  - WITH CHECK: true

---

## 3. Medium Severity Findings

No medium severity database findings.

## 4. Needs Manual Review

### Migration: `001_initial_schema.sql` (Service Role Bypass)
- **Severity: Low / Informational**
- **Impact:** Policy explicitly targets `service_role`. This bypasses RLS safely via service role logic.

#### Evidence
Policy `service_role_bypass` on `cases` (L693)
  - Command: ALL
  - Target: service_role
  - USING: true
  - WITH CHECK: true

---

### Migration: `001_initial_schema.sql` (Service Role Bypass)
- **Severity: Low / Informational**
- **Impact:** Policy explicitly targets `service_role`. This bypasses RLS safely via service role logic.

#### Evidence
Policy `service_role_bypass` on `dcas` (L694)
  - Command: ALL
  - Target: service_role
  - USING: true
  - WITH CHECK: true

---

### Migration: `001_initial_schema.sql` (Service Role Bypass)
- **Severity: Low / Informational**
- **Impact:** Policy explicitly targets `service_role`. This bypasses RLS safely via service role logic.

#### Evidence
Policy `service_role_bypass` on `users` (L695)
  - Command: ALL
  - Target: service_role
  - USING: true
  - WITH CHECK: true

---

### Migration: `001_initial_schema.sql` (Service Role Bypass)
- **Severity: Low / Informational**
- **Impact:** Policy explicitly targets `service_role`. This bypasses RLS safely via service role logic.

#### Evidence
Policy `service_role_bypass` on `case_actions` (L696)
  - Command: ALL
  - Target: service_role
  - USING: true
  - WITH CHECK: true

---

### Migration: `001_initial_schema.sql` (Service Role Bypass)
- **Severity: Low / Informational**
- **Impact:** Policy explicitly targets `service_role`. This bypasses RLS safely via service role logic.

#### Evidence
Policy `service_role_bypass` on `notifications` (L697)
  - Command: ALL
  - Target: service_role
  - USING: true
  - WITH CHECK: true

---

### Migration: `001_initial_schema.sql` (Service Role Bypass)
- **Severity: Low / Informational**
- **Impact:** Policy explicitly targets `service_role`. This bypasses RLS safely via service role logic.

#### Evidence
Policy `service_role_bypass` on `sla_logs` (L698)
  - Command: ALL
  - Target: service_role
  - USING: true
  - WITH CHECK: true

---

### Migration: `001_initial_schema.sql` (Service Role Bypass)
- **Severity: Low / Informational**
- **Impact:** Policy explicitly targets `service_role`. This bypasses RLS safely via service role logic.

#### Evidence
Policy `service_role_bypass` on `escalations` (L699)
  - Command: ALL
  - Target: service_role
  - USING: true
  - WITH CHECK: true

---

### Migration: `003_fix_rls_policies.sql` (Anon Exposure)
- **Severity: Needs Manual Review**
- **Impact:** `anon` users have broad `SELECT` access to `organizations`. Ensure table contains only public reference data.
- **Fix:** Verify if public access intent is correct.

#### Evidence
Policy `anon_read_organizations` on `organizations` (L33)
  - Command: SELECT
  - Target: anon
  - USING: true
  - WITH CHECK: None

---

### Migration: `003_fix_rls_policies.sql` (Service Role Bypass)
- **Severity: Low / Informational**
- **Impact:** Policy explicitly targets `service_role`. This bypasses RLS safely via service role logic.

#### Evidence
Policy `service_role_bypass_organizations` on `organizations` (L38)
  - Command: ALL
  - Target: service_role
  - USING: true
  - WITH CHECK: true

---

### Migration: `003_fix_rls_policies.sql` (Service Role Bypass)
- **Severity: Low / Informational**
- **Impact:** Policy explicitly targets `service_role`. This bypasses RLS safely via service role logic.

#### Evidence
Policy `service_role_bypass_sla_templates` on `sla_templates` (L76)
  - Command: ALL
  - Target: service_role
  - USING: true
  - WITH CHECK: true

---

### Migration: `007_api_keys_webhooks.sql` (Broad Authenticated Access)
- **Severity: Needs Manual Review**
- **Impact:** Broad authenticated access to `webhooks`. May be acceptable reference data.
- **Fix:** Verify table sensitivity.

#### Evidence
Policy `webhooks_admin_all` on `webhooks` (L61)
  - Command: ALL
  - Target: authenticated
  - USING: TRUE
  - WITH CHECK: None

---

### Migration: `020_region_master.sql` (Service Role Bypass)
- **Severity: Low / Informational**
- **Impact:** Policy explicitly targets `service_role`. This bypasses RLS safely via service role logic.

#### Evidence
Policy `regions_service_bypass` on `regions` (L360)
  - Command: ALL
  - Target: service_role
  - USING: true
  - WITH CHECK: true

---

### Migration: `020_region_master.sql` (Service Role Bypass)
- **Severity: Low / Informational**
- **Impact:** Policy explicitly targets `service_role`. This bypasses RLS safely via service role logic.

#### Evidence
Policy `user_region_access_service_bypass` on `user_region_access` (L361)
  - Command: ALL
  - Target: service_role
  - USING: true
  - WITH CHECK: true

---

### Migration: `023_case_timeline.sql` (Unspecified Target Broad Access)
- **Severity: Needs Manual Review**
- **Impact:** Policy target is unclear but contains `USING (true)` on `case_timeline`.
- **Fix:** Verify target role and exposure.

#### Evidence
Policy `case_timeline_read_policy` on `case_timeline` (L43)
  - Command: SELECT
  - Target: unspecified
  - USING: true
  - WITH CHECK: None

---

### Migration: `023_case_timeline.sql` (Unspecified Target Broad Access)
- **Severity: Needs Manual Review**
- **Impact:** Policy target is unclear but contains `USING (true)` on `case_timeline`.
- **Fix:** Verify target role and exposure.

#### Evidence
Policy `case_timeline_insert_policy` on `case_timeline` (L47)
  - Command: INSERT
  - Target: unspecified
  - USING: None
  - WITH CHECK: true

---

### Migration: `024_system_actor.sql` (Service Role Bypass)
- **Severity: Low / Informational**
- **Impact:** Policy explicitly targets `service_role`. This bypasses RLS safely via service role logic.

#### Evidence
Policy `service_actors_service_role` on `service_actors` (L104)
  - Command: ALL
  - Target: service_role
  - USING: true
  - WITH CHECK: true

---

### Migration: `031_enterprise_region_access.sql` (Service Role Bypass)
- **Severity: Low / Informational**
- **Impact:** Policy explicitly targets `service_role`. This bypasses RLS safely via service role logic.

#### Evidence
Policy `dca_user_region_service_bypass` on `dca_user_region_access` (L44)
  - Command: ALL
  - Target: service_role
  - USING: true
  - WITH CHECK: true

---

### Migration: `035_fix_agent_rls.sql` (Unspecified Target Broad Access)
- **Severity: Needs Manual Review**
- **Impact:** Policy target is unclear but contains `USING (true)` on `case_activities`.
- **Fix:** Verify target role and exposure.

#### Evidence
Policy `service_role_bypass_case_activities` on `case_activities` (L10)
  - Command: ALL
  - Target: unspecified
  - USING: true
  - WITH CHECK: true

---

### Migration: `035_fix_agent_rls.sql` (Unspecified Target Broad Access)
- **Severity: Needs Manual Review**
- **Impact:** Policy target is unclear but contains `USING (true)` on `scheduled_callbacks`.
- **Fix:** Verify target role and exposure.

#### Evidence
Policy `service_role_bypass_scheduled_callbacks` on `scheduled_callbacks` (L18)
  - Command: ALL
  - Target: unspecified
  - USING: true
  - WITH CHECK: true

---

### Migration: `035_fix_agent_rls.sql` (Unspecified Target Broad Access)
- **Severity: Needs Manual Review**
- **Impact:** Policy target is unclear but contains `USING (true)` on `agent_notifications`.
- **Fix:** Verify target role and exposure.

#### Evidence
Policy `service_role_bypass_agent_notifications` on `agent_notifications` (L25)
  - Command: ALL
  - Target: unspecified
  - USING: true
  - WITH CHECK: true

---

### Migration: `043_security_fixes.sql` (Service Role Bypass)
- **Severity: Low / Informational**
- **Impact:** Policy explicitly targets `service_role`. This bypasses RLS safely via service role logic.

#### Evidence
Policy `region_audit_log_service_bypass` on `region_audit_log` (L63)
  - Command: ALL
  - Target: service_role
  - USING: true
  - WITH CHECK: true

---

### Migration: `043_security_fixes.sql` (Service Role Bypass)
- **Severity: Low / Informational**
- **Impact:** Policy explicitly targets `service_role`. This bypasses RLS safely via service role logic.

#### Evidence
Policy `escalation_matrices_service_bypass` on `escalation_matrices` (L90)
  - Command: ALL
  - Target: service_role
  - USING: true
  - WITH CHECK: true

---

### Migration: `043_security_fixes.sql` (Broad Authenticated Access)
- **Severity: Needs Manual Review**
- **Impact:** Broad authenticated access to `escalation_matrices`. May be acceptable reference data.
- **Fix:** Verify table sensitivity.

#### Evidence
Policy `escalation_matrices_read` on `escalation_matrices` (L95)
  - Command: SELECT
  - Target: authenticated
  - USING: true
  - WITH CHECK: None

---

### Migration: `043_security_fixes.sql` (Service Role Bypass)
- **Severity: Low / Informational**
- **Impact:** Policy explicitly targets `service_role`. This bypasses RLS safely via service role logic.

#### Evidence
Policy `escalation_matrix_levels_service_bypass` on `escalation_matrix_levels` (L144)
  - Command: ALL
  - Target: service_role
  - USING: true
  - WITH CHECK: true

---

### Migration: `043_security_fixes.sql` (Broad Authenticated Access)
- **Severity: Needs Manual Review**
- **Impact:** Broad authenticated access to `escalation_matrix_levels`. May be acceptable reference data.
- **Fix:** Verify table sensitivity.

#### Evidence
Policy `escalation_matrix_levels_read` on `escalation_matrix_levels` (L149)
  - Command: SELECT
  - Target: authenticated
  - USING: true
  - WITH CHECK: None

---

### Migration: `043_security_fixes.sql` (Service Role Bypass)
- **Severity: Low / Informational**
- **Impact:** Policy explicitly targets `service_role`. This bypasses RLS safely via service role logic.

#### Evidence
Policy `message_templates_service_bypass` on `message_templates` (L198)
  - Command: ALL
  - Target: service_role
  - USING: true
  - WITH CHECK: true

---

### Migration: `043_security_fixes.sql` (Broad Authenticated Access)
- **Severity: Needs Manual Review**
- **Impact:** Broad authenticated access to `message_templates`. May be acceptable reference data.
- **Fix:** Verify table sensitivity.

#### Evidence
Policy `message_templates_read` on `message_templates` (L203)
  - Command: SELECT
  - Target: authenticated
  - USING: true
  - WITH CHECK: None

---

### Migration: `043_security_fixes.sql` (Service Role Bypass)
- **Severity: Low / Informational**
- **Impact:** Policy explicitly targets `service_role`. This bypasses RLS safely via service role logic.

#### Evidence
Policy `geography_region_rules_service_bypass` on `geography_region_rules` (L252)
  - Command: ALL
  - Target: service_role
  - USING: true
  - WITH CHECK: true

---

### Migration: `043_security_fixes.sql` (Broad Authenticated Access)
- **Severity: Needs Manual Review**
- **Impact:** Broad authenticated access to `geography_region_rules`. May be acceptable reference data.
- **Fix:** Verify table sensitivity.

#### Evidence
Policy `geography_region_rules_read` on `geography_region_rules` (L257)
  - Command: SELECT
  - Target: authenticated
  - USING: true
  - WITH CHECK: None

---

### Migration: `043_security_fixes.sql` (Service Role Bypass)
- **Severity: Low / Informational**
- **Impact:** Policy explicitly targets `service_role`. This bypasses RLS safely via service role logic.

#### Evidence
Policy `rda_service_bypass` on `region_dca_assignments` (L306)
  - Command: ALL
  - Target: service_role
  - USING: true
  - WITH CHECK: true

---
