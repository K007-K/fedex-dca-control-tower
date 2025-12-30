import { NextResponse } from 'next/server';

/**
 * GET /api/health/email
 * Check if email service is configured
 */
export async function GET() {
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const resendApiKey = process.env.RESEND_API_KEY;

    const smtpConfigured = !!(smtpUser && smtpPass);
    const resendConfigured = !!resendApiKey;

    return NextResponse.json({
        configured: smtpConfigured || resendConfigured,
        provider: resendConfigured ? 'Resend' : smtpConfigured ? 'SMTP (Gmail)' : null,
        smtp: smtpConfigured,
        resend: resendConfigured,
    });
}
