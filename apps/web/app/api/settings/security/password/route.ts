import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering - this route uses cookies/headers
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';

/**
 * Password complexity requirements
 * P1-3 FIX: Enforce strong password policy
 */
interface PasswordValidation {
    isValid: boolean;
    errors: string[];
}

function validatePasswordComplexity(password: string): PasswordValidation {
    const errors: string[] = [];

    // Minimum length
    if (password.length < 12) {
        errors.push('Password must be at least 12 characters long');
    }

    // Maximum length (prevent DoS)
    if (password.length > 128) {
        errors.push('Password cannot exceed 128 characters');
    }

    // Uppercase letter
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }

    // Lowercase letter
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }

    // Number
    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    // Special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password must contain at least one special character (!@#$%^&*...)');
    }

    // Common password patterns to reject
    const commonPatterns = [
        /^password/i,
        /^12345/,
        /^qwerty/i,
        /^admin/i,
        /^fedex/i,
        /(.)\1{3,}/, // 4+ repeated characters
    ];

    for (const pattern of commonPatterns) {
        if (pattern.test(password)) {
            errors.push('Password is too common or contains repeated patterns');
            break;
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

/**
 * POST /api/settings/security/password
 * Update user password with complexity validation
 */
export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    // Validate new password is provided
    if (!newPassword) {
        return NextResponse.json(
            { error: 'New password is required' },
            { status: 400 }
        );
    }

    // Check passwords match
    if (newPassword !== confirmPassword) {
        return NextResponse.json(
            { error: 'New password and confirmation do not match' },
            { status: 400 }
        );
    }

    // P1-3 FIX: Validate password complexity
    const validation = validatePasswordComplexity(newPassword);
    if (!validation.isValid) {
        return NextResponse.json(
            {
                error: 'Password does not meet complexity requirements',
                details: validation.errors,
            },
            { status: 400 }
        );
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
    });

    if (updateError) {
        // Log failed password change attempt
        try {
            const { logUserAction } = await import('@/lib/audit');
            await logUserAction(
                'PASSWORD_CHANGED',
                user.id,
                user.email || 'unknown',
                'security',
                user.id,
                {
                    success: false,
                    error: updateError.message,
                    ip_address: request.headers.get('x-forwarded-for') || 'unknown',
                    user_agent: request.headers.get('user-agent') || 'unknown',
                }
            );
        } catch { }
        return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    // Log successful password change
    try {
        const { logUserAction } = await import('@/lib/audit');
        await logUserAction(
            'PASSWORD_CHANGED',
            user.id,
            user.email || 'unknown',
            'security',
            user.id,
            {
                success: true,
                ip_address: request.headers.get('x-forwarded-for') || 'unknown',
                user_agent: request.headers.get('user-agent') || 'unknown',
            }
        );
    } catch (auditError) {
        console.error('Failed to log password change:', auditError);
    }

    return NextResponse.json({
        success: true,
        message: 'Password updated successfully'
    });
}

/**
 * GET /api/settings/security/password
 * Get password requirements for UI display
 */
export async function GET() {
    return NextResponse.json({
        requirements: [
            'At least 12 characters long',
            'At least one uppercase letter (A-Z)',
            'At least one lowercase letter (a-z)',
            'At least one number (0-9)',
            'At least one special character (!@#$%^&*...)',
            'No common patterns or repeated characters',
        ],
        minLength: 12,
        maxLength: 128,
    });
}
