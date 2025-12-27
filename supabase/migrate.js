#!/usr/bin/env node
/**
 * Database Migration Script
 * Runs SQL migrations against Supabase using the Admin API
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://tmksoivitpmysjprbhxg.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRta3NvaXZpdHBteXNqcHJiaHhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgzMjEwNSwiZXhwIjoyMDgyNDA4MTA1fQ.FNvLhSSzHNh0UTmlg-aBMCdOA4X2-kHU0Mjw0iy6tyM';

async function runSQL(sql, description) {
    console.log(`\n📦 Running: ${description}...`);

    // Split SQL into individual statements
    const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`   Found ${statements.length} SQL statements`);

    // Note: Supabase REST API doesn't support raw SQL execution
    // We need to use the database connection or the SQL Editor
    // This script will output the SQL for manual execution

    console.log('\n⚠️  Supabase REST API does not support raw SQL execution.');
    console.log('   Please run the SQL in Supabase SQL Editor:');
    console.log(`   ${SUPABASE_URL.replace('.co', '.com')}/project/sql/new`);

    return { success: false, reason: 'REST_API_LIMITATION' };
}

async function main() {
    console.log('🚀 FedEx DCA Control Tower - Database Migration');
    console.log('================================================\n');

    const migrationsDir = path.join(__dirname, 'migrations');

    // Check if migrations exist
    const schemaFile = path.join(migrationsDir, '001_initial_schema.sql');
    const seedFile = path.join(migrationsDir, '002_seed_data.sql');

    if (!fs.existsSync(schemaFile)) {
        console.error('❌ Schema migration not found:', schemaFile);
        process.exit(1);
    }

    console.log('📁 Migration files found:');
    console.log(`   - ${schemaFile}`);
    console.log(`   - ${seedFile}`);

    // Alternative: Output instructions for Supabase Dashboard
    console.log('\n' + '='.repeat(60));
    console.log('📋 MANUAL MIGRATION STEPS');
    console.log('='.repeat(60));
    console.log('\n1. Open Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/tmksoivitpmysjprbhxg/sql/new');
    console.log('\n2. Run Schema Migration:');
    console.log('   - Open: supabase/migrations/001_initial_schema.sql');
    console.log('   - Copy all contents');
    console.log('   - Paste into SQL Editor');
    console.log('   - Click "Run" button');
    console.log('\n3. Run Seed Data:');
    console.log('   - Open: supabase/migrations/002_seed_data.sql');
    console.log('   - Copy all contents');
    console.log('   - Paste into SQL Editor');
    console.log('   - Click "Run" button');
    console.log('\n4. Verify with health check:');
    console.log('   curl http://localhost:3000/api/health');
    console.log('='.repeat(60));

    // Print schema file size for reference
    const schemaContent = fs.readFileSync(schemaFile, 'utf8');
    const seedContent = fs.existsSync(seedFile) ? fs.readFileSync(seedFile, 'utf8') : '';

    console.log('\n📊 Migration Stats:');
    console.log(`   Schema: ${schemaContent.split('\n').length} lines, ${(schemaContent.length / 1024).toFixed(1)} KB`);
    console.log(`   Seed:   ${seedContent.split('\n').length} lines, ${(seedContent.length / 1024).toFixed(1)} KB`);
}

main().catch(console.error);
