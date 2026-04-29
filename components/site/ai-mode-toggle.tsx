"use client";

import Link from "next/link";
import { BrainCircuit, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function AiModeToggle({
  active,
  className,
}: {
  active: "obyronai" | "neural";
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label="Modo da IA"
      className={cn(
        "inline-flex items-center rounded-full border border-border/60 bg-card/40 p-1 backdrop-blur-md",
        className,
      )}
    >
      <Link
        href="/obyronai"
        role="tab"
        aria-selected={active === "obyronai"}
        className={cn(
          "flex items-center gap-2 rounded-full px-5 py-2 text-sm transition-all",
          active === "obyronai"
            ? "bg-foreground text-background shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Sparkles className="h-4 w-4" />
        ObyronAI
      </Link>
      <Link
        href="/neural"
        role="tab"
        aria-selected={active === "neural"}
        className={cn(
          "flex items-center gap-2 rounded-full px-5 py-2 text-sm transition-all",
          active === "neural"
            ? "bg-foreground text-background shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <BrainCircuit className="h-4 w-4" />
        Neural
      </Link>
    </div>
  );
}
