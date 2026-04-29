import fs from "fs/promises";
import path from "path";
import type { MemorySearchResult } from "@/lib/types";

const STOP_WORDS = new Set([
  "a",
  "as",
  "o",
  "os",
  "de",
  "da",
  "das",
  "do",
  "dos",
  "e",
  "ou",
  "em",
  "no",
  "na",
  "nos",
  "nas",
  "um",
  "uma",
  "meu",
  "minha",
  "meus",
  "minhas",
  "que",
  "quem",
  "qual",
  "quais",
  "como",
  "sobre",
  "pra",
  "para",
  "por",
  "com",
  "ele",
  "ela",
  "eu",
  "voce",
  "voces",
  "isso",
  "isto",
  "esse",
  "essa",
  "esse",
  "essa",
  "ser",
  "era",
  "foi",
  "sao",
  "são",
  "esta",
  "está",
  "estao",
  "estão",
]);

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function tokenize(value: string): string[] {
  return normalizeText(value)
    .replace(/[^a-z0-9\s/:-]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function extractTitle(relativePath: string, content: string): string {
  const firstHeading = content
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.startsWith("# "));

  if (firstHeading) {
    return firstHeading.replace(/^#\s+/, "").trim();
  }

  return path.basename(relativePath, ".md");
}

function extractSnippet(content: string, tokens: string[]): string {
  const lines = content.split("\n").map((line) => line.trim()).filter(Boolean);

  for (const line of lines) {
    const normalized = normalizeText(line);
    if (tokens.some((token) => normalized.includes(token))) {
      return line.slice(0, 280);
    }
  }

  return lines.slice(0, 3).join(" ").slice(0, 280);
}

async function collectMarkdownFiles(rootPath: string, currentPath = rootPath): Promise<string[]> {
  const entries = await fs.readdir(currentPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const absolutePath = path.join(currentPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectMarkdownFiles(rootPath, absolutePath)));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(absolutePath);
    }
  }

  return files;
}

export class ObsidianMemory {
  static async readLocalNotes(vaultPath: string): Promise<{ name: string; path: string; content: string }[]> {
    const absoluteVaultPath = path.resolve(vaultPath);
    const markdownFiles = await collectMarkdownFiles(absoluteVaultPath);

    return Promise.all(
      markdownFiles.map(async (filePath) => {
        const content = await fs.readFile(filePath, "utf-8");
        return {
          name: path.basename(filePath),
          path: path.relative(absoluteVaultPath, filePath).replace(/\\/g, "/"),
          content,
        };
      })
    );
  }

  static async searchLocal(vaultPath: string, query: string): Promise<string[]> {
    const results = await this.searchRelevantNotes(vaultPath, query, 3);
    return results.map((result) => result.content);
  }

  static async searchRelevantNotes(
    vaultPath: string,
    query: string,
    limit = 5
  ): Promise<MemorySearchResult[]> {
    const notes = await this.readLocalNotes(vaultPath);
    const queryTokens = Array.from(new Set(tokenize(query)));
    const normalizedQuery = normalizeText(query).trim();

    if (queryTokens.length === 0 && !normalizedQuery) {
      return [];
    }

    const scored = notes
      .map((note) => {
        const title = extractTitle(note.path, note.content);
        const titleNorm = normalizeText(title);
        const pathNorm = normalizeText(note.path);
        const contentNorm = normalizeText(note.content);

        let score = 0;

        if (normalizedQuery && titleNorm.includes(normalizedQuery)) score += 18;
        if (normalizedQuery && pathNorm.includes(normalizedQuery)) score += 16;
        if (normalizedQuery && contentNorm.includes(normalizedQuery)) score += 8;

        for (const token of queryTokens) {
          if (titleNorm.includes(token)) score += 9;
          if (pathNorm.includes(token)) score += 7;
          if (contentNorm.includes(token)) score += 3;
        }

        if (note.path.startsWith("Obyron/Conversas/")) {
          score -= 2;
        }

        return {
          path: note.path,
          title,
          score,
          snippet: extractSnippet(note.content, queryTokens),
          content: note.content,
        };
      })
      .filter((note) => note.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored;
  }

  static async buildMemoryContext(vaultPath: string, query: string, limit = 4): Promise<string> {
    const matches = await this.searchRelevantNotes(vaultPath, query, limit);

    if (matches.length === 0) {
      return "";
    }

    return matches
      .map(
        (match, index) =>
          `MEMORIA ${index + 1}\nArquivo: ${match.path}\nTitulo: ${match.title}\nTrecho: ${match.snippet}`
      )
      .join("\n\n");
  }
}
