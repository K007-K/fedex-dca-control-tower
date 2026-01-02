/**
 * Reset and Seed Auth Users Script
 * Deletes ALL existing auth users and creates new ones matching the users table
 * 
 * USAGE:
 * node scripts/reset-auth-users.js
 * 
 * DEFAULT PASSWORD: Password123!
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../apps/web/.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEFAULT_PASSWORD = 'Password123!';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

// All users matching the users table (17 total, all 9 roles covered)
const USERS = [
    // FedEx Users
    { email: 'admin@fedex.com', name: 'System Administrator', role: 'SUPER_ADMIN' },
    { email: 'fedex.admin@fedex.com', name: 'David Wilson', role: 'FEDEX_ADMIN' },
    { email: 'india.manager@fedex.com', name: 'Priya Sharma', role: 'FEDEX_MANAGER' },
    { email: 'us.manager@fedex.com', name: 'Jennifer Martinez', role: 'FEDEX_MANAGER' },
    { email: 'analyst@fedex.com', name: 'Robert Chen', role: 'FEDEX_ANALYST' },
    { email: 'auditor@fedex.com', name: 'Lisa Thompson', role: 'AUDITOR' },
    { email: 'viewer@fedex.com', name: 'Emily Clark', role: 'READONLY' },
    // India DCA Users
    { email: 'rajesh.sharma@tatarecovery.in', name: 'Rajesh Sharma', role: 'DCA_ADMIN' },
    { email: 'manager@tatarecovery.in', name: 'Suresh Kumar', role: 'DCA_MANAGER' },
    { email: 'agent1@tatarecovery.in', name: 'Ankit Verma', role: 'DCA_AGENT' },
    { email: 'priya.patel@ril.in', name: 'Priya Patel', role: 'DCA_ADMIN' },
    { email: 'vikram.reddy@infosys.in', name: 'Vikram Reddy', role: 'DCA_ADMIN' },
    // America DCA Users
    { email: 'john.smith@apexcollections.com', name: 'John Smith', role: 'DCA_ADMIN' },
    { email: 'manager@apexcollections.com', name: 'James Miller', role: 'DCA_MANAGER' },
    { email: 'agent1@apexcollections.com', name: 'Mike Johnson', role: 'DCA_AGENT' },
    { email: 'sarah.j@libertyrecovery.com', name: 'Sarah Johnson', role: 'DCA_ADMIN' },
    { email: 'm.brown@eagledebt.com', name: 'Michael Brown', role: 'DCA_ADMIN' },
];

async function deleteAllAuthUsers() {
    console.log('🗑️  Deleting all existing auth users...');

    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error('Failed to list users:', error.message);
        return 0;
    }

    let deleted = 0;
    for (const user of users) {
        const { error: delError } = await supabase.auth.admin.deleteUser(user.id);
        if (!delError) {
            console.log(`   Deleted: ${user.email}`);
            deleted++;
        }
    }

    return deleted;
}

async function createAuthUser(user) {
    const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: DEFAULT_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: user.name, role: user.role }
    });

    if (error) {
        console.log(`❌ Failed: ${user.email} - ${error.message}`);
        return false;
    }

    console.log(`✅ Created: ${user.email} (${user.role})`);
    return true;
}

async function main() {
    console.log('🔐 FedEx DCA Control Tower - Reset Auth Users');
    console.log('='.repeat(50));
    console.log(`🔑 Password for all users: ${DEFAULT_PASSWORD}`);
    console.log('='.repeat(50) + '\n');

    // Step 1: Delete existing users
    const deleted = await deleteAllAuthUsers();
    console.log(`\n🗑️  Deleted ${deleted} existing users\n`);

    // Step 2: Create new users
    console.log('👥 Creating new auth users...');
    let created = 0;
    for (const user of USERS) {
        if (await createAuthUser(user)) created++;
    }

    console.log('\n' + '='.repeat(50));
    console.log(`📊 Created ${created}/${USERS.length} users`);
    console.log(`🔑 Password: ${DEFAULT_PASSWORD}`);
    console.log('='.repeat(50));
}

main().catch(console.error);
