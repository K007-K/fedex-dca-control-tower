import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

// Force dynamic rendering - this route uses cookies
export const dynamic = 'force-dynamic';

/**
 * GET /api/me - Get current authenticated user's info
 * Used for frontend permission checks
 * Uses direct getCurrentUser instead of withAuth to avoid region access checks
 */
export async function GET() {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        return NextResponse.json({
            data: {
                id: user.id,
                email: user.email,
                role: user.role,
                dcaId: user.dcaId,
            }
        });
    } catch (error) {
        console.error('/api/me error:', error);
        return NextResponse.json(
            { error: 'Failed to get current user' },
            { status: 500 }
        );
    }
}
