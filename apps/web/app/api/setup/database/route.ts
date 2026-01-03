import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering - this route uses cookies/headers
export const dynamic = 'force-dynamic';

import { withPermission, type ApiHandler } from '@/lib/auth/api-wrapper';

/**
 * GET /api/setup/database
 * Instructions for database setup
 * 
 * SECURITY: Protected - SUPER_ADMIN only, disabled in production
 * Permission: admin:security
 */
const handleGetSetup: ApiHandler = async (request, { user }) => {
  // SECURITY: Disabled in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Setup endpoints are disabled in production' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    message: 'Database Setup Instructions',
    instructions: [
      'STEP 1: Open Supabase Dashboard',
      '  - Navigate to: https://supabase.com/dashboard/project/tmksoivitpmysjprbhxg/sql/new',
      '',
      'STEP 2: Run Schema Migration',
      '  - Copy contents of: supabase/migrations/001_initial_schema.sql',
      '  - Paste into SQL Editor and click "Run"',
      '',
      'STEP 3: Run Seed Data',
      '  - Copy contents of: supabase/migrations/002_seed_data.sql',
      '  - Paste into SQL Editor and click "Run"',
      '',
      'STEP 4: Verify Setup',
      '  - Visit /api/health to check database connectivity'
    ],
    files: {
      schema: 'supabase/migrations/001_initial_schema.sql',
      seed: 'supabase/migrations/002_seed_data.sql'
    },
    note: 'SQL migrations must be run manually in Supabase SQL Editor'
  });
};

/**
 * POST /api/setup/database
 * Placeholder - actual setup requires running SQL in Supabase Dashboard
 * 
 * Permission: admin:security
 */
const handlePostSetup: ApiHandler = async (request, { user }) => {
  // SECURITY: Disabled in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Setup endpoints are disabled in production' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    error: {
      code: 'MANUAL_SETUP_REQUIRED',
      message: 'Database migrations must be run manually in Supabase SQL Editor',
      instructions: 'Use GET /api/setup/database for detailed instructions'
    }
  }, { status: 400 });
};

// CRITICAL: Protected with admin:security - SUPER_ADMIN only
export const GET = withPermission('admin:security', handleGetSetup);
export const POST = withPermission('admin:security', handlePostSetup);
