import nodemailer from 'nodemailer';

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}

/**
 * Send an email using Gmail SMTP
 * Uses the same credentials configured in Supabase
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpUser || !smtpPass) {
        console.error('SMTP credentials not configured');
        return { success: false, error: 'Email not configured' };
    }

    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        });

        await transporter.sendMail({
            from: `"FedEx DCA Control Tower" <${smtpUser}>`,
            to: options.to,
            subject: options.subject,
            html: options.html,
        });

        return { success: true };
    } catch (error) {
        console.error('Email send error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' };
    }
}

/**
 * Send user credentials to their personal email
 */
export async function sendUserCredentials(
    personalEmail: string,
    fullName: string,
    workEmail: string,
    tempPassword: string
): Promise<{ success: boolean; error?: string }> {
    const loginUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F0599; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .credentials { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #ddd; }
        .credentials p { margin: 10px 0; }
        .label { font-weight: bold; color: #666; }
        .value { font-family: monospace; font-size: 16px; background: #f0f0f0; padding: 8px 12px; border-radius: 4px; display: inline-block; }
        .button { display: inline-block; background: #4F0599; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to FedEx DCA Control Tower</h1>
        </div>
        <div class="content">
            <p>Hello ${fullName},</p>
            <p>Your account has been created. Here are your login credentials:</p>
            
            <div class="credentials">
                <p><span class="label">Work Email (Login):</span><br><span class="value">${workEmail}</span></p>
                <p><span class="label">Temporary Password:</span><br><span class="value">${tempPassword}</span></p>
            </div>
            
            <p><strong>Important:</strong> Please change your password after your first login for security.</p>
            
            <a href="${loginUrl}/login" class="button">Login to your account</a>
            
            <div class="footer">
                <p>This is an automated message. Please do not reply to this email.</p>
            </div>
        </div>
    </div>
</body>
</html>
    `;

    return sendEmail({
        to: personalEmail,
        subject: 'Your FedEx DCA Control Tower Account Credentials',
        html,
    });
}
