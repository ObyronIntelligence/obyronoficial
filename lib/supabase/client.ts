"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseEnv } from "@/lib/supabase/env";

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient() {
  if (browserClient) {
    return browserClient;
  }

  const { url, publishableKey } = requireSupabaseEnv();
  browserClient = createClient(url, publishableKey);

  return browserClient;
}
