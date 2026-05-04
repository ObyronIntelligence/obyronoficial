"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type SupabaseHealthPayload = {
  authProviders?: string[];
  configured?: boolean;
  connected?: boolean;
  error?: string;
};

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0">
      <path
        fill="#4285F4"
        d="M21.8 12.23c0-.72-.06-1.25-.19-1.81H12v3.42h5.65c-.11.85-.7 2.13-2.01 2.99l-.02.11 2.79 2.12.19.02c1.77-1.6 3.2-4.42 3.2-8.85Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.76 0 5.07-.89 6.76-2.41l-3.22-2.49c-.86.59-2.01 1-3.54 1-2.7 0-4.98-1.74-5.79-4.14l-.11.01-2.9 2.21-.04.1C4.84 19.53 8.15 22 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.21 13.96A5.83 5.83 0 0 1 5.87 12c0-.68.13-1.34.34-1.96l-.01-.13-2.94-2.24-.1.04A9.79 9.79 0 0 0 2 12c0 1.57.38 3.06 1.06 4.29l3.15-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.9c1.93 0 3.23.82 3.97 1.5l2.9-2.78C17.06 2.97 14.76 2 12 2 8.15 2 4.84 4.47 3.16 7.71l3.05 2.33C7.02 7.64 9.3 5.9 12 5.9Z"
      />
    </svg>
  );
}

export function GoogleAuthButton({
  label,
  nextPath = "/",
  className,
  onError,
}: {
  label: string;
  nextPath?: string;
  className?: string;
  onError?: (message: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    onError?.("");

    try {
      const healthPayload: SupabaseHealthPayload | null = await fetch("/api/supabase", {
        cache: "no-store",
      })
        .then(async (response) => {
          if (!response.ok) {
            return null;
          }

          return response.json();
        })
        .catch(() => null);

      if (!healthPayload?.configured) {
        throw new Error(
          healthPayload?.error ||
            "Supabase nao configurado. Preencha o .env.local com a URL e a chave publica reais do seu projeto.",
        );
      }

      if (!healthPayload.connected) {
        throw new Error(
          healthPayload.error ||
            "Nao foi possivel conectar ao Supabase. Confira NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY no .env.local.",
        );
      }

      const googleKnownDisabled =
        Array.isArray(healthPayload?.authProviders) &&
        !healthPayload.authProviders.includes("google");

      if (googleKnownDisabled) {
        throw new Error("O login com Google ainda nao foi habilitado no Supabase.");
      }

      const supabase = getSupabaseBrowserClient();
      const callbackUrl = new URL("/auth/callback", window.location.origin);
      callbackUrl.searchParams.set("next", nextPath);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl.toString(),
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nao foi possivel iniciar a autenticacao com Google agora.";

      onError?.(message);
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      disabled={loading}
      aria-busy={loading}
      className={cn("w-full gap-2 border-border/60 bg-background/70 hover:bg-accent/80", className)}
      onClick={() => void handleClick()}
    >
      <GoogleMark />
      {loading ? "Conectando..." : label}
    </Button>
  );
}
