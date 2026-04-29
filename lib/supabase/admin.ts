import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAdminEnv } from "@/lib/supabase/env";

export function createSupabaseAdminClient() {
  const { serviceRoleKey, url } = requireSupabaseAdminEnv();

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
