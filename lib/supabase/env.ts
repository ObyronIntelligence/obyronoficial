type SupabaseEnv = {
  configured: boolean;
  projectRef: string | null;
  publishableKey: string;
  url: string;
};

function deriveProjectRef(rawUrl: string) {
  try {
    const parsed = new URL(rawUrl);
    const dashboardMatch = parsed.pathname.match(/\/dashboard\/project\/([^/]+)/);

    if (dashboardMatch?.[1]) {
      return dashboardMatch[1];
    }

    const hostMatch = parsed.hostname.match(/^([a-z0-9-]+)\.supabase\.co$/i);
    return hostMatch?.[1] || null;
  } catch {
    return null;
  }
}

function normalizeSupabaseUrl(rawUrl: string) {
  const trimmedUrl = rawUrl.trim().replace(/\/+$/, "");
  const projectRef = deriveProjectRef(trimmedUrl);

  if (!trimmedUrl || !projectRef) {
    return trimmedUrl;
  }

  if (trimmedUrl.includes("/dashboard/project/")) {
    return `https://${projectRef}.supabase.co`;
  }

  return trimmedUrl;
}

export function getSupabaseEnv(): SupabaseEnv {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_KEY ||
    "";
  const url = normalizeSupabaseUrl(rawUrl);
  const projectRef = deriveProjectRef(url);

  return {
    url,
    publishableKey,
    projectRef,
    configured: Boolean(url && publishableKey),
  };
}

export function requireSupabaseEnv() {
  const env = getSupabaseEnv();

  if (!env.configured) {
    throw new Error(
      "Supabase nao configurado. Preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY no .env.local.",
    );
  }

  return env;
}
