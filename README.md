# FedEx DCA Control Tower

**Enterprise Debt Collection Agency Management Platform**

> A governance-first, audit-compliant system for managing debt collection operations across multiple agencies, regions, and organizational boundaries.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Core Principles & Non-Negotiables](#2-core-principles--non-negotiables)
3. [System Architecture](#3-system-architecture)
4. [Role & Governance Model](#4-role--governance-model)
5. [UI Architecture & Workbenches](#5-ui-architecture--workbenches)
6. [Case Lifecycle & Allocation Flow](#6-case-lifecycle--allocation-flow)
7. [Upstream Ingestion Model](#7-upstream-ingestion-model)
8. [AI / Automation Responsibilities](#8-ai--automation-responsibilities)
9. [Security Model](#9-security-model)
10. [Database Design Overview](#10-database-design-overview)
11. [Audit & Compliance](#11-audit--compliance)
12. [Testing Strategy](#12-testing-strategy)
13. [Monitoring & Observability](#13-monitoring--observability)
14. [DevOps & CI/CD](#14-devops--cicd)
15. [Environment Setup](#15-environment-setup)
16. [Folder Structure](#16-folder-structure)
17. [API Overview](#17-api-overview)
18. [Known Constraints & Explicit Non-Goals](#18-known-constraints--explicit-non-goals)
19. [Roadmap](#19-roadmap)
20. [Final Governance Statement](#20-final-governance-statement)

---

## 1. Project Overview

### What This System Solves

The FedEx DCA Control Tower manages the distribution, tracking, and governance of debt collection cases across third-party Debt Collection Agencies (DCAs). It provides:

- Centralized case ingestion from upstream ERP/billing systems
- Automated allocation of cases to DCAs based on region, capacity, and performance
- Real-time SLA monitoring and escalation
- Complete audit trail for regulatory compliance
- Role-isolated workbenches for different operational personas

### What This System Does NOT Solve

| This System | External System |
|-------------|-----------------|
| Case assignment & tracking | Invoice generation |
| DCA performance monitoring | Payment processing |
| SLA enforcement | Customer relationship management |
| Audit logging | Financial reconciliation |

### Explicit Boundary

> **This is NOT a CRM, ERP, or payment system.**  
> The Control Tower receives cases from upstream systems and manages their lifecycle through collection. It does not create invoices, process payments, or manage customer relationships.

---

## 2. Core Principles & Non-Negotiables

| Principle | Meaning |
|-----------|---------|
| **Backend Authorization is Source of Truth** | All access decisions are made server-side. UI visibility is a convenience, not security. |
| **UI Never Governs Access** | Hiding a button or menu item is not access control. Every action is validated at the API layer. |
| **Region × Role × Organization Enforcement** | Users see only data within their region, allowed by their role, and scoped to their organization. |
| **SYSTEM Owns Case Creation** | Cases are created by upstream SYSTEM actors only. Humans cannot bypass ingestion governance. |
| **Audit Immutability** | Audit logs cannot be modified or deleted. `actor_type`, `region_id`, and `external_case_id` are immutable after creation. |
| **Fail Closed** | Missing permissions, invalid tokens, or ambiguous state result in denial, not fallback. |

---

## 3. System Architecture

### High-Level Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           UPSTREAM SYSTEMS                               │
│                    (ERP, Billing, RPA Bots, Legacy)                      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ POST /api/v1/cases/system-create
┌─────────────────────────────────────────────────────────────────────────┐
│                         INGESTION LAYER                                  │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐                   │
│   │ Auth Guard  │ → │ Validation  │ → │ Idempotency │                   │
│   │ (SYSTEM)    │   │ (Schema)    │   │ Check       │                   │
│   └─────────────┘   └─────────────┘   └─────────────┘                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         CONTROL TOWER CORE                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │ Region       │  │ DCA          │  │ Agent        │  │ SLA         │  │
│  │ Resolution   │→ │ Allocation   │→ │ Assignment   │→ │ Binding     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌───────────────┐          ┌───────────────┐          ┌───────────────┐
│   ADMIN UI    │          │   MANAGER UI  │          │   AGENT UI    │
│  (FedEx/SA)   │          │  (FM/DM)      │          │   (DCA_AGENT) │
└───────────────┘          └───────────────┘          └───────────────┘
        │                           │                           │
        └───────────────────────────┼───────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           SUPABASE (PostgreSQL)                          │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │
│   │ cases   │  │ dcas    │  │ users   │  │sla_logs │  │audit_   │      │
│   │         │  │         │  │         │  │         │  │logs     │      │
│   └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘      │
│                        RLS Policies + Triggers                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Ingestion API | Only accepts SYSTEM tokens (X-Service-Auth) |
| Human APIs | Only accepts authenticated session tokens |
| Database | RLS enforces row-level access per user context |
| AI Service | Advisory only; cannot execute mutations |

---

## 4. Role & Governance Model

### Role Hierarchy

```
SUPER_ADMIN (100)
    └── FEDEX_ADMIN (90)
            ├── FEDEX_MANAGER (70)
            ├── FEDEX_ANALYST (50)
            ├── FEDEX_AUDITOR (35)
            └── FEDEX_VIEWER (30)
    └── DCA_ADMIN (60)
            ├── DCA_MANAGER (40)
            └── DCA_AGENT (20)
```

### Role Intent Table

| Role | Intent | Scope |
|------|--------|-------|
| SUPER_ADMIN | Platform governance, DCA onboarding | Global |
| FEDEX_ADMIN | Operational oversight, case management | Multi-region |
| FEDEX_MANAGER | Regional supervision | Single region |
| FEDEX_ANALYST | Reporting, read-only analytics | Assigned regions |
| FEDEX_AUDITOR | Compliance review, audit log access | Read-only |
| DCA_ADMIN | Agency administration | Own DCA |
| DCA_MANAGER | Team supervision, case escalation | Own DCA + State |
| DCA_AGENT | Case work, customer contact | Assigned cases |
| READONLY | External read-only access | Limited |

### Forbidden Actions (Explicit)

| Role | Cannot Do |
|------|-----------|
| DCA_AGENT | Create cases, assign cases, view other DCA data |
| DCA_MANAGER | Create DCAs, manage FedEx users, view other DCA data |
| DCA_ADMIN | Create regions, manage SLA templates, access FedEx settings |
| FEDEX_ADMIN | Create DCAs (governance is SUPER_ADMIN only) |
| All Roles | Modify audit logs, change actor_type, bypass region isolation |

---

## 5. UI Architecture & Workbenches

### Role-Based Workbenches

| Workbench | Target Roles | Route Prefix | Purpose |
|-----------|--------------|--------------|---------|
| Admin Workbench | SUPER_ADMIN, FEDEX_ADMIN | `/admin/*` | Platform governance |
| Manager Workbench | FEDEX_MANAGER, DCA_MANAGER | `/manager/*` | Team oversight |
| Agent Workbench | DCA_AGENT | `/agent/*` | Case execution |
| Analyst View | FEDEX_ANALYST, AUDITOR | `/analyst/*` | Read-only analytics |

### Why Workbenches Are Isolated

1. **Cognitive Load** - Each role sees only what they need
2. **Security by Structure** - Route structure implies authorization
3. **Audit Clarity** - Actions are traceable to specific workbenches
4. **Scalability** - Features can be added per-role without cross-contamination

### Sidebar Strategy

- Navigation configs are per-role files (`lib/navigation/*.ts`)
- Sidebar renders from role-specific config
- No inline role conditionals in UI components
- Menu visibility ≠ access control (backend enforces)

---

## 6. Case Lifecycle & Allocation Flow

### State Machine

```
         ┌──────────────────┐
         │ PENDING_ALLOCATION │ ◄── Case Created
         └────────┬─────────┘
                  │ DCA Allocated
                  ▼
         ┌──────────────────┐
         │      OPEN        │
         └────────┬─────────┘
                  │ Agent Assigned + Work Started
                  ▼
         ┌──────────────────┐
         │   IN_PROGRESS    │ ←────┐
         └────────┬─────────┘      │
                  │                │
        ┌─────────┴─────────┐      │
        ▼                   ▼      │
┌───────────────┐  ┌────────────┐  │
│AWAITING_RESPONSE││ ESCALATED  │──┘
└───────┬───────┘  └────────────┘
        │
        ▼
┌──────────────────┐
│    RESOLVED      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│     CLOSED       │
└──────────────────┘
```

### Allocation Flow (Step-by-Step)

| Step | Actor | Action |
|------|-------|--------|
| 1 | SYSTEM | Receives case from upstream |
| 2 | SYSTEM | Validates payload against schema |
| 3 | SYSTEM | Checks idempotency (`external_case_id`) |
| 4 | SYSTEM | Resolves region from address |
| 5 | SYSTEM | Queries eligible DCAs (active, licensed, capacity) |
| 6 | SYSTEM | Selects optimal DCA (round-robin or score) |
| 7 | SYSTEM | Assigns case to DCA |
| 8 | SYSTEM | Binds SLA from region template |
| 9 | SYSTEM | Creates audit log entry |
| 10 | SYSTEM | Notifies DCA_MANAGER of new case |

---

## 7. Upstream Ingestion Model

### SYSTEM-Only Ingestion

```
┌─────────────────┐      X-Service-Auth        ┌────────────────────┐
│   Upstream RPA  │ ───────────────────────► │ /api/v1/cases/     │
│   / ERP System  │       Bearer <token>       │ system-create      │
└─────────────────┘                            └────────────────────┘
```

### Ingestion Rules

| Rule | Enforcement |
|------|-------------|
| Only SYSTEM tokens accepted | `withSystemAuth()` wrapper |
| Human sessions rejected | Returns 403 |
| `external_case_id` required | Schema validation |
| Duplicate `external_case_id` rejected | UNIQUE constraint |
| Assignment fields forbidden in payload | Stripped by schema |
| `actor_type` always set to SYSTEM | Backend sets, not payload |

### Idempotency Guarantee

- `external_case_id` has UNIQUE index
- Duplicate ingestion returns existing case ID
- No duplicate cases possible

### Audit Guarantee

- Every ingestion creates an audit log
- `actor_type = SYSTEM`
- `service_name` identifies source (e.g., `RPA_BOT`)
- `ingestion_timestamp` records exact time

---

## 8. AI / Automation Responsibilities

### What AI DOES

| Capability | Description | Binding? |
|------------|-------------|----------|
| Risk Scoring | Predicts collection difficulty (0-100) | Advisory |
| Priority Recommendation | Suggests CRITICAL/HIGH/MEDIUM/LOW | Advisory |
| Contact Time Suggestion | Optimal contact window | Advisory |
| Predicted Recovery Rate | Likelihood of collection | Advisory |

### What AI NEVER Does

| Action | Why Forbidden |
|--------|---------------|
| Assign cases | Deterministic SYSTEM rules only |
| Change case status | Human or workflow action only |
| Modify customer data | No write access |
| Override SLA | Governance-controlled |
| Bypass allocation rules | SYSTEM enforces |

### Deterministic vs Probabilistic

| Type | Examples | Binding |
|------|----------|---------|
| Deterministic | Region resolution, DCA allocation, SLA binding | YES |
| Probabilistic | Risk score, priority suggestion, recovery prediction | NO (advisory) |

---

## 9. Security Model

### Authentication Types

| Type | Header | Use Case |
|------|--------|----------|
| SYSTEM | `X-Service-Auth: Bearer <JWT>` | Upstream ingestion, cron jobs |
| HUMAN | `Cookie: sb-*` (Supabase session) | UI users |

### RBAC Enforcement Layers

```
┌─────────────────────────────────────────────────┐
│ 1. Middleware (route protection)                │
├─────────────────────────────────────────────────┤
│ 2. API Wrapper (permission check)               │
├─────────────────────────────────────────────────┤
│ 3. SecureQueryBuilder (region/org scoping)      │
├─────────────────────────────────────────────────┤
│ 4. RLS Policies (database row-level)            │
└─────────────────────────────────────────────────┘
```

### Privilege Escalation Prevention

- `canManageRole(manager, target)` enforces hierarchy
- Users cannot assign roles higher than their own
- DCA users cannot access FedEx resources
- FedEx users cannot modify DCA internal structure

### MFA Rules

| Role | MFA Required |
|------|--------------|
| SUPER_ADMIN | Yes |
| FEDEX_ADMIN | Yes |
| AUDITOR | Yes |
| Others | Optional |

---

## 10. Database Design Overview

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `cases` | Collection cases | `id`, `region_id`, `external_case_id`, `assigned_dca_id` |
| `dcas` | Debt Collection Agencies | `id`, `region_id`, `is_active`, `capacity` |
| `users` | All platform users | `id`, `role`, `dca_id`, `region_id` |
| `sla_logs` | SLA tracking | `case_id`, `sla_type`, `due_at`, `status` |
| `audit_logs` | Immutable audit trail | `actor_type`, `action`, `resource_id` |

### Immutable Fields (Trigger-Enforced)

| Table | Field | Trigger |
|-------|-------|---------|
| cases | `region_id` | `enforce_region_immutability` |
| cases | `external_case_id` | `enforce_external_case_id_immutability` |
| cases | `source_system` | `enforce_source_system_immutability` |
| cases | `actor_type` | `enforce_actor_type_immutability` |

### RLS Philosophy

- Every table has RLS enabled
- `service_role` bypasses for SYSTEM operations
- `authenticated` users filtered by region/org
- `anon` denied on all tables

---

## 11. Audit & Compliance

### Audit Events

| Event | Actor Types | Logged Data |
|-------|-------------|-------------|
| CASE_CREATED | SYSTEM | source_system, external_case_id |
| CASE_ASSIGNED | SYSTEM | dca_id, agent_id |
| CASE_UPDATED | HUMAN | changed_fields, previous_values |
| SLA_BREACHED | SYSTEM | sla_type, due_at |
| USER_LOGIN | HUMAN | ip_address, user_agent |
| PERMISSION_DENIED | BOTH | attempted_action, reason |

### Actor Identity Model

```typescript
type AuditEntry = {
    actor_type: 'SYSTEM' | 'HUMAN';
    actor_id: string;           // User ID or service name
    service_name?: string;      // For SYSTEM actors
    user_email?: string;        // For HUMAN actors
    user_role?: string;         // For HUMAN actors
    ip_address?: string;        // For HUMAN actors
}
```

### Immutability Guarantees

- `audit_logs` table has no UPDATE or DELETE policies
- Triggers prevent modification of audit records
- All entries include `created_at` timestamp
- No cascade deletes from parent tables

---

## 12. Testing Strategy

### What Is Tested

| Category | Coverage |
|----------|----------|
| RBAC Permissions | `hasPermission()`, role hierarchy |
| System Auth | SYSTEM vs HUMAN token validation |
| Payload Validation | Required fields, forbidden fields |
| Security | Privilege escalation, spoofing, injection |
| Region Isolation | Access boundaries |
| Governance Invariants | Actor types, SLA lifecycle |

### What Is NOT Tested

- UI styling and layout
- Component snapshots
- Animation timing
- Third-party library internals

### Coverage Philosophy

We test **governance-critical paths**, not vanity coverage. A test suite that fails when security is broken is more valuable than 100% line coverage.

### Test Files

```
__tests__/
├── auth/
│   ├── rbac.test.ts
│   ├── system-auth.test.ts
│   └── region-isolation.test.ts
├── case/
│   └── ingestion-validation.test.ts
├── governance/
│   └── invariants.test.ts
└── security/
    └── negative-tests.test.ts
```

---

## 13. Monitoring & Observability

### Logging Strategy

| Log Type | Format | Destination |
|----------|--------|-------------|
| Request logs | JSON structured | stdout |
| Error logs | JSON with stack | stderr |
| Audit logs | Database | `audit_logs` table |

### Correlation IDs

- Every request receives `x-correlation-id`
- ID propagates through all log entries
- Enables end-to-end request tracing

### Planned Integrations

| Tool | Purpose | Status |
|------|---------|--------|
| Sentry | Error aggregation | Planned |
| PagerDuty | Alerting | Planned |
| Datadog | APM | Planned |

### Why Monitoring Comes After Governance

Governance ensures the system is correct. Monitoring ensures the system is visible. A monitored but ungoverned system is still broken.

---

## 14. DevOps & CI/CD

### CI Pipeline Stages

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│   Lint   │ → │   Test   │ → │  Build   │ → │  Docker  │
│ (ESLint) │   │ (Jest)   │   │ (Next.js)│   │ (Optional)│
└──────────┘   └──────────┘   └──────────┘   └──────────┘
```

### What Blocks a Merge

| Failure | Blocks Merge? |
|---------|---------------|
| ESLint errors | Yes |
| TypeScript errors | Yes |
| Test failures | Yes |
| Build failures | Yes |
| Coverage drop | Warning only |

### Secrets Handling

- All secrets via environment variables
- `.env.local` gitignored
- CI secrets in GitHub Secrets
- No hardcoded credentials anywhere

---

## 15. Environment Setup

### Prerequisites

- Node.js 20+
- pnpm 8+
- Supabase account
- PostgreSQL (via Supabase)

### Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SERVICE_SECRET=<min 32 chars>

# Optional
ML_SERVICE_URL=http://localhost:8000
SENDGRID_API_KEY=...
```

### Local Development

```bash
cd apps/web
cp .env.example .env.local
npm install
npm run dev
```

### Safety Warnings

> ⚠️ **Never commit `.env.local`**  
> ⚠️ **Never expose `SUPABASE_SERVICE_ROLE_KEY` to frontend**  
> ⚠️ **Never run production migrations without backup**

---

## 16. Folder Structure

```
FEDEX_PROJECT/
├── apps/
│   ├── web/                 # Next.js UI + API routes
│   │   ├── app/             # Pages and API routes
│   │   ├── components/      # React components
│   │   ├── lib/             # Backend domain logic
│   │   └── __tests__/       # Test files
│   └── ml-service/          # Python AI/ML service
├── supabase/
│   └── migrations/          # Database migrations
├── docs/                    # Documentation
└── scripts/                 # Utility scripts
```

### Why This Structure

| Folder | Rationale |
|--------|-----------|
| `lib/auth/` | All authentication and authorization |
| `lib/case/` | Case lifecycle logic |
| `lib/allocation/` | DCA/agent assignment |
| `lib/sla/` | SLA binding and monitoring |
| `lib/audit/` | Audit logging |
| `lib/region/` | Region resolution |

---

## 17. API Overview

### Versioning

- SYSTEM APIs: `/api/v1/*`
- Human APIs: `/api/*`

### Auth Model

| Endpoint Pattern | Auth Type |
|------------------|-----------|
| `/api/v1/*` | SYSTEM (X-Service-Auth) |
| `/api/agent/*` | HUMAN (DCA_AGENT) |
| `/api/manager/*` | HUMAN (Manager roles) |
| `/api/admin/*` | HUMAN (Admin roles) |

### Error Contract

```json
{
    "error": {
        "code": "FORBIDDEN",
        "message": "Missing permission: cases:create"
    }
}
```

### Key Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/cases/system-create` | POST | SYSTEM case ingestion |
| `/api/cases` | GET | List cases (filtered by role) |
| `/api/cases/[id]` | GET | Case detail |
| `/api/agent/dashboard` | GET | Agent metrics |
| `/api/manager/team` | GET | Team members |

---

## 18. Known Constraints & Explicit Non-Goals

### What Will NEVER Be Added

| Feature | Reason |
|---------|--------|
| UI case creation for any role | Ingestion is SYSTEM-only |
| Bulk assignment override | Allocation is algorithmic |
| Audit log editing | Immutability is governance |
| Cross-DCA case transfer | Violates org isolation |
| Anonymous access | All actions require identity |

### Why Certain Shortcuts Are Forbidden

- **No "admin bypass"** - SUPER_ADMIN is governance, not operational
- **No "test mode" in production** - Demo mode is dev-only
- **No client-side RBAC** - Backend is source of truth

---

## 19. Roadmap

### Confirmed (Short-Term)

| Item | Priority |
|------|----------|
| Sentry integration | High |
| PagerDuty alerting | High |
| SLA breach notifications | Medium |

### Confirmed (Medium-Term)

| Item | Priority |
|------|----------|
| Additional upstream connectors | Medium |
| Bulk ingestion API | Medium |
| Advanced analytics dashboard | Low |

### Explicitly NOT on Roadmap

- Multi-tenancy (out of scope)
- Mobile app (not planned)
- Customer-facing portal (different system)

---

## 20. Final Governance Statement

---

**This system is governed.**

Every access decision is made by the backend. Every mutation is audited. Every role has explicit boundaries.

**This system is auditable.**

The audit log is immutable. Actor identity is captured. Actions are traceable to users or services.

**This system is enterprise-ready.**

It enforces Region × Role × Organization isolation. It separates SYSTEM from HUMAN actors. It prevents privilege escalation by design.

---

**Maintained by:** FedEx DCA Engineering  
**Last Updated:** 2026-01-07  
**Version:** 1.0.0
