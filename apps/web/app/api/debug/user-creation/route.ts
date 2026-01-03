import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering - this route uses cookies/headers
export const dynamic = 'force-dynamic';
import { createClient as createAdminSupabase } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { withPermission, type ApiHandler } from '@/lib/auth/api-wrapper';

/**
 * Debug endpoint to test user creation
 * GET /api/debug/user-creation
 * 
 * SECURITY: This is a debug route - SUPER_ADMIN only, disabled in production
 * Permission: admin:security
 */
const handleDebugUserCreation: ApiHandler = async (request, { user }) => {
    // SECURITY: Disabled in production
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
            { error: 'Debug endpoints are disabled in production' },
            { status: 404 }
        );
    }

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
        debug.authUser = {
            id: user.id,
            email: user.email,
            role: user.role,
        };

        // Step 3: Test admin client
        const adminClient = createAdminSupabase(supabaseUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        // Step 4: Try to create a test auth user
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

        // Step 5: Try to insert into users table with admin client
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
};

// CRITICAL: Protected with admin:security - SUPER_ADMIN only
export const GET = withPermission('admin:security', handleDebugUserCreation);
