import type { NeuralProcessingResult, NeuralVault } from "@/lib/types";
import { classificationService } from "@/lib/services/classification-service";
import { notesService } from "@/lib/services/notes-service";

function normalizeText(value: string) {
  return classificationService.normalizeText(value);
}

function ensureMemoryMention(reply: string, parentCategory: string, subcategory: string) {
  const normalizedReply = normalizeText(reply);
  const mentionsParent = normalizedReply.includes(normalizeText(parentCategory));
  const mentionsChild = normalizedReply.includes(normalizeText(subcategory));

  if (mentionsParent && mentionsChild) {
    return reply;
  }

  return `${reply.trim()} Tambem organizei isso em ${parentCategory} > ${subcategory}.`.trim();
}

async function requestRemoteReply(prompt: string) {
  const response = await fetch("/api/neural", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, persistMemory: false }),
  });

  const payload = await response.json();

  if (!response.ok || payload.error) {
    throw new Error(payload.error || "Falha ao consultar o core neural.");
  }

  return payload as { reply?: string; memoryContext?: string };
}

export const neuralService = {
  async checkIntegrations() {
    const [obsidianResult, googleResult, supabaseResult] = await Promise.allSettled([
      fetch("/api/obsidian?action=ping").then((response) => response.json()),
      fetch("/api/google").then((response) => response.json()),
      fetch("/api/supabase").then((response) => response.json()),
    ]);

    return {
      obsidianConnected:
        obsidianResult.status === "fulfilled" ? Boolean(obsidianResult.value.connected) : false,
      googleConfigured:
        googleResult.status === "fulfilled" ? Boolean(googleResult.value.configured) : false,
      supabaseConnected:
        supabaseResult.status === "fulfilled" ? Boolean(supabaseResult.value.connected) : false,
    };
  },
  async processVoiceInput(vault: NeuralVault, userText: string): Promise<NeuralProcessingResult> {
    const classification = classificationService.classifyText(userText);
    let reply = classificationService.buildFallbackReply(classification);
    let source: NeuralProcessingResult["source"] = "fallback";
    let memoryContext = "";

    try {
      const remotePayload = await requestRemoteReply(userText);
      if (remotePayload.reply) {
        reply = ensureMemoryMention(remotePayload.reply, classification.parentCategory, classification.subcategory);
        source = "remote";
      }
      memoryContext = remotePayload.memoryContext || "";
    } catch {}

    const nextVault = notesService.applyVoiceCapture(vault, userText, reply, classification);
    notesService.saveVault(nextVault);
    await notesService.syncNotes(nextVault, [classification.parentNotePath, classification.notePath]);

    return {
      reply,
      classification,
      vault: nextVault,
      activeNotePath: classification.notePath,
      source,
      memoryContext,
    };
  },
  async syncEditedNote(vault: NeuralVault, notePath: string) {
    notesService.saveVault(vault);
    await notesService.syncNotes(vault, [notePath]);
  },
};
