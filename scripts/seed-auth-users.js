/**
 * Seed Auth Users Script
 * Creates Supabase auth users matching the seed data in 002_seed_data.sql
 * 
 * USAGE:
 * 1. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local or environment
 * 2. Run: node scripts/seed-auth-users.js
 * 
 * DEFAULT PASSWORD: Password123!
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../apps/web/.env.local') });

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEFAULT_PASSWORD = 'Password123!';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing required environment variables:');
    console.error('   - NEXT_PUBLIC_SUPABASE_URL');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

// Create admin client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Users from seed data with matching UUIDs
const SEED_USERS = [
    // FedEx Users
    {
        id: '20000000-0000-0000-0000-000000000001',
        email: 'admin@fedex.com',
        full_name: 'System Administrator',
        role: 'SUPER_ADMIN'
    },
    {
        id: '20000000-0000-0000-0000-000000000002',
        email: 'collections.manager@fedex.com',
        full_name: 'Jennifer Martinez',
        role: 'FEDEX_MANAGER'
    },
    {
        id: '20000000-0000-0000-0000-000000000003',
        email: 'analyst@fedex.com',
        full_name: 'Robert Chen',
        role: 'FEDEX_ANALYST'
    },
    {
        id: '20000000-0000-0000-0000-000000000004',
        email: 'auditor@fedex.com',
        full_name: 'Lisa Thompson',
        role: 'AUDITOR'
    },
    // DCA Users - Apex Collections
    {
        id: '20000000-0000-0000-0000-000000000011',
        email: 'john.smith@apexcollections.com',
        full_name: 'John Smith',
        role: 'DCA_ADMIN'
    },
    {
        id: '20000000-0000-0000-0000-000000000012',
        email: 'agent1@apexcollections.com',
        full_name: 'Mike Johnson',
        role: 'DCA_AGENT'
    },
    // DCA Users - Global Recovery
    {
        id: '20000000-0000-0000-0000-000000000021',
        email: 'sarah.j@globalrecovery.com',
        full_name: 'Sarah Johnson',
        role: 'DCA_ADMIN'
    },
    {
        id: '20000000-0000-0000-0000-000000000022',
        email: 'agent1@globalrecovery.com',
        full_name: 'Emma Williams',
        role: 'DCA_AGENT'
    },
    // DCA Users - Premier Debt
    {
        id: '20000000-0000-0000-0000-000000000031',
        email: 'm.brown@premierdebt.com',
        full_name: 'Michael Brown',
        role: 'DCA_ADMIN'
    }
];

async function createAuthUser(user) {
    try {
        // First check if user already exists
        const { data: existingUser } = await supabase.auth.admin.getUserById(user.id);

        if (existingUser?.user) {
            console.log(`⏭️  User already exists: ${user.email}`);
            return { success: true, skipped: true };
        }

        // Create auth user with specific UUID
        const { data, error } = await supabase.auth.admin.createUser({
            email: user.email,
            password: DEFAULT_PASSWORD,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
                full_name: user.full_name,
                role: user.role
            },
            app_metadata: {
                role: user.role
            }
        });

        if (error) {
            // If user exists with different ID, log it
            if (error.message.includes('already been registered')) {
                console.log(`⚠️  Email already exists (different ID): ${user.email}`);
                return { success: false, exists: true };
            }
            throw error;
        }

        console.log(`✅ Created: ${user.email} (${user.role})`);
        return { success: true, user: data.user };

    } catch (error) {
        console.error(`❌ Failed to create ${user.email}:`, error.message);
        return { success: false, error: error.message };
    }
}

async function main() {
    console.log('🔐 FedEx DCA Control Tower - Auth User Seeding');
    console.log('='.repeat(50));
    console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
    console.log(`🔑 Default password: ${DEFAULT_PASSWORD}`);
    console.log('='.repeat(50));
    console.log('');

    let created = 0;
    let skipped = 0;
    let failed = 0;

    for (const user of SEED_USERS) {
        const result = await createAuthUser(user);
        if (result.success) {
            if (result.skipped) skipped++;
            else created++;
        } else {
            failed++;
        }
    }

    console.log('');
    console.log('='.repeat(50));
    console.log('📊 Summary:');
    console.log(`   ✅ Created: ${created}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log('');
    console.log('🔑 Login Credentials:');
    console.log(`   Email: admin@fedex.com`);
    console.log(`   Password: ${DEFAULT_PASSWORD}`);
    console.log('='.repeat(50));
}

main().catch(console.error);
