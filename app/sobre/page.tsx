import { Rocket, Target, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CtaSection } from "@/components/site/cta-section";

const VALUES = [
  {
    icon: Target,
    title: "Foco em resultado",
    desc: "Cada projeto e desenhado para gerar impacto mensuravel no seu negocio.",
  },
  {
    icon: Users,
    title: "Parceria real",
    desc: "Trabalhamos lado a lado com o seu time, do diagnostico a entrega.",
  },
  {
    icon: Rocket,
    title: "Tecnologia de ponta",
    desc: "Stack moderna, IA aplicada e arquitetura preparada para escalar.",
  },
];

export default function SobrePage() {
  return (
    <>
      <section className="container mx-auto px-6 pb-16 pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="outline" className="mb-4 border-border/60 bg-card/40 backdrop-blur">
            Sobre nos
          </Badge>
          <h1 className="bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-5xl font-bold tracking-tight text-transparent md:text-6xl">
            Construimos software que pensa
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            A Obyron nasceu para unir design moderno, engenharia de software e IA aplicada.
            Criamos plataformas digitais que automatizam o operacional e liberam sua equipe para o
            que realmente importa: estrategia e crescimento.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-6 pb-24">
        <div className="grid gap-4 md:grid-cols-3">
          {VALUES.map((value) => (
            <Card key={value.title} className="border-border/60 bg-card/40 backdrop-blur">
              <CardContent className="p-6">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-foreground/5 text-brand">
                  <value.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-1 text-base font-semibold">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-6 pb-24">
        <div className="grid gap-8 rounded-3xl border border-border/60 bg-card/40 p-10 backdrop-blur md:grid-cols-2 md:p-14">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Nossa missao</h2>
            <p className="mt-4 text-muted-foreground">
              Tornar acessivel para qualquer empresa o poder de automacoes inteligentes e IA
              aplicada com produtos de qualidade premium e entregas rapidas.
            </p>
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Como trabalhamos</h2>
            <p className="mt-4 text-muted-foreground">
              Diagnostico, design, desenvolvimento e operacao continua. Voce recebe um produto
              vivo, em evolucao, com automacoes e IA conectadas ao seu dia a dia.
            </p>
          </div>
        </div>
      </section>

      <CtaSection />
    </>
  );
}
