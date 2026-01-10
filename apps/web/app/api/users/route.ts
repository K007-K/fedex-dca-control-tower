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

// BUSINESS RULES - CREATOR PERMISSION MATRIX (ENTERPRISE MODEL)
// =====================================================
// SUPER_ADMIN: Can create all FEDEX roles + DCA_ADMIN
// FEDEX_ADMIN: Can create FEDEX_MANAGER, FEDEX_ANALYST, READONLY, AUDITOR + DCA_ADMIN
// DCA_ADMIN: Can create DCA_MANAGER, DCA_AGENT (within own DCA only, assigns state to managers)
// DCA_MANAGER: Can create DCA_AGENT ONLY (within own DCA, same state, if can_create_agents=true)
// All others: CANNOT create users

const SUPER_ADMIN_CAN_CREATE: UserRole[] = [
    'FEDEX_ADMIN', 'FEDEX_MANAGER', 'FEDEX_ANALYST', 'FEDEX_AUDITOR', 'READONLY', 'DCA_ADMIN'
];
const FEDEX_ADMIN_CAN_CREATE: UserRole[] = [
    'FEDEX_MANAGER', 'FEDEX_ANALYST', 'READONLY', 'FEDEX_AUDITOR', 'DCA_ADMIN'
];
const DCA_ADMIN_CAN_CREATE: UserRole[] = ['DCA_MANAGER', 'DCA_AGENT'];
const DCA_MANAGER_CAN_CREATE: UserRole[] = ['DCA_AGENT'];  // Delegated creation

// Roles that are DCA internal (only DCA_ADMIN/DCA_MANAGER can create)
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

    // READONLY role: Allow any email (external users)
    // READONLY users use personal email for login, so any domain is acceptable
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

    // DCA_MANAGER: Can ONLY create DCA_AGENT (delegated creation)
    // Additional checks (can_create_agents flag, state inheritance) done in main handler
    if (creatorRole === 'DCA_MANAGER') {
        if (!DCA_MANAGER_CAN_CREATE.includes(targetRole)) {
            return {
                allowed: false,
                error: `DCA Manager can only create DCA Agent, not ${targetRole}`
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
        // Use admin client for DCA roles to bypass RLS (since RLS is blocking DCA user queries)
        // FedEx roles can use regular client as they typically have broader access
        const adminClient = getAdminClient();
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

        // Build query using admin client to bypass RLS
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let query = (adminClient as any)
            .from('users')
            .select('*', { count: 'exact' });

        // =====================================================
        // GOVERNANCE: Role-based user visibility (STRICT)
        // FedEx: Can only see FedEx roles + DCA_ADMIN
        // DCA: Can only see internal DCA users in their own DCA
        // =====================================================
        const DCA_INTERNAL_ROLES = ['DCA_MANAGER', 'DCA_AGENT'];
        const FEDEX_ROLES = ['SUPER_ADMIN', 'FEDEX_ADMIN', 'FEDEX_MANAGER', 'FEDEX_ANALYST', 'FEDEX_AUDITOR', 'FEDEX_VIEWER'];

        if (user.role === 'SUPER_ADMIN') {
            // SUPER_ADMIN: Can see all FedEx roles + DCA_ADMIN; NOT DCA internal
            query = query.in('role', [...FEDEX_ROLES, 'DCA_ADMIN']);
        } else if (user.role === 'FEDEX_ADMIN') {
            // FEDEX_ADMIN: Cannot see SUPER_ADMIN or DCA internal users
            query = query.in('role', ['FEDEX_ADMIN', 'FEDEX_MANAGER', 'FEDEX_ANALYST', 'FEDEX_AUDITOR', 'FEDEX_VIEWER', 'DCA_ADMIN']);
        } else if (['FEDEX_MANAGER', 'FEDEX_ANALYST', 'FEDEX_AUDITOR', 'FEDEX_VIEWER'].includes(user.role)) {
            // Other FedEx roles: Can only see FedEx users + DCA_ADMIN (not DCA internal)
            query = query.in('role', [...FEDEX_ROLES, 'DCA_ADMIN']);
        } else if (user.role === 'DCA_ADMIN') {
            // DCA_ADMIN: Can only see DCA_MANAGER + DCA_AGENT in their own DCA
            if (!user.dcaId) {
                return NextResponse.json({ error: 'No DCA assigned' }, { status: 403 });
            }
            query = query.eq('dca_id', user.dcaId).in('role', DCA_INTERNAL_ROLES);
        } else if (user.role === 'DCA_MANAGER') {
            // DCA_MANAGER: Can only see DCA_AGENT in their own DCA
            if (!user.dcaId) {
                return NextResponse.json({ error: 'No DCA assigned' }, { status: 403 });
            }
            query = query.eq('dca_id', user.dcaId).eq('role', 'DCA_AGENT');
        } else if (user.role === 'DCA_AGENT') {
            // DCA_AGENT: No user access
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
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
        // State handling:
        // - DCA_ADMIN creating DCA_MANAGER: assigns state from body.state_code
        // - DCA_ADMIN creating DCA_AGENT: optional state_code
        // - DCA_MANAGER creating DCA_AGENT: inherits state from creator
        // =====================================================
        let dcaId: string | null = null;
        let regionId: string | null = null;
        let stateCode: string | null = null;
        let canCreateAgents: boolean = false;
        let regionIds: string[] = []; // For multi-region assignment (DCA agents or FedEx admins)

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

                // STATE ASSIGNMENT for DCA_MANAGER (required)
                if (targetRole === 'DCA_MANAGER') {
                    if (!body.state_code) {
                        await logUserCreationAudit(adminClient, 'USER_CREATION_DENIED', 'WARNING', user.id, user.email, {
                            reason: 'State code required when creating DCA_MANAGER',
                            creator_role: user.role,
                            target_role: targetRole,
                        });
                        return NextResponse.json(
                            { error: 'State code is required when creating a DCA Manager. Assign a state for this manager to supervise.' },
                            { status: 400 }
                        );
                    }
                    stateCode = body.state_code;
                    // New managers get creation rights by default
                    canCreateAgents = body.can_create_agents !== false;
                } else if (targetRole === 'DCA_AGENT') {
                    // DCA_ADMIN creating agent: handle region assignment
                    stateCode = body.state_code || null;

                    // Handle region_ids assignment for agents
                    if (body.region_ids && Array.isArray(body.region_ids) && body.region_ids.length > 0) {
                        // Validate that all region_ids are within DCA's operating regions
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const { data: dcaRegions } = await (adminClient as any)
                            .from('region_dca_assignments')
                            .select('region_id')
                            .eq('dca_id', dcaId)
                            .eq('is_active', true);

                        const allowedRegionIds = dcaRegions?.map((r: { region_id: string }) => r.region_id) || [];

                        // Check that all requested regions are allowed for this DCA
                        const invalidRegions = body.region_ids.filter((rid: string) => !allowedRegionIds.includes(rid));
                        if (invalidRegions.length > 0) {
                            await logUserCreationAudit(adminClient, 'USER_CREATION_DENIED', 'WARNING', user.id, user.email, {
                                reason: 'Agent region outside DCA scope',
                                creator_role: user.role,
                                target_role: targetRole,
                                requested_regions: body.region_ids,
                                allowed_regions: allowedRegionIds,
                                invalid_regions: invalidRegions,
                            });
                            return NextResponse.json(
                                { error: 'Cannot assign agent to regions outside DCA operating scope' },
                                { status: 403 }
                            );
                        }

                        // Valid - use provided region_ids
                        regionIds = body.region_ids;
                        regionId = body.region_ids[0]; // Primary region
                    } else {
                        // Auto-derive from DCA's operating regions
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const { data: dcaRegions } = await (adminClient as any)
                            .from('region_dca_assignments')
                            .select('region_id')
                            .eq('dca_id', dcaId)
                            .eq('is_active', true);

                        if (dcaRegions && dcaRegions.length > 0) {
                            regionIds = dcaRegions.map((r: { region_id: string }) => r.region_id);
                            regionId = regionIds[0]; // Primary region
                        }
                    }
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
            } else if (user.role === 'DCA_MANAGER') {
                // DCA_MANAGER: Delegated agent creation with state inheritance
                // Check can_create_agents flag - use adminClient to bypass RLS
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { data: creatorData } = await (adminClient as any)
                    .from('users')
                    .select('dca_id, state_code, can_create_agents')
                    .eq('id', user.id)
                    .single();

                if (!creatorData?.can_create_agents) {
                    await logUserCreationAudit(adminClient, 'USER_CREATION_DENIED', 'WARNING', user.id, user.email, {
                        reason: 'DCA Manager creation rights have been revoked',
                        creator_role: user.role,
                        target_role: targetRole,
                    });
                    return NextResponse.json(
                        { error: 'Your user creation rights have been revoked by your DCA Admin.' },
                        { status: 403 }
                    );
                }

                if (!creatorData?.dca_id) {
                    await logUserCreationAudit(adminClient, 'USER_CREATION_DENIED', 'ERROR', user.id, user.email, {
                        reason: 'DCA Manager has no DCA assigned',
                        creator_role: user.role,
                        target_role: targetRole,
                    });
                    return NextResponse.json(
                        { error: 'Your account has no DCA assigned. Contact administrator.' },
                        { status: 403 }
                    );
                }

                dcaId = creatorData.dca_id;

                // Get region from DCA
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { data: dcaData } = await (supabase as any)
                    .from('dcas')
                    .select('region, primary_region_id')
                    .eq('id', dcaId)
                    .single();

                if (dcaData?.primary_region_id) {
                    regionId = dcaData.primary_region_id;
                }

                // Inherit state from creator (cannot be overridden)
                stateCode = creatorData.state_code || null;

                // Inherit region access from the manager who created this agent
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { data: managerRegions } = await (adminClient as any)
                    .from('dca_user_region_access')
                    .select('region_id')
                    .eq('user_id', user.id)
                    .is('revoked_at', null);

                if (managerRegions && managerRegions.length > 0) {
                    regionIds = managerRegions.map((r: { region_id: string }) => r.region_id);
                    regionId = regionIds[0]; // Primary region
                } else if (dcaData?.primary_region_id) {
                    // Fallback to DCA primary region
                    regionIds = [dcaData.primary_region_id];
                }
            }
        }

        // =====================================================
        // VALIDATION 4: Region enforcement for FedEx users
        // =====================================================
        // regionIds is already declared earlier in the function

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
        // Check users table
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: existing } = await (supabase as any)
            .from('users')
            .select('id')
            .eq('email', body.email)
            .single();

        if (existing) {
            await logUserCreationAudit(adminClient, 'USER_CREATION_DENIED', 'WARNING', user.id, user.email, {
                reason: 'Email already exists in users table',
                creator_role: user.role,
                target_email: body.email,
            });
            return NextResponse.json(
                { error: 'User with this email already exists' },
                { status: 409 }
            );
        }

        // Check for orphaned auth user (exists in auth but not in users table)
        // This can happen if a delete operation failed partially
        // Use getUserById by searching with email - more reliable than listUsers
        try {
            // Check if email exists in auth by attempting to list with email filter
            const { data: authUsersData } = await adminClient.auth.admin.listUsers({
                page: 1,
                perPage: 1,
            });

            // Search through users for matching email
            const { data: allAuthUsers } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
            const orphanedAuthUser = allAuthUsers?.users?.find(
                (u: { email?: string }) => u.email?.toLowerCase() === body.email.toLowerCase()
            );

            if (orphanedAuthUser) {
                console.log(`Found orphaned auth user for ${body.email} (ID: ${orphanedAuthUser.id}), cleaning up...`);
                await logUserCreationAudit(adminClient, 'ORPHANED_AUTH_CLEANUP', 'WARNING', user.id, user.email, {
                    orphaned_user_id: orphanedAuthUser.id,
                    target_email: body.email,
                });
                // Delete the orphaned auth user - force it
                try {
                    await adminClient.auth.admin.deleteUser(orphanedAuthUser.id);
                    console.log(`Cleaned up orphaned auth user for ${body.email}`);
                } catch (deleteErr) {
                    console.error('Failed to cleanup orphaned auth user:', deleteErr);
                    // Try alternative approach - ban first then delete
                    try {
                        await adminClient.auth.admin.updateUserById(orphanedAuthUser.id, { ban_duration: '876600h' });
                        await adminClient.auth.admin.deleteUser(orphanedAuthUser.id);
                        console.log(`Cleaned up orphaned auth user (with ban) for ${body.email}`);
                    } catch (banErr) {
                        console.error('Failed to cleanup with ban approach:', banErr);
                        return NextResponse.json(
                            { error: 'Email exists in auth system. Delete it manually from Supabase Authentication → Users.' },
                            { status: 409 }
                        );
                    }
                }
            }
        } catch (authCheckErr) {
            console.error('Error checking for orphaned auth users:', authCheckErr);
            // Continue anyway - createUser will fail if email exists
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

            // Check for specific error types
            let errorMessage = 'Failed to create user authentication';
            if (authError.message?.includes('already registered') || authError.message?.includes('already exists')) {
                errorMessage = 'User with this email already exists in authentication system';
            } else if (authError.message) {
                errorMessage = `Auth error: ${authError.message}`;
            }

            await logUserCreationAudit(adminClient, 'USER_CREATION_DENIED', 'ERROR', user.id, user.email, {
                reason: 'Auth creation failed',
                error_message: authError.message,
                error_code: (authError as { code?: string }).code,
                creator_role: user.role,
                target_email: body.email,
            });
            return NextResponse.json(
                { error: errorMessage },
                { status: 500 }
            );
        }

        // Create user profile
        // GOVERNANCE: Users NEVER store region_id - region access derived from dca_id
        // State-scoped creation: DCA_MANAGER has state, DCA_AGENT inherits from creator
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
                state_code: stateCode,  // State assignment/inheritance
                can_create_agents: body.role === 'DCA_MANAGER' ? canCreateAgents : false,
                created_by_user_id: user.id,  // Audit trail
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
        const creationMethod = user.role === 'DCA_MANAGER'
            ? 'dca_manager_delegated'
            : user.role === 'DCA_ADMIN'
                ? 'dca_admin_self_service'
                : 'fedex_admin';

        await logUserCreationAudit(adminClient, 'USER_CREATED', 'INFO', user.id, user.email, {
            target_user_id: data.id,
            target_email: body.email,
            target_role: body.role,
            dca_id: dcaId,
            state_code: stateCode,
            region_id: regionId,
            region_ids: regionIds.length > 0 ? regionIds : undefined,
            can_create_agents: body.role === 'DCA_MANAGER' ? canCreateAgents : undefined,
            creator_role: user.role,
            method: creationMethod,
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
