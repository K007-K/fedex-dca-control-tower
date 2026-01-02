import { NextResponse } from 'next/server';

// Force dynamic rendering - this route uses cookies/headers
export const dynamic = 'force-dynamic';

import { createClient as createAdminSupabase } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

function getAdminClient() {
    return createAdminSupabase(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );
}

/**
 * DELETE /api/notifications/delete-all - Delete all notifications for current user
 * Uses admin client to bypass RLS
 */
export async function DELETE() {
    try {
        const adminClient = getAdminClient();
        const supabase = await createClient();

        // Get current user
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (!authUser) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get the database user ID by email
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: profile } = await (supabase as any)
            .from('users')
            .select('id')
            .eq('email', authUser.email)
            .single();

        const userId = profile?.id || authUser.id;

        // Delete all notifications for this user using admin client
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (adminClient as any)
            .from('notifications')
            .delete()
            .eq('recipient_id', userId)
            .select('id');

        if (error) {
            console.error('Delete all notifications error:', error);
            throw error;
        }

        return NextResponse.json({
            message: 'All notifications deleted',
            count: data?.length || 0,
        });

    } catch (error) {
        console.error('Delete all notifications error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
