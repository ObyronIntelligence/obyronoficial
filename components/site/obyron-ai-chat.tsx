"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUpIcon,
  BarChart3,
  Bot,
  Code,
  Paperclip,
  PlusIcon,
  Sparkles,
  Workflow,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

function useAutoResizeTextarea({ minHeight, maxHeight }: { minHeight: number; maxHeight?: number }) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const element = textareaRef.current;
      if (!element) return;

      if (reset) {
        element.style.height = `${minHeight}px`;
        return;
      }

      element.style.height = `${minHeight}px`;
      const nextHeight = Math.max(
        minHeight,
        Math.min(element.scrollHeight, maxHeight ?? Number.POSITIVE_INFINITY),
      );
      element.style.height = `${nextHeight}px`;
    },
    [maxHeight, minHeight],
  );

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = `${minHeight}px`;
    }
  }, [minHeight]);

  return { textareaRef, adjustHeight };
}

export function ObyronAIChat() {
  const [value, setValue] = useState("");
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({ minHeight: 60, maxHeight: 200 });
  const { requireAuth } = useAuth();

  const guardInteraction = () =>
    requireAuth({
      title: "Entre para interagir com a ObyronAI",
      description: "Sem conta ativa, o chat e os atalhos da ObyronAI ficam bloqueados.",
    });

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!guardInteraction()) {
        return;
      }
      if (value.trim()) {
        setValue("");
        adjustHeight(true);
      }
    }
  };

  return (
    <div className="flex w-full flex-col items-center space-y-8">
      <h1 className="bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-center text-3xl font-semibold tracking-tight text-transparent md:text-5xl">
        Como posso te ajudar hoje?
      </h1>

      <div className="w-full">
        <div className="relative rounded-3xl border border-border bg-card/80 shadow-sm backdrop-blur">
          <div className="overflow-y-auto">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(event) => {
                if (!guardInteraction()) {
                  return;
                }
                setValue(event.target.value);
                adjustHeight();
              }}
              onClick={() => {
                guardInteraction();
              }}
              onKeyDown={onKeyDown}
              placeholder="Pergunte qualquer coisa para a ObyronAI..."
              className={cn(
                "min-h-[60px] w-full resize-none border-none bg-transparent px-5 py-4 text-sm shadow-none",
                "focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground",
              )}
              style={{ overflow: "hidden" }}
            />
          </div>

          <div className="flex items-center justify-between p-3">
            <button
              type="button"
              onClick={() => {
                guardInteraction();
              }}
              className="group flex items-center gap-1 rounded-lg p-2 transition-colors hover:bg-accent"
            >
              <Paperclip className="h-4 w-4 text-foreground" />
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  guardInteraction();
                }}
                className="flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:bg-accent"
              >
                <PlusIcon className="h-4 w-4" />
                Projeto
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!guardInteraction()) {
                    return;
                  }

                  if (value.trim()) {
                    setValue("");
                    adjustHeight(true);
                  }
                }}
                className={cn(
                  "flex items-center gap-1 rounded-full border px-2.5 py-2 text-sm transition-colors",
                  value.trim()
                    ? "border-transparent bg-foreground text-background"
                    : "border-border text-muted-foreground hover:bg-accent",
                )}
              >
                <ArrowUpIcon className="h-4 w-4" />
                <span className="sr-only">Enviar</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <ActionButton icon={<Sparkles className="h-4 w-4" />} label="Gerar ideia" />
          <ActionButton icon={<Workflow className="h-4 w-4" />} label="Criar automacao" />
          <ActionButton icon={<Code className="h-4 w-4" />} label="Escrever codigo" />
          <ActionButton icon={<BarChart3 className="h-4 w-4" />} label="Analisar dados" />
          <ActionButton icon={<Bot className="h-4 w-4" />} label="Treinar agente" />
        </div>
      </div>
    </div>
  );
}

function ActionButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  const { requireAuth } = useAuth();

  return (
    <button
      type="button"
      onClick={() => {
        requireAuth({
          title: `Entre para usar ${label}`,
          description: "Os atalhos inteligentes ficam disponiveis apenas para usuarios autenticados.",
        });
      }}
      className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-accent hover:text-foreground"
    >
      {icon}
      <span className="text-xs">{label}</span>
    </button>
  );
}
