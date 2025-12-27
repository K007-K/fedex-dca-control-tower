import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/users - List users with pagination and filters
 */
export async function GET(request: Request) {
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
        let query = supabase
            .from('users')
            .select('*', { count: 'exact' });

        // Apply filters
        if (role) {
            query = query.eq('role', role);
        }

        if (dcaId) {
            query = query.eq('dca_id', dcaId);
        }

        if (organizationId) {
            query = query.eq('organization_id', organizationId);
        }

        if (isActive !== null && isActive !== undefined) {
            query = query.eq('is_active', isActive === 'true');
        }

        if (search) {
            query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
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
}

/**
 * POST /api/users - Create a new user
 */
export async function POST(request: Request) {
    try {
        const supabase = await createClient();
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

        // Check if email already exists
        const { data: existing } = await supabase
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

        // Create user
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
            .from('users')
            .insert({
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
            })
            .select()
            .single();

        if (error) {
            console.error('User creation error:', error);
            return NextResponse.json(
                { error: 'Failed to create user', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ data }, { status: 201 });

    } catch (error) {
        console.error('Users API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
