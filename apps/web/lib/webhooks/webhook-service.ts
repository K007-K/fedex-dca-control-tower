/**
 * Webhook Service
 * Fires HTTP POST requests to registered webhooks when events occur
 */

import { createAdminClient } from '@/lib/supabase/server';
import crypto from 'crypto';

interface WebhookPayload {
    event: string;
    timestamp: string;
    data: Record<string, unknown>;
}

interface Webhook {
    id: string;
    url: string;
    secret: string;
    events: string[];
    is_active: boolean;
}

/**
 * Fire a webhook event to all registered, active webhooks that subscribe to this event
 */
export async function fireWebhookEvent(
    eventType: string,
    eventData: Record<string, unknown>
): Promise<{ sent: number; failed: number }> {
    const results = { sent: 0, failed: 0 };

    try {
        const supabase = createAdminClient();

        // Get all active webhooks that subscribe to this event
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: webhooks, error } = await (supabase as any)
            .from('webhooks')
            .select('id, url, secret, events')
            .eq('is_active', true);

        if (error || !webhooks) {
            console.error('Failed to fetch webhooks:', error);
            return results;
        }

        // Filter webhooks that subscribe to this event
        const subscribedWebhooks = (webhooks as Webhook[]).filter(
            w => w.events.includes(eventType) || w.events.includes('*')
        );

        if (subscribedWebhooks.length === 0) {
            return results;
        }

        // Prepare payload
        const payload: WebhookPayload = {
            event: eventType,
            timestamp: new Date().toISOString(),
            data: eventData,
        };

        // Fire webhooks in parallel (fire-and-forget style, don't block)
        const deliveryPromises = subscribedWebhooks.map(async (webhook) => {
            try {
                // Create HMAC signature for verification
                const signature = crypto
                    .createHmac('sha256', webhook.secret || '')
                    .update(JSON.stringify(payload))
                    .digest('hex');

                // Send POST request
                const response = await fetch(webhook.url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Webhook-Signature': signature,
                        'X-Webhook-Event': eventType,
                        'User-Agent': 'FedEx-DCA-Control-Tower/1.0',
                    },
                    body: JSON.stringify(payload),
                    signal: AbortSignal.timeout(10000), // 10 second timeout
                });

                const success = response.ok;

                // Log delivery
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (supabase as any).from('webhook_deliveries').insert({
                    webhook_id: webhook.id,
                    event_type: eventType,
                    payload,
                    response_status: response.status,
                    response_body: await response.text().catch(() => null),
                    success,
                });

                return success;
            } catch (err) {
                console.error(`Webhook delivery failed for ${webhook.url}:`, err);

                // Log failed delivery
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (supabase as any).from('webhook_deliveries').insert({
                    webhook_id: webhook.id,
                    event_type: eventType,
                    payload,
                    response_status: 0,
                    response_body: err instanceof Error ? err.message : 'Unknown error',
                    success: false,
                });

                return false;
            }
        });

        // Wait for all deliveries to complete
        const deliveryResults = await Promise.all(deliveryPromises);
        results.sent = deliveryResults.filter(r => r).length;
        results.failed = deliveryResults.filter(r => !r).length;

        console.log(`[Webhook] Event ${eventType}: ${results.sent} sent, ${results.failed} failed`);

        return results;
    } catch (error) {
        console.error('Webhook service error:', error);
        return results;
    }
}

// Pre-defined event types for type safety
export const WebhookEvents = {
    CASE_CREATED: 'case.created',
    CASE_UPDATED: 'case.updated',
    CASE_ESCALATED: 'case.escalated',
    CASE_RESOLVED: 'case.resolved',
    CASE_CLOSED: 'case.closed',
    SLA_BREACH: 'sla.breach',
    SLA_WARNING: 'sla.warning',
    PAYMENT_RECEIVED: 'payment.received',
    DCA_ASSIGNED: 'dca.assigned',
} as const;
