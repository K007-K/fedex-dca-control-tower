# FedEx DCA Control Tower - Architecture

## System Overview

The DCA Control Tower is designed as a modular, scalable enterprise system following microservices-ready architecture principles.

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                             │
│   Next.js 14 App Router (SSR + CSR hybrid)                  │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────┐
│                      API LAYER                               │
│   Next.js API Routes + Supabase Client                      │
│   - Authentication via Supabase Auth                        │
│   - Row Level Security for data isolation                   │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Supabase    │  │    Redis     │  │  AI Service  │
│  PostgreSQL  │  │  (caching)   │  │  (Python)    │
└──────────────┘  └──────────────┘  └──────────────┘
```

## Design Decisions

### 1. Monolithic Frontend with API Routes

**Decision**: Use Next.js API routes instead of separate backend service.

**Rationale**:
- Simplified deployment and development
- Shared types between frontend and API
- Edge runtime capabilities
- Easier to extract to microservices later if needed

### 2. Supabase as Primary Database

**Decision**: PostgreSQL via Supabase with Row Level Security.

**Rationale**:
- Built-in auth and realtime subscriptions
- Row Level Security for multi-tenant isolation
- Managed service reduces operational overhead
- Strong consistency guarantees

### 3. Separate AI/ML Service

**Decision**: Python FastAPI microservice for AI capabilities.

**Rationale**:
- Python ecosystem for ML (scikit-learn, XGBoost)
- Independent scaling from main application
- Fallback to rule-based logic when unavailable
- Easier model updates without full deployment

## Data Flow

### Case Lifecycle

```
ERP Import → Ingestion → AI Scoring → Allocation → DCA Actions → Resolution
     │            │           │           │            │            │
     └────────────┴───────────┴───────────┴────────────┴────────────┘
                              │
                        Audit Logging
```

### SLA Enforcement

```
Case Assigned → SLA Timer Started → Warning (80%) → Breach → Escalation
                     │                    │           │          │
                     └────────────────────┴───────────┴──────────┘
                                          │
                                   Notifications
```

## Security Architecture

- **Authentication**: Supabase Auth (JWT-based)
- **Authorization**: RBAC with 9 roles
- **Data Isolation**: Row Level Security policies
- **Audit Trail**: Immutable audit_logs table
- **Secrets**: Environment variables, never in code

## Scalability Considerations

- Horizontal scaling via Vercel (frontend) and Railway (backend)
- Database connection pooling via Supabase
- CDN for static assets (Vercel Edge Network)
- Redis caching for frequently accessed data
- Materialized views for analytics queries

## Future Enhancements

- [ ] Event sourcing for case state changes
- [ ] Message queue (BullMQ) for background jobs
- [ ] Full microservices extraction if scale demands
- [ ] Multi-region deployment for global DCAs
