# FedEx DCA Control Tower

Enterprise-grade Debt Collection Agency Management System for FedEx.

## Overview

The DCA Control Tower is a centralized command center for managing Debt Collection Agencies. It provides real-time dashboards, case management, DCA performance tracking, and analytics.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14+ (App Router), React 18, TypeScript |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |

## Quick Start

### Prerequisites

- Node.js 20+
- npm (recommended) or pnpm 8+
- Supabase account with project set up

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd FEDEX_PROJECT
```

2. Install dependencies:
```bash
cd apps/web
npm install
```

3. Configure environment:
```bash
# Create .env.local in apps/web/
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

4. Start development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Demo Login

```
Email: admin@fedex.com
Password: Password123!
```

## Environment Variables

Create `apps/web/.env.local` with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Project Structure

```
FEDEX_PROJECT/
├── apps/
│   └── web/                    # Next.js frontend + API
│       ├── app/                # App Router pages
│       │   ├── (auth)/         # Login page
│       │   ├── (dashboard)/    # Dashboard, Cases, DCAs, Analytics
│       │   └── api/            # API routes
│       ├── components/         # UI components
│       │   ├── analytics/      # Charts
│       │   ├── cases/          # Case forms
│       │   ├── dcas/           # DCA forms
│       │   ├── layout/         # Sidebar, Header
│       │   └── ui/             # Base UI components
│       └── lib/                # Utilities, types
├── scripts/                    # Setup scripts
├── supabase/                   # Database migrations
└── README.md
```

## Available Scripts

Run from `apps/web/` directory:

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Features Implemented

### Phase 1-4: Foundation
- ✅ Project setup with Next.js 14
- ✅ Supabase integration
- ✅ Authentication (email/password)
- ✅ Dashboard layout with sidebar

### Phase 5: Case Management
- ✅ Cases list with filters and pagination
- ✅ Case detail view
- ✅ Case create/edit forms

### Phase 6: DCA Management
- ✅ DCA list with performance cards
- ✅ DCA detail view with capacity tracking
- ✅ DCA create/edit forms

### Phase 7: Analytics & Reports
- ✅ Analytics dashboard with charts
- ✅ Recovery trend visualization
- ✅ DCA performance comparison
- ✅ Reports template gallery

## Database Setup

1. Run the migrations in order in Supabase SQL Editor:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_seed_data.sql`
   - `supabase/migrations/003_fix_rls_policies.sql`

2. Run auth user seeding:
```bash
node scripts/seed-auth-users.js
```

3. Run RLS policies for authenticated users:
```bash
# Execute in Supabase SQL Editor
scripts/add-authenticated-policies.sql
```

## License

Proprietary - FedEx Corporation
