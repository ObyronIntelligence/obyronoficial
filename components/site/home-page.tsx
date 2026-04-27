import { FeaturesSection } from "@/components/site/features-section";
import { PlansSection } from "@/components/site/plans-section";
import { CtaSection } from "@/components/site/cta-section";
import { LiquidMetalHero } from "@/components/site/liquid-metal-hero";

export default function HomePage() {
  return (
    <>
      <LiquidMetalHero
        badge="Obyron · Sites + Automacoes + IA"
        title="Sites inteligentes que trabalham por voce"
        subtitle="Combinamos design moderno, automacoes detalhadas e Inteligencia Artificial para criar produtos digitais que escalam o seu negocio."
        primaryCtaLabel="Criar conta gratis"
        secondaryCtaLabel="Ver planos"
        primaryHref="/auth/signup"
        secondaryHref="/planos"
        features={["Edge-native", "Automacoes fluidas", "IA integrada"]}
      />
      <FeaturesSection />
      <PlansSection />
      <CtaSection />
    </>
  );
}
