import { NextResponse } from 'next/server';

import { withPermission, withRateLimitedPermission, type ApiHandler } from '@/lib/auth/api-wrapper';
import { getCaseFilter, isFedExRole, isDCARole, canManageRole, type UserRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';

// Use admin client for user creation (requires service role)
import { createClient as createAdminSupabase } from '@supabase/supabase-js';

function getAdminClient() {
    return createAdminSupabase(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );
}

/**
 * Generate a temporary password for new users
 */
function generateTempPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 16; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

/**
 * GET /api/users - List users with pagination and filters
 * Permission: users:read
 */
const handleGetUsers: ApiHandler = async (request, { user }) => {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);

        // Parse query parameters
        const page = parseInt(searchParams.get('page') ?? '1');
        const limit = parseInt(searchParams.get('limit') ?? '20');
        const role = searchParams.get('role');
        const dcaId = searchParams.get('dca_id');
        const organizationId = searchParams.get('organization_id');
        const isActive = searchParams.get('is_active');
        const search = searchParams.get('search');

        const offset = (page - 1) * limit;

        // Build query
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let query = (supabase as any)
            .from('users')
            .select('*', { count: 'exact' });

        // DCA users can only see users in their DCA
        if (isDCARole(user.role) && user.dcaId) {
            query = query.eq('dca_id', user.dcaId);
        }

        // Apply filters
        if (role) {
            query = query.eq('role', role);
        }

        if (dcaId) {
            // Verify DCA users can only see their own DCA's users
            if (isDCARole(user.role) && dcaId !== user.dcaId) {
                return NextResponse.json(
                    { error: { code: 'FORBIDDEN', message: 'Cannot access other DCA users' } },
                    { status: 403 }
                );
            }
            query = query.eq('dca_id', dcaId);
        }

        if (organizationId) {
            query = query.eq('organization_id', organizationId);
        }

        if (isActive !== null && isActive !== undefined) {
            query = query.eq('is_active', isActive === 'true');
        }

        if (search) {
            // Sanitize search input
            const sanitizedSearch = search.replace(/[%_]/g, '\\$&');
            query = query.or(`full_name.ilike.%${sanitizedSearch}%,email.ilike.%${sanitizedSearch}%`);
        }

        // Add pagination and ordering
        query = query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) {
            console.error('Users fetch error:', error);
            return NextResponse.json(
                { error: 'Failed to fetch users', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            data,
            pagination: {
                page,
                limit,
                total: count ?? 0,
                totalPages: Math.ceil((count ?? 0) / limit),
            },
        });

    } catch (error) {
        console.error('Users API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
};

/**
 * POST /api/users - Create a new user
 * Permission: users:create
 * 
 * P0-7 FIX: Creates Supabase Auth user first, then profile
 */
const handleCreateUser: ApiHandler = async (request, { user }) => {
    try {
        const supabase = await createClient();
        const adminClient = getAdminClient();
        const body = await request.json();

        // Validate required fields
        const requiredFields = ['email', 'full_name', 'role'];
        for (const field of requiredFields) {
            if (!body[field]) {
                return NextResponse.json(
                    { error: `Missing required field: ${field}` },
                    { status: 400 }
                );
            }
        }

        const targetRole = body.role as UserRole;

        // Check if user can assign this role
        if (!canManageRole(user.role, targetRole)) {
            return NextResponse.json(
                { error: 'You cannot create users with a role higher than your own' },
                { status: 403 }
            );
        }

        // DCA admins can only create users for their own DCA
        if (isDCARole(user.role) && isDCARole(targetRole)) {
            if (!body.dca_id || body.dca_id !== user.dcaId) {
                return NextResponse.json(
                    { error: 'You can only create users for your own DCA' },
                    { status: 403 }
                );
            }
        }

        // Check if email already exists
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: existing } = await (supabase as any)
            .from('users')
            .select('id')
            .eq('email', body.email)
            .single();

        if (existing) {
            return NextResponse.json(
                { error: 'User with this email already exists' },
                { status: 409 }
            );
        }

        // P0-7 FIX: Create Supabase Auth user first
        const tempPassword = generateTempPassword();
        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
            email: body.email,
            password: tempPassword,
            email_confirm: true, // Auto-confirm for admin-created users
            user_metadata: {
                full_name: body.full_name,
                role: body.role,
            }
        });

        if (authError) {
            console.error('Auth user creation error:', authError);
            return NextResponse.json(
                { error: 'Failed to create user authentication', details: authError.message },
                { status: 500 }
            );
        }

        // Create/update user profile with admin client to bypass RLS
        // Using UPSERT because Supabase may auto-create a profile via trigger
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (adminClient as any)
            .from('users')
            .upsert({
                id: authData.user.id, // Link to auth user
                email: body.email,
                full_name: body.full_name,
                role: body.role,
                organization_id: body.organization_id ?? null,
                dca_id: body.dca_id ?? null,
                phone: body.phone ?? null,
                timezone: body.timezone ?? 'America/New_York',
                locale: body.locale ?? 'en-US',
                is_active: body.is_active ?? true,
                notification_preferences: body.notification_preferences ?? { email: true, in_app: true },
            }, { onConflict: 'id' })
            .select()
            .single();

        if (error) {
            console.error('User profile creation error:', error);
            // Rollback: delete the auth user if profile creation fails
            await adminClient.auth.admin.deleteUser(authData.user.id);
            return NextResponse.json(
                { error: 'Failed to create user profile', details: error.message },
                { status: 500 }
            );
        }

        // Send credentials email to personal email if provided
        let emailSent = false;
        let emailError = '';

        if (body.personal_email) {
            try {
                const { sendUserCredentials } = await import('@/lib/email/send-email');
                const result = await sendUserCredentials(
                    body.personal_email,
                    body.full_name,
                    body.email, // work email
                    tempPassword
                );
                emailSent = result.success;
                if (!result.success) {
                    emailError = result.error || 'Unknown error';
                }
            } catch (emailErr) {
                console.error('Failed to send credentials email:', emailErr);
                emailError = emailErr instanceof Error ? emailErr.message : 'Failed to send email';
            }
        }

        return NextResponse.json({
            data,
            tempPassword, // Still return temp password as backup
            emailSent,
            emailError: emailSent ? undefined : emailError,
            message: emailSent
                ? `User created! Credentials have been sent to ${body.personal_email}`
                : body.personal_email
                    ? `User created. Email failed to send - share credentials manually.`
                    : 'User created. Share the temporary password with the user securely.'
        }, { status: 201 });

    } catch (error) {
        console.error('Users API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
};

// Export wrapped handlers with rate limiting for user creation
export const GET = withPermission('users:read', handleGetUsers);
export const POST = withRateLimitedPermission('users:create', handleCreateUser, RATE_LIMIT_CONFIGS.admin);
