"use client";

import { ProtectedExperience } from "@/components/auth/protected-experience";
import { AiModeToggle } from "@/components/site/ai-mode-toggle";
import { ObyronAIChat } from "@/components/site/obyron-ai-chat";
import { Badge } from "@/components/ui/badge";

export default function ObyronAIPage() {
  return (
    <ProtectedExperience
      title="ObyronAI exclusiva para usuarios"
      description="Crie sua conta ou entre para conversar com a ObyronAI e usar seus atalhos inteligentes."
    >
      <section className="container mx-auto flex min-h-[80vh] max-w-5xl flex-col items-center justify-center px-6 py-16">
        <Badge variant="outline" className="mb-6 border-border/60 bg-card/40 backdrop-blur">
          ObyronAI beta
        </Badge>

        <AiModeToggle active="obyronai" className="mb-10" />

        <ObyronAIChat />
      </section>
    </ProtectedExperience>
  );
}
