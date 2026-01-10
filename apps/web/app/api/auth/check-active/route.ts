/**
 * API Route: Check User Active Status
 * Used during login flow to verify if user account is active
 * Uses admin client to bypass RLS
 */
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        // Use admin client to bypass RLS
        const adminClient = createAdminClient();

        const { data, error } = await adminClient
            .from('users')
            .select('id, role, is_active')
            .eq('email', email)
            .single();

        const userData = data as { id: string; role: string; is_active: boolean } | null;

        if (error || !userData) {
            // Don't reveal if user exists or not
            return NextResponse.json({
                is_active: true,
                role: null
            });
        }

        return NextResponse.json({
            is_active: userData.is_active,
            role: userData.role
        });

    } catch (error) {
        console.error('Check active status error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
