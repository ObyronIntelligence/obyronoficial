"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Database, MessageSquareQuote, Mic, MicOff, Settings, Volume2, Wifi, WifiOff } from "lucide-react";
import { ProtectedExperience } from "@/components/auth/protected-experience";
import VoiceOrb from "@/components/ui/voice-orb";
import { cn } from "@/lib/utils";
import { voiceService, type VoiceState } from "@/lib/services/voice-service";
import { neuralService } from "@/lib/services/neural-service";
import { notesService } from "@/lib/services/notes-service";
import type { NeuralVault } from "@/lib/types";

function buildConversationPairs(vault: NeuralVault) {
  const pairs: { user: string; assistant?: string; time: string }[] = [];

  for (let index = 0; index < vault.interactions.length; index += 1) {
    const item = vault.interactions[index];

    if (item.role !== "user") {
      continue;
    }

    const nextItem = vault.interactions[index + 1];
    const time = new Date(item.timestamp).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const pair: { user: string; assistant?: string; time: string } = {
      user: item.text,
      time,
    };

    if (nextItem?.role === "assistant") {
      pair.assistant = nextItem.text;
      index += 1;
    }

    pairs.push(pair);
  }

  return pairs;
}

export default function NeuralPage() {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [obsidianConnected, setObsidianConnected] = useState(false);
  const [googleConfigured, setGoogleConfigured] = useState(false);
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [vault, setVault] = useState<NeuralVault | null>(null);

  const runtimeRef = useRef<ReturnType<typeof voiceService.create> | null>(null);
  const vaultRef = useRef(vault);
  const animFrameRef = useRef<number>(0);
  const transcriptTimeoutRef = useRef<number | null>(null);
  const historyEndRef = useRef<HTMLDivElement>(null);
  const handleUserMessageRef = useRef<(text: string) => void>();

  useEffect(() => {
    const loadedVault = notesService.loadVault();
    vaultRef.current = loadedVault;
    setVault(loadedVault);
    setVoiceSupported(voiceService.isBrowserSupported());

    void neuralService.checkIntegrations().then((integrations) => {
      setObsidianConnected(integrations.obsidianConnected);
      setGoogleConfigured(integrations.googleConfigured);
      setSupabaseConnected(integrations.supabaseConnected);
    });
  }, []);

  useEffect(() => {
    if (vault) {
      vaultRef.current = vault;
    }
  }, [vault]);

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [vault?.interactions]);

  useEffect(() => {
    return () => {
      if (transcriptTimeoutRef.current) {
        window.clearTimeout(transcriptTimeoutRef.current);
      }

      cancelAnimationFrame(animFrameRef.current);
      runtimeRef.current?.destroy();
    };
  }, []);

  const updateAudioLevel = useCallback(() => {
    setAudioLevel(runtimeRef.current?.getAudioLevel() || 0);
    animFrameRef.current = requestAnimationFrame(updateAudioLevel);
  }, []);

  handleUserMessageRef.current = (text: string) => {
    void handleUserMessage(text);
  };

  async function initializeVoice(autoStart = false) {
    if (runtimeRef.current) {
      if (autoStart) {
        runtimeRef.current.startListening();
      }
      return;
    }

    const runtime = voiceService.create({
      onTranscript: (text, isFinal) => {
        setTranscript(text);

        if (transcriptTimeoutRef.current) {
          window.clearTimeout(transcriptTimeoutRef.current);
        }

        if (isFinal && text.trim()) {
          transcriptTimeoutRef.current = window.setTimeout(() => {
            handleUserMessageRef.current?.(text);
          }, 1200);
        }
      },
      onStateChange: (state) => setVoiceState(state),
      onError: (error) => {
        setResponse(error);
        setVoiceState("idle");
      },
    });

    runtimeRef.current = runtime;
    const status = await runtime.initialize();
    setIsInitialized(true);

    if (status.audioEnabled) {
      animFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }

    if (autoStart && status.speechEnabled) {
      runtime.startListening();
    }
  }

  async function handleUserMessage(text: string) {
    if (!text.trim()) {
      return;
    }

    if (!vaultRef.current) {
      return;
    }

    runtimeRef.current?.stopListening();
    setVoiceState("processing");
    setResponse("");

    try {
      const result = await neuralService.processVoiceInput(vaultRef.current, text);
      vaultRef.current = result.vault;
      setVault(result.vault);
      setResponse(result.reply);
      setVoiceState("speaking");

      runtimeRef.current?.speak(result.reply, () => {
        setVoiceState("idle");
        setTranscript("");
      });
    } catch {
      setResponse("Erro de conexao com o core neural.");
      setVoiceState("idle");
    }
  }

  async function toggleListening() {
    if (!voiceSupported) {
      setResponse("Seu navegador atual nao oferece suporte ao reconhecimento de voz necessario para a Neural.");
      return;
    }

    if (!isInitialized) {
      await initializeVoice(true);
      return;
    }

    if (voiceState === "processing") {
      return;
    }

    if (voiceState === "speaking") {
      runtimeRef.current?.stopSpeaking();
      setVoiceState("idle");
      return;
    }

    if (voiceState === "listening") {
      runtimeRef.current?.stopListening();
      setVoiceState("idle");
      return;
    }

    setTranscript("");
    setResponse("");
    runtimeRef.current?.startListening();
  }

  const conversationPairs = vault ? buildConversationPairs(vault) : [];

  return (
    <ProtectedExperience
      title="Neural disponivel apos login"
      description="Para conversar com a Neural, abrir memoria e usar os controles de voz, e necessario entrar ou criar sua conta."
    >
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,hsl(var(--brand)/0.14)_0%,transparent_26%,transparent_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_18%,hsl(var(--brand-glow)/0.10)_0%,transparent_22%,transparent_100%)]" />

      <div className="container mx-auto flex min-h-[calc(100svh-7.5rem)] flex-col overflow-hidden px-4 py-5 md:px-6 md:py-6">
        <div className="grid flex-1 items-center gap-5 xl:grid-cols-[320px_minmax(440px,1fr)_320px]">
          <section className="hidden h-[560px] xl:flex flex-col rounded-[28px] border border-border/60 bg-card/45 backdrop-blur-xl shadow-[0_20px_80px_hsl(var(--brand)/0.08)]">
            <div className="flex items-center gap-3 border-b border-border/60 px-5 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[hsl(var(--brand)/0.12)] text-brand">
                <MessageSquareQuote size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold">Historico</p>
                <p className="text-xs text-muted-foreground">Conversas recentes com a Neural</p>
              </div>
            </div>

            <div
              className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {conversationPairs.length === 0 && (
                <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-border/60 bg-background/20 px-6 text-center text-sm text-muted-foreground">
                  Nenhum historico ainda. Sua primeira conversa aparecera aqui.
                </div>
              )}

              {conversationPairs.map((pair, index) => (
                <motion.div
                  key={`${pair.time}-${index}`}
                  initial={{ opacity: 0, x: -20, scale: 0.98 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ duration: 0.35, ease: [0.2, 0.65, 0.3, 0.9] }}
                  className="rounded-[24px] border border-border/60 bg-background/55 p-4 shadow-sm"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="rounded-full border border-border/60 bg-card px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                      {pair.time}
                    </span>
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
                  </div>
                </motion.div>
              ))}
              <div ref={historyEndRef} />
            </div>
          </section>

          <section className="relative flex h-[560px] flex-col items-center justify-center px-0 py-0">
            <div className="relative z-10 flex w-full flex-1 items-center justify-center">
              <div className="relative flex h-[360px] w-[360px] items-center justify-center sm:h-[420px] sm:w-[420px] md:h-[500px] md:w-[500px]">
                <VoiceOrb
                  audioLevel={audioLevel}
                  isSpeaking={voiceState === "speaking" || voiceState === "listening"}
                />

                <motion.button
                  type="button"
                  onClick={() => void toggleListening()}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "relative z-20 flex h-16 w-16 items-center justify-center rounded-full border backdrop-blur-md transition-all duration-300 md:h-20 md:w-20",
                    voiceState === "listening" &&
                      "border-transparent bg-foreground text-background shadow-[0_0_35px_hsl(var(--brand)/0.28)]",
                    (voiceState === "processing" || voiceState === "speaking") &&
                      "cursor-wait border-border/60 bg-card/60 text-foreground",
                    voiceState === "idle" &&
                      "border-border/60 bg-card/70 text-foreground hover:border-foreground/25 hover:bg-card",
                  )}
                  disabled={voiceState === "processing"}
                >
                  {voiceState === "listening" ? <MicOff size={22} /> : <Mic size={22} />}
                </motion.button>
              </div>
            </div>

          </section>

          <section className="flex h-[560px] flex-col rounded-[28px] border border-border/60 bg-card/45 p-5 backdrop-blur-xl shadow-[0_20px_80px_hsl(var(--brand)/0.08)]">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[hsl(var(--brand)/0.12)] text-brand">
                  <Volume2 size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold">Canal ativo</p>
                  <p className="text-xs text-muted-foreground">Entrada e resposta em tempo real</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card/55 px-3 py-2 text-xs text-muted-foreground">
                {obsidianConnected ? (
                  <Wifi size={14} className="text-emerald-400" />
                ) : (
                  <WifiOff size={14} />
                )}
                <span>{obsidianConnected ? "Obsidian conectado" : "Obsidian offline"}</span>
              </div>
            </div>

            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSettings((value) => !value)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-card/55 text-muted-foreground transition-colors hover:text-foreground"
              >
                <Settings size={16} />
              </button>
            </div>

            <div className="flex flex-1 items-center justify-center">
              <div className="min-h-[320px] w-full max-w-md">
                <AnimatePresence mode="wait">
                  {voiceState === "listening" && transcript && (
                    <motion.div
                      key="transcript"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -16 }}
                      className="mx-auto rounded-[24px] border border-border/60 bg-background/55 p-4"
                    >
                      <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        O que voce disse
                      </p>
                      <p className="text-lg leading-relaxed text-foreground/90">"{transcript}"</p>
                    </motion.div>
                  )}

                  {(voiceState === "speaking" || (voiceState === "idle" && response)) && (
                    <motion.div
                      key="response"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -16 }}
                      className="mx-auto rounded-[24px] border border-[hsl(var(--brand)/0.14)] bg-[hsl(var(--brand)/0.06)] p-4"
                    >
                      <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-brand">
                        Resposta atual
                      </p>
                      <p className="max-h-[320px] overflow-y-auto text-base leading-relaxed text-foreground/90">
                        {response}
                      </p>
                    </motion.div>
                  )}

                  {voiceState === "processing" && (
                    <motion.div
                      key="processing"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -16 }}
                      className="mx-auto flex min-h-[220px] flex-col items-center justify-center rounded-[24px] border border-border/60 bg-background/55 p-6 text-center"
                    >
                      <p className="mb-4 text-[11px] uppercase tracking-[0.18em] text-amber-400">
                        Processando...
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
                  )}

                  {voiceState === "idle" && !response && !transcript && (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mx-auto rounded-[24px] border border-dashed border-border/60 bg-background/35 p-5 text-center"
                    >
                      <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        Pronto
                      </p>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        Ative o microfone para conversar. A resposta da Neural continua aparecendo aqui em tempo
                        real, junto com o que voce acabou de falar.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </section>
        </div>
      </div>

      <AnimatePresence>
      {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="fixed right-5 top-24 z-40 w-80 rounded-[24px] border border-border/60 bg-background/92 p-5 backdrop-blur-xl shadow-[0_20px_80px_hsl(var(--brand)/0.08)]"
          >
            <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.22em] text-foreground">Configuracoes</h3>

            <div className="space-y-3">
              <SettingRow
                label="Obsidian API"
                value={obsidianConnected ? "Conectado" : "Desconectado"}
                tone={obsidianConnected ? "text-emerald-400" : "text-rose-400"}
              />
              <SettingRow
                label="Microfone"
                value={isInitialized ? "Ativo" : "Inativo"}
                tone={isInitialized ? "text-emerald-400" : "text-muted-foreground"}
              />
              <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/55 px-4 py-3">
                <span className="text-xs text-muted-foreground">Nivel de audio</span>
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-border/60">
                  <motion.div
                    className="h-full rounded-full bg-brand"
                    animate={{ width: `${Math.max(audioLevel * 100, 4)}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
              </div>
              <SettingRow
                label="Google"
                value={googleConfigured ? "Pronto" : "Nao configurado"}
                tone={googleConfigured ? "text-emerald-400" : "text-muted-foreground"}
              />
              <SettingRow
                label="Supabase"
                value={supabaseConnected ? "Conectado" : "Nao conectado"}
                tone={supabaseConnected ? "text-emerald-400" : "text-amber-300"}
                icon={Database}
              />
            </div>

            <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
              Configure `OBSIDIAN_API_URL`, `OBSIDIAN_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`,
              `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e as credenciais Google no `.env.local` para habilitar
              memoria, sincronizacao local e futuras automacoes.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
    </ProtectedExperience>
  );
}

function SettingRow({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon?: typeof Database;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/55 px-4 py-3">
      <span className="flex items-center gap-2 text-xs text-muted-foreground">
        {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
        {label}
      </span>
      <span className={cn("text-xs", tone)}>{value}</span>
    </div>
  );
}
