"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { buttonVariants } from "@/components/ui/button";

export function CtaSection() {
  const { requireAuth } = useAuth();

  return (
    <section className="relative w-full overflow-hidden py-24">
      <div className="container mx-auto px-6">
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card/80 via-card/40 to-card/80 p-12 backdrop-blur md:p-16">
          <div className="absolute -top-32 left-1/2 h-64 w-[600px] -translate-x-1/2 rounded-full bg-brand/30 blur-[120px]" />
          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-4xl font-bold tracking-tight text-transparent md:text-5xl">
              Pronto para automatizar com IA?
            </h2>
            <p className="mt-4 text-muted-foreground">
              Crie sua conta gratuita e descubra como a Obyron pode acelerar seu negocio.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/neural"
                onClick={(event) => {
                  const allowed = requireAuth({
                    title: "Crie sua conta para continuar",
                    description: "O acesso as automacoes e experiencias da Obyron exige login ou cadastro.",
                  });

                  if (!allowed) {
                    event.preventDefault();
                  }
                }}
                className={buttonVariants({
                  size: "lg",
                  className: "group bg-foreground text-background hover:bg-foreground/90",
                })}
              >
                Criar conta gratis
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/contato"
                className={buttonVariants({
                  variant: "outline",
                  size: "lg",
                  className: "border-border/60 bg-background/40 backdrop-blur",
                })}
              >
                Falar com especialista
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
