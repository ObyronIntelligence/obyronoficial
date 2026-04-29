"use client";

import type { ReactNode } from "react";
import { LockKeyhole } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";

export function ProtectedExperience({
  children,
  description = "Entre ou crie sua conta para acessar e interagir com esta experiencia.",
  title = "Area exclusiva para usuarios",
}: {
  children: ReactNode;
  description?: string;
  title?: string;
}) {
  const { isAuthenticated, loading, openAuthModal } = useAuth();

  if (loading || isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-sm opacity-45">{children}</div>

      <div className="absolute inset-0 z-10 flex items-center justify-center px-4">
        <button
          type="button"
          className="absolute inset-0"
          aria-label="Abrir autenticacao"
          onClick={() => openAuthModal({ title, description })}
        />
        <div className="relative z-[1] mx-auto max-w-md rounded-[28px] border border-border/60 bg-background/90 p-6 text-center shadow-[0_24px_90px_hsl(var(--background)/0.55)] backdrop-blur-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(var(--brand)/0.12)] text-brand">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-xl font-semibold">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
          <Button
            type="button"
            className="mt-5 bg-foreground text-background hover:bg-foreground/90"
            onClick={() => openAuthModal({ title, description })}
          >
            Entrar para continuar
          </Button>
        </div>
      </div>
    </div>
  );
}
