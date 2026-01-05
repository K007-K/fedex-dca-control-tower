import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';

/**
 * Agent Case Activity API
 * 
 * POST: Add activity note or log contact attempt
 * Uses admin client to bypass RLS (user auth is handled separately)
 */

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getCurrentUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'DCA_AGENT') {
        return NextResponse.json({ error: 'Forbidden - Only DCA agents can add activities' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { activity_type, description, metadata } = body;

    if (!activity_type || !description) {
        return NextResponse.json({ error: 'Activity type and description are required' }, { status: 400 });
    }

    // Use admin client to bypass RLS - we handle auth ourselves
    const supabase = createAdminClient();

    try {
        // Verify case is assigned to this agent
        const { data: caseData, error: caseError } = await supabase
            .from('cases')
            .select('id, case_number')
            .eq('id', id)
            .eq('assigned_agent_id', user.id)
            .single();

        if (caseError) {
            console.error('Case lookup error:', caseError);
            return NextResponse.json({ error: 'Case not found or not assigned to you' }, { status: 404 });
        }

        if (!caseData) {
            return NextResponse.json({ error: 'Case not found or not assigned to you' }, { status: 404 });
        }

        // Insert activity
        const { data: insertedActivity, error: insertError } = await supabase
            .from('case_activities')
            .insert({
                case_id: id,
                activity_type,
                description,
                metadata: metadata || {},
                created_by: user.id,
            })
            .select()
            .single();

        if (insertError) {
            console.error('Activity insert error:', insertError);
            // Check for specific errors
            if (insertError.code === '42P01') {
                return NextResponse.json({
                    error: 'Table case_activities does not exist. Please run database migrations.'
                }, { status: 500 });
            }
            return NextResponse.json({
                error: 'Failed to add activity',
                details: insertError.message
            }, { status: 500 });
        }

        // Update case updated_at
        await supabase
            .from('cases')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', id);

        console.log(`Activity ${activity_type} added to case ${caseData.case_number} by ${user.email}`);

        return NextResponse.json({
            success: true,
            activity_id: insertedActivity?.id
        });

    } catch (error) {
        console.error('Activity API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
