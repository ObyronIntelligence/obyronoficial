"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <Card className="w-full border-border/60 bg-card/60 backdrop-blur">
      <CardContent className="p-8">
        <h1 className="text-2xl font-bold tracking-tight">Criar sua conta</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Comece em segundos. Sem cartao de credito.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" required placeholder="Seu nome" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" required placeholder="voce@empresa.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" required minLength={6} placeholder="********" />
          </div>
          <Button type="submit" className="w-full bg-foreground text-background hover:bg-foreground/90">
            Criar conta
          </Button>
        </form>
        {submitted && (
          <p className="mt-4 text-center text-sm text-brand">
            Cadastro recebido. Depois podemos ligar essa tela ao backend real.
          </p>
        )}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Ja tem conta?{" "}
          <Link href="/auth/signin" className="text-foreground underline-offset-4 hover:underline">
            Entrar
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
