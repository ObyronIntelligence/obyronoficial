import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { normalizeAuthNextPath } from "@/lib/auth/redirects";
import { requireSupabaseEnv } from "@/lib/supabase/env";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = normalizeAuthNextPath(requestUrl.searchParams.get("next"), "/");

  if (code) {
    const { url, publishableKey } = requireSupabaseEnv();
    const supabase = createRouteHandlerClient(
      { cookies },
      {
        supabaseUrl: url,
        supabaseKey: publishableKey,
      },
    );

    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(nextPath, requestUrl.origin));
}
