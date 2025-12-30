'use client';

import { useEffect, useRef, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeOptions {
    table: string;
    schema?: string;
    event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
    filter?: string;
}

type SupabaseClient = ReturnType<typeof createBrowserClient>;

/**
 * Hook to subscribe to Supabase realtime changes
 */
export function useRealtimeSubscription(
    options: RealtimeOptions,
    onUpdate: () => void
) {
    const supabaseRef = useRef<SupabaseClient | null>(null);
    const channelRef = useRef<RealtimeChannel | null>(null);

    const subscribe = useCallback(() => {
        // Create client if not exists
        if (!supabaseRef.current) {
            supabaseRef.current = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );
        }

        const { table, schema = 'public', event = '*', filter } = options;

        // Create channel with postgres_changes
        const channelName = `realtime-${table}-${Date.now()}`;
        const channel = supabaseRef.current.channel(channelName);

        // Subscribe to postgres changes
        channel.on(
            'postgres_changes' as 'system',  // Type assertion needed for Supabase types
            {
                event,
                schema,
                table,
                filter,
            } as unknown as { event: string },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (payload: any) => {
                console.log(`[Realtime] ${table} ${payload?.eventType ?? 'update'}:`, payload);
                onUpdate();
            }
        ).subscribe((status: string) => {
            console.log(`[Realtime] ${table} subscription:`, status);
        });

        channelRef.current = channel;
    }, [options, onUpdate]);

    const unsubscribe = useCallback(() => {
        if (channelRef.current && supabaseRef.current) {
            supabaseRef.current.removeChannel(channelRef.current);
            channelRef.current = null;
        }
    }, []);

    useEffect(() => {
        subscribe();
        return () => unsubscribe();
    }, [subscribe, unsubscribe]);

    return { subscribe, unsubscribe };
}

/**
 * Hook to subscribe to cases table changes
 */
export function useCasesRealtime(onUpdate: () => void) {
    return useRealtimeSubscription({ table: 'cases' }, onUpdate);
}

/**
 * Hook to subscribe to DCA changes
 */
export function useDCAsRealtime(onUpdate: () => void) {
    return useRealtimeSubscription({ table: 'dcas' }, onUpdate);
}

/**
 * Hook to subscribe to notifications
 */
export function useNotificationsRealtime(userId: string, onUpdate: () => void) {
    return useRealtimeSubscription(
        {
            table: 'notifications',
            filter: `recipient_id=eq.${userId}`,
        },
        onUpdate
    );
}
