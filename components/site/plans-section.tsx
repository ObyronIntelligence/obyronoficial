import Link from "next/link";
import { Check } from "lucide-react";
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
                "relative flex flex-col border-border/60 bg-card/60 backdrop-blur transition-all hover:border-foreground/30",
                plan.highlighted && "border-foreground/40 shadow-[0_0_60px_-15px_hsl(var(--brand))]",
              )}
            >
              {plan.highlighted && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-foreground text-background">
                  Mais popular
                </Badge>
              )}
              <CardHeader className="space-y-2">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription className="text-sm">{plan.tagline}</CardDescription>
                <div className="pt-3">
                  <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.priceSuffix}</span>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
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
                    href="/auth/signup"
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
