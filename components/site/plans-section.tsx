"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PLANS } from "@/lib/site-data";

export function PlansSection({ compact = false }: { compact?: boolean }) {
  const { requireAuth } = useAuth();

  return (
    <section className="relative w-full py-24">
      <div className="container mx-auto px-6">
        {!compact && (
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <Badge variant="outline" className="mb-4 border-border/60 bg-card/40 backdrop-blur">
              Planos
            </Badge>
            <h2 className="bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-4xl font-bold tracking-tight text-transparent md:text-5xl">
              Escolha o plano ideal
            </h2>
            <p className="mt-4 text-muted-foreground">
              Tres niveis pensados para escalar sua operacao, do basico ao premium com IA dedicada.
            </p>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={cn(
                "group relative flex flex-col border-border/60 bg-card/60 backdrop-blur transition-[transform,box-shadow,border-color,background-color] duration-500 ease-out will-change-transform hover:scale-[1.015] hover:border-foreground/30 hover:shadow-[0_24px_80px_-28px_hsl(var(--brand)/0.45)]",
                plan.highlighted &&
                  "border-foreground/40 shadow-[0_0_60px_-15px_hsl(var(--brand))] hover:shadow-[0_28px_90px_-24px_hsl(var(--brand)/0.55)]",
              )}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_top,hsl(var(--brand)/0.18),transparent_58%)] opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100"
              />
              {plan.highlighted && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-foreground text-background">
                  Mais popular
                </Badge>
              )}
              <CardHeader className="relative z-[1] space-y-2">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription className="text-sm">{plan.tagline}</CardDescription>
                <div className="pt-3">
                  <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.priceSuffix}</span>
                </div>
              </CardHeader>
              <CardContent className="relative z-[1] flex flex-1 flex-col">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 pt-4">
                  <Link
                    href="/neural"
                    onClick={(event) => {
                      const allowed = requireAuth({
                        title: `Desbloqueie o plano ${plan.name}`,
                        description: "Crie sua conta ou entre para contratar e continuar com este plano.",
                      });

                      if (!allowed) {
                        event.preventDefault();
                      }
                    }}
                    className={buttonVariants({
                      variant: plan.highlighted ? "default" : "outline",
                      className: cn(
                        "w-full",
                        plan.highlighted && "bg-foreground text-background hover:bg-foreground/90",
                      ),
                    })}
                  >
                    Comecar agora
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
