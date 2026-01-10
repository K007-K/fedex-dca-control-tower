import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { UserRole } from '@/lib/auth/rbac';

export const dynamic = 'force-dynamic';

interface CreateAgentRequest {
    full_name: string;
    email: string;
    phone?: string;
}

/**
 * POST /api/manager/agents
 * 
 * Create a new DCA_AGENT under the current manager's supervision.
 * 
 * GOVERNANCE RULES:
 * 1. Only DCA_MANAGER can call this endpoint
 * 2. Manager must have can_create_agents = true
 * 3. New agent inherits: state_code, dca_id, primary_region_id, organization_id from manager
 * 4. created_by_user_id is set to manager's ID for audit trail
 */
export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // 1. Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get manager profile with permissions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: manager, error: managerError } = await (adminSupabase as any)
        .from('users')
        .select('id, role, can_create_agents, state_code, dca_id, primary_region_id, organization_id, email')
        .eq('email', user.email)
        .single();

    if (managerError || !manager) {
        return NextResponse.json({ error: 'Manager profile not found' }, { status: 404 });
    }

    // 3. Role check - must be DCA_MANAGER
    if (manager.role !== 'DCA_MANAGER') {
        return NextResponse.json(
            { error: 'Only DCA Managers can create agents' },
            { status: 403 }
        );
    }

    // 4. Permission check - must have can_create_agents
    if (!manager.can_create_agents) {
        return NextResponse.json(
            { error: 'You do not have permission to create agents. Contact your DCA Admin.' },
            { status: 403 }
        );
    }

    // 5. Validate request body
    let body: CreateAgentRequest;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    if (!body.full_name || !body.email) {
        return NextResponse.json(
            { error: 'Full name and email are required' },
            { status: 400 }
        );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // 6. Check if email already exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingUser } = await (adminSupabase as any)
        .from('users')
        .select('id')
        .eq('email', body.email)
        .single();

    if (existingUser) {
        return NextResponse.json(
            { error: 'A user with this email already exists' },
            { status: 409 }
        );
    }

    // 7. Create auth user in Supabase Auth
    // Generate a temporary password - user should reset on first login
    const tempPassword = `Agent${Date.now()}!`;

    const { data: authData, error: authCreateError } = await adminSupabase.auth.admin.createUser({
        email: body.email,
        password: tempPassword,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
            full_name: body.full_name,
            role: 'DCA_AGENT',
        },
    });

    if (authCreateError || !authData.user) {
        console.error('Auth user creation failed:', authCreateError);
        return NextResponse.json(
            { error: 'Failed to create user account' },
            { status: 500 }
        );
    }

    // 8. Create user record in public.users table with inherited governance
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newAgent, error: insertError } = await (adminSupabase as any)
        .from('users')
        .insert({
            email: body.email,
            full_name: body.full_name,
            phone: body.phone || null,
            role: 'DCA_AGENT' as UserRole,
            is_active: true,
            // GOVERNANCE: Inherit from manager
            state_code: manager.state_code,
            dca_id: manager.dca_id,
            primary_region_id: manager.primary_region_id,
            // AUDIT: Track creator
            created_by_user_id: manager.id,
            can_create_agents: false, // Agents cannot create other agents
            created_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (insertError) {
        console.error('User record creation failed:', insertError);
        // Try to clean up auth user
        await adminSupabase.auth.admin.deleteUser(authData.user.id);
        return NextResponse.json(
            { error: 'Failed to create user profile' },
            { status: 500 }
        );
    }

    // 9. Log the creation in audit_logs
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (adminSupabase as any)
            .from('audit_logs')
            .insert({
                action: 'AGENT_CREATED',
                severity: 'INFO',
                user_id: manager.id,
                resource_type: 'USER',
                resource_id: newAgent.id,
                region_id: manager.primary_region_id,
                details: {
                    created_agent_email: body.email,
                    created_agent_name: body.full_name,
                    inherited_state_code: manager.state_code,
                    inherited_dca_id: manager.dca_id,
                    creator_email: manager.email,
                },
            });
    } catch (auditError) {
        // Non-fatal - log but continue
        console.warn('Audit log failed:', auditError);
    }

    // 10. Return success response
    return NextResponse.json({
        success: true,
        message: 'Agent created successfully',
        agent: {
            id: newAgent.id,
            email: newAgent.email,
            full_name: newAgent.full_name,
            state_code: newAgent.state_code,
        },
        // Include temp password for manager to share with agent
        temporary_password: tempPassword,
        note: 'Please share the temporary password with the agent. They should change it on first login.',
    });
}
