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

export default function SignupPage() {
  const router = useRouter();
  const [nextPath, setNextPath] = useState("/neural");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [step, setStep] = useState<"signup" | "verify">("signup");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNextPath(normalizeAuthNextPath(params.get("next")));
  }, []);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("A confirmacao de senha precisa ser igual a senha.");
      return;
    }

    setLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            username,
          },
        },
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setStep("verify");
      setMessage("Conta criada. Enviamos um codigo para o seu e-mail para confirmar o cadastro.");
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
      const maybeError = await verifyEmailOtp(email, verificationCode);

      if (maybeError) {
        setErrorMessage(maybeError);
        return;
      }

      setMessage("Conta confirmada com sucesso. Redirecionando...");
      router.push(nextPath);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    setLoading(true);
    setErrorMessage("");
    setMessage("");

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setMessage("Enviamos um novo codigo para o seu e-mail.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full border-border/60 bg-card/60 backdrop-blur">
      <CardContent className="p-8">
        <h1 className="text-2xl font-bold tracking-tight">Criar sua conta</h1>
        <p className="mt-1 text-sm text-muted-foreground">Cadastre-se para desbloquear as interacoes do site.</p>

        {step === "signup" ? (
          <>
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
                <Label htmlFor="name">Nome</Label>
                <Input id="name" required placeholder="Seu nome" value={name} onChange={(event) => setName(event.target.value)} />
              </div>
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
                <Label htmlFor="username">Nome de usuario</Label>
                <Input
                  id="username"
                  required
                  placeholder="seu_usuario"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  placeholder="********"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar senha</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  required
                  minLength={6}
                  placeholder="********"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-foreground text-background hover:bg-foreground/90">
                {loading ? "Criando conta..." : "Criar conta"}
              </Button>
            </form>
          </>
        ) : (
          <form onSubmit={onVerify} className="mt-6 space-y-4">
            <div className="rounded-2xl border border-border/60 bg-background/35 p-4 text-sm text-muted-foreground">
              Um codigo de confirmacao foi enviado para <span className="text-foreground">{email}</span>.
            </div>
            <div className="space-y-2">
              <Label htmlFor="verification-code">Codigo de confirmacao</Label>
              <Input
                id="verification-code"
                inputMode="numeric"
                required
                placeholder="123456"
                value={verificationCode}
                onChange={(event) => setVerificationCode(event.target.value)}
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-foreground text-background hover:bg-foreground/90">
              {loading ? "Validando..." : "Validar codigo"}
            </Button>
            <Button type="button" disabled={loading} variant="outline" className="w-full" onClick={() => void onResend()}>
              Reenviar codigo
            </Button>
          </form>
        )}

        <Suspense fallback={null}>
          <AuthFeedback />
        </Suspense>
        {errorMessage ? <p className="mt-4 text-center text-sm text-rose-400">{errorMessage}</p> : null}
        {message ? <p className="mt-4 text-center text-sm text-brand">{message}</p> : null}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Ja tem conta?{" "}
          <Link href={`/auth/signin?next=${encodeURIComponent(nextPath)}`} className="text-foreground underline-offset-4 hover:underline">
            Entrar
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
