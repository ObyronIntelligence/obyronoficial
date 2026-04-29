"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AuthFeedback } from "@/components/auth/auth-feedback";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { normalizeAuthNextPath } from "@/lib/auth/redirects";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

async function verifyEmailOtp(email: string, token: string) {
  const supabase = getSupabaseBrowserClient();
  const attempts = ["signup", "email"] as const;
  let lastError: string | null = null;

  for (const type of attempts) {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type,
    });

    if (!error) {
      return null;
    }

    lastError = error.message;
  }

  return lastError || "Nao foi possivel validar o codigo.";
}

export default function SigninPage() {
  const router = useRouter();
  const [nextPath, setNextPath] = useState("/neural");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verifyEmail, setVerifyEmail] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyVisible, setVerifyVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNextPath(normalizeAuthNextPath(params.get("next")));
  }, []);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setMessage("");

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      router.push(nextPath);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setMessage("");

    try {
      const maybeError = await verifyEmailOtp(verifyEmail, verifyCode);

      if (maybeError) {
        setErrorMessage(maybeError);
        return;
      }

      setMessage("Codigo validado com sucesso. Redirecionando...");
      router.push(nextPath);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full border-border/60 bg-card/60 backdrop-blur">
      <CardContent className="p-8">
        <h1 className="text-2xl font-bold tracking-tight">Entrar</h1>
        <p className="mt-1 text-sm text-muted-foreground">Acesse sua conta para usar as experiencias da Obyron.</p>

        <div className="mt-6 space-y-3">
          <GoogleAuthButton
            label="Continuar com Google"
            nextPath={nextPath}
            onError={(nextError) => {
              setErrorMessage(nextError);
              setMessage("");
            }}
          />
        </div>

        <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
          <span className="h-px flex-1 bg-border/60" />
          <span>ou</span>
          <span className="h-px flex-1 bg-border/60" />
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              required
              placeholder="voce@empresa.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              required
              placeholder="********"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-foreground text-background hover:bg-foreground/90">
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => {
            setVerifyVisible((current) => !current);
            setVerifyEmail(email);
          }}
          className="mt-5 w-full text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Recebeu um codigo de confirmacao?
        </button>

        {verifyVisible ? (
          <form onSubmit={onVerify} className="mt-5 space-y-4 rounded-2xl border border-border/60 bg-background/35 p-4">
            <div className="space-y-2">
              <Label htmlFor="verify-email">E-mail do cadastro</Label>
              <Input
                id="verify-email"
                type="email"
                required
                placeholder="voce@empresa.com"
                value={verifyEmail}
                onChange={(event) => setVerifyEmail(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="verify-code">Codigo de confirmacao</Label>
              <Input
                id="verify-code"
                inputMode="numeric"
                required
                placeholder="123456"
                value={verifyCode}
                onChange={(event) => setVerifyCode(event.target.value)}
              />
            </div>
            <Button type="submit" disabled={loading} variant="outline" className="w-full">
              {loading ? "Validando..." : "Validar codigo"}
            </Button>
          </form>
        ) : null}

        <Suspense fallback={null}>
          <AuthFeedback />
        </Suspense>
        {errorMessage ? <p className="mt-4 text-center text-sm text-rose-400">{errorMessage}</p> : null}
        {message ? <p className="mt-4 text-center text-sm text-brand">{message}</p> : null}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Novo por aqui?{" "}
          <Link href={`/auth/signup?next=${encodeURIComponent(nextPath)}`} className="text-foreground underline-offset-4 hover:underline">
            Criar conta
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
