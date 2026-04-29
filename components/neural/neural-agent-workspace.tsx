"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  BrainCircuit,
  MessageSquareQuote,
  Settings,
  Volume2,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { NeuralClassificationResult } from "@/lib/types";
import type { VoiceState } from "@/lib/services/voice-service";

type ConversationPair = {
  id: string;
  user: string;
  assistant?: string;
  time: string;
  notePath?: string;
  tags: string[];
};

export function NeuralAgentWorkspace({
  conversationPairs,
  transcript,
  response,
  voiceState,
  obsidianConnected,
  googleConfigured,
  audioLevel,
  lastClassification,
  onToggleSettings,
}: {
  conversationPairs: ConversationPair[];
  transcript: string;
  response: string;
  voiceState: VoiceState;
  obsidianConnected: boolean;
  googleConfigured: boolean;
  audioLevel: number;
  lastClassification?: NeuralClassificationResult;
  onToggleSettings: () => void;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
      <section className="flex min-h-[560px] flex-col rounded-[28px] border border-border/60 bg-card/45 backdrop-blur-xl shadow-[0_20px_80px_hsl(var(--brand)/0.08)]">
        <div className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[hsl(var(--brand)/0.12)] text-brand">
              <MessageSquareQuote size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold">Historico de voz</p>
              <p className="text-xs text-muted-foreground">Cada conversa ja sai organizada para a memoria</p>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4" style={{ scrollbarWidth: "none" }}>
          {conversationPairs.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-border/60 bg-background/20 px-6 text-center text-sm text-muted-foreground">
              Nenhum historico ainda. Sua primeira conversa vai abrir uma nova trilha de memoria.
            </div>
          ) : (
            conversationPairs.map((pair, index) => (
              <motion.div
                key={pair.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: Math.min(index * 0.04, 0.2) }}
                className="rounded-[24px] border border-border/60 bg-background/55 p-4 shadow-sm"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full border border-border/60 bg-card px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    {pair.time}
                  </span>
                  {pair.notePath && (
                    <span className="rounded-full border border-[hsl(var(--brand)/0.16)] bg-[hsl(var(--brand)/0.08)] px-2.5 py-1 text-[10px] tracking-[0.18em] text-brand">
                      {pair.notePath.replace(".md", "")}
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="mb-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Voce</p>
                    <p className="text-sm leading-relaxed text-foreground/90">{pair.user}</p>
                  </div>

                  {pair.assistant ? (
                    <div className="rounded-2xl border border-[hsl(var(--brand)/0.14)] bg-[hsl(var(--brand)/0.06)] p-3">
                      <p className="mb-1 text-[11px] uppercase tracking-[0.18em] text-brand">Neural</p>
                      <p className="text-sm leading-relaxed text-foreground/85">{pair.assistant}</p>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-border/60 bg-card/70 p-3 text-sm text-muted-foreground">
                      Processando resposta...
                    </div>
                  )}

                  {pair.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {pair.tags.map((tag) => (
                        <Badge
                          key={`${pair.id}-${tag}`}
                          variant="outline"
                          className="border-border/60 bg-card/40 text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
                        >
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </section>

      <section className="flex min-h-[560px] flex-col rounded-[28px] border border-border/60 bg-card/45 p-5 backdrop-blur-xl shadow-[0_20px_80px_hsl(var(--brand)/0.08)]">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[hsl(var(--brand)/0.12)] text-brand">
              <Volume2 size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold">Canal ativo</p>
              <p className="text-xs text-muted-foreground">Entrada e saida em voz com memoria sincronizada</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleSettings}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-card/55 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Settings size={16} />
          </button>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-2">
          <StatusPill
            icon={obsidianConnected ? Wifi : WifiOff}
            tone={obsidianConnected ? "good" : "neutral"}
            label={obsidianConnected ? "Obsidian pronto" : "Obsidian offline"}
            value={obsidianConnected ? "Sincronizando notas locais" : "Rodando em localStorage"}
          />
          <StatusPill
            icon={BrainCircuit}
            tone={googleConfigured ? "good" : "brand"}
            label={googleConfigured ? "IA expandida" : "MVP local"}
            value={googleConfigured ? "Google configurado" : "Classificacao e memoria local"}
          />
        </div>

        <div className="grid flex-1 gap-4">
          <div className="rounded-[24px] border border-border/60 bg-background/40 p-4">
            <AnimatePresence mode="wait">
              {voiceState === "listening" && transcript ? (
                <motion.div
                  key="transcript"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                >
                  <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Captura em andamento
                  </p>
                  <p className="text-lg leading-relaxed text-foreground/92">"{transcript}"</p>
                </motion.div>
              ) : voiceState === "processing" ? (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  className="flex min-h-[180px] flex-col items-center justify-center text-center"
                >
                  <p className="mb-4 text-[11px] uppercase tracking-[0.18em] text-amber-400">
                    Neural analisando contexto
                  </p>
                  <div className="flex justify-center gap-2">
                    {[0, 1, 2].map((item) => (
                      <motion.div
                        key={item}
                        className="h-2.5 w-2.5 rounded-full bg-amber-400"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 0.65, repeat: Infinity, delay: item * 0.14 }}
                      />
                    ))}
                  </div>
                </motion.div>
              ) : response ? (
                <motion.div
                  key="response"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  className="rounded-[24px] border border-[hsl(var(--brand)/0.14)] bg-[hsl(var(--brand)/0.06)] p-4"
                >
                  <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-brand">Resposta falada</p>
                  <p className="max-h-[260px] overflow-y-auto text-base leading-relaxed text-foreground/90">
                    {response}
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex min-h-[180px] items-center justify-center rounded-[24px] border border-dashed border-border/60 bg-background/35 p-5 text-center"
                >
                  <div>
                    <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      Pronto para ouvir
                    </p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Fale naturalmente. A Neural responde em voz e transforma a conversa em notas conectadas.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[24px] border border-border/60 bg-background/40 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">Sinais em tempo real</p>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.18em]",
                    voiceState === "listening" && "bg-emerald-400/10 text-emerald-300",
                    voiceState === "processing" && "bg-amber-400/10 text-amber-300",
                    voiceState === "speaking" && "bg-[hsl(var(--brand)/0.12)] text-brand",
                    voiceState === "idle" && "bg-card text-muted-foreground",
                  )}
                >
                  {voiceState === "listening"
                    ? "Escutando"
                    : voiceState === "processing"
                      ? "Pensando"
                      : voiceState === "speaking"
                        ? "Falando"
                        : "Stand by"}
                </span>
              </div>

              <div className="space-y-3">
                <MetricRow
                  label="Nivel do microfone"
                  value={`${Math.round(audioLevel * 100)}%`}
                  meterWidth={`${Math.max(audioLevel * 100, 4)}%`}
                />
                <MetricRow
                  label="Resposta por voz"
                  value={voiceState === "speaking" ? "Ativa" : "Aguardando"}
                  meterWidth={voiceState === "speaking" ? "82%" : "28%"}
                />
                <MetricRow
                  label="Captura estruturada"
                  value={lastClassification ? `${lastClassification.parentCategory} / ${lastClassification.subcategory}` : "Sem nota ativa"}
                  meterWidth={lastClassification ? "88%" : "18%"}
                />
              </div>
            </div>

            <div className="rounded-[24px] border border-border/60 bg-background/40 p-4">
              <p className="mb-3 text-sm font-semibold">Ultima rota de memoria</p>
              {lastClassification ? (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-[hsl(var(--brand)/0.14)] bg-[hsl(var(--brand)/0.06)] p-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-brand">Pasta ativa</p>
                    <p className="mt-1 text-sm text-foreground/90">
                      {lastClassification.parentCategory} / {lastClassification.subcategory}
                    </p>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Nota principal: {lastClassification.parentNotePath}</p>
                    <p>Nota filha: {lastClassification.notePath}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {lastClassification.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="border-border/60 bg-card/40 text-[10px] uppercase tracking-[0.18em]">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  A proxima fala vai abrir automaticamente uma categoria pai, uma subcategoria e suas notas espelho.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatusPill({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Wifi;
  label: string;
  value: string;
  tone: "good" | "brand" | "neutral";
}) {
  return (
    <div className="flex items-center gap-3 rounded-[20px] border border-border/60 bg-card/50 px-4 py-3">
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-2xl",
          tone === "good" && "bg-emerald-400/10 text-emerald-300",
          tone === "brand" && "bg-[hsl(var(--brand)/0.12)] text-brand",
          tone === "neutral" && "bg-card text-muted-foreground",
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground/90">{value}</p>
      </div>
    </div>
  );
}

function MetricRow({
  label,
  value,
  meterWidth,
}: {
  label: string;
  value: string;
  meterWidth: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 px-4 py-3">
      <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-border/60">
        <motion.div
          className="h-full rounded-full bg-brand"
          animate={{ width: meterWidth }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
