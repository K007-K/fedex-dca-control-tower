// Test script for DCA Case Allocation - validates end-to-end allocation flow
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ==========================================
// HELPERS
// ==========================================

function separator(title: string) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`  ${title}`);
    console.log('='.repeat(60));
}

function pass(msg: string) { console.log(`  ✅ ${msg}`); }
function fail(msg: string) { console.log(`  ❌ ${msg}`); }
function info(msg: string) { console.log(`  ℹ️  ${msg}`); }
function warn(msg: string) { console.log(`  ⚠️  ${msg}`); }

// ==========================================
// TEST 1: Check Regions Exist
// ==========================================
async function testRegions() {
    separator('TEST 1: Regions');

    const { data, error } = await supabase
        .from('regions')
        .select('id, region_code, name, status')
        .eq('status', 'ACTIVE');

    if (error) {
        fail(`Failed to query regions: ${error.message}`);
        return null;
    }

    if (!data || data.length === 0) {
        fail('No ACTIVE regions found! Allocation needs at least one region.');
        return null;
    }

    pass(`Found ${data.length} active region(s):`);
    for (const r of data) {
        info(`${r.region_code} - ${r.name} (${r.id})`);
    }

    return data;
}

// ==========================================
// TEST 2: Check DCAs Exist
// ==========================================
async function testDCAs() {
    separator('TEST 2: DCAs');

    const { data, error } = await supabase
        .from('dcas')
        .select('id, name, status, capacity_limit, capacity_used');

    if (error) {
        fail(`Failed to query DCAs: ${error.message}`);
        return null;
    }

    if (!data || data.length === 0) {
        fail('No DCAs found! Allocation needs at least one DCA.');
        return null;
    }

    pass(`Found ${data.length} DCA(s):`);
    for (const d of data) {
        const available = (d.capacity_limit || 100) - (d.capacity_used || 0);
        const statusIcon = d.status === 'ACTIVE' ? '🟢' : '🔴';
        info(`${statusIcon} ${d.name} | Status: ${d.status} | Capacity: ${d.capacity_used || 0}/${d.capacity_limit || 100} (${available} available)`);
    }

    const activeDCAs = data.filter(d => d.status === 'ACTIVE');
    if (activeDCAs.length === 0) {
        fail('No ACTIVE DCAs found! At least one DCA must be ACTIVE.');
    } else {
        pass(`${activeDCAs.length} DCA(s) are ACTIVE`);
    }

    return data;
}

// ==========================================
// TEST 3: Check Region-DCA Assignments
// ==========================================
async function testRegionDCAAssignments() {
    separator('TEST 3: Region-DCA Assignments');

    const { data, error } = await supabase
        .from('region_dca_assignments')
        .select(`
            id, region_id, dca_id, is_primary, allocation_priority, 
            is_active, suspended_at, region_sla_compliance, region_recovery_rate,
            regions!inner(region_code, name),
            dcas!inner(name, status, capacity_limit, capacity_used)
        `)
        .eq('is_active', true);

    if (error) {
        fail(`Failed to query assignments: ${error.message}`);
        return null;
    }

    if (!data || data.length === 0) {
        fail('No active Region-DCA assignments found!');
        info('This means no DCA is assigned to any region → allocation WILL FAIL.');
        info('Fix: INSERT INTO region_dca_assignments (region_id, dca_id, is_primary, allocation_priority, is_active) VALUES (...)');
        return null;
    }

    pass(`Found ${data.length} active assignment(s):`);
    for (const a of data) {
        const region = (a as any).regions;
        const dca = (a as any).dcas;
        const suspended = a.suspended_at ? '🚫 SUSPENDED' : '✅ Active';
        info(`${region.region_code} → ${dca.name} | Priority: ${a.allocation_priority} | Primary: ${a.is_primary} | ${suspended}`);
        info(`  SLA: ${a.region_sla_compliance || 0}% | Recovery: ${a.region_recovery_rate || 0}% | DCA Status: ${dca.status}`);
    }

    // Check for eligible (not suspended + DCA ACTIVE + has capacity)
    const eligible = data.filter(a => {
        const dca = (a as any).dcas;
        return !a.suspended_at && dca.status === 'ACTIVE' && 
               ((dca.capacity_used || 0) < (dca.capacity_limit || 100));
    });

    if (eligible.length === 0) {
        fail('No ELIGIBLE DCAs found (all are suspended, inactive, or at capacity)');
    } else {
        pass(`${eligible.length} DCA(s) are eligible for allocation`);
    }

    return data;
}

// ==========================================
// TEST 4: Simulate Allocation Scoring
// ==========================================
async function testAllocationScoring(regionId: string) {
    separator('TEST 4: Allocation Scoring Simulation');

    const WEIGHT_CAPACITY = 0.40;
    const WEIGHT_SLA = 0.35;
    const WEIGHT_RECOVERY = 0.25;

    const { data, error } = await supabase
        .from('region_dca_assignments')
        .select(`
            dca_id, allocation_priority, region_sla_compliance, region_recovery_rate,
            dcas!inner(id, name, status, capacity_limit, capacity_used)
        `)
        .eq('region_id', regionId)
        .eq('is_active', true)
        .is('suspended_at', null);

    if (error) {
        fail(`Scoring query failed: ${error.message}`);
        return null;
    }

    if (!data || data.length === 0) {
        fail(`No eligible DCAs found for region ${regionId}`);
        return null;
    }

    info(`Evaluating ${data.length} candidate(s) for region ${regionId}:\n`);

    const scored = data
        .filter(row => {
            const dca = (row as any).dcas;
            return dca.status === 'ACTIVE' && 
                   ((dca.capacity_used || 0) < (dca.capacity_limit || 100));
        })
        .map(row => {
            const dca = (row as any).dcas;
            const capacityLimit = dca.capacity_limit || 100;
            const capacityUsed = dca.capacity_used || 0;
            const utilizationPct = (capacityUsed / capacityLimit) * 100;

            const capacityScore = (100 - utilizationPct);
            const slaScore = row.region_sla_compliance || 0;
            const recoveryScore = row.region_recovery_rate || 0;

            const totalScore = 
                (capacityScore * WEIGHT_CAPACITY) +
                (slaScore * WEIGHT_SLA) +
                (recoveryScore * WEIGHT_RECOVERY);

            return {
                dca_name: dca.name,
                dca_id: dca.id,
                capacityUsed,
                capacityLimit,
                utilizationPct: utilizationPct.toFixed(1),
                capacityScore: capacityScore.toFixed(1),
                slaScore: slaScore.toFixed(1),
                recoveryScore: recoveryScore.toFixed(1),
                totalScore: totalScore.toFixed(2),
            };
        })
        .sort((a, b) => parseFloat(b.totalScore) - parseFloat(a.totalScore));

    if (scored.length === 0) {
        fail('No eligible DCAs after filtering (all at capacity or inactive)');
        return null;
    }

    console.log('  ┌─────────────────────┬────────────┬──────────┬──────────┬──────────┬────────────┐');
    console.log('  │ DCA Name            │ Capacity   │ Cap(40%) │ SLA(35%) │ Rec(25%) │ TOTAL      │');
    console.log('  ├─────────────────────┼────────────┼──────────┼──────────┼──────────┼────────────┤');
    for (const s of scored) {
        const name = s.dca_name.padEnd(19);
        const cap = `${s.capacityUsed}/${s.capacityLimit}`.padEnd(10);
        const cs = s.capacityScore.padStart(8);
        const sl = s.slaScore.padStart(8);
        const rc = s.recoveryScore.padStart(8);
        const ts = s.totalScore.padStart(10);
        console.log(`  │ ${name} │ ${cap} │ ${cs} │ ${sl} │ ${rc} │ ${ts} │`);
    }
    console.log('  └─────────────────────┴────────────┴──────────┴──────────┴──────────┴────────────┘');

    pass(`Winner: ${scored[0].dca_name} (Score: ${scored[0].totalScore})`);

    return scored[0];
}

// ==========================================
// TEST 5: Live Allocation Test (Create & Allocate)
// ==========================================
async function testLiveAllocation(regionId: string, regionCode: string) {
    separator('TEST 5: Live Allocation (Create Test Case)');

    const testCaseNumber = `TEST-ALLOC-${Date.now()}`;

    // Create a test case
    info(`Creating test case: ${testCaseNumber}`);

    const { data: newCase, error: createError } = await supabase
        .from('cases')
        .insert({
            case_number: testCaseNumber,
            customer_id: `TEST-CUST-${Date.now()}`,
            invoice_number: `INV-TEST-${Date.now()}`,
            invoice_date: new Date().toISOString().split('T')[0],
            due_date: new Date().toISOString().split('T')[0],
            currency: 'INR',
            customer_name: 'ALLOCATION TEST - SAFE TO DELETE',
            customer_type: 'B2B',
            customer_contact: { email: 'test@allocation-test.com', phone: '0000000000' },
            region: regionCode,
            region_id: regionId,
            status: 'PENDING_ALLOCATION',
            priority: 'MEDIUM',
            original_amount: 10000,
            outstanding_amount: 10000,
            created_source: 'SYSTEM',
            actor_type: 'SYSTEM',
            metadata: { test: true, purpose: 'allocation_test' },
        })
        .select('id, case_number, status, assigned_dca_id')
        .single();

    if (createError) {
        fail(`Failed to create test case: ${createError.message}`);
        return;
    }

    pass(`Test case created: ${newCase.case_number} (${newCase.id})`);
    info(`Status: ${newCase.status} | Assigned DCA: ${newCase.assigned_dca_id || 'NONE'}`);

    // Now simulate what allocateCase() does
    info('\nRunning allocation algorithm...');

    // Step 1: Find eligible DCAs
    const { data: eligibleData } = await supabase
        .from('region_dca_assignments')
        .select(`
            dca_id, allocation_priority, region_sla_compliance, region_recovery_rate,
            dcas!inner(id, name, status, capacity_limit, capacity_used)
        `)
        .eq('region_id', regionId)
        .eq('is_active', true)
        .is('suspended_at', null);

    if (!eligibleData || eligibleData.length === 0) {
        fail('No eligible DCAs found - case will stay in PENDING_ALLOCATION');
        // Cleanup
        await supabase.from('cases').delete().eq('id', newCase.id);
        info('Test case cleaned up.');
        return;
    }

    // Step 2: Score & rank
    const eligible = eligibleData
        .filter(row => {
            const dca = (row as any).dcas;
            return dca.status === 'ACTIVE' &&
                   ((dca.capacity_used || 0) < (dca.capacity_limit || 100));
        })
        .map(row => {
            const dca = (row as any).dcas;
            const capacityLimit = dca.capacity_limit || 100;
            const capacityUsed = dca.capacity_used || 0;
            const utilizationPct = (capacityUsed / capacityLimit) * 100;
            const score =
                ((100 - utilizationPct) * 0.40) +
                ((row.region_sla_compliance || 0) * 0.35) +
                ((row.region_recovery_rate || 0) * 0.25);

            return { dca_id: dca.id, dca_name: dca.name, score, capacity_used: capacityUsed };
        })
        .sort((a, b) => b.score - a.score);

    if (eligible.length === 0) {
        fail('All DCAs at capacity or inactive');
        await supabase.from('cases').delete().eq('id', newCase.id);
        info('Test case cleaned up.');
        return;
    }

    const winner = eligible[0];
    info(`Selected DCA: ${winner.dca_name} (Score: ${winner.score.toFixed(2)})`);

    // Step 3: Assign (service_role now allowed by fixed trigger)
    const now = new Date().toISOString();
    const { error: assignError } = await supabase
        .from('cases')
        .update({
            assigned_dca_id: winner.dca_id,
            status: 'ALLOCATED',
            updated_at: now,
            metadata: {
                test: true,
                assigned_at: now,
                assigned_by: 'SYSTEM',
                assignment_score: winner.score,
            },
        })
        .eq('id', newCase.id);

    if (assignError) {
        fail(`Assignment failed: ${assignError.message}`);
        await supabase.from('cases').delete().eq('id', newCase.id);
        info('Test case cleaned up.');
        return;
    }

    // Step 4: Verify
    const { data: verifyCase } = await supabase
        .from('cases')
        .select('id, case_number, status, assigned_dca_id')
        .eq('id', newCase.id)
        .single();

    if (verifyCase?.assigned_dca_id === winner.dca_id && verifyCase?.status === 'ALLOCATED') {
        pass('🎉 ALLOCATION SUCCESSFUL!');
        info(`Case: ${verifyCase.case_number}`);
        info(`Status: ${verifyCase.status}`);
        info(`Assigned DCA: ${winner.dca_name} (${verifyCase.assigned_dca_id})`);
    } else {
        fail('Allocation verification failed - case state mismatch');
    }

    // Step 5: Timeline entry
    const { error: timelineError } = await supabase
        .from('case_timeline')
        .insert({
            case_id: newCase.id,
            event_type: 'CASE_ASSIGNED',
            event_category: 'SYSTEM',
            description: `[TEST] Case auto-assigned to ${winner.dca_name} by SYSTEM allocation`,
            metadata: {
                dca_id: winner.dca_id,
                dca_name: winner.dca_name,
                allocation_score: winner.score,
                allocated_by: 'SYSTEM',
                is_test: true,
            },
            performed_by: 'SYSTEM',
            performed_by_role: 'SYSTEM',
        });

    if (timelineError) {
        warn(`Timeline entry failed (non-critical): ${timelineError.message}`);
    } else {
        pass('Timeline entry created');
    }

    // Cleanup
    separator('CLEANUP');
    info('Removing test case and timeline entries...');

    await supabase.from('case_timeline').delete().eq('case_id', newCase.id);
    await supabase.from('cases').delete().eq('id', newCase.id);
    pass('Test data cleaned up successfully');
}

// ==========================================
// MAIN
// ==========================================
async function main() {
    console.log('\n🚀 FedEx DCA Control Tower - Case Allocation Test');
    console.log('='.repeat(60));

    // Test 1: Regions
    const regions = await testRegions();
    if (!regions) {
        console.log('\n💀 FATAL: Cannot proceed without regions.');
        process.exit(1);
    }

    // Test 2: DCAs
    const dcas = await testDCAs();
    if (!dcas) {
        console.log('\n💀 FATAL: Cannot proceed without DCAs.');
        process.exit(1);
    }

    // Test 3: Assignments
    const assignments = await testRegionDCAAssignments();
    if (!assignments) {
        console.log('\n💀 FATAL: Cannot proceed without region-DCA assignments.');
        process.exit(1);
    }

    // Use first active region for remaining tests
    const testRegionId = regions[0].id;
    const testRegionCode = regions[0].region_code;
    info(`\nUsing region: ${testRegionCode} (${testRegionId}) for allocation tests`);

    // Test 4: Scoring simulation
    await testAllocationScoring(testRegionId);

    // Test 5: Live allocation
    await testLiveAllocation(testRegionId, testRegionCode);

    separator('SUMMARY');
    pass('All allocation tests completed!');
    console.log('');
}

main().catch(err => {
    console.error('❌ Test runner crashed:', err);
    process.exit(1);
});
