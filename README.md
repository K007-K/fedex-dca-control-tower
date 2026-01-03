# FedEx DCA Control Tower

**Enterprise-grade Debt Collection Agency Management Platform**

---

## 1. Project Overview

### What It Is

The FedEx DCA Control Tower is a **governance-first** platform for managing Debt Collection Agencies across global regions. It provides centralized control over case assignment, SLA enforcement, DCA performance tracking, and compliance monitoring.

### Problem Solved

| Challenge | Solution |
|-----------|----------|
| Manual case routing | Automated SYSTEM-driven allocation |
| Inconsistent SLA tracking | Region-aware SLA templates with breach detection |
| Unaudited operations | Complete audit trail for every action |
| Role confusion | Strict RBAC with backend enforcement |

### Why Governance-First

- **SYSTEM is the primary actor** — Humans supervise, not operate
- **Backend enforces all rules** — UI cannot bypass security
- **Immutable financial data** — Core fields protected by DB triggers
- **Full audit trail** — Every action is traceable

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        INTERNET                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
     ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
     │   Browser   │  │ ERP/Source  │  │   Cron/     │
     │   (Human)   │  │   Systems   │  │  Scheduler  │
     └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
            │                │                │
            ▼                ▼                ▼
     ┌─────────────────────────────────────────────┐
     │         FRONTEND (Vercel - Next.js)         │
     │  • Dashboard • Cases • DCAs • Analytics     │
     └──────────────────────┬──────────────────────┘
                            │
                            ▼
     ┌─────────────────────────────────────────────┐
     │           BACKEND API (Next.js)             │
     │  • Auth • RBAC • Business Logic • Webhooks  │
     └────────┬─────────────────────┬──────────────┘
              │                     │
              ▼                     ▼
     ┌─────────────┐        ┌─────────────┐
     │  ML Service │        │   Supabase  │
     │   (Render)  │        │  (Postgres) │
     │  • Scoring  │        │  • RLS      │
     │  • Predict  │        │  • Triggers │
     └─────────────┘        └─────────────┘
```

### Components

| Component | Technology | Responsibility |
|-----------|------------|----------------|
| Frontend | Next.js 14 (Vercel) | UI, dashboards, forms |
| Backend | Next.js API Routes | Auth, RBAC, business logic |
| ML Service | FastAPI (Render) | Priority scoring, predictions |
| Database | Supabase (PostgreSQL) | Data storage, RLS, triggers |
| SYSTEM Jobs | Cron-triggered APIs | SLA breach check, allocation |

---

## 3. Roles & Responsibilities

### FedEx Roles

| Role | Purpose | Powers |
|------|---------|--------|
| `SUPER_ADMIN` | Governance oversight | Read-only global view, security settings, NO operational powers |
| `FEDEX_ADMIN` | Operations lead | Manual case creation, user management, workflow transitions |
| `FEDEX_MANAGER` | Team supervision | DCA performance review, escalation handling |
| `FEDEX_ANALYST` | Reporting | Analytics access, report generation |
| `FEDEX_AUDITOR` | Compliance | Audit log access, read-only operations |
| `FEDEX_VIEWER` | Read-only | Dashboard view only |

### DCA Roles

| Role | Purpose | Powers |
|------|---------|--------|
| `DCA_ADMIN` | Agency admin | Manage DCA users, view assigned cases |
| `DCA_MANAGER` | Team lead | Escalate cases, view DCA performance |
| `DCA_AGENT` | Field agent | Work assigned cases, update status |

### Non-Human Actor

| Actor | Purpose | Powers |
|-------|---------|--------|
| `SYSTEM` | Automation | Case creation, DCA allocation, SLA enforcement |

---

## 4. Case Lifecycle

```
┌─────────────┐
│  ERP/Source │
│   System    │
└──────┬──────┘
       │ API call
       ▼
┌─────────────┐     ┌─────────────┐
│   SYSTEM    │────▶│    Case     │──── status: OPEN
│   Creates   │     │   Created   │
└─────────────┘     └──────┬──────┘
                           │ Auto-allocation
                           ▼
                    ┌─────────────┐
                    │    DCA      │──── assigned_dca_id set
                    │  Assigned   │
                    └──────┬──────┘
                           │ DCA works case
                           ▼
                    ┌─────────────┐
                    │  IN_PROGRESS│──── DCA_AGENT transitions
                    │  CONTACTED  │
                    │  PROMISE_PAY│
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
       ┌───────────┐ ┌───────────┐ ┌───────────┐
       │ RECOVERED │ │  FAILED   │ │ ESCALATED │
       └─────┬─────┘ └─────┬─────┘ └─────┬─────┘
             │             │             │
             └─────────────┴─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   CLOSED    │──── Terminal state
                    └─────────────┘
```

### Key Transitions

| From | To | Who |
|------|----|-----|
| OPEN | IN_PROGRESS | DCA_AGENT |
| IN_PROGRESS | CONTACTED | DCA_AGENT |
| CONTACTED | PROMISE_TO_PAY / FAILED | DCA_AGENT |
| ANY | ESCALATED | DCA_MANAGER |
| RECOVERED / FAILED / ESCALATED | CLOSED | FEDEX_ADMIN |

### SLA Breach Flow

1. **SYSTEM** detects SLA violation (`due_at < now`)
2. `sla_logs.status` → `BREACHED`
3. `escalation` record created
4. `case.status` → `ESCALATED` (if configured)
5. All actions audited

---

## 5. Governance & Security Principles

### Backend-Enforced RBAC

- Permissions defined in `lib/auth/rbac.ts`
- Every API endpoint checks `withPermission()`
- UI visibility reflects backend truth

### SYSTEM as Primary Actor

| Action | Who |
|--------|-----|
| Case creation | SYSTEM (ERP integration) |
| DCA allocation | SYSTEM (algorithm) |
| SLA enforcement | SYSTEM (cron job) |
| Workflow transitions | HUMAN (DCA roles) |

### Immutability Rules

| Field | Protected By |
|-------|--------------|
| `original_amount`, `currency`, `region_id` | DB trigger |
| `actor_type`, `created_source`, `created_by` | DB trigger |
| `sla_start_time`, `sla_due_time` | Service logic |

### Audit-First Design

Every action creates entries in:
- `audit_logs` — Who did what
- `case_timeline` — Case history

---

## 6. Failure Handling

| Failure | Behavior | Safe |
|---------|----------|------|
| ML down | Fallback stub scoring | ✅ |
| SLA job fails | Retry on next run | ✅ |
| Allocation fails | Case stays unassigned | ✅ |
| DB write fails | Full rollback | ✅ |

---

## 7. Deployment

### Environment Matrix

| Service | Platform | Environment |
|---------|----------|-------------|
| Frontend | Vercel | `NEXT_PUBLIC_*` only |
| Backend | Vercel | Full secrets |
| ML Service | Render | Read-only DB access |
| Database | Supabase | RLS enabled |

### Environment Separation

```
production/
├── SUPABASE_SERVICE_ROLE_KEY (backend only)
├── SERVICE_SECRET (backend only)
└── NEXT_PUBLIC_SUPABASE_URL (frontend)

staging/
├── Separate Supabase project
└── Separate secrets
```

---

## 8. API Surface Summary

### SYSTEM-Only Endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /api/v1/cases/system-create` | Create case from ERP |
| `POST /api/v1/sla/breach-check` | Trigger breach detection |
| `POST /api/cases/allocate` | Trigger DCA allocation |

### Role-Protected Endpoints

| Endpoint | Roles |
|----------|-------|
| `POST /api/v1/cases/manual-create` | FEDEX_ADMIN |
| `POST /api/v1/cases/{id}/transition` | DCA_AGENT, DCA_MANAGER, FEDEX_ADMIN |
| `GET /api/v1/governance/*` | SUPER_ADMIN |
| `GET /api/health` | Public |

---

## 9. Quick Start

```bash
# Clone and install
git clone <repository-url>
cd FEDEX_PROJECT/apps/web
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start development
npm run dev
```

### Demo Login

```
Email: admin@fedex.com
Password: Password123!
```

---

## 10. Health Monitoring

| Endpoint | Response |
|----------|----------|
| `GET /api/health` | Overall system health |
| `GET /health` (ML) | Model readiness |

---

## License

Proprietary - FedEx Corporation
