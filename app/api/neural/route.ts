import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { ObyronOrchestrator } from "@/lib/core/agent-orchestrator";
import { ObsidianMemory } from "@/lib/memory/obsidian-sync";
import { ObsidianAPI } from "@/lib/memory/obsidian-api";
import { GoogleAutomationService } from "@/lib/actions/google-automation";

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
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt invalido." }, { status: 400 });
    }

    const context = await buildMemoryContext(prompt);
    const { reply, obsidian_actions, google_actions } = await ObyronOrchestrator.chat(prompt, context || undefined);

    if (obsidian_actions.length > 0) {
      for (const note of obsidian_actions) {
        try {
          await ObsidianAPI.createStructuredNote(note);
        } catch (error) {
          console.error("[OBSIDIAN SAVE ERROR]", note.title, error);
        }
      }
    }

    let automationResults: string[] = [];
    let finalReply = reply;

    if (!context && looksLikeMemoryQuestion(prompt) && google_actions.length === 0) {
      finalReply = "Ainda nao tenho essa informacao salva na memoria. Se voce me contar isso, eu posso guardar no Obsidian e lembrar depois.";
    }

    if (google_actions.length > 0) {
      try {
        automationResults = await GoogleAutomationService.executeActions(google_actions);
        finalReply = [reply, ...automationResults].filter(Boolean).join(" ");
      } catch (error: any) {
        const message = error?.message || "Falha ao executar automacao do Google.";
        finalReply = `${reply} ${message}`.trim();
      }
    }

    return NextResponse.json({ reply: finalReply, automationResults, memoryContext: context });
  } catch (error: any) {
    console.error("[OBYRON API ERROR]", error?.message);

    const msg = error?.message || "";
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
