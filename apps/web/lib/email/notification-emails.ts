/**
 * Email Notification Service
 * Sends emails for various system events (SLA breaches, escalations, case assignments)
 */

import { sendEmail } from './send-email';
import {
    caseEscalatedEmail,
    slaBreachEmail,
    caseAssignmentEmail,
    weeklyReportEmail,
} from '../email-templates';
import { createAdminClient } from '@/lib/supabase/server';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * Send escalation notification email
 */
export async function sendEscalationEmail(params: {
    escalationId: string;
    recipientEmail: string;
    recipientName: string;
    caseNumber: string;
    customerName: string;
    reason: string;
    priority: string;
    escalatedBy: string;
}): Promise<{ success: boolean; error?: string }> {
    const html = caseEscalatedEmail({
        recipientName: params.recipientName,
        caseNumber: params.caseNumber,
        customerName: params.customerName,
        reason: params.reason,
        priority: params.priority,
        escalatedBy: params.escalatedBy,
        dashboardUrl: `${APP_URL}/cases?escalated=true`,
    });

    return sendEmail({
        to: params.recipientEmail,
        subject: `🚨 Case Escalated: ${params.caseNumber}`,
        html,
    });
}

/**
 * Send SLA breach warning email
 */
export async function sendSlaBreachEmail(params: {
    recipientEmail: string;
    recipientName: string;
    caseNumber: string;
    slaName: string;
    dueDate: string;
    hoursRemaining: number;
    caseId: string;
}): Promise<{ success: boolean; error?: string }> {
    const html = slaBreachEmail({
        recipientName: params.recipientName,
        caseNumber: params.caseNumber,
        slaName: params.slaName,
        dueDate: params.dueDate,
        hoursRemaining: params.hoursRemaining,
        dashboardUrl: `${APP_URL}/cases/${params.caseId}`,
    });

    return sendEmail({
        to: params.recipientEmail,
        subject: `⚠️ SLA Warning: ${params.caseNumber} - ${params.slaName}`,
        html,
    });
}

/**
 * Send case assignment notification
 */
export async function sendCaseAssignmentEmail(params: {
    recipientEmail: string;
    recipientName: string;
    dcaName: string;
    casesAssigned: number;
    totalAmount: number;
    priority: string;
}): Promise<{ success: boolean; error?: string }> {
    const html = caseAssignmentEmail({
        recipientName: params.recipientName,
        dcaName: params.dcaName,
        casesAssigned: params.casesAssigned,
        totalAmount: `$${params.totalAmount.toLocaleString()}`,
        priority: params.priority,
        dashboardUrl: `${APP_URL}/cases`,
    });

    return sendEmail({
        to: params.recipientEmail,
        subject: `📋 New Cases Assigned: ${params.casesAssigned} case(s)`,
        html,
    });
}

/**
 * Get admin emails for notifications
 */
export async function getAdminEmails(): Promise<string[]> {
    const supabase = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: admins } = await (supabase as any)
        .from('users')
        .select('email')
        .in('role', ['SUPER_ADMIN', 'FEDEX_ADMIN', 'FEDEX_MANAGER'])
        .eq('is_active', true);

    return admins?.map((u: { email: string }) => u.email) || [];
}

/**
 * Send notification to all admins
 */
export async function notifyAdmins(subject: string, html: string): Promise<void> {
    const adminEmails = await getAdminEmails();

    for (const email of adminEmails) {
        await sendEmail({ to: email, subject, html });
    }
}

/**
 * Send weekly performance report
 */
export async function sendWeeklyReport(params: {
    recipientEmail: string;
    recipientName: string;
    weekEnding: string;
    totalCases: number;
    casesResolved: number;
    totalRecovered: number;
    recoveryRate: number;
    topDca: string;
}): Promise<{ success: boolean; error?: string }> {
    const html = weeklyReportEmail({
        recipientName: params.recipientName,
        weekEnding: params.weekEnding,
        totalCases: params.totalCases,
        casesResolved: params.casesResolved,
        totalRecovered: `$${params.totalRecovered.toLocaleString()}`,
        recoveryRate: `${params.recoveryRate.toFixed(1)}%`,
        topDca: params.topDca,
        dashboardUrl: `${APP_URL}/analytics`,
    });

    return sendEmail({
        to: params.recipientEmail,
        subject: `📊 Weekly Performance Report - ${params.weekEnding}`,
        html,
    });
}
