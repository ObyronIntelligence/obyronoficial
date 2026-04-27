import fs from "fs/promises";
import path from "path";
import { ObsidianMemory } from "@/lib/memory/obsidian-sync";

// ============================================
// OBSIDIAN CONNECTOR - REST API + LOCAL FALLBACK
// ============================================

const OBSIDIAN_HOST = process.env.OBSIDIAN_API_URL || "http://127.0.0.1:27123";
const OBSIDIAN_KEY = process.env.OBSIDIAN_API_KEY || "";

function resolveVaultPath() {
  const configuredVault = process.env.OBSIDIAN_VAULT_PATH || "./obsidian";
  return path.isAbsolute(configuredVault)
    ? configuredVault
    : path.join(process.cwd(), configuredVault);
}

function toAbsoluteVaultFile(filePath: string) {
  const safeSegments = filePath.split("/").filter(Boolean);
  return path.join(resolveVaultPath(), ...safeSegments);
}

async function listLocalFiles(currentPath: string, rootPath = currentPath): Promise<string[]> {
  const entries = await fs.readdir(currentPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const absolutePath = path.join(currentPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await listLocalFiles(absolutePath, rootPath)));
      continue;
    }

    if (entry.isFile()) {
      files.push(path.relative(rootPath, absolutePath).replace(/\\/g, "/"));
    }
  }

  return files;
}

async function ensureLocalDirectory(filePath: string) {
  const directory = path.dirname(toAbsoluteVaultFile(filePath));
  await fs.mkdir(directory, { recursive: true });
}

async function obsidianFetch(requestPath: string, options: RequestInit = {}) {
  const url = `${OBSIDIAN_HOST}${requestPath}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${OBSIDIAN_KEY}`,
      "Content-Type": "application/markdown",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Obsidian API [${res.status}]: ${body}`);
  }

  return res;
}

export class ObsidianAPI {
  static async listFiles(): Promise<{ files: string[] }> {
    try {
      const res = await obsidianFetch("/vault/", {
        headers: { Accept: "application/json" },
      });
      return await res.json();
    } catch {
      const files = await listLocalFiles(resolveVaultPath());
      return { files };
    }
  }

  static async readNote(filePath: string): Promise<string> {
    try {
      const res = await obsidianFetch(`/vault/${encodeURIComponent(filePath)}`);
      return await res.text();
    } catch {
      return fs.readFile(toAbsoluteVaultFile(filePath), "utf-8");
    }
  }

  static async writeNote(filePath: string, content: string): Promise<void> {
    try {
      await obsidianFetch(`/vault/${encodeURIComponent(filePath)}`, {
        method: "PUT",
        body: content,
      });
      return;
    } catch {
      await ensureLocalDirectory(filePath);
      await fs.writeFile(toAbsoluteVaultFile(filePath), content, "utf-8");
    }
  }

  static async appendToNote(filePath: string, content: string): Promise<void> {
    try {
      const existingContent = await this.readNote(filePath);
      await this.writeNote(filePath, `${existingContent}\n${content}`.trim());
    } catch {
      await this.writeNote(filePath, content);
    }
  }

  static async deleteNote(filePath: string): Promise<void> {
    try {
      await obsidianFetch(`/vault/${encodeURIComponent(filePath)}`, {
        method: "DELETE",
      });
      return;
    } catch {
      await fs.unlink(toAbsoluteVaultFile(filePath));
    }
  }

  static async search(query: string): Promise<any[]> {
    try {
      const res = await obsidianFetch(`/search/simple/?query=${encodeURIComponent(query)}`, {
        headers: { Accept: "application/json" },
      });
      return await res.json();
    } catch {
      const results = await ObsidianMemory.searchRelevantNotes(resolveVaultPath(), query, 5);
      return results.map((item) => ({
        filename: item.path,
        content: item.snippet,
        score: item.score,
      }));
    }
  }

  static async getActiveNote(): Promise<string> {
    const res = await obsidianFetch("/active/", {
      headers: { Accept: "application/vnd.olrapi.note+json" },
    });
    const data = await res.json();
    return data.content || "";
  }

  static async createStructuredNote(params: {
    title: string;
    folder?: string;
    projeto?: string;
    tipo?: string;
    descricao: string;
    conteudo: string;
    relacionamentos?: string[];
  }): Promise<void> {
    const folderName = params.folder || "Conhecimentos";
    const safeTitle = params.title.replace(/[\\/:"*?<>|]+/g, "-");

    const connections = [...(params.relacionamentos || [])];
    const parts = folderName.split("/").filter((segment) => segment.trim() !== "");
    const parentFolder = parts.length > 0 ? parts[parts.length - 1] : "Obyron";

    if (!connections.includes(parentFolder) && parentFolder !== safeTitle) {
      connections.push(parentFolder);
    }

    const connectionLinks = connections.map((relation) => `- [[${relation}]]`).join("\n");
    const hierarchicalTags = parts.map((segment) => segment.toLowerCase().replace(/\s+/g, "-"));

    if (!hierarchicalTags.includes("obyron")) {
      hierarchicalTags.unshift("obyron");
    }

    const depth = parts.length;
    hierarchicalTags.push(`nivel/${depth}`);

    const tagsFormatted = hierarchicalTags.join(", ");
    const cssClass = hierarchicalTags[1] || hierarchicalTags[0];

    const content = `---
tags: [${tagsFormatted}]
cssclass: folder-${cssClass}
---

# ${params.title}

## Descricao
${params.descricao}

## Conteudo
${params.conteudo}

## Relacionamentos
${connectionLinks || "- (nenhuma conexao definida)"}
`;

    const filePath = `Obyron/${folderName}/${safeTitle}.md`;
    await this.writeNote(filePath, content);
    await this.ensureHierarchyLinks(folderName, safeTitle);
  }

  private static async ensureHierarchyLinks(folderPath: string, childName: string): Promise<void> {
    if (!folderPath) return;

    const parts = folderPath.split("/").filter((segment) => segment.trim() !== "");

    for (let index = 0; index < parts.length; index += 1) {
      const currentFolder = parts[index];
      const child = index < parts.length - 1 ? parts[index + 1] : childName;
      const depth = index + 1;
      const hierarchyTags = [
        "obyron",
        ...parts.slice(0, index + 1).map((segment) => segment.toLowerCase().replace(/\s+/g, "-")),
        `nivel/${depth}`,
      ];
      const uniqueTags = Array.from(new Set(hierarchyTags));
      const tagsStr = uniqueTags.join(", ");
      const cssClass = uniqueTags[1] || uniqueTags[0];
      const parentFolder = index > 0 ? parts[index - 1] : "Obyron";

      if (currentFolder === child) {
        continue;
      }

      const pathUpToCurrent = ["Obyron", ...parts.slice(0, index + 1)].join("/");
      const indexPath = `${pathUpToCurrent}/${currentFolder}.md`;

      try {
        const content = await this.readNote(indexPath);
        let toAppend = "";

        if (!content.includes(`[[${child}]]`)) {
          toAppend += `\n- [[${child}]]`;
        }

        if (!content.includes(`[[${parentFolder}]]`)) {
          toAppend += `\n- [[${parentFolder}]]`;
        }

        if (toAppend) {
          await this.appendToNote(indexPath, toAppend);
        }
      } catch {
        const initialContent = `---
tags: [${tagsStr}]
cssclass: folder-${cssClass}
---
# ${currentFolder}

No pai gerado automaticamente.

## Conteudos e Conexoes
- [[${parentFolder}]]
- [[${child}]]
`;

        await this.writeNote(indexPath, initialContent);
      }
    }
  }

  static async ping(): Promise<boolean> {
    try {
      const res = await fetch(`${OBSIDIAN_HOST}/`, {
        headers: { Authorization: `Bearer ${OBSIDIAN_KEY}` },
      });

      if (res.ok) {
        return true;
      }
    } catch {
      // Continua no fallback local.
    }

    try {
      await fs.access(resolveVaultPath());
      return true;
    } catch {
      return false;
    }
  }
}
