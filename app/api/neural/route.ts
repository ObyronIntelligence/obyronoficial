import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { ObyronOrchestrator } from "@/lib/core/agent-orchestrator";
import { ObsidianMemory } from "@/lib/memory/obsidian-sync";
import { ObsidianAPI } from "@/lib/memory/obsidian-api";
import { GoogleAutomationService } from "@/lib/actions/google-automation";
import { classificationService } from "@/lib/services/classification-service";
import { parseCalendarRequest } from "@/lib/services/calendar-request-parser";

function resolveVaultPath() {
  const configuredVault = process.env.OBSIDIAN_VAULT_PATH || "./obsidian";
  return path.isAbsolute(configuredVault)
    ? configuredVault
    : path.join(process.cwd(), configuredVault);
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function looksLikeMemoryQuestion(prompt: string) {
  const normalized = normalizeText(prompt);
  const asksForRecall =
    /\b(quem|qual|quais|como|onde|quando)\b/.test(normalized) ||
    normalized.includes("voce lembra") ||
    normalized.includes("sabe me dizer");
  const personalReference = /\b(meu|minha|meus|minhas|eu|familia|irma|irmao|mae|pai|namorada|namorado)\b/.test(
    normalized
  );

  return asksForRecall && personalReference;
}

function hasUsableGroqKey() {
  const key = process.env.GROQ_API_KEY || "";
  return Boolean(key && !key.includes("sua-chave") && !key.includes("your-") && !key.includes("aqui"));
}

function formatGoogleAutomationError(error: unknown) {
  const message = error instanceof Error ? error.message : "Falha ao executar automacao do Google.";

  if (
    message.includes("GOOGLE_REFRESH_TOKEN") ||
    message.includes("Integracao Google") ||
    message.includes("Integra")
  ) {
    return [
      "Eu entendi o evento, mas ainda nao consegui criar no Google Calendar porque a autorizacao da agenda nao foi concluida.",
      "O erro tecnico foi: GOOGLE_REFRESH_TOKEN ausente.",
      "Abra /api/google/oauth/start, autorize sua conta Google e depois tente novamente.",
    ].join(" ");
  }

  return message;
}

async function buildMemoryContext(prompt: string) {
  try {
    const vaultPath = resolveVaultPath();
    return await ObsidianMemory.buildMemoryContext(vaultPath, prompt, 4);
  } catch (error) {
    console.warn("[MEMORY CONTEXT] Falha ao montar contexto local.", error);
    return "";
  }
}

export async function POST(request: NextRequest) {
  let promptValue = "";

  try {
    const { prompt, persistMemory = true } = await request.json();
    promptValue = typeof prompt === "string" ? prompt : "";

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt invalido." }, { status: 400 });
    }

    const context = await buildMemoryContext(prompt);
    const groqAvailable = hasUsableGroqKey();
    const calendarRequest = parseCalendarRequest(prompt);

    if (calendarRequest.detected && calendarRequest.missing.length > 0) {
      return NextResponse.json({
        reply: calendarRequest.reply,
        automationResults: [],
        memoryContext: context,
        fallback: true,
      });
    }

    if (!groqAvailable) {
      if (calendarRequest.detected && calendarRequest.action) {
        let automationResults: string[] = [];
        let finalReply = calendarRequest.reply;

        try {
          automationResults = await GoogleAutomationService.executeActions([calendarRequest.action]);
          finalReply = [calendarRequest.reply, ...automationResults].filter(Boolean).join(" ");
        } catch (error) {
          finalReply = `${calendarRequest.reply} ${formatGoogleAutomationError(error)}`.trim();
        }

        return NextResponse.json({
          reply: finalReply,
          automationResults,
          memoryContext: context,
          fallback: true,
        });
      }

      const fallbackClassification = classificationService.classifyText(prompt);
      return NextResponse.json({
        reply: classificationService.buildFallbackReply(fallbackClassification),
        automationResults: [],
        memoryContext: context,
        fallback: true,
      });
    }

    const { reply, obsidian_actions, google_actions } = await ObyronOrchestrator.chat(
      prompt,
      context || undefined,
    );

    if (persistMemory !== false && obsidian_actions.length > 0) {
      for (const note of obsidian_actions) {
        try {
          await ObsidianAPI.createStructuredNote(note);
        } catch (error) {
          console.error("[OBSIDIAN SAVE ERROR]", note.title, error);
        }
      }
    }

    let automationResults: string[] = [];
    const effectiveGoogleActions =
      google_actions.length === 0 && calendarRequest.detected && calendarRequest.action
        ? [calendarRequest.action]
        : google_actions;
    let finalReply =
      google_actions.length === 0 && calendarRequest.detected && calendarRequest.action
        ? calendarRequest.reply
        : reply;

    if (!context && looksLikeMemoryQuestion(prompt) && effectiveGoogleActions.length === 0) {
      finalReply = "Ainda nao tenho essa informacao salva na memoria. Se voce me contar isso, eu posso guardar no Obsidian e lembrar depois.";
    }

    if (effectiveGoogleActions.length > 0) {
      try {
        automationResults = await GoogleAutomationService.executeActions(effectiveGoogleActions);
        finalReply = [finalReply, ...automationResults].filter(Boolean).join(" ");
      } catch (error) {
        finalReply = `${finalReply} ${formatGoogleAutomationError(error)}`.trim();
      }
    }

    return NextResponse.json({ reply: finalReply, automationResults, memoryContext: context });
  } catch (error: any) {
    console.error("[OBYRON API ERROR]", error?.message);

    const msg = error?.message || "";
    if (
      msg.includes("GROQ_API_KEY") ||
      msg.includes("Invalid API Key") ||
      msg.includes("Unauthorized") ||
      msg.includes("401") ||
      msg.includes("fetch failed") ||
      msg.includes("ECONNREFUSED") ||
      msg.includes("rate limit")
    ) {
      const fallbackClassification = classificationService.classifyText(
        promptValue || "Memoria registrada pela Neural.",
      );
      return NextResponse.json({
        reply: classificationService.buildFallbackReply(fallbackClassification),
        automationResults: [],
        fallback: true,
      });
    }

    let userMessage = "Erro interno no processamento neural.";

    if (msg.includes("GROQ_API_KEY")) {
      userMessage = "A GROQ_API_KEY nao esta configurada no .env.local.";
    } else if (msg.includes("Unauthorized") || msg.includes("Invalid API Key") || msg.includes("401")) {
      userMessage = "A chave da API do Groq parece invalida.";
    } else if (msg.includes("429") || msg.includes("Too Many Requests") || msg.includes("rate limit")) {
      userMessage = "Muitas requisicoes ao Groq. Aguarde alguns segundos e tente de novo.";
    } else if (msg.includes("fetch failed") || msg.includes("ECONNREFUSED")) {
      userMessage = "Sem conexao com o servico externo necessario para a resposta.";
    }

    return NextResponse.json({ error: userMessage, details: msg }, { status: 500 });
  }
}
