import { NextResponse } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

function hasPlaceholderSupabaseValues(env: ReturnType<typeof getSupabaseEnv>) {
  return (
    env.url.includes("your-project.supabase.co") ||
    env.publishableKey.includes("xxxxxxxx") ||
    env.publishableKey.includes("sua-chave")
  );
}

export async function GET() {
  const env = getSupabaseEnv();

  if (!env.configured || hasPlaceholderSupabaseValues(env)) {
    return NextResponse.json({
      configured: false,
      connected: false,
      projectRef: env.projectRef,
      resolvedUrl: env.url,
      error:
        "Supabase nao configurado. Troque NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY no .env.local por valores reais do seu projeto.",
    });
  }

  try {
    const response = await fetch(`${env.url}/auth/v1/settings`, {
      method: "GET",
      headers: {
        apikey: env.publishableKey,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({
        configured: true,
        connected: false,
        projectRef: env.projectRef,
        resolvedUrl: env.url,
        error: `Supabase respondeu com status ${response.status}.`,
      });
    }

    const payload = await response.json();
    const authProviders = Object.entries(payload?.external || {})
      .filter(([, enabled]) => enabled === true)
      .map(([provider]) => provider);

    return NextResponse.json({
      configured: true,
      connected: true,
      projectRef: env.projectRef,
      resolvedUrl: env.url,
      authProviders,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao consultar o Supabase.";

    return NextResponse.json({
      configured: true,
      connected: false,
      projectRef: env.projectRef,
      resolvedUrl: env.url,
      error: message,
    });
  }
}
