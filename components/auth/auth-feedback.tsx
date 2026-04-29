"use client";

import { useSearchParams } from "next/navigation";

const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied: "Este e-mail ainda nao esta liberado para os testes.",
  NoEmail: "A conta Google precisa compartilhar um e-mail valido para continuar.",
  WhitelistNotConfigured: "A whitelist de e-mails ainda nao foi configurada no ambiente.",
  OAuthAccountNotLinked: "Esta conta ja existe com outro metodo de entrada.",
  Configuration: "A autenticacao Google nao esta configurada corretamente.",
  Default: "Nao foi possivel concluir a autenticacao agora. Tente novamente.",
};

export function AuthFeedback() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  if (!error) {
    return null;
  }

  return (
    <p className="mt-4 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {ERROR_MESSAGES[error] || ERROR_MESSAGES.Default}
    </p>
  );
}
