import { FeaturesSection } from "@/components/site/features-section";
import { PlansSection } from "@/components/site/plans-section";
import { CtaSection } from "@/components/site/cta-section";
import { LiquidMetalHero } from "@/components/site/liquid-metal-hero";

export default function HomePage() {
  return (
    <>
      <LiquidMetalHero
        badge="Obyron · Sites + Automações + IA"
        title="Sites inteligentes que trabalham por você"
        subtitle="Combinamos design moderno, automações detalhadas e Inteligência Artificial para criar produtos digitais que escalam o seu negócio."
        primaryCtaLabel="Criar conta grátis"
        secondaryCtaLabel="Ver planos"
        primaryHref="/auth/signup"
        secondaryHref="/planos"
        features={["Edge-native", "Automações fluidas", "IA integrada"]}
      />
      <FeaturesSection />
      <PlansSection />
      <CtaSection />
    </>
  );
}
