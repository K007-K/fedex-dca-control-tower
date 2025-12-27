import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/sla - List SLA templates
 */
export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);

        const slaType = searchParams.get('type');
        const isActive = searchParams.get('is_active');

        let query = supabase
            .from('sla_templates')
            .select('*')
            .order('created_at', { ascending: false });

        if (slaType) {
            query = query.eq('sla_type', slaType);
        }

        if (isActive !== null) {
            query = query.eq('is_active', isActive === 'true');
        }

        const { data, error } = await query;

        if (error) {
            console.error('SLA templates fetch error:', error);
            return NextResponse.json(
                { error: 'Failed to fetch SLA templates', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ data });

    } catch (error) {
        console.error('SLA API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/sla - Create SLA template
 */
export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const body = await request.json();

        // Validate required fields
        const requiredFields = ['name', 'sla_type', 'duration_hours'];
        for (const field of requiredFields) {
            if (!body[field]) {
                return NextResponse.json(
                    { error: `Missing required field: ${field}` },
                    { status: 400 }
                );
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
            .from('sla_templates')
            .insert({
                name: body.name,
                sla_type: body.sla_type,
                description: body.description ?? null,
                duration_hours: body.duration_hours,
                business_hours_only: body.business_hours_only ?? false,
                applicable_to: body.applicable_to ?? null,
                breach_notification_to: body.breach_notification_to ?? [],
                auto_escalate_on_breach: body.auto_escalate_on_breach ?? true,
                escalation_rules: body.escalation_rules ?? null,
                is_active: body.is_active ?? true,
            })
            .select()
            .single();

        if (error) {
            console.error('SLA template creation error:', error);
            return NextResponse.json(
                { error: 'Failed to create SLA template', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ data }, { status: 201 });

    } catch (error) {
        console.error('SLA API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
