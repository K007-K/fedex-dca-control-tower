#!/usr/bin/env node

/**
 * Idempotent demo case seeding for the active Supabase project.
 *
 * This script does not delete or reset data. It reads current DCA/user IDs from
 * Supabase and inserts only missing DEMO-2026 cases so dashboards have useful
 * data after the governed user/DCA seed.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, 'apps', 'web', '.env.local');

function loadEnvFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        process.env[key] = process.env[key] || value;
    }
}

function daysAgo(days) {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - days);
    return date.toISOString().slice(0, 10);
}

function isoDaysAgo(days) {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - days);
    return date.toISOString();
}

async function supabaseFetch(pathname, options = {}) {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${pathname}`;
    const response = await fetch(url, {
        ...options,
        headers: {
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
            ...(options.headers || {}),
        },
    });

    const text = await response.text();
    const body = text ? JSON.parse(text) : null;
    if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}: ${text}`);
    }
    return body;
}

function requireRow(rows, label, predicate) {
    const row = rows.find(predicate);
    if (!row) {
        throw new Error(`Missing required seed dependency: ${label}`);
    }
    return row;
}

async function main() {
    loadEnvFile(envPath);

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in apps/web/.env.local');
    }

    const [dcas, users, regions, existingCases] = await Promise.all([
        supabaseFetch('dcas?select=id,name,region_id'),
        supabaseFetch('users?select=id,email,role,dca_id,primary_region_id'),
        supabaseFetch('regions?select=id,region_code,name'),
        supabaseFetch('cases?select=case_number&case_number=like.DEMO-2026-*'),
    ]);

    const indiaRegion = requireRow(regions, 'INDIA region', r => r.region_code === 'INDIA');
    const tata = requireRow(dcas, 'Tata Recovery Services DCA', d => d.name === 'Tata Recovery Services');
    const infosol = requireRow(dcas, 'InfoSol Collections DCA', d => d.name === 'InfoSol Collections');
    const systemAdmin = requireRow(users, 'system.admin@fedex.com', u => u.email === 'system.admin@fedex.com');
    const tataAgent = requireRow(users, 'agent1@tatarecovery.in', u => u.email === 'agent1@tatarecovery.in');
    const tataAgent2 = requireRow(users, 'agent2@tatarecovery.in', u => u.email === 'agent2@tatarecovery.in');
    const infosolAgent = requireRow(users, 'agent1@infosolcollections.in', u => u.email === 'agent1@infosolcollections.in');
    const infosolAgent2 = requireRow(users, 'agent2@infosolcollections.in', u => u.email === 'agent2@infosolcollections.in');

    const existing = new Set(existingCases.map(c => c.case_number));
    const baseCase = {
        currency: 'INR',
        customer_country: 'IN',
        customer_type: 'B2B',
        customer_segment: 'MID_MARKET',
        region: 'INDIA',
        region_id: indiaRegion.id,
        created_by: systemAdmin.id,
        updated_by: systemAdmin.id,
        created_source: 'SYSTEM',
        actor_type: 'SYSTEM',
        source_system: 'DEMO_SEED',
        ingestion_timestamp: new Date().toISOString(),
    };

    const cases = [
        {
            case_number: 'DEMO-2026-0001',
            invoice_number: 'FDX-IN-2026-0001',
            invoice_date: daysAgo(42),
            due_date: daysAgo(12),
            original_amount: 425000,
            outstanding_amount: 425000,
            customer_id: 'DEMO-CUST-001',
            customer_name: 'Aarav Retail Logistics',
            customer_industry: 'Retail',
            customer_state: 'MH',
            customer_city: 'Mumbai',
            status: 'ALLOCATED',
            priority: 'HIGH',
            priority_score: 82,
            recovery_probability: 0.64,
            assigned_dca_id: tata.id,
            assigned_agent_id: tataAgent.id,
            assigned_at: isoDaysAgo(9),
            assignment_method: 'AUTO',
            recovered_amount: 0,
            contact_attempts: 2,
            tags: ['demo', 'mumbai', 'high-value'],
        },
        {
            case_number: 'DEMO-2026-0002',
            invoice_number: 'FDX-IN-2026-0002',
            invoice_date: daysAgo(64),
            due_date: daysAgo(34),
            original_amount: 185000,
            outstanding_amount: 95000,
            customer_id: 'DEMO-CUST-002',
            customer_name: 'Deccan Pharma Supply',
            customer_industry: 'Healthcare',
            customer_state: 'MH',
            customer_city: 'Pune',
            status: 'PARTIAL_RECOVERY',
            priority: 'MEDIUM',
            priority_score: 58,
            recovery_probability: 0.78,
            assigned_dca_id: tata.id,
            assigned_agent_id: tataAgent2.id,
            assigned_at: isoDaysAgo(22),
            assignment_method: 'MANUAL',
            recovered_amount: 90000,
            last_payment_date: daysAgo(5),
            contact_attempts: 4,
            successful_contacts: 2,
            tags: ['demo', 'partial-recovery'],
        },
        {
            case_number: 'DEMO-2026-0003',
            invoice_number: 'FDX-IN-2026-0003',
            invoice_date: daysAgo(27),
            due_date: daysAgo(1),
            original_amount: 72000,
            outstanding_amount: 72000,
            customer_id: 'DEMO-CUST-003',
            customer_name: 'Western Components LLP',
            customer_industry: 'Manufacturing',
            customer_state: 'GJ',
            customer_city: 'Ahmedabad',
            status: 'PENDING_ALLOCATION',
            priority: 'MEDIUM',
            priority_score: 61,
            recovery_probability: 0.59,
            assigned_dca_id: null,
            assigned_agent_id: null,
            assigned_at: null,
            assignment_method: null,
            recovered_amount: 0,
            tags: ['demo', 'pending-allocation'],
        },
        {
            case_number: 'DEMO-2026-0004',
            invoice_number: 'FDX-IN-2026-0004',
            invoice_date: daysAgo(90),
            due_date: daysAgo(60),
            original_amount: 950000,
            outstanding_amount: 950000,
            customer_id: 'DEMO-CUST-004',
            customer_name: 'North Star Infrastructure',
            customer_industry: 'Construction',
            customer_state: 'DL',
            customer_city: 'New Delhi',
            status: 'ESCALATED',
            priority: 'CRITICAL',
            priority_score: 96,
            recovery_probability: 0.31,
            assigned_dca_id: infosol.id,
            assigned_agent_id: infosolAgent.id,
            assigned_at: isoDaysAgo(35),
            assignment_method: 'AUTO',
            recovered_amount: 0,
            contact_attempts: 8,
            successful_contacts: 1,
            escalated_by_manager: true,
            escalated_at: isoDaysAgo(2),
            escalated_reason: 'No customer response after repeated contact attempts',
            escalation_priority: 'HIGH',
            high_priority_flag: true,
            tags: ['demo', 'escalated', 'critical'],
        },
        {
            case_number: 'DEMO-2026-0005',
            invoice_number: 'FDX-IN-2026-0005',
            invoice_date: daysAgo(48),
            due_date: daysAgo(18),
            original_amount: 240000,
            outstanding_amount: 240000,
            customer_id: 'DEMO-CUST-005',
            customer_name: 'BluePeak Electronics',
            customer_industry: 'Technology',
            customer_state: 'KA',
            customer_city: 'Bengaluru',
            status: 'CUSTOMER_CONTACTED',
            priority: 'HIGH',
            priority_score: 77,
            recovery_probability: 0.68,
            assigned_dca_id: tata.id,
            assigned_agent_id: tataAgent.id,
            assigned_at: isoDaysAgo(14),
            assignment_method: 'AUTO',
            recovered_amount: 0,
            contact_attempts: 3,
            successful_contacts: 1,
            tags: ['demo', 'contacted'],
        },
        {
            case_number: 'DEMO-2026-0006',
            invoice_number: 'FDX-IN-2026-0006',
            invoice_date: daysAgo(36),
            due_date: daysAgo(6),
            original_amount: 138000,
            outstanding_amount: 138000,
            customer_id: 'DEMO-CUST-006',
            customer_name: 'Capital Office Supplies',
            customer_industry: 'Wholesale',
            customer_state: 'DL',
            customer_city: 'New Delhi',
            status: 'PAYMENT_PROMISED',
            priority: 'LOW',
            priority_score: 35,
            recovery_probability: 0.86,
            assigned_dca_id: infosol.id,
            assigned_agent_id: infosolAgent2.id,
            assigned_at: isoDaysAgo(11),
            assignment_method: 'AUTO',
            recovered_amount: 0,
            payment_plan_active: true,
            contact_attempts: 2,
            successful_contacts: 2,
            tags: ['demo', 'promise-to-pay'],
        },
    ].map(row => ({
        ...baseCase,
        ...row,
        external_case_id: `DEMO_SEED:${row.case_number}`,
        metadata: {
            seeded_by: 'scripts/seed-demo-cases.js',
            seeded_for: 'portfolio-demo',
        },
    }));

    const allKeys = Array.from(new Set(cases.flatMap(row => Object.keys(row))));
    const normalizedCases = cases.map(row => Object.fromEntries(
        allKeys.map(key => [key, Object.prototype.hasOwnProperty.call(row, key) ? row[key] : null])
    ));
    const missingCases = normalizedCases.filter(row => !existing.has(row.case_number));

    if (missingCases.length === 0) {
        console.log('No demo cases inserted. All DEMO-2026 cases already exist.');
    } else {
        await supabaseFetch('cases', {
            method: 'POST',
            body: JSON.stringify(missingCases),
        });
        console.log(`Inserted ${missingCases.length} demo cases.`);
    }

    const counts = await supabaseFetch('cases?select=status');
    const byStatus = counts.reduce((acc, row) => {
        acc[row.status] = (acc[row.status] || 0) + 1;
        return acc;
    }, {});

    console.log(JSON.stringify({
        total_cases: counts.length,
        demo_cases_present: cases.length,
        by_status: byStatus,
    }, null, 2));
}

main().catch(error => {
    console.error(error.message);
    process.exit(1);
});
