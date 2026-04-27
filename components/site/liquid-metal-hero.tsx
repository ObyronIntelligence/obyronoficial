"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { LiquidMetal } from "@paper-design/shaders-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface LiquidMetalHeroProps {
  badge?: string;
  title: string;
  subtitle: string;
  primaryCtaLabel: string;
  secondaryCtaLabel?: string;
  primaryHref: string;
  secondaryHref?: string;
  features?: string[];
}

export function LiquidMetalHero({
  badge,
  title,
  subtitle,
  primaryCtaLabel,
  secondaryCtaLabel,
  primaryHref,
  secondaryHref,
  features = [],
}: LiquidMetalHeroProps) {
  const router = useRouter();

  return (
    <section className="relative w-full">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
      >
        <LiquidMetal
          colorBack="#00000000"
          colorTint="#8b5cf6"
          repetition={3}
          softness={1}
          shiftRed={0.4}
          shiftBlue={0.6}
          distortion={0.6}
          contour={0.8}
          shape="metaballs"
          offsetX={0}
          offsetY={0}
          scale={0.9}
          rotation={0}
          speed={1.4}
          style={{ width: "120%", height: "120%", opacity: 0.85 }}
        />
      </div>

      <div className="container relative mx-auto flex min-h-[88vh] flex-col items-center justify-center px-6 py-24 text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { delayChildren: 0.15, staggerChildren: 0.12 },
            },
          }}
          className="flex max-w-4xl flex-col items-center gap-8"
        >
          {badge && (
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
              <Badge variant="outline" className="gap-2 border-border/60 bg-card/40 px-4 py-1.5 text-xs backdrop-blur-md">
                <Sparkles className="h-3 w-3 text-brand" />
                {badge}
              </Badge>
            </motion.div>
          )}

          <motion.h1
            variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
            className="text-balance bg-gradient-to-b from-foreground via-foreground to-foreground/50 bg-clip-text text-5xl font-bold leading-[1.05] tracking-tighter text-transparent md:text-7xl lg:text-8xl"
          >
            {title}
          </motion.h1>

          <motion.p
            variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
            className="max-w-2xl text-balance text-base leading-relaxed text-muted-foreground md:text-lg"
          >
            {subtitle}
          </motion.p>

          <motion.div
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            className="flex flex-col items-center gap-3 sm:flex-row"
          >
            <Button
              size="lg"
              onClick={() => router.push(primaryHref)}
              className="group h-12 gap-2 bg-foreground px-7 text-background hover:bg-foreground/90"
            >
              {primaryCtaLabel}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
            {secondaryCtaLabel && secondaryHref && (
              <Button
                size="lg"
                variant="outline"
                onClick={() => router.push(secondaryHref)}
                className="h-12 border-border/60 bg-card/40 px-7 backdrop-blur-md hover:bg-card/70"
              >
                {secondaryCtaLabel}
              </Button>
            )}
          </motion.div>

          {features.length > 0 && (
            <motion.div
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground"
            >
              {features.map((feature) => (
                <span key={feature} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-brand" />
                  {feature}
                </span>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
