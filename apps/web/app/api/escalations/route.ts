import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

interface Escalation {
    id: string;
    case_id: string;
    escalation_type: string;
    title: string;
    description: string;
    severity: string;
    status: string;
    escalated_to: string | null;
    escalated_from: string | null;
    escalated_at: string;
    resolution: string | null;
    resolved_by: string | null;
    resolved_at: string | null;
    created_at: string;
}

/**
 * GET /api/escalations - List escalations with filters
 */
export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);

        const caseId = searchParams.get('case_id');
        const status = searchParams.get('status');
        const escalationType = searchParams.get('type');

        let query = supabase
            .from('escalations')
            .select(`
                *,
                case:cases(id, case_number, customer_name, outstanding_amount),
                escalated_to_user:users!escalations_escalated_to_fkey(id, full_name, email),
                escalated_from_user:users!escalations_escalated_from_fkey(id, full_name, email)
            `)
            .order('created_at', { ascending: false });

        if (caseId) {
            query = query.eq('case_id', caseId);
        }

        if (status) {
            query = query.eq('status', status);
        }

        if (escalationType) {
            query = query.eq('escalation_type', escalationType);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Escalations fetch error:', error);
            return NextResponse.json(
                { error: 'Failed to fetch escalations', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ data });

    } catch (error) {
        console.error('Escalations API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/escalations - Create new escalation
 */
export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const body = await request.json();

        // Validate required fields
        const requiredFields = ['case_id', 'escalation_type', 'title', 'description'];
        for (const field of requiredFields) {
            if (!body[field]) {
                return NextResponse.json(
                    { error: `Missing required field: ${field}` },
                    { status: 400 }
                );
            }
        }

        // Valid escalation types
        const validTypes = [
            'SLA_BREACH', 'REPEATED_BREACH', 'NO_PROGRESS', 'CUSTOMER_COMPLAINT',
            'DCA_PERFORMANCE', 'HIGH_VALUE', 'FRAUD_SUSPECTED', 'LEGAL_REQUIRED', 'MANUAL'
        ];

        if (!validTypes.includes(body.escalation_type)) {
            return NextResponse.json(
                { error: `Invalid escalation type. Must be one of: ${validTypes.join(', ')}` },
                { status: 400 }
            );
        }

        // Create escalation
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: escalation, error: escalationError } = await (supabase as any)
            .from('escalations')
            .insert({
                case_id: body.case_id,
                escalation_type: body.escalation_type,
                title: body.title,
                description: body.description,
                severity: body.severity || 'MEDIUM',
                status: 'OPEN',
                escalated_to: body.escalated_to || null,
                escalated_from: body.escalated_from || null,
                escalated_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (escalationError) {
            console.error('Escalation creation error:', escalationError);
            return NextResponse.json(
                { error: 'Failed to create escalation', details: escalationError.message },
                { status: 500 }
            );
        }

        // Update case status to ESCALATED
        await supabase
            .from('cases')
            .update({ status: 'ESCALATED', updated_at: new Date().toISOString() })
            .eq('id', body.case_id);

        // Create notification for the escalation
        if (body.escalated_to) {
            await supabase.from('notifications').insert({
                recipient_id: body.escalated_to,
                notification_type: 'ESCALATION_CREATED',
                title: 'New Escalation Assigned',
                message: `You have been assigned escalation: ${body.title}`,
                related_case_id: body.case_id,
                related_escalation_id: (escalation as Escalation).id,
                channels: ['IN_APP'],
                priority: body.severity === 'HIGH' || body.severity === 'CRITICAL' ? 'HIGH' : 'NORMAL',
            });
        }

        return NextResponse.json({ data: escalation }, { status: 201 });

    } catch (error) {
        console.error('Escalations API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
