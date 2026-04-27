import { Bot, LayoutDashboard, ShieldCheck, Sparkles, Workflow, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const FEATURES = [
  {
    icon: LayoutDashboard,
    title: "Sites sob medida",
    desc: "Interfaces modernas, rapidas e otimizadas para conversao.",
  },
  {
    icon: Workflow,
    title: "Automacoes fluidas",
    desc: "Workflows que conectam suas ferramentas e eliminam trabalho manual.",
  },
  {
    icon: Bot,
    title: "ObyronAI integrada",
    desc: "Agentes de IA treinados com seus dados para resolver tarefas reais.",
  },
  {
    icon: Zap,
    title: "Performance extrema",
    desc: "Arquitetura preparada para carregamento rapido e boa indexacao.",
  },
  {
    icon: ShieldCheck,
    title: "Seguranca first",
    desc: "Boas praticas de autenticacao, protecao de dados e estabilidade.",
  },
  {
    icon: Sparkles,
    title: "Design premium",
    desc: "Estetica moderna com acabamento consistente em todas as paginas.",
  },
];

export function FeaturesSection() {
  return (
    <section className="relative w-full py-24">
      <div className="container mx-auto px-6">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-4xl font-bold tracking-tight text-transparent md:text-5xl">
            O que entregamos
          </h2>
          <p className="mt-4 text-muted-foreground">
            Stack completo para sua empresa rodar com automacao de ponta a ponta.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <Card
              key={feature.title}
              className="group border-border/60 bg-card/40 backdrop-blur transition-all hover:border-foreground/30 hover:bg-card/70"
            >
              <CardContent className="p-6">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-foreground/5 text-foreground transition-colors group-hover:bg-brand/15 group-hover:text-brand">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-1 text-base font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
