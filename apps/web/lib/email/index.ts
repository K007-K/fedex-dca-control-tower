/**
 * Email Notification Service
 * P0-5 FIX: Implements actual email sending
 * 
 * Uses Resend for email delivery. Add RESEND_API_KEY to .env.local
 * Install: pnpm add resend
 */

import {
    caseEscalatedEmail,
    slaBreachEmail,
    weeklyReportEmail,
    caseAssignmentEmail
} from '../email-templates';

// Type for Resend - will be properly typed when package is added
type ResendClient = {
    emails: {
        send: (params: {
            from: string;
            to: string[];
            subject: string;
            html: string;
        }) => Promise<{ data?: { id: string }; error?: Error }>;
    };
};

let resendClient: ResendClient | null = null;

/**
 * Get or create Resend client
 */
function getResendClient(): ResendClient | null {
    if (resendClient) return resendClient;

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.warn('RESEND_API_KEY not configured. Email sending disabled.');
        return null;
    }

    // Dynamic import to avoid errors if package not installed
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { Resend } = require('resend');
        resendClient = new Resend(apiKey);
        return resendClient;
    } catch {
        console.warn('Resend package not installed. Run: pnpm add resend');
        return null;
    }
}

// Default sender configuration
const DEFAULT_FROM = process.env.EMAIL_FROM || 'FedEx DCA Control Tower <noreply@fedex-dca.com>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export interface EmailResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

/**
 * Send an email
 */
export async function sendEmail(
    to: string[],
    subject: string,
    html: string
): Promise<EmailResult> {
    const client = getResendClient();

    if (!client) {
        console.log('[Email] Would send to:', to.join(', '), '- Subject:', subject);
        return { success: false, error: 'Email service not configured' };
    }

    try {
        const { data, error } = await client.emails.send({
            from: DEFAULT_FROM,
            to,
            subject,
            html,
        });

        if (error) {
            console.error('[Email] Send error:', error);
            return { success: false, error: error.message };
        }

        console.log('[Email] Sent successfully:', data?.id);
        return { success: true, messageId: data?.id };
    } catch (error) {
        console.error('[Email] Exception:', error);
        return { success: false, error: String(error) };
    }
}

/**
 * Send case escalation notification
 */
export async function sendEscalationEmail(params: {
    recipientEmail: string;
    recipientName: string;
    caseNumber: string;
    customerName: string;
    reason: string;
    priority: string;
    escalatedBy: string;
    caseId: string;
}): Promise<EmailResult> {
    const html = caseEscalatedEmail({
        recipientName: params.recipientName,
        caseNumber: params.caseNumber,
        customerName: params.customerName,
        reason: params.reason,
        priority: params.priority,
        escalatedBy: params.escalatedBy,
        dashboardUrl: `${APP_URL}/cases/${params.caseId}`,
    });

    return sendEmail(
        [params.recipientEmail],
        `🚨 Case Escalated: ${params.caseNumber}`,
        html
    );
}

/**
 * Send SLA breach warning
 */
export async function sendSlaBreachEmail(params: {
    recipientEmail: string;
    recipientName: string;
    caseNumber: string;
    slaName: string;
    dueDate: string;
    hoursRemaining: number;
    caseId: string;
}): Promise<EmailResult> {
    const html = slaBreachEmail({
        recipientName: params.recipientName,
        caseNumber: params.caseNumber,
        slaName: params.slaName,
        dueDate: params.dueDate,
        hoursRemaining: params.hoursRemaining,
        dashboardUrl: `${APP_URL}/cases/${params.caseId}`,
    });

    const urgency = params.hoursRemaining <= 4 ? '🔴' : '⚠️';

    return sendEmail(
        [params.recipientEmail],
        `${urgency} SLA Breach Warning: ${params.caseNumber} (${params.hoursRemaining}h remaining)`,
        html
    );
}

/**
 * Send weekly report
 */
export async function sendWeeklyReportEmail(params: {
    recipientEmail: string;
    recipientName: string;
    weekEnding: string;
    totalCases: number;
    casesResolved: number;
    totalRecovered: string;
    recoveryRate: string;
    topDca: string;
}): Promise<EmailResult> {
    const html = weeklyReportEmail({
        recipientName: params.recipientName,
        weekEnding: params.weekEnding,
        totalCases: params.totalCases,
        casesResolved: params.casesResolved,
        totalRecovered: params.totalRecovered,
        recoveryRate: params.recoveryRate,
        topDca: params.topDca,
        dashboardUrl: `${APP_URL}/analytics`,
    });

    return sendEmail(
        [params.recipientEmail],
        `📊 Weekly Performance Report - Week Ending ${params.weekEnding}`,
        html
    );
}

/**
 * Send case assignment notification
 */
export async function sendCaseAssignmentEmail(params: {
    recipientEmail: string;
    recipientName: string;
    dcaName: string;
    casesAssigned: number;
    totalAmount: string;
    priority: string;
}): Promise<EmailResult> {
    const html = caseAssignmentEmail({
        recipientName: params.recipientName,
        dcaName: params.dcaName,
        casesAssigned: params.casesAssigned,
        totalAmount: params.totalAmount,
        priority: params.priority,
        dashboardUrl: `${APP_URL}/cases?dca_id=${encodeURIComponent(params.dcaName)}`,
    });

    return sendEmail(
        [params.recipientEmail],
        `📋 New Cases Assigned: ${params.casesAssigned} cases to ${params.dcaName}`,
        html
    );
}
