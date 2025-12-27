import { createBrowserClient } from '@supabase/ssr';

import type { Database } from './database.types';

/**
 * Create a Supabase client for use in browser/client components
 * Uses the anon key for public access
 */
export function createClient() {
    return createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

/**
 * Singleton instance for client components
 */
let browserClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
    if (!browserClient) {
        browserClient = createClient();
    }
    return browserClient;
}
