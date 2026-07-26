# 30-Day Stabilization Plan — Execution Tracker

> Last updated: 2026-02-20
> Status: **Week 1 Complete** | Week 2 Pending

---

## Week 1 — Stabilization ✅ COMPLETE

### P0 — Production Blocker Fixes

- [x] **Fix #1: Broken `createClient` import** (2 files)
  - `lib/auth/permissions.ts` — added `createClient` to import (line 1)
  - `app/(dashboard)/layout.tsx` — added `createClient` to import (line 5)
  - **Impact:** Every auth check and dashboard page was crashing at runtime

- [x] **Fix #2: Build error silencing**
  - `next.config.js` — removed `eslint.ignoreDuringBuilds` permanently
  - `next.config.js` — `typescript.ignoreBuildErrors` re-enabled temporarily
  - **Finding:** 492 pre-existing TS errors across 73 files (all Supabase type issues)
  - **Root cause:** `database.types.ts` lacks definitions for 15+ tables
  - **Fix path:** Run `supabase gen types typescript` (queued for Week 3)

- [x] **Fix #3: Secrets exposure check**
  - `.env.local` confirmed in `.gitignore` (line 13)
  - TODO: Rotate `SERVICE_SECRET` if `.env.local` was ever committed to git history

- [x] **Fix #4: `api-wrapper.ts` error handling audit**
  - Audited all 7 `catch` blocks (lines 130, 198, 246, 349, 506, 657, 827)
  - **Result:** All return correct HTTP status codes (401/403/429/500)
  - **No silent 200s found** — no changes needed

### Dead Code Removal

- [x] **Prisma removal** — `package.json`
  - Removed `prisma` and `@prisma/client` from devDependencies
  - Removed 4 dead scripts: `db:generate`, `db:push`, `db:studio`, `db:seed`

- [x] **CI fix** — `.github/workflows/ci.yml`
  - Migrated 3 jobs (`lint-web`, `test-web`, `build-web`) from `npm` → `pnpm`
  - Added `pnpm/action-setup@v4`, updated cache config

- [x] **Hardcoded URL fix** — `lib/governance/governance-service.ts`
  - Line 193: `'http://localhost:8000/health'` → `${process.env.ML_SERVICE_URL}/health`

### MFA Redirect Loop Fix

- [x] **`middleware.ts`** — Added `listFactors()` check before MFA redirect
  - Only redirects to `/mfa-verify` if user has verified TOTP factors enrolled
  - Prevents infinite redirect loop for admin roles without MFA enrollment

---

## Week 2 — Security & Governance Hardening 🔲 PENDING

### Day 6-7: RLS Policy Verification (FIRST PRIORITY)

- [ ] Write RLS integration test (`__tests__/security/rls-isolation.test.ts`)
  - Connect as DCA Agent, query cases, assert only own DCA's cases returned
  - Attempt cross-DCA read → assert rejection
- [ ] Manual RLS verification in Supabase SQL editor
  - Verify every data table has RLS policies
  - Verify `audit_logs` has no UPDATE/DELETE policy (immutability)
  - Run: `SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public'`

### Day 8-9: Rate Limiter Hardening

- [ ] `lib/rate-limit.ts` improvements:
  - Add periodic cleanup interval (every 60s)
  - Use `${userId}:${pathname}` as identifier when auth available
  - Add tighter limits for SYSTEM endpoints
  - Add `TODO: Replace with Redis/Upstash when scaling beyond single instance`

### Day 9-10: Audit Log Cleanup

- [ ] Delete legacy `logAudit` function (`audit/index.ts` lines 387-426)
- [ ] Delete legacy `logUserAction` re-export (line 429)
- [ ] Find and migrate all callers to `logHumanAction`
- [ ] Verify: `grep -r "logUserAction\|logAudit" apps/web/ --include="*.ts"` returns zero

---

## Week 3 — Architecture Simplification 🔲 PENDING

### Day 11-13: Dead Code & Type Safety

- [ ] Add comment to `organizationId` in `AuthUser`: "Reserved for future multi-tenant use"
- [ ] Clarify `lib/supabase/index.ts` exports with comments
- [ ] Run `supabase gen types typescript` to regenerate `database.types.ts`
- [ ] Re-run `tsc --noEmit` — target: reduce 492 errors significantly
- [ ] If errors drop below 50, remove `ignoreBuildErrors` from `next.config.js`

### Day 13-14: ML Proxy & Docker

- [ ] Make `system-case-creation.ts` and `manual-case-creation.ts` use `ml-client.ts`
- [ ] Create `docker-compose.dev.yml` with volume mounts for hot-reload

---

## Week 4 — Maturity & Observability 🔲 PENDING

### Day 15-17: E2E Tests (3 Strategic Tests)

- [ ] `e2e/auth-login.spec.ts` — Login as DCA Agent → reach dashboard
- [ ] `e2e/case-lifecycle.spec.ts` — View cases → open detail → change status
- [ ] `e2e/rbac-boundary.spec.ts` — Agent accesses admin page → expect redirect/403

### Day 17-18: Error Tracking & Health

- [ ] Create `lib/logging/structured-logger.ts` (JSON to stdout)
- [ ] Replace `console.error` in `audit/index.ts`, `governance-service.ts`, `permissions.ts`
- [ ] Extend `/api/health` to check Supabase + ML service connectivity

### Day 19-20: Correlation ID

- [ ] Verify `lib/tracing.ts` is wired into `api-wrapper.ts`
- [ ] Add `x-request-id` response header
- [ ] Include correlation ID in audit log entries and error logs

---

## Reference Files Changed (Week 1)

| File | What Changed |
|------|-------------|
| `lib/auth/permissions.ts` | Added `createClient` import |
| `app/(dashboard)/layout.tsx` | Added `createClient` import |
| `next.config.js` | Removed `ignoreDuringBuilds`, documented `ignoreBuildErrors` |
| `package.json` | Removed Prisma (2 packages, 4 scripts) |
| `.github/workflows/ci.yml` | npm → pnpm (3 jobs) |
| `lib/governance/governance-service.ts` | Hardcoded localhost → env var |
| `middleware.ts` | MFA factor check before redirect |

---

## Known Issues (Not In Scope)

| Issue | Why Deferred |
|-------|-------------|
| 492 TS errors from Supabase types | Requires `supabase gen types` (Week 3) |
| FedEx role workbenches missing | Feature work, not stabilization |
| No billing/subscription model | SaaS concern, separate design needed |
| No multi-tenancy (`tenant_id`) | SaaS concern, separate design needed |
| `api-wrapper.ts` is 851 lines | Refactor, not stabilization |
| 50+ `(supabase as any)` casts | Resolved by type regeneration (Week 3) |
