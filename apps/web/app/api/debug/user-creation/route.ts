import { NextResponse } from 'next/server';
import { createClient as createAdminSupabase } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

/**
 * Debug endpoint to test user creation
 * GET /api/debug/user-creation
 */
export async function GET() {
    const debug: Record<string, unknown> = {};

    try {
        // Step 1: Check env vars
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        debug.envCheck = {
            supabaseUrl: !!supabaseUrl,
            serviceRoleKey: !!serviceRoleKey,
            serviceRoleKeyLength: serviceRoleKey?.length || 0,
        };

        if (!supabaseUrl || !serviceRoleKey) {
            return NextResponse.json({
                error: 'Missing env vars',
                debug
            }, { status: 500 });
        }

        // Step 2: Check current user
        const supabase = await createClient();
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        debug.authUser = {
            id: authUser?.id,
            email: authUser?.email,
            error: authError?.message,
        };

        // Step 3: Check user profile in database
        if (authUser?.email) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: profile, error: profileError } = await (supabase as any)
                .from('users')
                .select('id, email, role')
                .eq('email', authUser.email)
                .single();

            debug.userProfile = {
                id: profile?.id,
                email: profile?.email,
                role: profile?.role,
                error: profileError?.message,
            };
        }

        // Step 4: Test admin client
        const adminClient = createAdminSupabase(supabaseUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        // Step 5: Try to create a test auth user
        const testEmail = `test-${Date.now()}@debug.local`;
        const { data: testAuthUser, error: testAuthError } = await adminClient.auth.admin.createUser({
            email: testEmail,
            password: 'TestPassword123!',
            email_confirm: true,
        });

        debug.testAuthCreation = {
            success: !!testAuthUser?.user?.id,
            userId: testAuthUser?.user?.id,
            error: testAuthError?.message,
        };

        // Step 6: Try to insert into users table with admin client
        if (testAuthUser?.user?.id) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: insertData, error: insertError } = await (adminClient as any)
                .from('users')
                .insert({
                    id: testAuthUser.user.id,
                    email: testEmail,
                    full_name: 'Debug Test User',
                    role: 'READONLY',
                })
                .select()
                .single();

            debug.testProfileInsert = {
                success: !!insertData?.id,
                id: insertData?.id,
                error: insertError?.message,
                errorCode: insertError?.code,
                errorDetails: insertError?.details,
            };

            // Cleanup - delete test user
            await adminClient.auth.admin.deleteUser(testAuthUser.user.id);

            if (insertData?.id) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (adminClient as any).from('users').delete().eq('id', insertData.id);
            }

            debug.cleanup = 'done';
        }

        return NextResponse.json({ success: true, debug });

    } catch (err) {
        debug.fatalError = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ error: 'Debug failed', debug }, { status: 500 });
    }
}
