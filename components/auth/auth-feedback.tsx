"use client";

import { useSearchParams } from "next/navigation";

const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied: "Este e-mail ainda nao esta liberado para os testes.",
  NoEmail: "A conta Google precisa compartilhar um e-mail valido para continuar.",
  WhitelistNotConfigured: "A whitelist de e-mails ainda nao foi configurada no ambiente.",
  OAuthAccountNotLinked: "Esta conta ja existe com outro metodo de entrada.",
  Configuration: "A autenticacao Google nao esta configurada corretamente.",
  access_denied: "A entrada com Google foi cancelada ou nao autorizada.",
  server_error: "Nao foi possivel concluir a autenticacao com Google agora.",
  Default: "Nao foi possivel concluir a autenticacao agora. Tente novamente.",
};

function normalizeDescription(rawDescription: string) {
  return rawDescription.replace(/\+/g, " ").trim();
}

function resolveErrorMessage(error: string | null, description: string | null) {
  if (description) {
    const normalizedDescription = normalizeDescription(description);
    const lowerDescription = normalizedDescription.toLowerCase();

    if (lowerDescription.includes("provider is not enabled")) {
      return "O login com Google ainda nao foi habilitado no Supabase.";
    }

    if (lowerDescription.includes("email") && lowerDescription.includes("provider")) {
      return "A conta Google precisa compartilhar um e-mail valido para continuar.";
    }

    return normalizedDescription;
  }

  if (!error) {
    return null;
  }

  return ERROR_MESSAGES[error] || ERROR_MESSAGES.Default;
}

export function AuthFeedback() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description") || searchParams.get("message");
  const message = resolveErrorMessage(error, errorDescription);

  if (!message) {
    return null;
  }

  return (
    <p className="mt-4 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {message}
    </p>
  );
}
