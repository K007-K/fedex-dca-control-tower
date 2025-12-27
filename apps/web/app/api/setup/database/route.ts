import { NextResponse } from 'next/server';

/**
 * GET /api/setup/database
 * Instructions for database setup
 */
export async function GET() {
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
}

/**
 * POST /api/setup/database
 * Placeholder - actual setup requires running SQL in Supabase Dashboard
 */
export async function POST() {
  return NextResponse.json({
    error: {
      code: 'MANUAL_SETUP_REQUIRED',
      message: 'Database migrations must be run manually in Supabase SQL Editor',
      instructions: 'Use GET /api/setup/database for detailed instructions'
    }
  }, { status: 400 });
}
