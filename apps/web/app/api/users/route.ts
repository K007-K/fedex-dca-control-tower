import { NextResponse } from 'next/server';

// Force dynamic rendering - this route uses cookies/headers
export const dynamic = 'force-dynamic';

import { withPermission, withRateLimitedPermission, type ApiHandler } from '@/lib/auth/api-wrapper';
import { isFedExRole, isDCARole, canManageRole, type UserRole } from '@/lib/auth';
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

// =====================================================
// BUSINESS RULES - CREATOR PERMISSION MATRIX (ENTERPRISE MODEL)
// =====================================================
// SUPER_ADMIN: Can create all FEDEX roles + DCA_ADMIN
// FEDEX_ADMIN: Can create FEDEX_MANAGER, FEDEX_ANALYST, READONLY, AUDITOR + DCA_ADMIN
// DCA_ADMIN: Can create DCA_MANAGER, DCA_AGENT (within own DCA only)
// All others: CANNOT create users

const SUPER_ADMIN_CAN_CREATE: UserRole[] = [
    'FEDEX_ADMIN', 'FEDEX_MANAGER', 'FEDEX_ANALYST', 'AUDITOR', 'READONLY', 'DCA_ADMIN'
];
const FEDEX_ADMIN_CAN_CREATE: UserRole[] = [
    'FEDEX_MANAGER', 'FEDEX_ANALYST', 'READONLY', 'AUDITOR', 'DCA_ADMIN'
];
const DCA_ADMIN_CAN_CREATE: UserRole[] = ['DCA_MANAGER', 'DCA_AGENT'];

// Roles that are DCA internal (only DCA_ADMIN can create)
const DCA_INTERNAL_ROLES: UserRole[] = ['DCA_MANAGER', 'DCA_AGENT'];

// =====================================================
// IDENTITY GOVERNANCE - EMAIL DOMAIN RULES
// =====================================================
// FedEx roles: MUST use @fedex.com
// DCA roles: MUST use corporate email, NO @fedex.com, NO personal domains

const BLOCKED_PERSONAL_DOMAINS = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
    'live.com', 'aol.com', 'icloud.com', 'mail.com',
    'protonmail.com', 'yandex.com', 'zoho.com'
];

/**
 * Validate email domain based on role type
 * CRITICAL: This is backend-only enforcement - NOT bypassable via UI
 */
function validateEmailDomain(
    email: string,
    targetRole: UserRole
): { valid: boolean; error?: string; domain: string } {
    const emailParts = email.toLowerCase().split('@');
    if (emailParts.length !== 2) {
        return { valid: false, error: 'Invalid email format', domain: '' };
    }
    const domain = emailParts[1];

    // FedEx roles MUST use @fedex.com
    if (isFedExRole(targetRole)) {
        if (domain !== 'fedex.com') {
            return {
                valid: false,
                error: `FedEx roles must use @fedex.com email. Got: @${domain}`,
                domain
            };
        }
        return { valid: true, domain };
    }

    // DCA roles: FORBIDDEN domains
    if (isDCARole(targetRole)) {
        // Block @fedex.com for DCA users
        if (domain === 'fedex.com') {
            return {
                valid: false,
                error: 'DCA users cannot use @fedex.com email. Use your corporate DCA email.',
                domain
            };
        }

        // Block personal domains
        if (BLOCKED_PERSONAL_DOMAINS.includes(domain)) {
            return {
                valid: false,
                error: `Personal email domains are not allowed for DCA users. Got: @${domain}`,
                domain
            };
        }

        // DCA roles must have a corporate email (not auto-generated)
        if (domain === 'fedex-dca.com') {
            return {
                valid: false,
                error: 'Auto-generated emails are not allowed for DCA roles. Enter your corporate email.',
                domain
            };
        }

        return { valid: true, domain };
    }

    // Other roles (AUDITOR, READONLY) - basic validation
    return { valid: true, domain };
}

/**
 * Validate creator can create the target role
 * GOVERNANCE MODEL A - Strict hierarchy
 */
function validateCreatorPermission(
    creatorRole: UserRole,
    targetRole: UserRole
): { allowed: boolean; error?: string } {
    // SUPER_ADMIN: Can ONLY create FEDEX_ADMIN and AUDITOR
    if (creatorRole === 'SUPER_ADMIN') {
        if (!SUPER_ADMIN_CAN_CREATE.includes(targetRole)) {
            return {
                allowed: false,
                error: `SUPER_ADMIN can only create FEDEX_ADMIN or AUDITOR, not ${targetRole}`
            };
        }
        return { allowed: true };
    }

    // FEDEX_ADMIN: Can create FEDEX_MANAGER, FEDEX_ANALYST, READONLY, AUDITOR, DCA_ADMIN
    if (creatorRole === 'FEDEX_ADMIN') {
        if (!FEDEX_ADMIN_CAN_CREATE.includes(targetRole)) {
            return {
                allowed: false,
                error: `FEDEX_ADMIN can only create: FEDEX_MANAGER, FEDEX_ANALYST, READONLY, AUDITOR, DCA_ADMIN`
            };
        }
        return { allowed: true };
    }

    // FEDEX_MANAGER: Cannot create users (removed from creator pool)
    if (creatorRole === 'FEDEX_MANAGER') {
        return { allowed: false, error: 'FEDEX_MANAGER cannot create users' };
    }

    // DCA_ADMIN: Can ONLY create DCA_MANAGER and DCA_AGENT
    if (creatorRole === 'DCA_ADMIN') {
        if (!DCA_ADMIN_CAN_CREATE.includes(targetRole)) {
            return {
                allowed: false,
                error: `DCA Admin can only create DCA Manager or DCA Agent, not ${targetRole}`
            };
        }
        return { allowed: true };
    }

    // All other roles: CANNOT create users
    return { allowed: false, error: 'Your role cannot create users' };
}

/**
 * Audit log helper - logs user creation events
 */
async function logUserCreationAudit(
    adminClient: ReturnType<typeof getAdminClient>,
    action: string,
    severity: 'INFO' | 'WARNING' | 'ERROR',
    creatorId: string,
    creatorEmail: string,
    details: Record<string, unknown>
) {
    try {
        await adminClient.from('audit_logs').insert({
            action,
            severity,
            user_id: creatorId,
            user_email: creatorEmail,
            resource_type: 'USER',
            resource_id: details.target_user_id || null,
            details,
        });
    } catch (err) {
        console.error('Failed to write audit log:', err);
        // Don't fail the request if audit logging fails
    }
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

        // FEDEX_ADMIN: Filter users by their accessible regions
        // SUPER_ADMIN sees all users (isGlobalAdmin bypasses)
        if (!user.isGlobalAdmin && !isDCARole(user.role)) {
            if (user.accessibleRegions && user.accessibleRegions.length > 0) {
                // Filter users by primary_region_id within FEDEX_ADMIN's accessible regions
                query = query.in('primary_region_id', user.accessibleRegions);
            }
            // Note: Users without primary_region_id (global users) may need special handling
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
 * HARDENED USER CREATION FLOW
 * - FedEx cannot create DCA_MANAGER or DCA_AGENT
 * - DCA_ADMIN can only create for their own DCA
 * - Region is mandatory and inherited for DCA users
 * - All actions are audited
 */
const handleCreateUser: ApiHandler = async (request, { user }) => {
    const adminClient = getAdminClient();

    try {
        const supabase = await createClient();
        const body = await request.json();

        // =====================================================
        // VALIDATION 1: Required fields
        // =====================================================
        const requiredFields = ['email', 'full_name', 'role'];
        for (const field of requiredFields) {
            if (!body[field]) {
                await logUserCreationAudit(adminClient, 'USER_CREATION_DENIED', 'WARNING', user.id, user.email, {
                    reason: `Missing required field: ${field}`,
                    creator_role: user.role,
                    target_role: body.role || 'unknown',
                });
                return NextResponse.json(
                    { error: `Missing required field: ${field}` },
                    { status: 400 }
                );
            }
        }

        const targetRole = body.role as UserRole;

        // =====================================================
        // VALIDATION 1.5: Email domain enforcement (CRITICAL)
        // =====================================================
        // FedEx roles: MUST use @fedex.com
        // DCA roles: MUST use corporate email, NO @fedex.com, NO personal domains
        const emailValidation = validateEmailDomain(body.email, targetRole);
        if (!emailValidation.valid) {
            await logUserCreationAudit(adminClient, 'USER_CREATION_DENIED', 'WARNING', user.id, user.email, {
                reason: emailValidation.error,
                creator_role: user.role,
                target_role: targetRole,
                target_email: body.email,
                email_domain: emailValidation.domain,
                violation_type: 'EMAIL_DOMAIN_POLICY',
            });
            return NextResponse.json(
                { error: emailValidation.error },
                { status: 400 }
            );
        }

        // =====================================================
        // VALIDATION 2: Creator permission matrix
        // =====================================================
        const permissionCheck = validateCreatorPermission(user.role, targetRole);
        if (!permissionCheck.allowed) {
            await logUserCreationAudit(adminClient, 'USER_CREATION_DENIED', 'WARNING', user.id, user.email, {
                reason: permissionCheck.error,
                creator_role: user.role,
                target_role: targetRole,
                target_email: body.email,
            });
            return NextResponse.json(
                { error: permissionCheck.error },
                { status: 403 }
            );
        }

        // =====================================================
        // VALIDATION 3: DCA boundary enforcement
        // DCA ID must come from creator context, not request body
        // =====================================================
        let dcaId: string | null = null;
        let regionId: string | null = null;

        if (isDCARole(targetRole)) {
            if (user.role === 'DCA_ADMIN') {
                // DCA_ADMIN: Force DCA from creator's context (no spoofing)
                if (!user.dcaId) {
                    await logUserCreationAudit(adminClient, 'USER_CREATION_DENIED', 'ERROR', user.id, user.email, {
                        reason: 'DCA Admin has no DCA assigned',
                        creator_role: user.role,
                        target_role: targetRole,
                    });
                    return NextResponse.json(
                        { error: 'Your account has no DCA assigned. Contact administrator.' },
                        { status: 403 }
                    );
                }
                dcaId = user.dcaId;

                // Inherit region from DCA
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { data: dcaData } = await (supabase as any)
                    .from('dcas')
                    .select('region, primary_region_id')
                    .eq('id', dcaId)
                    .single();

                if (dcaData?.primary_region_id) {
                    regionId = dcaData.primary_region_id;
                }
            } else if (isFedExRole(user.role) && targetRole === 'DCA_ADMIN') {
                // FedEx creating DCA_ADMIN: DCA must be provided
                if (!body.dca_id) {
                    await logUserCreationAudit(adminClient, 'USER_CREATION_DENIED', 'WARNING', user.id, user.email, {
                        reason: 'DCA ID required when creating DCA_ADMIN',
                        creator_role: user.role,
                        target_role: targetRole,
                    });
                    return NextResponse.json(
                        { error: 'DCA ID is required when creating a DCA Admin' },
                        { status: 400 }
                    );
                }
                dcaId = body.dca_id;

                // Get region from DCA registration
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { data: dcaData } = await (supabase as any)
                    .from('dcas')
                    .select('region, primary_region_id')
                    .eq('id', dcaId)
                    .single();

                if (dcaData?.primary_region_id) {
                    regionId = dcaData.primary_region_id;
                }
            }
        }

        // =====================================================
        // VALIDATION 4: Region enforcement for FedEx users
        // =====================================================
        let regionIds: string[] = []; // For FEDEX_ADMIN multi-region

        if (isFedExRole(targetRole)) {
            // FEDEX_ADMIN can have multiple regions via region_ids
            if (targetRole === 'FEDEX_ADMIN' && body.region_ids && Array.isArray(body.region_ids) && body.region_ids.length > 0) {
                // Validate all regions exist and are active
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { data: validRegions, error: regionsError } = await (supabase as any)
                    .from('regions')
                    .select('id')
                    .in('id', body.region_ids)
                    .eq('status', 'ACTIVE');

                if (regionsError || !validRegions || validRegions.length !== body.region_ids.length) {
                    await logUserCreationAudit(adminClient, 'USER_CREATION_DENIED', 'WARNING', user.id, user.email, {
                        reason: 'One or more regions are invalid or inactive',
                        creator_role: user.role,
                        target_role: targetRole,
                        region_ids: body.region_ids,
                    });
                    return NextResponse.json(
                        { error: 'One or more regions are invalid or inactive' },
                        { status: 400 }
                    );
                }
                regionIds = body.region_ids;
                // Use first region as primary
                regionId = body.region_ids[0];
            } else if (body.region_id) {
                // Single region for other FedEx roles
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { data: regionData } = await (supabase as any)
                    .from('regions')
                    .select('id, status')
                    .eq('id', body.region_id)
                    .single();

                if (!regionData || regionData.status !== 'ACTIVE') {
                    await logUserCreationAudit(adminClient, 'USER_CREATION_DENIED', 'WARNING', user.id, user.email, {
                        reason: 'Invalid or inactive region',
                        creator_role: user.role,
                        target_role: targetRole,
                        region_id: body.region_id,
                    });
                    return NextResponse.json(
                        { error: 'Invalid or inactive region' },
                        { status: 400 }
                    );
                }
                regionId = body.region_id;
                regionIds = [body.region_id]; // Single region as array for user_region_access
            }
            // Note: Region is optional for FedEx users as they may have global access
        }

        // =====================================================
        // VALIDATION 5: Check if email already exists
        // =====================================================
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: existing } = await (supabase as any)
            .from('users')
            .select('id')
            .eq('email', body.email)
            .single();

        if (existing) {
            await logUserCreationAudit(adminClient, 'USER_CREATION_DENIED', 'WARNING', user.id, user.email, {
                reason: 'Email already exists',
                creator_role: user.role,
                target_email: body.email,
            });
            return NextResponse.json(
                { error: 'User with this email already exists' },
                { status: 409 }
            );
        }

        // =====================================================
        // CREATE USER: Auth user first, then profile
        // =====================================================
        const tempPassword = generateTempPassword();
        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
            email: body.email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
                full_name: body.full_name,
                role: body.role,
            }
        });

        if (authError) {
            console.error('Auth user creation error:', authError);
            await logUserCreationAudit(adminClient, 'USER_CREATION_DENIED', 'ERROR', user.id, user.email, {
                reason: 'Auth creation failed',
                error_message: authError.message,
                creator_role: user.role,
                target_email: body.email,
            });
            return NextResponse.json(
                { error: 'Failed to create user authentication', details: authError.message },
                { status: 500 }
            );
        }

        // Create user profile
        // GOVERNANCE: Users NEVER store region_id - region access derived from dca_id
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (adminClient as any)
            .from('users')
            .upsert({
                id: authData.user.id,
                email: body.email,
                full_name: body.full_name,
                role: body.role,
                organization_id: body.organization_id ?? null,
                dca_id: dcaId,
                // NO primary_region_id - region derived from dca_id → region_dca_assignments
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
            await logUserCreationAudit(adminClient, 'USER_CREATION_DENIED', 'ERROR', user.id, user.email, {
                reason: 'Profile creation failed',
                error_message: error.message,
                creator_role: user.role,
                target_email: body.email,
            });
            return NextResponse.json(
                { error: 'Failed to create user profile', details: error.message },
                { status: 500 }
            );
        }

        // =====================================================
        // AUDIT LOG: Success
        // =====================================================
        await logUserCreationAudit(adminClient, 'USER_CREATED', 'INFO', user.id, user.email, {
            target_user_id: data.id,
            target_email: body.email,
            target_role: body.role,
            dca_id: dcaId,
            region_id: regionId,
            region_ids: regionIds.length > 0 ? regionIds : undefined,
            creator_role: user.role,
            method: user.role === 'DCA_ADMIN' ? 'dca_self_service' : 'fedex_admin',
        });

        // =====================================================
        // CREATE REGION ACCESS ENTRIES
        // FedEx roles → user_region_access
        // DCA roles → dca_user_region_access
        // =====================================================
        if (regionIds.length > 0) {
            const targetTable = isDCARole(targetRole) ? 'dca_user_region_access' : 'user_region_access';

            const regionAccessEntries = regionIds.map(rId => ({
                user_id: data.id,
                region_id: rId,
                granted_by: user.id,
            }));

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error: accessError } = await (adminClient as any)
                .from(targetTable)
                .upsert(regionAccessEntries, { onConflict: 'user_id,region_id' });

            if (accessError) {
                console.error(`Failed to create region access entries in ${targetTable}:`, accessError);
                // Non-fatal - user is created, but log the error
            } else {
                await logUserCreationAudit(adminClient, 'REGION_ASSIGNED', 'INFO', user.id, user.email, {
                    target_user_id: data.id,
                    region_ids: regionIds,
                    assignment_type: isDCARole(targetRole) ? 'dca_explicit' : 'fedex_explicit',
                    table_used: targetTable,
                });
            }
        } else if (regionId) {
            // Single region assignment (legacy fallback)
            const targetTable = isDCARole(targetRole) ? 'dca_user_region_access' : 'user_region_access';

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error: accessError } = await (adminClient as any)
                .from(targetTable)
                .upsert({
                    user_id: data.id,
                    region_id: regionId,
                    granted_by: user.id,
                }, { onConflict: 'user_id,region_id' });

            if (!accessError) {
                await logUserCreationAudit(adminClient, 'REGION_ASSIGNED', 'INFO', user.id, user.email, {
                    target_user_id: data.id,
                    region_id: regionId,
                    assignment_type: isDCARole(targetRole) ? 'dca_single' : 'fedex_single',
                    table_used: targetTable,
                });
            }
        }

        // =====================================================
        // OPTIONAL: Send credentials email
        // =====================================================
        let emailSent = false;
        let emailError = '';

        if (body.personal_email) {
            try {
                const { sendUserCredentials } = await import('@/lib/email/send-email');
                const result = await sendUserCredentials(
                    body.personal_email,
                    body.full_name,
                    body.email,
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
            tempPassword,
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
        await logUserCreationAudit(adminClient, 'USER_CREATION_DENIED', 'ERROR', user.id, user.email, {
            reason: 'Internal server error',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            creator_role: user.role,
        });
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
};

// Export wrapped handlers with rate limiting for user creation
export const GET = withPermission('users:read', handleGetUsers);
export const POST = withRateLimitedPermission('users:create', handleCreateUser, RATE_LIMIT_CONFIGS.admin);
