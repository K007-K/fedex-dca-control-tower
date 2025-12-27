/**
 * Sync User IDs Script
 * Syncs public.users IDs to match auth.users IDs
 * 
 * USAGE: node scripts/sync-user-ids.js
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../apps/web/.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing environment variables');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function syncUserIds() {
    console.log('🔄 Syncing User IDs...');
    console.log('='.repeat(50));

    // Get all auth users
    const { data: authUsersResult, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
        console.error('❌ Failed to get auth users:', authError.message);
        return;
    }

    const authUsers = authUsersResult.users;
    console.log(`📥 Found ${authUsers.length} auth users`);

    // Get all public users
    const { data: publicUsers, error: publicError } = await supabase
        .from('users')
        .select('*');

    if (publicError) {
        console.error('❌ Failed to get public users:', publicError.message);
        return;
    }

    console.log(`📥 Found ${publicUsers?.length || 0} public users`);
    console.log('');

    let synced = 0;
    let created = 0;
    let skipped = 0;

    for (const authUser of authUsers) {
        const email = authUser.email;
        const authId = authUser.id;

        // Find matching public user by email
        const publicUser = publicUsers?.find(u => u.email === email);

        if (!publicUser) {
            // No public user exists, create one
            console.log(`➕ Creating public user for: ${email}`);

            const { error: insertError } = await supabase
                .from('users')
                .insert({
                    id: authId,
                    email: email,
                    full_name: authUser.user_metadata?.full_name || email.split('@')[0],
                    role: authUser.app_metadata?.role || 'READONLY',
                    organization_id: '00000000-0000-0000-0000-000000000001', // FedEx org
                    is_active: true,
                    is_verified: true,
                    timezone: 'America/New_York'
                });

            if (insertError) {
                console.error(`   ❌ Failed: ${insertError.message}`);
            } else {
                created++;
                console.log(`   ✅ Created with ID: ${authId}`);
            }
            continue;
        }

        if (publicUser.id === authId) {
            console.log(`⏭️  Already synced: ${email}`);
            skipped++;
            continue;
        }

        // IDs don't match - need to update
        console.log(`🔄 Syncing: ${email}`);
        console.log(`   Old ID: ${publicUser.id}`);
        console.log(`   New ID: ${authId}`);

        try {
            // First update all foreign key references
            await supabase.from('case_actions').update({ performed_by: authId }).eq('performed_by', publicUser.id);
            await supabase.from('cases').update({ assigned_agent_id: authId }).eq('assigned_agent_id', publicUser.id);
            await supabase.from('notifications').update({ recipient_id: authId }).eq('recipient_id', publicUser.id);
            await supabase.from('audit_logs').update({ user_id: authId }).eq('user_id', publicUser.id);

            // Delete old user
            const { error: deleteError } = await supabase.from('users').delete().eq('id', publicUser.id);
            if (deleteError) {
                console.log(`   ⚠️  Delete old user warning: ${deleteError.message}`);
            }

            // Check if new ID already exists
            const { data: existingNew } = await supabase.from('users').select('id').eq('id', authId).single();

            if (existingNew) {
                console.log(`   ⏭️  New ID already exists, updating...`);
                await supabase.from('users').update({
                    email: publicUser.email,
                    full_name: publicUser.full_name,
                    role: publicUser.role,
                    organization_id: publicUser.organization_id,
                    dca_id: publicUser.dca_id,
                    is_active: publicUser.is_active,
                    is_verified: publicUser.is_verified,
                    timezone: publicUser.timezone
                }).eq('id', authId);
                synced++;
                console.log(`   ✅ Updated!`);
            } else {
                // Insert with new ID
                const { error: insertError } = await supabase
                    .from('users')
                    .insert({
                        id: authId,
                        email: publicUser.email,
                        full_name: publicUser.full_name,
                        role: publicUser.role,
                        organization_id: publicUser.organization_id,
                        dca_id: publicUser.dca_id,
                        is_active: publicUser.is_active,
                        is_verified: publicUser.is_verified,
                        timezone: publicUser.timezone
                    });

                if (insertError) {
                    console.error(`   ❌ Insert failed: ${insertError.message}`);
                } else {
                    synced++;
                    console.log(`   ✅ Synced!`);
                }
            }
        } catch (err) {
            console.error(`   ❌ Error: ${err.message}`);
        }
    }

    console.log('');
    console.log('='.repeat(50));
    console.log('📊 Summary:');
    console.log(`   🔄 Synced: ${synced}`);
    console.log(`   ➕ Created: ${created}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log('='.repeat(50));
}

syncUserIds().catch(console.error);
