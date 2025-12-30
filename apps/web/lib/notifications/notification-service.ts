/**
 * Notification Service
 * Creates in-app notifications and sends emails based on user preferences
 */

import { createClient } from '@/lib/supabase/server';
import { sendEscalationEmail, sendSlaBreachEmail } from '@/lib/email';

// Notification types mapping to preference keys
const NOTIFICATION_TYPE_MAP: Record<string, string> = {
    'CASE_UPDATED': 'case_updates',
    'CASE_ASSIGNED': 'case_updates',
    'CASE_RESOLVED': 'case_updates',
    'SLA_WARNING': 'sla_alerts',
    'SLA_BREACH': 'sla_alerts',
    'ESCALATION_CREATED': 'escalations',
    'DCA_PERFORMANCE': 'dca_performance',
    'SYSTEM_UPDATE': 'system_updates',
};

interface NotificationPayload {
    recipientId: string;
    notificationType: string;
    title: string;
    message: string;
    relatedCaseId?: string;
    relatedEscalationId?: string;
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    // Extra data for email templates
    emailData?: {
        caseNumber?: string;
        customerName?: string;
        reason?: string;
        escalatedBy?: string;
        slaName?: string;
        dueDate?: string;
        hoursRemaining?: number;
    };
}

interface NotificationResult {
    inAppCreated: boolean;
    emailSent: boolean;
    emailSkipped?: string;
    error?: string;
}

/**
 * Get user's notification preferences
 */
async function getUserPreferences(userId: string): Promise<Record<string, { email: boolean; inApp: boolean }>> {
    const supabase = await createClient();

    // Get user's email to lookup their auth record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: user } = await (supabase as any)
        .from('users')
        .select('email')
        .eq('id', userId)
        .single();

    if (!user?.email) {
        // Return defaults if user not found
        return getDefaultPreferences();
    }

    // Get auth user by email to access metadata
    const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
    const authUser = authUsers?.find(u => u.email === user.email);

    if (!authUser?.user_metadata?.notification_preferences) {
        return getDefaultPreferences();
    }

    return authUser.user_metadata.notification_preferences;
}

function getDefaultPreferences(): Record<string, { email: boolean; inApp: boolean }> {
    return {
        case_updates: { email: true, inApp: true },
        sla_alerts: { email: true, inApp: true },
        dca_performance: { email: false, inApp: true },
        escalations: { email: true, inApp: true },
        system_updates: { email: false, inApp: true },
    };
}

/**
 * Create notification and optionally send email based on user preferences
 */
export async function createNotification(payload: NotificationPayload): Promise<NotificationResult> {
    const supabase = await createClient();
    const result: NotificationResult = { inAppCreated: false, emailSent: false };

    try {
        // Get user preferences
        const preferences = await getUserPreferences(payload.recipientId);
        const prefKey = NOTIFICATION_TYPE_MAP[payload.notificationType] || 'system_updates';
        const pref = preferences[prefKey] || { email: true, inApp: true };

        // Create in-app notification if enabled
        if (pref.inApp) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase as any).from('notifications').insert({
                recipient_id: payload.recipientId,
                notification_type: payload.notificationType,
                title: payload.title,
                message: payload.message,
                related_case_id: payload.relatedCaseId || null,
                related_escalation_id: payload.relatedEscalationId || null,
                channels: pref.email ? ['IN_APP', 'EMAIL'] : ['IN_APP'],
                priority: payload.priority || 'NORMAL',
            });

            if (!error) {
                result.inAppCreated = true;
            } else {
                console.error('Failed to create in-app notification:', error);
            }
        }

        // Send email if enabled
        if (pref.email) {
            // Get recipient details
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: recipient } = await (supabase as any)
                .from('users')
                .select('email, full_name')
                .eq('id', payload.recipientId)
                .single();

            if (recipient) {
                const emailResult = await sendNotificationEmail(
                    payload.notificationType,
                    recipient.email,
                    recipient.full_name,
                    payload
                );
                result.emailSent = emailResult.success;
                if (!emailResult.success) {
                    result.emailSkipped = emailResult.error;
                }
            }
        } else {
            result.emailSkipped = 'User preference: email disabled';
        }

        return result;
    } catch (error) {
        console.error('Notification service error:', error);
        result.error = String(error);
        return result;
    }
}

/**
 * Send email based on notification type
 */
async function sendNotificationEmail(
    type: string,
    recipientEmail: string,
    recipientName: string,
    payload: NotificationPayload
): Promise<{ success: boolean; error?: string }> {
    const { emailData } = payload;

    try {
        switch (type) {
            case 'ESCALATION_CREATED':
                if (emailData?.caseNumber && emailData?.customerName) {
                    return await sendEscalationEmail({
                        recipientEmail,
                        recipientName,
                        caseNumber: emailData.caseNumber,
                        customerName: emailData.customerName,
                        reason: emailData.reason || payload.message,
                        priority: payload.priority || 'NORMAL',
                        escalatedBy: emailData.escalatedBy || 'System',
                        caseId: payload.relatedCaseId || '',
                    });
                }
                break;

            case 'SLA_WARNING':
            case 'SLA_BREACH':
                if (emailData?.caseNumber && emailData?.slaName) {
                    return await sendSlaBreachEmail({
                        recipientEmail,
                        recipientName,
                        caseNumber: emailData.caseNumber,
                        slaName: emailData.slaName,
                        dueDate: emailData.dueDate || 'N/A',
                        hoursRemaining: emailData.hoursRemaining || 0,
                        caseId: payload.relatedCaseId || '',
                    });
                }
                break;

            default:
                // For other types, we could use a generic email template
                console.log(`[Email] No specific template for ${type}, skipping email`);
                return { success: false, error: 'No email template for this notification type' };
        }

        return { success: false, error: 'Missing required email data' };
    } catch (error) {
        console.error('Email send error:', error);
        return { success: false, error: String(error) };
    }
}
