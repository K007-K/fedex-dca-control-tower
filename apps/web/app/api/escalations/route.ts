import { NextResponse } from 'next/server';

import { withPermission, type ApiHandler } from '@/lib/auth/api-wrapper';
import { isFedExRole, isDCARole } from '@/lib/auth';
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
 * Permission: cases:read (escalations are part of case management)
 */
const handleGetEscalations: ApiHandler = async (request, { user }) => {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);

        const caseId = searchParams.get('case_id');
        const status = searchParams.get('status');
        const escalationType = searchParams.get('type');
        const region = searchParams.get('region');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let query = (supabase as any)
            .from('escalations')
            .select(`
                *,
                case:cases(id, case_number, customer_name, outstanding_amount, assigned_dca_id, region),
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

        // Filter for DCA users - only show escalations for their cases
        let filteredData = data;
        if (isDCARole(user.role) && user.dcaId) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            filteredData = data?.filter((e: any) =>
                e.case?.assigned_dca_id === user.dcaId ||
                e.escalated_to === user.id ||
                e.escalated_from === user.id
            );
        }

        // Apply region filter if provided
        if (region && region !== 'ALL') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            filteredData = filteredData?.filter((e: any) => e.case?.region === region);
        }

        return NextResponse.json({ data: filteredData });

    } catch (error) {
        console.error('Escalations API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
};

/**
 * POST /api/escalations - Create new escalation
 * Permission: cases:update (need permission to modify case status)
 */
const handleCreateEscalation: ApiHandler = async (request, { user }) => {
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
                escalated_from: user.id, // Track who created the escalation
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
            .from('cases')
            .update({ status: 'ESCALATED', updated_at: new Date().toISOString() })
            .eq('id', body.case_id);

        // Create notification (checks preferences and sends email if enabled)
        if (body.escalated_to) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: caseData } = await (supabase as any)
                .from('cases')
                .select('case_number, customer_name')
                .eq('id', body.case_id)
                .single();

            // Import notification service dynamically to avoid circular deps
            const { createNotification } = await import('@/lib/notifications/notification-service');

            createNotification({
                recipientId: body.escalated_to,
                notificationType: 'ESCALATION_CREATED',
                title: 'New Escalation Assigned',
                message: `You have been assigned escalation: ${body.title}`,
                relatedCaseId: body.case_id,
                relatedEscalationId: (escalation as Escalation).id,
                priority: body.severity === 'HIGH' || body.severity === 'CRITICAL' ? 'HIGH' : 'NORMAL',
                emailData: caseData ? {
                    caseNumber: caseData.case_number,
                    customerName: caseData.customer_name,
                    reason: body.description,
                    escalatedBy: user.email,
                } : undefined,
            }).catch(err => console.error('Notification error:', err));

            // Fire webhook event for escalation
            const { fireWebhookEvent } = await import('@/lib/webhooks');
            fireWebhookEvent('case.escalated', {
                escalation_id: (escalation as Escalation).id,
                case_id: body.case_id,
                case_number: caseData?.case_number,
                customer_name: caseData?.customer_name,
                escalation_type: body.escalation_type,
                severity: body.severity || 'MEDIUM',
                title: body.title,
                escalated_by: user.email,
                escalated_to: body.escalated_to,
            }).catch(err => console.error('Webhook error:', err));
        }

        return NextResponse.json({ data: escalation }, { status: 201 });

    } catch (error) {
        console.error('Escalations API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
};

// Export wrapped handlers
export const GET = withPermission('cases:read', handleGetEscalations);
export const POST = withPermission('cases:update', handleCreateEscalation);
