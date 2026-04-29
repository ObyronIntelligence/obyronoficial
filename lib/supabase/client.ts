"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseEnv } from "@/lib/supabase/env";

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient() {
  if (browserClient) {
    return browserClient;
  }

  const { url, publishableKey } = requireSupabaseEnv();
  browserClient = createClientComponentClient({
    supabaseUrl: url,
    supabaseKey: publishableKey,
    isSingleton: true,
  });

  return browserClient;
}
