# FedEx DCA Control Tower

Enterprise-grade Debt Collection Agency Management System for FedEx.

## Overview

The DCA Control Tower is a centralized command center for managing 500+ Debt Collection Agencies across 50+ countries. It provides AI-powered insights, real-time SLA monitoring, and optimized recovery workflows.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14+ (App Router), React 18, TypeScript |
| Styling | Tailwind CSS, shadcn/ui |
| State | Zustand, TanStack Query |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL 15+) |
| Auth | Supabase Auth with RBAC |
| AI/ML | Python FastAPI (separate service) |

## Project Structure

```
fedex-dca-control-tower/
├── apps/
│   └── web/                    # Next.js frontend + API
│       ├── app/                # App Router pages
│       ├── components/         # UI components
│       ├── lib/                # Utilities, types, hooks
│       └── styles/             # Global styles
├── services/
│   └── ai-service/             # Python ML service
├── docs/                       # Documentation
├── scripts/                    # Automation scripts
└── infrastructure/             # IaC configs
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd fedex-dca-control-tower
```

2. Install dependencies:
```bash
pnpm install
```

3. Configure environment:
```bash
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

4. Start development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `AI_SERVICE_URL` | Python AI service URL | No |

See `.env.example` for all variables.

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run unit tests |
| `pnpm test:e2e` | Run E2E tests |
| `pnpm db:studio` | Open Prisma Studio |

## Documentation

- [Architecture](./docs/ARCHITECTURE.md)
- [API Reference](./docs/API.md)
- [Database Schema](./docs/DATABASE_SCHEMA.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Security](./docs/SECURITY.md)

## Key Features

- **Case Lifecycle Management**: Track cases from ingestion to resolution
- **AI-Powered Scoring**: ML models for priority and recovery prediction
- **DCA Performance Tracking**: Real-time metrics and benchmarking
- **SLA Enforcement**: Automated monitoring with breach alerts
- **Role-Based Access Control**: Fine-grained permissions
- **Real-Time Updates**: Live dashboards via Supabase Realtime
- **Audit Logging**: Immutable activity trail

## License

Proprietary - FedEx Corporation
