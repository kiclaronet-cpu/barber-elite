'use client';

import { useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;

export function useSupabase(): SupabaseClient {
  return useMemo(() => {
    if (!cachedClient) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !key) {
        if (typeof window === 'undefined') {
          return {} as SupabaseClient;
        }
      }
      cachedClient = createClient();
    }
    return cachedClient;
  }, []);
}
