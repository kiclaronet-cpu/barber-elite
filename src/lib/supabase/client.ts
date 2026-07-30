import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return client;
}

const dummyClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const realClient = getClient();
    return Reflect.get(realClient, prop);
  },
});

export function createClient(): SupabaseClient {
  if (typeof window === 'undefined' && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return dummyClient;
  }
  return getClient();
}
