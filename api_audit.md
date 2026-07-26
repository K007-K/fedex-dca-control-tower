# Phase 3: API & Auth Audit

> [!NOTE]
> This audit report is generated strictly from the line-by-line evidence in `route_evidence_matrix.md`. All severities are based exclusively on proven table operations and authentication checks.

## Summary Table

| Severity | Count | Main Pattern |
|---|---:|---|
| Critical | 38 | Unauthenticated sensitive DB access |
| High | 21 | Auth exists but admin client/RBAC/ownership missing |
| Medium | 4 | Validation/rate limit/error handling gaps |
| Needs Manual Review | 13 | AST could not determine exact exposure |


## Fix Order

**Priority 1:**
* Unauthenticated routes accessing `users`, `cases`, `dcas`, `api_keys`, `audit_logs`, and `webhooks`

**Priority 2:**
* Authenticated routes using admin client without RBAC/ownership checks

**Priority 3:**
* Public auth/health/proxy routes needing validation, rate limiting, and response hardening

---

## 1. Critical Severity Vulnerabilities

### `/api/dcas`
- **File Path:** `/apps/web/app/api/dcas/route.ts`
- **Method(s):** GET, POST
- **Severity:** **Critical**

#### Exact Evidence
- **Tables Accessed:** `regions` (L163)<br>`dcas` (L36)<br>`dcas` (L178)<br>`region_dca_assignments` (L231)<br>`dcas` (L237)
- **Operations:** `insert` (L232)<br>`select` (L201)<br>`delete` (L237)<br>`select` (L164)<br>`select` (L37)<br>`insert` (L179)
- **Admin Client:** `createAdminClient` (L125)
- **Auth Check:** No auth evidence found after inspecting handler
- **RBAC/Ownership:** None
- **Input Parsing:** `searchParams.get` (L64)<br>`searchParams.get` (L51)<br>`searchParams.get` (L30)<br>`searchParams.get` (L57)<br>`searchParams.get` (L31)<br>`searchParams.get` (L63)<br>`request.json()` (L126)<br>`searchParams.get` (L44)
- **Validation:** Manual `if (!field)` (L130)<br>Manual `if (!field)` (L153)
#### Analysis
- **Specific Problem:** Unauthenticated route explicitly accesses/modifies sensitive tables or performs destructive actions.
- **Specific Impact:** Unauthenticated users can select, insert and delete dcas, regions and region_dca_assignments records directly.
- **Recommended Fix:** Wrap the route handler with `guardAPI()` before any DB operations.
- **Verification Test:** Attempt to cURL the route without an Authorization header; assert 401 Unauthorized.

---

### `/api/dcas/[id]`
- **File Path:** `/apps/web/app/api/dcas/[id]/route.ts`
- **Method(s):** GET, PATCH, DELETE
- **Severity:** **Critical**

#### Exact Evidence
- **Tables Accessed:** `cases` (L155)<br>`dcas` (L169)<br>`cases` (L43)<br>`dcas` (L113)<br>`dcas` (L21)
- **Operations:** `select` (L22)<br>`select` (L175)<br>`select` (L156)<br>`update` (L170)<br>`select` (L44)<br>`update` (L114)<br>`select` (L116)
- **Admin Client:** `createAdminClient` (L151)<br>`createAdminClient` (L18)<br>`createAdminClient` (L85)
- **Auth Check:** No auth evidence found after inspecting handler
- **RBAC/Ownership:** None
- **Input Parsing:** `request.json()` (L86)
- **Validation:** No validation evidence
#### Analysis
- **Specific Problem:** Unauthenticated route explicitly accesses/modifies sensitive tables or performs destructive actions.
- **Specific Impact:** Unauthenticated users can update and select dcas and cases records directly.
- **Recommended Fix:** Wrap the route handler with `guardAPI()` before any DB operations.
- **Verification Test:** Attempt to cURL the route without an Authorization header; assert 401 Unauthorized.

---

### `/api/dcas/[id]/regions`
- **File Path:** `/apps/web/app/api/dcas/[id]/regions/route.ts`
- **Method(s):** GET
- **Severity:** **Critical**

#### Exact Evidence
- **Tables Accessed:** `region_dca_assignments` (L24)
- **Operations:** `select` (L25)
- **Admin Client:** `createAdminClient` (L12)
- **Auth Check:** No auth evidence found after inspecting handler
- **RBAC/Ownership:** None
- **Input Parsing:** No parsing evidence
- **Validation:** Manual `if (!field)` (L17)
#### Analysis
- **Specific Problem:** Unauthenticated route explicitly accesses/modifies sensitive tables or performs destructive actions.
- **Specific Impact:** Unauthenticated users can select region_dca_assignments records directly.
- **Recommended Fix:** Wrap the route handler with `guardAPI()` before any DB operations.
- **Verification Test:** Attempt to cURL the route without an Authorization header; assert 401 Unauthorized.

---

### `/api/v1/cases`
- **File Path:** `/apps/web/app/api/v1/cases/route.ts`
- **Method(s):** GET
- **Severity:** **Critical**

#### Exact Evidence
- **Tables Accessed:** `cases` (L62)
- **Operations:** `select` (L63)
- **Admin Client:** `createAdminClient` (L51)
- **Auth Check:** No auth evidence found after inspecting handler
- **RBAC/Ownership:** None
- **Input Parsing:** `searchParams.get` (L57)<br>`searchParams.get` (L56)<br>`searchParams.get` (L55)
- **Validation:** Manual `if (!field)` (L29)
#### Analysis
- **Specific Problem:** Unauthenticated route explicitly accesses/modifies sensitive tables or performs destructive actions.
- **Specific Impact:** Unauthenticated users can select cases records directly.
- **Recommended Fix:** Wrap the route handler with `guardAPI()` before any DB operations.
- **Verification Test:** Attempt to cURL the route without an Authorization header; assert 401 Unauthorized.

---

### `/api/v1/cases/[id]`
- **File Path:** `/apps/web/app/api/v1/cases/[id]/route.ts`
- **Method(s):** GET
- **Severity:** **Critical**

#### Exact Evidence
- **Tables Accessed:** `cases` (L38)
- **Operations:** `select` (L39)
- **Admin Client:** `createAdminClient` (L34)
- **Auth Check:** No auth evidence found after inspecting handler
- **RBAC/Ownership:** None
- **Input Parsing:** No parsing evidence
- **Validation:** Manual `if (!field)` (L21)
#### Analysis
- **Specific Problem:** Unauthenticated route explicitly accesses/modifies sensitive tables or performs destructive actions.
- **Specific Impact:** Unauthenticated users can select cases records directly.
- **Recommended Fix:** Wrap the route handler with `guardAPI()` before any DB operations.
- **Verification Test:** Attempt to cURL the route without an Authorization header; assert 401 Unauthorized.

---

### `/api/v1/governance/audit-logs`
- **File Path:** `/apps/web/app/api/v1/governance/audit-logs/route.ts`
- **Method(s):** GET
- **Severity:** **Critical**

#### Exact Evidence
- **Tables Accessed:** `audit_logs` (L56)
- **Operations:** `select` (L57)
- **Admin Client:** `createAdminClient` (L41)
- **Auth Check:** No auth evidence found after inspecting handler
- **RBAC/Ownership:** None
- **Input Parsing:** `searchParams.get` (L48)<br>`searchParams.get` (L51)<br>`searchParams.get` (L50)<br>`searchParams.get` (L49)<br>`searchParams.get` (L46)<br>`searchParams.get` (L45)<br>`searchParams.get` (L47)
- **Validation:** No validation evidence
#### Analysis
- **Specific Problem:** Unauthenticated route explicitly accesses/modifies sensitive tables or performs destructive actions.
- **Specific Impact:** Unauthenticated users can select audit_logs records directly.
- **Recommended Fix:** Wrap the route handler with `guardAPI()` before any DB operations.
- **Verification Test:** Attempt to cURL the route without an Authorization header; assert 401 Unauthorized.

---

### `/api/v1/governance/security`
- **File Path:** `/apps/web/app/api/v1/governance/security/route.ts`
- **Method(s):** GET, POST
- **Severity:** **Critical**

#### Exact Evidence
- **Tables Accessed:** `system_settings` (L59)<br>`system_settings` (L136)
- **Operations:** `upsert` (L137)<br>`select` (L60)
- **Admin Client:** `createAdminClient` (L120)<br>`createAdminClient` (L54)
- **Auth Check:** No auth evidence found after inspecting handler
- **RBAC/Ownership:** None
- **Input Parsing:** `request.json()` (L119)
- **Validation:** Manual `if (!field)` (L127)
#### Analysis
- **Specific Problem:** Unauthenticated route explicitly accesses/modifies sensitive tables or performs destructive actions.
- **Specific Impact:** Unauthenticated users can select and upsert system_settings records directly.
- **Recommended Fix:** Wrap the route handler with `guardAPI()` before any DB operations.
- **Verification Test:** Attempt to cURL the route without an Authorization header; assert 401 Unauthorized.

---

### `/api/v1/analytics`
- **File Path:** `/apps/web/app/api/v1/analytics/route.ts`
- **Method(s):** GET
- **Severity:** **Critical**

#### Exact Evidence
- **Tables Accessed:** `cases` (L77)<br>`cases` (L65)<br>`cases` (L84)<br>`cases` (L54)<br>`cases` (L71)<br>`cases` (L59)
- **Operations:** `select` (L72)<br>`select` (L55)<br>`select` (L66)<br>`select` (L85)<br>`select` (L78)<br>`select` (L60)
- **Admin Client:** `createAdminClient` (L49)
- **Auth Check:** No auth evidence found after inspecting handler
- **RBAC/Ownership:** None
- **Input Parsing:** No parsing evidence
- **Validation:** Manual `if (!field)` (L27)
#### Analysis
- **Specific Problem:** Unauthenticated route explicitly accesses/modifies sensitive tables or performs destructive actions.
- **Specific Impact:** Unauthenticated users can select cases records directly.
- **Recommended Fix:** Wrap the route handler with `guardAPI()` before any DB operations.
- **Verification Test:** Attempt to cURL the route without an Authorization header; assert 401 Unauthorized.

---

### `/api/escalations`
- **File Path:** `/apps/web/app/api/escalations/route.ts`
- **Method(s):** GET, POST
- **Severity:** **Critical**

#### Exact Evidence
- **Tables Accessed:** `escalations` (L43)<br>`cases` (L164)<br>`escalations` (L138)<br>`cases` (L172)
- **Operations:** `insert` (L139)<br>`update` (L165)<br>`select` (L173)<br>`select` (L44)<br>`select` (L150)
- **Auth Check:** No auth evidence found after inspecting handler
- **RBAC/Ownership:** None
- **Input Parsing:** `request.json()` (L109)<br>`searchParams.get` (L37)<br>`searchParams.get` (L39)<br>`searchParams.get` (L38)<br>`searchParams.get` (L36)
- **Validation:** Manual `if (!field)` (L128)<br>Manual `if (!field)` (L114)
#### Analysis
- **Specific Problem:** Unauthenticated route explicitly accesses/modifies sensitive tables or performs destructive actions.
- **Specific Impact:** Unauthenticated users can update, select and insert escalations and cases records directly.
- **Recommended Fix:** Wrap the route handler with `guardAPI()` before any DB operations.
- **Verification Test:** Attempt to cURL the route without an Authorization header; assert 401 Unauthorized.

---

### `/api/escalations/[id]`
- **File Path:** `/apps/web/app/api/escalations/[id]/route.ts`
- **Method(s):** GET, PATCH, DELETE
- **Severity:** **Critical**

#### Exact Evidence
- **Tables Accessed:** `escalations` (L109)<br>`escalations` (L19)<br>`escalations` (L85)<br>`escalations` (L147)
- **Operations:** `select` (L112)<br>`select` (L86)<br>`select` (L20)<br>`update` (L110)<br>`select` (L153)<br>`update` (L148)
- **Auth Check:** No auth evidence found after inspecting handler
- **RBAC/Ownership:** None
- **Input Parsing:** `request.json()` (L59)
- **Validation:** No validation evidence
#### Analysis
- **Specific Problem:** Unauthenticated route explicitly accesses/modifies sensitive tables or performs destructive actions.
- **Specific Impact:** Unauthenticated users can update and select escalations records directly.
- **Recommended Fix:** Wrap the route handler with `guardAPI()` before any DB operations.
- **Verification Test:** Attempt to cURL the route without an Authorization header; assert 401 Unauthorized.

---

### `/api/audit-logs`
- **File Path:** `/apps/web/app/api/audit-logs/route.ts`
- **Method(s):** GET
- **Severity:** **Critical**

#### Exact Evidence
- **Tables Accessed:** `audit_logs` (L30)
- **Operations:** `select` (L31)
- **Auth Check:** No auth evidence found after inspecting handler
- **RBAC/Ownership:** Ownership `.eq('user_id')` (L40)
- **Input Parsing:** `searchParams.get` (L21)<br>`searchParams.get` (L18)<br>`searchParams.get` (L22)<br>`searchParams.get` (L20)<br>`searchParams.get` (L23)<br>`searchParams.get` (L24)<br>`searchParams.get` (L19)<br>`searchParams.get` (L25)
- **Validation:** No validation evidence
#### Analysis
- **Specific Problem:** Unauthenticated route explicitly accesses/modifies sensitive tables or performs destructive actions.
- **Specific Impact:** Unauthenticated users can select audit_logs records directly.
- **Recommended Fix:** Wrap the route handler with `guardAPI()` before any DB operations.
- **Verification Test:** Attempt to cURL the route without an Authorization header; assert 401 Unauthorized.

---

### `/api/settings/api-keys`
- **File Path:** `/apps/web/app/api/settings/api-keys/route.ts`
- **Method(s):** GET, POST
- **Severity:** **Critical**

#### Exact Evidence
- **Tables Accessed:** `api_keys` (L34)<br>`api_keys` (L87)<br>`users` (L67)<br>`api_keys` (L110)<br>`region_audit_log` (L124)
- **Operations:** `select` (L112)<br>`insert` (L111)<br>`select` (L35)<br>`update` (L88)<br>`insert` (L125)<br>`update` (L14)<br>`select` (L68)
- **Auth Check:** No auth evidence found after inspecting handler
- **RBAC/Ownership:** None
- **Input Parsing:** No parsing evidence
- **Validation:** Manual `if (!field)` (L60)<br>Manual `if (!field)` (L72)<br>Manual `if (!field)` (L27)
#### Analysis
- **Specific Problem:** Unauthenticated route explicitly accesses/modifies sensitive tables or performs destructive actions.
- **Specific Impact:** Unauthenticated users can update, select and insert users, api_keys and region_audit_log records directly.
- **Recommended Fix:** Wrap the route handler with `guardAPI()` before any DB operations.
- **Verification Test:** Attempt to cURL the route without an Authorization header; assert 401 Unauthorized.

---

### `/api/settings/profile`
- **File Path:** `/apps/web/app/api/settings/profile/route.ts`
- **Method(s):** GET, PUT
- **Severity:** **Critical**

#### Exact Evidence
- **Tables Accessed:** `users` (L32)<br>`users` (L51)<br>`users` (L41)<br>`users` (L109)<br>`users` (L192)
- **Operations:** `select` (L33)<br>`select` (L42)<br>`update` (L52)<br>`update` (L193)<br>`select` (L110)
- **Admin Client:** `createAdminClient` (L26)
- **Auth Check:** No auth evidence found after inspecting handler
- **RBAC/Ownership:** None
- **Input Parsing:** `request.json()` (L115)
- **Validation:** Manual `if (!field)` (L38)<br>Manual `if (!field)` (L60)<br>Manual `if (!field)` (L122)
#### Analysis
- **Specific Problem:** Unauthenticated route explicitly accesses/modifies sensitive tables or performs destructive actions.
- **Specific Impact:** Unauthenticated users can update and select users records directly.
- **Recommended Fix:** Wrap the route handler with `guardAPI()` before any DB operations.
- **Verification Test:** Attempt to cURL the route without an Authorization header; assert 401 Unauthorized.

---

### `/api/settings/notifications`
- **File Path:** `/apps/web/app/api/settings/notifications/route.ts`
- **Method(s):** GET, PUT
- **Severity:** **Critical**

#### Exact Evidence
- **Tables Accessed:** `users` (L29)
- **Operations:** `select` (L30)
- **Admin Client:** `createAdminClient` (L24)
- **Auth Check:** No auth evidence found after inspecting handler
- **RBAC/Ownership:** None
- **Input Parsing:** `request.json()` (L58)
- **Validation:** Manual `if (!field)` (L70)<br>Manual `if (!field)` (L61)
#### Analysis
- **Specific Problem:** Unauthenticated route explicitly accesses/modifies sensitive tables or performs destructive actions.
- **Specific Impact:** Unauthenticated users can select users records directly.
- **Recommended Fix:** Wrap the route handler with `guardAPI()` before any DB operations.
- **Verification Test:** Attempt to cURL the route without an Authorization header; assert 401 Unauthorized.

---

### `/api/regions`
- **File Path:** `/apps/web/app/api/regions/route.ts`
- **Method(s):** GET, POST
- **Severity:** **Critical**

#### Exact Evidence
- **Tables Accessed:** `region_audit_log` (L145)<br>`regions` (L65)<br>`regions` (L117)<br>`regions` (L31)
- **Operations:** `insert` (L118)<br>`select` (L66)<br>`insert` (L145)<br>`select` (L32)<br>`select` (L130)
- **Auth Check:** No auth evidence found after inspecting handler
- **RBAC/Ownership:** None
- **Input Parsing:** `request.json()` (L103)
- **Validation:** Manual `if (!field)` (L108)
#### Analysis
- **Specific Problem:** Unauthenticated route explicitly accesses/modifies sensitive tables or performs destructive actions.
- **Specific Impact:** Unauthenticated users can select and insert regions and region_audit_log records directly.
- **Recommended Fix:** Wrap the route handler with `guardAPI()` before any DB operations.
- **Verification Test:** Attempt to cURL the route without an Authorization header; assert 401 Unauthorized.

---

### `/api/regions/[id]`
- **File Path:** `/apps/web/app/api/regions/[id]/route.ts`
- **Method(s):** GET, DELETE, PUT
- **Severity:** **Critical**

#### Exact Evidence
- **Tables Accessed:** `region_audit_log` (L176)<br>`regions` (L39)<br>`cases` (L148)<br>`regions` (L162)<br>`regions` (L79)<br>`regions` (L93)<br>`region_audit_log` (L118)
- **Operations:** `select` (L149)<br>`select` (L109)<br>`select` (L40)<br>`insert` (L118)<br>`update` (L163)<br>`update` (L94)<br>`select` (L80)<br>`insert` (L176)
- **Auth Check:** No auth evidence found after inspecting handler
- **RBAC/Ownership:** None
- **Input Parsing:** `request.json()` (L89)
- **Validation:** Manual `if (!field)` (L30)<br>Manual `if (!field)` (L84)
#### Analysis
- **Specific Problem:** Unauthenticated route explicitly accesses/modifies sensitive tables or performs destructive actions.
- **Specific Impact:** Unauthenticated users can update, select and insert regions, cases and region_audit_log records directly.
- **Recommended Fix:** Wrap the route handler with `guardAPI()` before any DB operations.
- **Verification Test:** Attempt to cURL the route without an Authorization header; assert 401 Unauthorized.

---

### `/api/regions/[id]/dcas`
- **File Path:** `/apps/web/app/api/regions/[id]/dcas/route.ts`
- **Method(s):** GET, DELETE, POST
- **Severity:** **Critical**

#### Exact Evidence
- **Tables Accessed:** `region_audit_log` (L141)<br>`cases` (L179)<br>`region_dca_assignments` (L194)<br>`region_dca_assignments` (L111)<br>`region_dca_assignments` (L119)<br>`region_dca_assignments` (L44)<br>`dcas` (L92)<br>`region_audit_log` (L209)
- **Operations:** `select` (L45)<br>`insert` (L209)<br>`insert` (L141)<br>`upsert` (L120)<br>`select` (L180)<br>`select` (L132)<br>`update` (L112)<br>`update` (L195)<br>`select` (L93)
- **Auth Check:** No auth evidence found after inspecting handler
- **RBAC/Ownership:** None
- **Input Parsing:** `request.json()` (L80)<br>`searchParams.get` (L166)
- **Validation:** Manual `if (!field)` (L35)<br>Manual `if (!field)` (L97)<br>Manual `if (!field)` (L83)<br>Manual `if (!field)` (L168)
#### Analysis
- **Specific Problem:** Unauthenticated route explicitly accesses/modifies sensitive tables or performs destructive actions.
- **Specific Impact:** Unauthenticated users can update, select, insert and upsert dcas, cases, region_dca_assignments and region_audit_log records directly.
- **Recommended Fix:** Wrap the route handler with `guardAPI()` before any DB operations.
- **Verification Test:** Attempt to cURL the route without an Authorization header; assert 401 Unauthorized.

---

### `/api/auth/me`
- **File Path:** `/apps/web/app/api/auth/me/route.ts`
- **Method(s):** GET
- **Severity:** **Critical**

#### Exact Evidence
- **Tables Accessed:** `users` (L40)<br>`users` (L50)<br>`users` (L31)
- **Operations:** `select` (L32)<br>`update` (L51)<br>`select` (L41)
- **Admin Client:** `createAdminClient` (L28)
- **Auth Check:** No auth evidence found after inspecting handler
- **RBAC/Ownership:** None
- **Input Parsing:** No parsing evidence
- **Validation:** Manual `if (!field)` (L37)<br>Manual `if (!field)` (L59)
#### Analysis
- **Specific Problem:** Identity route returns user state without enforcing a valid session (missing check).
- **Specific Impact:** Unauthenticated users can update and select users records directly.
- **Recommended Fix:** Wrap the route handler with `guardAPI()` before any DB operations.
- **Verification Test:** Attempt to cURL the route without an Authorization header; assert 401 Unauthorized.

---

### `/api/cases`
- **File Path:** `/apps/web/app/api/cases/route.ts`
- **Method(s):** GET, POST
- **Severity:** **Critical**

#### Exact Evidence
- **Tables Accessed:** `cases` (L35)<br>`cases` (L236)<br>`regions` (L219)
- **Operations:** `select` (L36)<br>`select` (L259)<br>`insert` (L237)<br>`select` (L220)
- **Auth Check:** No auth evidence found after inspecting handler
- **RBAC/Ownership:** None
- **Input Parsing:** `searchParams.get` (L52)<br>`searchParams.get` (L30)<br>`request.json()` (L159)<br>`searchParams.get` (L65)<br>`searchParams.get` (L40)<br>`searchParams.get` (L31)<br>`searchParams.get` (L26)<br>`searchParams.get` (L46)<br>`searchParams.get` (L25)
- **Validation:** Manual `if (!field)` (L172)<br>Manual `if (!field)` (L165)<br>Manual `if (!field)` (L68)<br>Manual `if (!field)` (L179)
#### Analysis
- **Specific Problem:** Unauthenticated route explicitly accesses/modifies sensitive tables or performs destructive actions.
- **Specific Impact:** Unauthenticated users can select and insert regions and cases records directly.
- **Recommended Fix:** Wrap the route handler with `guardAPI()` before any DB operations.
- **Verification Test:** Attempt to cURL the route without an Authorization header; assert 401 Unauthorized.

---

### `/api/cases/bulk`
- **File Path:** `/apps/web/app/api/cases/bulk/route.ts`
- **Method(s):** POST
- **Severity:** **Critical**

#### Exact Evidence
- **Tables Accessed:** `dcas` (L128)<br>`cases` (L51)<br>`cases` (L113)
- **Operations:** `select` (L57)<br>`select` (L114)<br>`update` (L52)<br>`select` (L129)
- **Admin Client:** `createAdminClient` (L108)
- **Auth Check:** No auth evidence found after inspecting handler
- **RBAC/Ownership:** None
- **Input Parsing:** `request.json()` (L23)
- **Validation:** Manual `if (!field)` (L34)<br>Manual `if (!field)` (L43)<br>Manual `if (!field)` (L27)
#### Analysis
- **Specific Problem:** Unauthenticated route explicitly accesses/modifies sensitive tables or performs destructive actions.
- **Specific Impact:** Unauthenticated users can update and select dcas and cases records directly.
- **Recommended Fix:** Wrap the route handler with `guardAPI()` before any DB operations.
- **Verification Test:** Attempt to cURL the route without an Authorization header; assert 401 Unauthorized.

---

### `/api/cases/[id]`
- **File Path:** `/apps/web/app/api/cases/[id]/route.ts`
- **Method(s):** GET, PATCH, DELETE
- **Severity:** **Critical**

#### Exact Evidence
- **Tables Accessed:** `cases` (L218)<br>`cases` (L33)<br>`cases` (L88)<br>`cases` (L275)
- **Operations:** `update` (L276)<br>`update` (L219)<br>`select` (L34)<br>`select` (L284)<br>`select` (L222)<br>`select` (L89)
- **Auth Check:** No auth evidence found after inspecting handler
- **RBAC/Ownership:** None
- **Input Parsing:** `request.json()` (L84)
- **Validation:** Manual `if (!field)` (L113)<br>Manual `if (!field)` (L23)<br>Manual `if (!field)` (L76)
#### Analysis
- **Specific Problem:** Unauthenticated route explicitly accesses/modifies sensitive tables or performs destructive actions.
- **Specific Impact:** Unauthenticated users can update and select cases records directly.
- **Recommended Fix:** Wrap the route handler with `guardAPI()` before any DB operations.
- **Verification Test:** Attempt to cURL the route without an Authorization header; assert 401 Unauthorized.

---

### `/api/dashboard`
- **File Path:** `/apps/web/app/api/dashboard/route.ts`
- **Method(s):** GET
- **Severity:** **Critical**

#### Exact Evidence
- **Tables Accessed:** `dcas` (L61)<br>`cases` (L45)
- **Operations:** `select` (L62)<br>`select` (L46)
- **Auth Check:** No auth evidence found after inspecting handler
- **RBAC/Ownership:** None
- **Input Parsing:** `searchParams.get` (L41)
- **Validation:** No validation evidence
#### Analysis
- **Specific Problem:** Unauthenticated route explicitly accesses/modifies sensitive tables or performs destructive actions.
- **Specific Impact:** Unauthenticated users can select dcas and cases records directly.
- **Recommended Fix:** Wrap the route handler with `guardAPI()` before any DB operations.
- **Verification Test:** Attempt to cURL the route without an Authorization header; assert 401 Unauthorized.

---

### `/api/integrations/status`
- **File Path:** `/apps/web/app/api/integrations/status/route.ts`
- **Method(s):** GET, POST
- **Severity:** **Critical**

#### Exact Evidence
- **Tables Accessed:** `api_keys` (L179)<br>`users` (L35)<br>`users` (L221)<br>`regions` (L64)
- **Operations:** `select` (L36)<br>`select` (L180)<br>`select` (L222)<br>`select` (L65)<br>`fetch/proxy` (L102)
- **Admin Client:** `createAdminClient` (L58)<br>`createAdminClient` (L32)
- **Auth Check:** No auth evidence found after inspecting handler
- **RBAC/Ownership:** None
- **Input Parsing:** `request.json()` (L228)
- **Validation:** Manual `if (!field)` (L249)
#### Analysis
- **Specific Problem:** Unauthenticated route explicitly accesses/modifies sensitive tables or performs destructive actions.
- **Specific Impact:** Unauthenticated users can select users, regions and api_keys records directly.
- **Recommended Fix:** Wrap the route handler with `guardAPI()` before any DB operations.
- **Verification Test:** Attempt to cURL the route without an Authorization header; assert 401 Unauthorized.

---

### `/api/manager/agents`
- **File Path:** `/apps/web/app/api/manager/agents/route.ts`
- **Method(s):** POST
- **Severity:** **Critical**

#### Exact Evidence
- **Tables Accessed:** `users` (L38)<br>`users` (L87)<br>`audit_logs` (L157)<br>`users` (L124)
- **Operations:** `select` (L88)<br>`insert` (L125)<br>`insert` (L158)<br>`select` (L39)<br>`select` (L140)
- **Admin Client:** `createAdminClient` (L27)
- **Auth Check:** No auth evidence found after inspecting handler
- **RBAC/Ownership:** None
- **Input Parsing:** `request.json()` (L66)
- **Validation:** Manual `if (!field)` (L71)<br>Manual `if (!field)` (L56)<br>Manual `if (!field)` (L80)
#### Analysis
- **Specific Problem:** Unauthenticated route explicitly accesses/modifies sensitive tables or performs destructive actions.
- **Specific Impact:** Unauthenticated users can select and insert users and audit_logs records directly.
- **Recommended Fix:** Wrap the route handler with `guardAPI()` before any DB operations.
- **Verification Test:** Attempt to cURL the route without an Authorization header; assert 401 Unauthorized.

---

### `/api/ml/insights`
- **File Path:** `/apps/web/app/api/ml/insights/route.ts`
- **Method(s):** GET
- **Severity:** **Critical**

#### Exact Evidence
- **Tables Accessed:** `cases` (L39)
- **Operations:** `fetch/proxy` (L84)<br>`select` (L40)<br>`fetch/proxy` (L93)
- **Auth Check:** No auth evidence found after inspecting handler
- **RBAC/Ownership:** None
- **Input Parsing:** `searchParams.get` (L34)
- **Validation:** No validation evidence
#### Analysis
- **Specific Problem:** Unauthenticated route explicitly accesses/modifies sensitive tables or performs destructive actions.
- **Specific Impact:** Unauthenticated users can select cases records directly.
- **Recommended Fix:** Wrap the route handler with `guardAPI()` before any DB operations.
- **Verification Test:** Attempt to cURL the route without an Authorization header; assert 401 Unauthorized.

---

### `/api/users`
- **File Path:** `/apps/web/app/api/users/route.ts`
- **Method(s):** GET, POST
- **Severity:** **Critical**

#### Exact Evidence
- **Tables Accessed:** `region_dca_assignments` (L486)<br>`dca_user_region_access` (L608)<br>`users` (L687)<br>`users` (L243)<br>`dcas` (L546)<br>`audit_logs` (L203)<br>`regions` (L658)<br>`region_dca_assignments` (L517)<br>`regions` (L634)<br>`dcas` (L593)<br>`dcas` (L452)<br>`users` (L559)<br>`users` (L794)
- **Operations:** `select` (L609)<br>`select` (L560)<br>`select` (L518)<br>`upsert` (L890)<br>`select` (L594)<br>`insert` (L203)<br>`select` (L812)<br>`select` (L635)<br>`select` (L244)<br>`select` (L487)<br>`upsert` (L870)<br>`select` (L453)<br>`upsert` (L795)<br>`select` (L688)<br>`select` (L659)<br>`select` (L547)
- **Admin Client:** `service_role_key` (L17)
- **Auth Check:** No auth evidence found after inspecting handler
- **RBAC/Ownership:** Ownership `.eq('organization_id')` (L297)<br>Ownership `.eq('user_id')` (L610)
- **Input Parsing:** `searchParams.get` (L234)<br>`searchParams.get` (L236)<br>`searchParams.get` (L230)<br>`searchParams.get` (L235)<br>`searchParams.get` (L231)<br>`searchParams.get` (L233)<br>`searchParams.get` (L232)<br>`request.json()` (L359)
- **Validation:** Manual `if (!field)` (L271)<br>Manual `if (!field)` (L150)<br>Manual `if (!field)` (L436)<br>Manual `if (!field)` (L463)<br>Manual `if (!field)` (L530)<br>Manual `if (!field)` (L576)<br>Manual `if (!field)` (L166)<br>Manual `if (!field)` (L922)<br>Manual `if (!field)` (L896)<br>Manual `if (!field)` (L564)<br>Manual `if (!field)` (L366)<br>Manual `if (!field)` (L139)<br>Manual `if (!field)` (L387)<br>Manual `if (!field)` (L406)<br>Manual `if (!field)` (L663)<br>Manual `if (!field)` (L265)<br>Manual `if (!field)` (L178)
#### Analysis
- **Specific Problem:** Unauthenticated route explicitly accesses/modifies sensitive tables or performs destructive actions.
- **Specific Impact:** Unauthenticated users can select, insert and upsert dca_user_region_access, audit_logs, regions, region_dca_assignments, dcas and users records directly.
- **Recommended Fix:** Wrap the route handler with `guardAPI()` before any DB operations.
- **Verification Test:** Attempt to cURL the route without an Authorization header; assert 401 Unauthorized.

---

### `/api/users/[id]`
- **File Path:** `/apps/web/app/api/users/[id]/route.ts`
- **Method(s):** GET, PATCH, DELETE
- **Severity:** **Critical**

#### Exact Evidence
- **Tables Accessed:** `users` (L274)<br>`cases` (L420)<br>`users` (L86)<br>`case_actions` (L415)<br>`cases` (L418)<br>`audit_logs` (L432)<br>`users` (L454)<br>`dcas` (L438)<br>`users` (L205)<br>`escalations` (L427)<br>`dcas` (L439)<br>`notifications` (L412)<br>`escalations` (L426)<br>`sla_logs` (L423)<br>`escalations` (L428)<br>`cases` (L419)<br>`users` (L351)<br>`audit_logs` (L47)
- **Operations:** `update` (L439)<br>`update` (L420)<br>`insert` (L47)<br>`select` (L206)<br>`select` (L277)<br>`delete` (L432)<br>`delete` (L455)<br>`update` (L438)<br>`update` (L427)<br>`update` (L419)<br>`update` (L428)<br>`update` (L275)<br>`delete` (L412)<br>`update` (L423)<br>`update` (L418)<br>`update` (L426)<br>`select` (L87)<br>`select` (L352)<br>`update` (L415)
- **Admin Client:** `service_role_key` (L13)
- **Auth Check:** No auth evidence found after inspecting handler
- **RBAC/Ownership:** Ownership `.eq('user_id')` (L432)
- **Input Parsing:** `request.json()` (L169)
- **Validation:** Manual `if (!field)` (L128)<br>Manual `if (!field)` (L243)<br>Manual `if (!field)` (L389)
#### Analysis
- **Specific Problem:** Unauthenticated route explicitly accesses/modifies sensitive tables or performs destructive actions.
- **Specific Impact:** Unauthenticated users can update, select, insert and delete audit_logs, escalations, case_actions, sla_logs, dcas, users, cases and notifications records directly.
- **Recommended Fix:** Wrap the route handler with `guardAPI()` before any DB operations.
- **Verification Test:** Attempt to cURL the route without an Authorization header; assert 401 Unauthorized.

---

### `/api/sla`
- **File Path:** `/apps/web/app/api/sla/route.ts`
- **Method(s):** GET, POST
- **Severity:** **Critical**

#### Exact Evidence
- **Tables Accessed:** `sla_templates` (L23)<br>`sla_templates` (L86)
- **Operations:** `insert` (L87)<br>`select` (L24)<br>`select` (L100)
- **Admin Client:** `createAdminClient` (L15)<br>`createAdminClient` (L62)
- **Auth Check:** No auth evidence found after inspecting handler
- **RBAC/Ownership:** None
- **Input Parsing:** `request.json()` (L63)<br>`searchParams.get` (L18)<br>`searchParams.get` (L19)
- **Validation:** Manual `if (!field)` (L68)
#### Analysis
- **Specific Problem:** Unauthenticated route explicitly accesses/modifies sensitive tables or performs destructive actions.
- **Specific Impact:** Unauthenticated users can select and insert sla_templates records directly.
- **Recommended Fix:** Wrap the route handler with `guardAPI()` before any DB operations.
- **Verification Test:** Attempt to cURL the route without an Authorization header; assert 401 Unauthorized.

---

### `/api/sla/[id]`
- **File Path:** `/apps/web/app/api/sla/[id]/route.ts`
- **Method(s):** GET, PATCH, DELETE
- **Severity:** **Critical**

#### Exact Evidence
- **Tables Accessed:** `sla_logs` (L46)<br>`sla_templates` (L165)<br>`sla_logs` (L58)<br>`sla_templates` (L127)<br>`sla_templates` (L27)
- **Operations:** `select` (L59)<br>`select` (L28)<br>`update` (L128)<br>`update` (L166)<br>`select` (L171)<br>`select` (L47)<br>`select` (L130)
- **Admin Client:** `createAdminClient` (L161)<br>`createAdminClient` (L100)<br>`createAdminClient` (L20)
- **Auth Check:** No auth evidence found after inspecting handler
- **RBAC/Ownership:** None
- **Input Parsing:** `request.json()` (L101)<br>`searchParams.get` (L23)
- **Validation:** No validation evidence
#### Analysis
- **Specific Problem:** Unauthenticated route explicitly accesses/modifies sensitive tables or performs destructive actions.
- **Specific Impact:** Unauthenticated users can update and select sla_templates and sla_logs records directly.
- **Recommended Fix:** Wrap the route handler with `guardAPI()` before any DB operations.
- **Verification Test:** Attempt to cURL the route without an Authorization header; assert 401 Unauthorized.

---

### `/api/sla/breach-check`
- **File Path:** `/apps/web/app/api/sla/breach-check/route.ts`
- **Method(s):** GET
- **Severity:** **Critical**

#### Exact Evidence
- **Tables Accessed:** `sla_templates` (L42)<br>`cases` (L113)<br>`sla_logs` (L63)
- **Operations:** `select` (L114)<br>`select` (L43)<br>`select` (L64)
- **Auth Check:** No auth evidence found after inspecting handler
- **RBAC/Ownership:** None
- **Input Parsing:** `searchParams.get` (L37)
- **Validation:** Manual `if (!field)` (L76)
#### Analysis
- **Specific Problem:** Unauthenticated route explicitly accesses/modifies sensitive tables or performs destructive actions.
- **Specific Impact:** Unauthenticated users can select cases, sla_templates and sla_logs records directly.
- **Recommended Fix:** Wrap the route handler with `guardAPI()` before any DB operations.
- **Verification Test:** Attempt to cURL the route without an Authorization header; assert 401 Unauthorized.

---

### `/api/webhooks`
- **File Path:** `/apps/web/app/api/webhooks/route.ts`
- **Method(s):** GET, POST
- **Severity:** **Critical**

#### Exact Evidence
- **Tables Accessed:** `webhooks` (L18)<br>`users` (L58)<br>`webhooks` (L73)
- **Operations:** `insert` (L74)<br>`select` (L83)<br>`select` (L59)<br>`select` (L19)
- **Auth Check:** No auth evidence found after inspecting handler
- **RBAC/Ownership:** None
- **Input Parsing:** `request.json()` (L41)
- **Validation:** Manual `if (!field)` (L63)<br>Manual `if (!field)` (L44)
#### Analysis
- **Specific Problem:** Unauthenticated route explicitly accesses/modifies sensitive tables or performs destructive actions.
- **Specific Impact:** Unauthenticated users can select and insert users and webhooks records directly.
- **Recommended Fix:** Wrap the route handler with `guardAPI()` before any DB operations.
- **Verification Test:** Attempt to cURL the route without an Authorization header; assert 401 Unauthorized.

---

### `/api/webhooks/[id]`
- **File Path:** `/apps/web/app/api/webhooks/[id]/route.ts`
- **Method(s):** PATCH, DELETE
- **Severity:** **Critical**

#### Exact Evidence
- **Tables Accessed:** `webhooks` (L56)<br>`webhooks` (L27)
- **Operations:** `select` (L30)<br>`delete` (L57)<br>`update` (L28)
- **Auth Check:** No auth evidence found after inspecting handler
- **RBAC/Ownership:** None
- **Input Parsing:** `request.json()` (L16)
- **Validation:** No validation evidence
#### Analysis
- **Specific Problem:** Unauthenticated route explicitly accesses/modifies sensitive tables or performs destructive actions.
- **Specific Impact:** Unauthenticated users can update, select and delete webhooks records directly.
- **Recommended Fix:** Wrap the route handler with `guardAPI()` before any DB operations.
- **Verification Test:** Attempt to cURL the route without an Authorization header; assert 401 Unauthorized.

---

### `/api/notifications`
- **File Path:** `/apps/web/app/api/notifications/route.ts`
- **Method(s):** GET
- **Severity:** **Critical**

#### Exact Evidence
- **Tables Accessed:** `notifications` (L24)
- **Operations:** `select` (L25)
- **Auth Check:** No auth evidence found after inspecting handler
- **RBAC/Ownership:** None
- **Input Parsing:** `searchParams.get` (L19)
- **Validation:** No validation evidence
#### Analysis
- **Specific Problem:** Unauthenticated route explicitly accesses/modifies sensitive tables or performs destructive actions.
- **Specific Impact:** Unauthenticated users can select notifications records directly.
- **Recommended Fix:** Wrap the route handler with `guardAPI()` before any DB operations.
- **Verification Test:** Attempt to cURL the route without an Authorization header; assert 401 Unauthorized.

---

### `/api/notifications/delete-all`
- **File Path:** `/apps/web/app/api/notifications/delete-all/route.ts`
- **Method(s):** DELETE
- **Severity:** **Critical**

#### Exact Evidence
- **Tables Accessed:** `notifications` (L31)
- **Operations:** `select` (L34)<br>`delete` (L32)
- **Admin Client:** `service_role_key` (L14)
- **Auth Check:** No auth evidence found after inspecting handler
- **RBAC/Ownership:** None
- **Input Parsing:** No parsing evidence
- **Validation:** No validation evidence
#### Analysis
- **Specific Problem:** Unauthenticated route explicitly accesses/modifies sensitive tables or performs destructive actions.
- **Specific Impact:** Unauthenticated users can select and delete notifications records directly.
- **Recommended Fix:** Wrap the route handler with `guardAPI()` before any DB operations.
- **Verification Test:** Attempt to cURL the route without an Authorization header; assert 401 Unauthorized.

---

### `/api/notifications/mark-all-read`
- **File Path:** `/apps/web/app/api/notifications/mark-all-read/route.ts`
- **Method(s):** POST
- **Severity:** **Critical**

#### Exact Evidence
- **Tables Accessed:** `notifications` (L31)
- **Operations:** `update` (L32)<br>`select` (L38)
- **Admin Client:** `service_role_key` (L14)
- **Auth Check:** No auth evidence found after inspecting handler
- **RBAC/Ownership:** None
- **Input Parsing:** No parsing evidence
- **Validation:** No validation evidence
#### Analysis
- **Specific Problem:** Unauthenticated route explicitly accesses/modifies sensitive tables or performs destructive actions.
- **Specific Impact:** Unauthenticated users can update and select notifications records directly.
- **Recommended Fix:** Wrap the route handler with `guardAPI()` before any DB operations.
- **Verification Test:** Attempt to cURL the route without an Authorization header; assert 401 Unauthorized.

---

### `/api/notifications/[id]`
- **File Path:** `/apps/web/app/api/notifications/[id]/route.ts`
- **Method(s):** GET, PATCH, DELETE
- **Severity:** **Critical**

#### Exact Evidence
- **Tables Accessed:** `notifications` (L19)<br>`notifications` (L78)<br>`notifications` (L116)
- **Operations:** `update` (L79)<br>`select` (L20)<br>`delete` (L117)<br>`select` (L82)
- **Auth Check:** No auth evidence found after inspecting handler
- **RBAC/Ownership:** None
- **Input Parsing:** `request.json()` (L54)
- **Validation:** No validation evidence
#### Analysis
- **Specific Problem:** Unauthenticated route explicitly accesses/modifies sensitive tables or performs destructive actions.
- **Specific Impact:** Unauthenticated users can update, select and delete notifications records directly.
- **Recommended Fix:** Wrap the route handler with `guardAPI()` before any DB operations.
- **Verification Test:** Attempt to cURL the route without an Authorization header; assert 401 Unauthorized.

---

### `/api/analytics/dashboard`
- **File Path:** `/apps/web/app/api/analytics/dashboard/route.ts`
- **Method(s):** GET
- **Severity:** **Critical**

#### Exact Evidence
- **Tables Accessed:** `dcas` (L85)<br>`cases` (L22)<br>`sla_logs` (L101)
- **Operations:** `select` (L102)<br>`select` (L23)<br>`select` (L86)
- **Auth Check:** No auth evidence found after inspecting handler
- **RBAC/Ownership:** None
- **Input Parsing:** No parsing evidence
- **Validation:** Manual `if (!field)` (L35)<br>Manual `if (!field)` (L91)<br>Manual `if (!field)` (L33)
#### Analysis
- **Specific Problem:** Unauthenticated route explicitly accesses/modifies sensitive tables or performs destructive actions.
- **Specific Impact:** Unauthenticated users can select dcas, cases and sla_logs records directly.
- **Recommended Fix:** Wrap the route handler with `guardAPI()` before any DB operations.
- **Verification Test:** Attempt to cURL the route without an Authorization header; assert 401 Unauthorized.

---

### `/api/reports/generate`
- **File Path:** `/apps/web/app/api/reports/generate/route.ts`
- **Method(s):** GET, POST
- **Severity:** **Critical**

#### Exact Evidence
- **Tables Accessed:** `cases` (L267)<br>`cases` (L356)<br>`cases` (L137)<br>`sla_logs` (L225)<br>`dcas` (L191)
- **Operations:** `select` (L356)<br>`select` (L226)<br>`select` (L192)<br>`select` (L268)<br>`select` (L138)
- **Admin Client:** `createAdminClient` (L34)<br>`createAdminClient` (L345)
- **Auth Check:** No auth evidence found after inspecting handler
- **RBAC/Ownership:** None
- **Input Parsing:** `searchParams.get` (L342)<br>`searchParams.get` (L341)<br>`searchParams.get` (L343)<br>`request.json()` (L35)
- **Validation:** Manual `if (!field)` (L39)<br>Manual `if (!field)` (L50)<br>Manual `if (!field)` (L58)
#### Analysis
- **Specific Problem:** Unauthenticated route explicitly accesses/modifies sensitive tables or performs destructive actions.
- **Specific Impact:** Unauthenticated users can select dcas, cases and sla_logs records directly.
- **Recommended Fix:** Wrap the route handler with `guardAPI()` before any DB operations.
- **Verification Test:** Attempt to cURL the route without an Authorization header; assert 401 Unauthorized.

---

## 2. High Severity Vulnerabilities

### `/api/health`
- **File Path:** `/apps/web/app/api/health/route.ts`
- **Method(s):** GET
- **Severity:** **High**

#### Exact Evidence
- **Tables Accessed:** `cases` (L65)<br>`dcas` (L66)<br>`regions` (L53)<br>`users` (L67)<br>`audit_logs` (L112)<br>`audit_logs` (L142)<br>`regions` (L68)
- **Operations:** `select` (L143)<br>`select` (L113)<br>`select` (L54)<br>`select` (L66)<br>`select` (L67)<br>`select` (L65)<br>`fetch/proxy` (L94)<br>`select` (L68)
- **Admin Client:** `service_role_key` (L177)<br>`createAdminClient` (L185)
- **Auth Check:** No auth evidence found after inspecting handler
- **RBAC/Ownership:** None
- **Input Parsing:** No parsing evidence
- **Validation:** Manual `if (!field)` (L149)<br>Manual `if (!field)` (L198)<br>Manual `if (!field)` (L177)<br>Manual `if (!field)` (L119)<br>Manual `if (!field)` (L200)
#### Analysis
- **Specific Problem:** Health route queries sensitive tables (`regions` (L53), `cases` (L65), `dcas` (L66), `users` (L67), `regions` (L68), `audit_logs` (L112), `audit_logs` (L142)) using admin client. Exposes DB internals.
- **Specific Impact:** Authenticated non-admin users may access other tenants' audit_logs, regions, dcas, users and cases records because the admin client bypasses RLS and RBAC is missing.
- **Recommended Fix:** Remove the admin client or add a strict `.eq('organization_id', user.org)` filter.
- **Verification Test:** Attempt to access another org's data using a standard user token; assert 403 Forbidden.

---

### `/api/admin/cases`
- **File Path:** `/apps/web/app/api/admin/cases/route.ts`
- **Method(s):** GET
- **Severity:** **High**

#### Exact Evidence
- **Tables Accessed:** `users` (L30)<br>`cases` (L47)
- **Operations:** `select` (L31)<br>`select` (L48)
- **Admin Client:** `createAdminClient` (L25)
- **Auth Check:** `getCurrentUser` (L14)
- **RBAC/Ownership:** None
- **Input Parsing:** `searchParams.get` (L43)
- **Validation:** Manual `if (!field)` (L16)<br>Manual `if (!field)` (L35)
#### Analysis
- **Specific Problem:** Authenticated route uses admin client (RLS bypass) without compensating RBAC/ownership checks.
- **Specific Impact:** Authenticated non-admin users may access other tenants' users and cases records because the admin client bypasses RLS and RBAC is missing.
- **Recommended Fix:** Remove the admin client or add a strict `.eq('organization_id', user.org)` filter.
- **Verification Test:** Attempt to access another org's data using a standard user token; assert 403 Forbidden.

---

### `/api/admin/dashboard`
- **File Path:** `/apps/web/app/api/admin/dashboard/route.ts`
- **Method(s):** GET
- **Severity:** **High**

#### Exact Evidence
- **Tables Accessed:** `cases` (L46)<br>`users` (L79)<br>`cases` (L90)<br>`users` (L31)
- **Operations:** `select` (L32)<br>`select` (L47)<br>`select` (L80)<br>`select` (L91)
- **Admin Client:** `createAdminClient` (L26)
- **Auth Check:** `getCurrentUser` (L14)
- **RBAC/Ownership:** None
- **Input Parsing:** No parsing evidence
- **Validation:** Manual `if (!field)` (L16)<br>Manual `if (!field)` (L36)
#### Analysis
- **Specific Problem:** Authenticated route uses admin client (RLS bypass) without compensating RBAC/ownership checks.
- **Specific Impact:** Authenticated non-admin users may access other tenants' users and cases records because the admin client bypasses RLS and RBAC is missing.
- **Recommended Fix:** Remove the admin client or add a strict `.eq('organization_id', user.org)` filter.
- **Verification Test:** Attempt to access another org's data using a standard user token; assert 403 Forbidden.

---

### `/api/admin/team`
- **File Path:** `/apps/web/app/api/admin/team/route.ts`
- **Method(s):** GET
- **Severity:** **High**

#### Exact Evidence
- **Tables Accessed:** `users` (L30)<br>`cases` (L65)<br>`users` (L43)
- **Operations:** `select` (L31)<br>`select` (L44)<br>`select` (L66)
- **Admin Client:** `createAdminClient` (L25)
- **Auth Check:** `getCurrentUser` (L14)
- **RBAC/Ownership:** None
- **Input Parsing:** No parsing evidence
- **Validation:** Manual `if (!field)` (L16)<br>Manual `if (!field)` (L35)
#### Analysis
- **Specific Problem:** Authenticated route uses admin client (RLS bypass) without compensating RBAC/ownership checks.
- **Specific Impact:** Authenticated non-admin users may access other tenants' users and cases records because the admin client bypasses RLS and RBAC is missing.
- **Recommended Fix:** Remove the admin client or add a strict `.eq('organization_id', user.org)` filter.
- **Verification Test:** Attempt to access another org's data using a standard user token; assert 403 Forbidden.

---

### `/api/admin/notifications`
- **File Path:** `/apps/web/app/api/admin/notifications/route.ts`
- **Method(s):** GET
- **Severity:** **High**

#### Exact Evidence
- **Tables Accessed:** `users` (L32)<br>`cases` (L72)<br>`cases` (L49)
- **Operations:** `select` (L50)<br>`select` (L33)<br>`select` (L73)
- **Admin Client:** `createAdminClient` (L27)
- **Auth Check:** `getCurrentUser` (L16)
- **RBAC/Ownership:** None
- **Input Parsing:** No parsing evidence
- **Validation:** Manual `if (!field)` (L18)<br>Manual `if (!field)` (L37)<br>Manual `if (!field)` (L80)
#### Analysis
- **Specific Problem:** Authenticated route uses admin client (RLS bypass) without compensating RBAC/ownership checks.
- **Specific Impact:** Authenticated non-admin users may access other tenants' users and cases records because the admin client bypasses RLS and RBAC is missing.
- **Recommended Fix:** Remove the admin client or add a strict `.eq('organization_id', user.org)` filter.
- **Verification Test:** Attempt to access another org's data using a standard user token; assert 403 Forbidden.

---

### `/api/agent/calendar`
- **File Path:** `/apps/web/app/api/agent/calendar/route.ts`
- **Method(s):** GET, POST
- **Severity:** **High**

#### Exact Evidence
- **Tables Accessed:** `cases` (L62)<br>`scheduled_callbacks` (L127)<br>`case_activities` (L148)<br>`scheduled_callbacks` (L36)<br>`cases` (L115)
- **Operations:** `insert` (L149)<br>`select` (L135)<br>`select` (L63)<br>`select` (L37)<br>`insert` (L128)<br>`select` (L116)
- **Admin Client:** `createAdminClient` (L28)<br>`createAdminClient` (L110)
- **Auth Check:** `getCurrentUser` (L15)<br>`getCurrentUser` (L93)
- **RBAC/Ownership:** None
- **Input Parsing:** `searchParams.get` (L26)<br>`request.json()` (L103)
- **Validation:** Manual `if (!field)` (L17)<br>Manual `if (!field)` (L106)<br>Manual `if (!field)` (L95)
#### Analysis
- **Specific Problem:** Authenticated route uses admin client (RLS bypass) without compensating RBAC/ownership checks.
- **Specific Impact:** Authenticated non-admin users may access other tenants' scheduled_callbacks, case_activities and cases records because the admin client bypasses RLS and RBAC is missing.
- **Recommended Fix:** Remove the admin client or add a strict `.eq('organization_id', user.org)` filter.
- **Verification Test:** Attempt to access another org's data using a standard user token; assert 403 Forbidden.

---

### `/api/agent/cases`
- **File Path:** `/apps/web/app/api/agent/cases/route.ts`
- **Method(s):** GET
- **Severity:** **High**

#### Exact Evidence
- **Tables Accessed:** `cases` (L37)<br>`sla_logs` (L75)
- **Operations:** `select` (L76)<br>`select` (L38)
- **Admin Client:** `createAdminClient` (L26)
- **Auth Check:** `getCurrentUser` (L15)
- **RBAC/Ownership:** None
- **Input Parsing:** `searchParams.get` (L31)<br>`searchParams.get` (L32)
- **Validation:** Manual `if (!field)` (L88)<br>Manual `if (!field)` (L17)<br>Manual `if (!field)` (L82)
#### Analysis
- **Specific Problem:** Authenticated route uses admin client (RLS bypass) without compensating RBAC/ownership checks.
- **Specific Impact:** Authenticated non-admin users may access other tenants' cases and sla_logs records because the admin client bypasses RLS and RBAC is missing.
- **Recommended Fix:** Remove the admin client or add a strict `.eq('organization_id', user.org)` filter.
- **Verification Test:** Attempt to access another org's data using a standard user token; assert 403 Forbidden.

---

### `/api/agent/cases/[id]`
- **File Path:** `/apps/web/app/api/agent/cases/[id]/route.ts`
- **Method(s):** GET
- **Severity:** **High**

#### Exact Evidence
- **Tables Accessed:** `case_activities` (L54)<br>`sla_logs` (L98)<br>`cases` (L34)<br>`users` (L71)
- **Operations:** `select` (L99)<br>`select` (L55)<br>`select` (L72)<br>`select` (L35)
- **Admin Client:** `createAdminClient` (L29)
- **Auth Check:** `getCurrentUser` (L18)
- **RBAC/Ownership:** None
- **Input Parsing:** No parsing evidence
- **Validation:** Manual `if (!field)` (L20)<br>Manual `if (!field)` (L48)<br>Manual `if (!field)` (L105)
#### Analysis
- **Specific Problem:** Authenticated route uses admin client (RLS bypass) without compensating RBAC/ownership checks.
- **Specific Impact:** Authenticated non-admin users may access other tenants' users, case_activities, cases and sla_logs records because the admin client bypasses RLS and RBAC is missing.
- **Recommended Fix:** Remove the admin client or add a strict `.eq('organization_id', user.org)` filter.
- **Verification Test:** Attempt to access another org's data using a standard user token; assert 403 Forbidden.

---

### `/api/agent/cases/[id]/activity`
- **File Path:** `/apps/web/app/api/agent/cases/[id]/activity/route.ts`
- **Method(s):** POST
- **Severity:** **High**

#### Exact Evidence
- **Tables Accessed:** `cases` (L41)<br>`cases` (L85)<br>`case_activities` (L58)
- **Operations:** `select` (L66)<br>`insert` (L59)<br>`update` (L86)<br>`select` (L42)
- **Admin Client:** `createAdminClient` (L36)
- **Auth Check:** `getCurrentUser` (L17)
- **RBAC/Ownership:** None
- **Input Parsing:** `request.json()` (L28)
- **Validation:** Manual `if (!field)` (L52)<br>Manual `if (!field)` (L31)<br>Manual `if (!field)` (L19)
#### Analysis
- **Specific Problem:** Authenticated route uses admin client (RLS bypass) without compensating RBAC/ownership checks.
- **Specific Impact:** Authenticated non-admin users may access other tenants' case_activities and cases records because the admin client bypasses RLS and RBAC is missing.
- **Recommended Fix:** Remove the admin client or add a strict `.eq('organization_id', user.org)` filter.
- **Verification Test:** Attempt to access another org's data using a standard user token; assert 403 Forbidden.

---

### `/api/agent/cases/[id]/payment`
- **File Path:** `/apps/web/app/api/agent/cases/[id]/payment/route.ts`
- **Method(s):** POST
- **Severity:** **High**

#### Exact Evidence
- **Tables Accessed:** `cases` (L40)<br>`case_activities` (L55)<br>`cases` (L81)
- **Operations:** `update` (L82)<br>`insert` (L56)<br>`select` (L41)
- **Admin Client:** `createAdminClient` (L35)
- **Auth Check:** `getCurrentUser` (L17)
- **RBAC/Ownership:** None
- **Input Parsing:** `request.json()` (L28)
- **Validation:** Manual `if (!field)` (L31)<br>Manual `if (!field)` (L19)
#### Analysis
- **Specific Problem:** Authenticated route uses admin client (RLS bypass) without compensating RBAC/ownership checks.
- **Specific Impact:** Authenticated non-admin users may access other tenants' case_activities and cases records because the admin client bypasses RLS and RBAC is missing.
- **Recommended Fix:** Remove the admin client or add a strict `.eq('organization_id', user.org)` filter.
- **Verification Test:** Attempt to access another org's data using a standard user token; assert 403 Forbidden.

---

### `/api/agent/cases/[id]/status`
- **File Path:** `/apps/web/app/api/agent/cases/[id]/status/route.ts`
- **Method(s):** POST
- **Severity:** **High**

#### Exact Evidence
- **Tables Accessed:** `cases` (L70)<br>`cases` (L49)<br>`case_activities` (L81)
- **Operations:** `update` (L71)<br>`insert` (L82)<br>`select` (L50)
- **Admin Client:** `createAdminClient` (L44)
- **Auth Check:** `getCurrentUser` (L26)
- **RBAC/Ownership:** None
- **Input Parsing:** `request.json()` (L37)
- **Validation:** Manual `if (!field)` (L28)<br>Manual `if (!field)` (L40)<br>Manual `if (!field)` (L62)
#### Analysis
- **Specific Problem:** Authenticated route uses admin client (RLS bypass) without compensating RBAC/ownership checks.
- **Specific Impact:** Authenticated non-admin users may access other tenants' case_activities and cases records because the admin client bypasses RLS and RBAC is missing.
- **Recommended Fix:** Remove the admin client or add a strict `.eq('organization_id', user.org)` filter.
- **Verification Test:** Attempt to access another org's data using a standard user token; assert 403 Forbidden.

---

### `/api/agent/dashboard`
- **File Path:** `/apps/web/app/api/agent/dashboard/route.ts`
- **Method(s):** GET
- **Severity:** **High**

#### Exact Evidence
- **Tables Accessed:** `cases` (L34)<br>`sla_logs` (L70)
- **Operations:** `select` (L71)<br>`select` (L35)
- **Admin Client:** `createAdminClient` (L26)
- **Auth Check:** `getCurrentUser` (L15)<br>`getCurrentUser` (L11)
- **RBAC/Ownership:** None
- **Input Parsing:** No parsing evidence
- **Validation:** Manual `if (!field)` (L17)
#### Analysis
- **Specific Problem:** Authenticated route uses admin client (RLS bypass) without compensating RBAC/ownership checks.
- **Specific Impact:** Authenticated non-admin users may access other tenants' cases and sla_logs records because the admin client bypasses RLS and RBAC is missing.
- **Recommended Fix:** Remove the admin client or add a strict `.eq('organization_id', user.org)` filter.
- **Verification Test:** Attempt to access another org's data using a standard user token; assert 403 Forbidden.

---

### `/api/agent/notifications`
- **File Path:** `/apps/web/app/api/agent/notifications/route.ts`
- **Method(s):** GET
- **Severity:** **High**

#### Exact Evidence
- **Tables Accessed:** `agent_notifications` (L31)<br>`cases` (L55)
- **Operations:** `select` (L32)<br>`select` (L56)
- **Admin Client:** `createAdminClient` (L27)
- **Auth Check:** `getCurrentUser` (L14)
- **RBAC/Ownership:** None
- **Input Parsing:** `searchParams.get` (L25)
- **Validation:** Manual `if (!field)` (L16)
#### Analysis
- **Specific Problem:** Authenticated route uses admin client (RLS bypass) without compensating RBAC/ownership checks.
- **Specific Impact:** Authenticated non-admin users may access other tenants' cases and agent_notifications records because the admin client bypasses RLS and RBAC is missing.
- **Recommended Fix:** Remove the admin client or add a strict `.eq('organization_id', user.org)` filter.
- **Verification Test:** Attempt to access another org's data using a standard user token; assert 403 Forbidden.

---

### `/api/agent/stats`
- **File Path:** `/apps/web/app/api/agent/stats/route.ts`
- **Method(s):** GET
- **Severity:** **High**

#### Exact Evidence
- **Tables Accessed:** `cases` (L48)
- **Operations:** `select` (L49)
- **Admin Client:** `createAdminClient` (L44)
- **Auth Check:** `getCurrentUser` (L34)
- **RBAC/Ownership:** None
- **Input Parsing:** No parsing evidence
- **Validation:** Manual `if (!field)` (L36)
#### Analysis
- **Specific Problem:** Authenticated route uses admin client (RLS bypass) without compensating RBAC/ownership checks.
- **Specific Impact:** Authenticated non-admin users may access other tenants' cases records because the admin client bypasses RLS and RBAC is missing.
- **Recommended Fix:** Remove the admin client or add a strict `.eq('organization_id', user.org)` filter.
- **Verification Test:** Attempt to access another org's data using a standard user token; assert 403 Forbidden.

---

### `/api/manager/cases`
- **File Path:** `/apps/web/app/api/manager/cases/route.ts`
- **Method(s):** GET
- **Severity:** **High**

#### Exact Evidence
- **Tables Accessed:** `sla_logs` (L117)<br>`users` (L51)<br>`cases` (L71)<br>`users` (L37)
- **Operations:** `select` (L52)<br>`select` (L118)<br>`select` (L72)<br>`select` (L38)
- **Admin Client:** `createAdminClient` (L31)
- **Auth Check:** `getCurrentUser` (L15)
- **RBAC/Ownership:** None
- **Input Parsing:** `searchParams.get` (L29)<br>`searchParams.get` (L28)<br>`searchParams.get` (L26)<br>`searchParams.get` (L27)
- **Validation:** Manual `if (!field)` (L17)<br>Manual `if (!field)` (L42)
#### Analysis
- **Specific Problem:** Authenticated route uses admin client (RLS bypass) without compensating RBAC/ownership checks.
- **Specific Impact:** Authenticated non-admin users may access other tenants' users, cases and sla_logs records because the admin client bypasses RLS and RBAC is missing.
- **Recommended Fix:** Remove the admin client or add a strict `.eq('organization_id', user.org)` filter.
- **Verification Test:** Attempt to access another org's data using a standard user token; assert 403 Forbidden.

---

### `/api/manager/cases/[id]`
- **File Path:** `/apps/web/app/api/manager/cases/[id]/route.ts`
- **Method(s):** GET
- **Severity:** **High**

#### Exact Evidence
- **Tables Accessed:** `users` (L39)<br>`users` (L118)<br>`users` (L67)<br>`case_activities` (L97)<br>`sla_logs` (L138)<br>`users` (L87)<br>`cases` (L53)
- **Operations:** `select` (L40)<br>`select` (L139)<br>`select` (L88)<br>`select` (L54)<br>`select` (L98)<br>`select` (L119)<br>`select` (L68)
- **Admin Client:** `createAdminClient` (L33)
- **Auth Check:** `getCurrentUser` (L23)
- **RBAC/Ownership:** None
- **Input Parsing:** No parsing evidence
- **Validation:** Manual `if (!field)` (L25)<br>Manual `if (!field)` (L44)
#### Analysis
- **Specific Problem:** Authenticated route uses admin client (RLS bypass) without compensating RBAC/ownership checks.
- **Specific Impact:** Authenticated non-admin users may access other tenants' users, cases, case_activities and sla_logs records because the admin client bypasses RLS and RBAC is missing.
- **Recommended Fix:** Remove the admin client or add a strict `.eq('organization_id', user.org)` filter.
- **Verification Test:** Attempt to access another org's data using a standard user token; assert 403 Forbidden.

---

### `/api/manager/cases/[id]/reassign`
- **File Path:** `/apps/web/app/api/manager/cases/[id]/reassign/route.ts`
- **Method(s):** POST
- **Severity:** **High**

#### Exact Evidence
- **Tables Accessed:** `case_activities` (L132)<br>`cases` (L118)<br>`users` (L98)<br>`users` (L47)<br>`users` (L61)<br>`cases` (L85)
- **Operations:** `select` (L48)<br>`select` (L86)<br>`insert` (L132)<br>`select` (L99)<br>`update` (L119)<br>`select` (L62)
- **Admin Client:** `createAdminClient` (L41)
- **Auth Check:** `getCurrentUser` (L23)
- **RBAC/Ownership:** None
- **Input Parsing:** `request.json()` (L34)
- **Validation:** Manual `if (!field)` (L52)<br>Manual `if (!field)` (L25)<br>Manual `if (!field)` (L90)<br>Manual `if (!field)` (L66)<br>Manual `if (!field)` (L37)
#### Analysis
- **Specific Problem:** Authenticated route uses admin client (RLS bypass) without compensating RBAC/ownership checks.
- **Specific Impact:** Authenticated non-admin users may access other tenants' users, case_activities and cases records because the admin client bypasses RLS and RBAC is missing.
- **Recommended Fix:** Remove the admin client or add a strict `.eq('organization_id', user.org)` filter.
- **Verification Test:** Attempt to access another org's data using a standard user token; assert 403 Forbidden.

---

### `/api/manager/cases/[id]/escalate`
- **File Path:** `/apps/web/app/api/manager/cases/[id]/escalate/route.ts`
- **Method(s):** POST
- **Severity:** **High**

#### Exact Evidence
- **Tables Accessed:** `cases` (L122)<br>`users` (L99)<br>`case_activities` (L139)<br>`users` (L59)<br>`notifications` (L150)<br>`cases` (L73)<br>`users` (L112)
- **Operations:** `insert` (L150)<br>`select` (L113)<br>`insert` (L139)<br>`select` (L100)<br>`update` (L123)<br>`select` (L74)<br>`select` (L60)
- **Admin Client:** `createAdminClient` (L53)
- **Auth Check:** `getCurrentUser` (L35)
- **RBAC/Ownership:** None
- **Input Parsing:** `request.json()` (L46)
- **Validation:** Manual `if (!field)` (L64)<br>Manual `if (!field)` (L49)<br>Manual `if (!field)` (L88)<br>Manual `if (!field)` (L37)<br>Manual `if (!field)` (L78)
#### Analysis
- **Specific Problem:** Authenticated route uses admin client (RLS bypass) without compensating RBAC/ownership checks.
- **Specific Impact:** Authenticated non-admin users may access other tenants' users, case_activities, cases and notifications records because the admin client bypasses RLS and RBAC is missing.
- **Recommended Fix:** Remove the admin client or add a strict `.eq('organization_id', user.org)` filter.
- **Verification Test:** Attempt to access another org's data using a standard user token; assert 403 Forbidden.

---

### `/api/manager/dashboard`
- **File Path:** `/apps/web/app/api/manager/dashboard/route.ts`
- **Method(s):** GET
- **Severity:** **High**

#### Exact Evidence
- **Tables Accessed:** `users` (L32)<br>`cases` (L152)<br>`cases` (L56)<br>`users` (L46)<br>`sla_logs` (L98)<br>`dcas` (L167)
- **Operations:** `select` (L57)<br>`select` (L33)<br>`select` (L99)<br>`select` (L153)<br>`select` (L47)<br>`select` (L168)
- **Admin Client:** `createAdminClient` (L26)
- **Auth Check:** `getCurrentUser` (L15)
- **RBAC/Ownership:** None
- **Input Parsing:** No parsing evidence
- **Validation:** Manual `if (!field)` (L17)<br>Manual `if (!field)` (L37)
#### Analysis
- **Specific Problem:** Authenticated route uses admin client (RLS bypass) without compensating RBAC/ownership checks.
- **Specific Impact:** Authenticated non-admin users may access other tenants' dcas, users, cases and sla_logs records because the admin client bypasses RLS and RBAC is missing.
- **Recommended Fix:** Remove the admin client or add a strict `.eq('organization_id', user.org)` filter.
- **Verification Test:** Attempt to access another org's data using a standard user token; assert 403 Forbidden.

---

### `/api/manager/team`
- **File Path:** `/apps/web/app/api/manager/team/route.ts`
- **Method(s):** GET
- **Severity:** **High**

#### Exact Evidence
- **Tables Accessed:** `users` (L35)<br>`dcas` (L141)<br>`users` (L49)<br>`sla_logs` (L103)<br>`cases` (L66)<br>`cases` (L74)
- **Operations:** `select` (L142)<br>`select` (L36)<br>`select` (L50)<br>`select` (L67)<br>`select` (L104)<br>`select` (L75)
- **Admin Client:** `createAdminClient` (L29)
- **Auth Check:** `getCurrentUser` (L19)
- **RBAC/Ownership:** None
- **Input Parsing:** No parsing evidence
- **Validation:** Manual `if (!field)` (L21)<br>Manual `if (!field)` (L40)
#### Analysis
- **Specific Problem:** Authenticated route uses admin client (RLS bypass) without compensating RBAC/ownership checks.
- **Specific Impact:** Authenticated non-admin users may access other tenants' dcas, users, cases and sla_logs records because the admin client bypasses RLS and RBAC is missing.
- **Recommended Fix:** Remove the admin client or add a strict `.eq('organization_id', user.org)` filter.
- **Verification Test:** Attempt to access another org's data using a standard user token; assert 403 Forbidden.

---

### `/api/manager/notifications`
- **File Path:** `/apps/web/app/api/manager/notifications/route.ts`
- **Method(s):** GET, PUT
- **Severity:** **High**

#### Exact Evidence
- **Tables Accessed:** `notifications` (L32)<br>`notifications` (L90)<br>`notifications` (L98)<br>`notifications` (L52)
- **Operations:** `update` (L99)<br>`select` (L53)<br>`select` (L33)<br>`update` (L91)
- **Admin Client:** `createAdminClient` (L27)<br>`createAdminClient` (L83)
- **Auth Check:** `getCurrentUser` (L14)<br>`getCurrentUser` (L70)
- **RBAC/Ownership:** None
- **Input Parsing:** `searchParams.get` (L25)<br>`request.json()` (L80)
- **Validation:** Manual `if (!field)` (L16)<br>Manual `if (!field)` (L72)
#### Analysis
- **Specific Problem:** Authenticated route uses admin client (RLS bypass) without compensating RBAC/ownership checks.
- **Specific Impact:** Authenticated non-admin users may access other tenants' notifications records because the admin client bypasses RLS and RBAC is missing.
- **Recommended Fix:** Remove the admin client or add a strict `.eq('organization_id', user.org)` filter.
- **Verification Test:** Attempt to access another org's data using a standard user token; assert 403 Forbidden.

---

## 3. Medium Severity Findings

### `/api/auth/check-active`
- **File Path:** `/apps/web/app/api/auth/check-active/route.ts`
- **Method(s):** POST
- **Severity:** **Medium**

#### Exact Evidence
- **Tables Accessed:** `users` (L25)
- **Operations:** `select` (L26)
- **Admin Client:** `createAdminClient` (L22)
- **Auth Check:** No auth evidence found after inspecting handler
- **RBAC/Ownership:** None
- **Input Parsing:** `request.json()` (L12)
- **Validation:** Manual `if (!field)` (L14)
#### Analysis
- **Specific Problem:** Public auth flow requires rate limiting verification to prevent brute force.
- **Specific Impact:** Account enumeration, credential stuffing, or malformed data injection.
- **Recommended Fix:** Implement Zod schema validation and Upstash rate limiting (e.g., 5 req/min).
- **Verification Test:** Send 10 rapid requests and verify a 429 Too Many Requests response.

---

### `/api/auth/forgot-password`
- **File Path:** `/apps/web/app/api/auth/forgot-password/route.ts`
- **Method(s):** POST
- **Severity:** **Medium**

#### Exact Evidence
- **Tables Accessed:** None found
- **Operations:** None found
- **Auth Check:** No auth evidence found after inspecting handler
- **RBAC/Ownership:** None
- **Input Parsing:** `request.json()` (L14)
- **Validation:** Manual `if (!field)` (L17)<br>Manual `if (!field)` (L26)
#### Analysis
- **Specific Problem:** Public auth flow requires rate limiting verification to prevent brute force.
- **Specific Impact:** Account enumeration, credential stuffing, or malformed data injection.
- **Recommended Fix:** Implement Zod schema validation and Upstash rate limiting (e.g., 5 req/min).
- **Verification Test:** Send 10 rapid requests and verify a 429 Too Many Requests response.

---

### `/api/health/email`
- **File Path:** `/apps/web/app/api/health/email/route.ts`
- **Method(s):** GET
- **Severity:** **Medium**

#### Exact Evidence
- **Tables Accessed:** None found
- **Operations:** None found
- **Auth Check:** No auth evidence found after inspecting handler
- **RBAC/Ownership:** None
- **Input Parsing:** No parsing evidence
- **Validation:** No validation evidence
#### Analysis
- **Specific Problem:** Health route exposes environment variables or dependency internals.
- **Specific Impact:** Operational metadata leakage or environment variable exposure, which aids reconnaissance.
- **Recommended Fix:** Sanitize the response object to only return a static `{ status: 'ok' }` string.
- **Verification Test:** cURL the route and confirm no secrets/internal IPs are present in the JSON body.

---

### `/api/ml/health`
- **File Path:** `/apps/web/app/api/ml/health/route.ts`
- **Method(s):** GET
- **Severity:** **Medium**

#### Exact Evidence
- **Tables Accessed:** None found
- **Operations:** `fetch/proxy` (L20)
- **Auth Check:** No auth evidence found after inspecting handler
- **RBAC/Ownership:** None
- **Input Parsing:** No parsing evidence
- **Validation:** No validation evidence
#### Analysis
- **Specific Problem:** Health route exposes environment variables or dependency internals.
- **Specific Impact:** Operational metadata leakage or environment variable exposure, which aids reconnaissance.
- **Recommended Fix:** Sanitize the response object to only return a static `{ status: 'ok' }` string.
- **Verification Test:** cURL the route and confirm no secrets/internal IPs are present in the JSON body.

---

## 4. Low Severity Findings

### `/api/v1/governance/system-health`
- **File Path:** `/apps/web/app/api/v1/governance/system-health/route.ts`
- **Method(s):** GET
- **Severity:** **Low**

#### Exact Evidence
- **Tables Accessed:** None found
- **Operations:** None found
- **Auth Check:** No auth evidence found after inspecting handler
- **RBAC/Ownership:** None
- **Input Parsing:** No parsing evidence
- **Validation:** No validation evidence
#### Analysis
- **Specific Problem:** Public static uptime/status route with proven non-sensitive output.
- **Specific Impact:** None. Route operates safely as a static health check.
- **Recommended Fix:** No action required.
- **Verification Test:** Ensure monitoring tools can reach the endpoint.

---

### `/api/account-deletion`
- **File Path:** `/apps/web/app/api/account-deletion/route.ts`
- **Method(s):** GET, POST
- **Severity:** **Low**

#### Exact Evidence
- **Tables Accessed:** `account_deletion_requests` (L80)<br>`users` (L159)<br>`account_deletion_requests` (L165)<br>`account_deletion_requests` (L144)<br>`users` (L73)<br>`account_deletion_requests` (L58)
- **Operations:** `insert` (L81)<br>`select` (L59)<br>`select` (L160)<br>`select` (L74)<br>`select` (L166)<br>`select` (L90)<br>`select` (L145)
- **Admin Client:** `createAdminClient` (L140)<br>`createAdminClient` (L54)
- **Auth Check:** `getCurrentUser` (L135)<br>`getCurrentUser` (L46)
- **RBAC/Ownership:** Ownership `.eq('user_id')` (L60)<br>Ownership `.eq('user_id')` (L146)
- **Input Parsing:** `request.json()` (L51)
- **Validation:** Manual `if (!field)` (L136)<br>Manual `if (!field)` (L47)
#### Analysis
- **Specific Problem:** Authenticated route with proper RBAC, Ownership, Validation, and safe DB order.
- **Specific Impact:** None. Identity validation succeeds.
- **Recommended Fix:** No action required.
- **Verification Test:** Ensure route returns 401 when token is missing/expired.

---

### `/api/account-deletion/[id]`
- **File Path:** `/apps/web/app/api/account-deletion/[id]/route.ts`
- **Method(s):** PUT
- **Severity:** **Low**

#### Exact Evidence
- **Tables Accessed:** `audit_logs` (L144)<br>`account_deletion_requests` (L107)<br>`notifications` (L143)<br>`users` (L90)<br>`users` (L152)<br>`account_deletion_requests` (L56)
- **Operations:** `update` (L108)<br>`select` (L57)<br>`delete` (L144)<br>`delete` (L153)<br>`delete` (L143)<br>`select` (L91)
- **Admin Client:** `createAdminClient` (L52)
- **Auth Check:** `getCurrentUser` (L36)
- **RBAC/Ownership:** Ownership `.eq('user_id')` (L144)
- **Input Parsing:** `request.json()` (L42)
- **Validation:** Manual `if (!field)` (L38)<br>Manual `if (!field)` (L45)<br>Manual `if (!field)` (L80)
#### Analysis
- **Specific Problem:** Authenticated route with proper RBAC, Ownership, Validation, and safe DB order.
- **Specific Impact:** None. Identity validation succeeds.
- **Recommended Fix:** No action required.
- **Verification Test:** Ensure route returns 401 when token is missing/expired.

---

### `/api/me`
- **File Path:** `/apps/web/app/api/me/route.ts`
- **Method(s):** GET
- **Severity:** **Low**

#### Exact Evidence
- **Tables Accessed:** None found
- **Operations:** None found
- **Auth Check:** `getCurrentUser` (L15)<br>`getCurrentUser` (L11)
- **RBAC/Ownership:** None
- **Input Parsing:** No parsing evidence
- **Validation:** Manual `if (!field)` (L17)
#### Analysis
- **Specific Problem:** Identity route properly enforces valid session check.
- **Specific Impact:** None. Identity validation succeeds.
- **Recommended Fix:** No action required.
- **Verification Test:** Ensure route returns 401 when token is missing/expired.

---

## 5. Needs Manual Review

The following routes could not be automatically classified due to custom logic or ambiguous operations:

- `/api/v1/cases/system-create`: Cannot determine exact exposure or operations from AST alone.
- `/api/v1/cases/[id]/transition`: Cannot determine exact exposure or operations from AST alone.
- `/api/v1/cases/manual-create`: Cannot determine exact exposure or operations from AST alone.
- `/api/v1/governance/dashboard`: Cannot determine exact exposure or operations from AST alone.
- `/api/v1/governance/analytics`: Cannot determine exact exposure or operations from AST alone.
- `/api/v1/sla/breach-check`: Auth present but no explicit table/operation traces found.
- `/api/settings/security/password`: Cannot determine exact exposure or operations from AST alone.
- `/api/regions/resolve`: Cannot determine exact exposure or operations from AST alone.
- `/api/places/autocomplete`: Cannot determine exact exposure or operations from AST alone.
- `/api/setup/database`: Cannot determine exact exposure or operations from AST alone.
- `/api/cases/allocate`: Auth present but no explicit table/operation traces found.
- `/api/ml/[...path]`: Cannot determine exact exposure or operations from AST alone.
- `/api/analytics/metrics`: Cannot determine exact exposure or operations from AST alone.