import { Badge } from "@/components/ui/badge";
import { PlansSection } from "@/components/site/plans-section";
import { CtaSection } from "@/components/site/cta-section";

export default function PlanosPage() {
  return (
    <>
      <section className="container mx-auto px-6 pb-8 pt-24 text-center">
        <Badge variant="outline" className="mb-4 border-border/60 bg-card/40 backdrop-blur">
          Precos transparentes
        </Badge>
        <h1 className="bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-5xl font-bold tracking-tight text-transparent md:text-6xl">
          Planos sob medida
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Do site essencial ao ecossistema completo com IA. Escolha o nivel certo para o estagio
          do seu negocio.
        </p>
      </section>
      <PlansSection compact />
      <CtaSection />
    </>
  );
}
