import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabasePublishableKey = import.meta.env
  .VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
      supabasePublishableKey &&
      !supabaseUrl.includes('your-project-id') &&
      !supabasePublishableKey.includes('your_key_here'),
  );
}

let cachedClient: SupabaseClient | null = null;

/**
 * Returns the public Supabase browser client using only VITE_SUPABASE_URL
 * and VITE_SUPABASE_PUBLISHABLE_KEY. Never use or expose secret/service-role keys here.
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      'Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY environment variables.',
    );
  }

  if (!cachedClient) {
    cachedClient = createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return cachedClient;
}
