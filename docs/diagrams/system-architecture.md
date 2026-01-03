# System Architecture Diagram

```mermaid
flowchart TB
    subgraph Internet
        Browser["Browser (Human)"]
        ERP["ERP/Source Systems"]
        Cron["Cron/Scheduler"]
    end

    subgraph Frontend["Frontend (Vercel)"]
        NextJS["Next.js 14 App"]
        Dashboard["Dashboard"]
        CasesUI["Cases UI"]
        DCAsUI["DCAs UI"]
        Analytics["Analytics"]
    end

    subgraph Backend["Backend API (Next.js)"]
        Auth["Auth Service"]
        RBAC["RBAC Middleware"]
        CaseService["Case Service"]
        AllocationService["Allocation Service"]
        SLAService["SLA Service"]
        WebhookService["Webhook Service"]
    end

    subgraph External["External Services"]
        ML["ML Service (Render)"]
        Supabase["Supabase (PostgreSQL)"]
    end

    subgraph SystemJobs["SYSTEM Jobs"]
        SLAJob["SLA Breach Detection"]
        AllocationJob["DCA Allocation"]
    end

    Browser --> NextJS
    ERP --> |"POST /api/v1/cases/system-create"| CaseService
    Cron --> |"POST /api/v1/sla/breach-check"| SLAJob

    NextJS --> Auth
    Auth --> RBAC
    RBAC --> CaseService
    RBAC --> AllocationService
    RBAC --> SLAService

    CaseService --> ML
    CaseService --> Supabase
    AllocationService --> Supabase
    SLAService --> Supabase
    SLAJob --> SLAService
    AllocationJob --> AllocationService

    ML --> |"Priority Scoring"| CaseService
```

## Component Responsibilities

| Component | Technology | Responsibility |
|-----------|------------|----------------|
| Frontend | Next.js 14 (Vercel) | UI, dashboards, forms |
| Backend | Next.js API Routes | Auth, RBAC, business logic |
| ML Service | FastAPI (Render) | Priority scoring, predictions |
| Database | Supabase (PostgreSQL) | Data storage, RLS, triggers |
| SYSTEM Jobs | Cron-triggered APIs | SLA breach check, allocation |

## Data Flow

1. **Human Requests**: Browser → Frontend → Backend → Database
2. **SYSTEM Requests**: ERP → Backend API → Database
3. **ML Inference**: Backend → ML Service → Backend
4. **Scheduled Jobs**: Cron → Backend API → Database
