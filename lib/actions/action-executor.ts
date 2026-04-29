import type { ActionDefinition } from "@/lib/types";

// Registro central de acoes externas
const actionRegistry: Map<string, ActionDefinition> = new Map();

const fetchExternalData: ActionDefinition = {
  name: "fetch_external",
  description: "Busca dados de uma API externa generica",
  execute: async (params: Record<string, any>) => {
    const url = String(params.url || "");
    const method = typeof params.method === "string" ? params.method : "GET";

    if (!url) {
      throw new Error("Parametro 'url' e obrigatorio.");
    }

    const res = await fetch(url, { method });
    return await res.json();
  },
};

const createObsidianNote: ActionDefinition = {
  name: "create_note",
  description: "Cria uma nova nota estruturada no vault Obsidian",
  execute: async (params: Record<string, any>) => {
    const fs = await import("fs/promises");
    const path = await import("path");
    const title = String(params.title || "");
    const content = String(params.content || "");
    const tags = Array.isArray(params.tags) ? params.tags.map(String) : [];

    if (!title || !content) {
      throw new Error("Parametros 'title' e 'content' sao obrigatorios.");
    }

    const frontmatter = `---\ntags: [${tags.join(", ")}]\n---\n\n`;
    const body = `# ${title}\n\n## Conteudo\n${content}\n`;
    const filePath = path.join(process.cwd(), "obsidian", `${title.replace(/\s+/g, "-")}.md`);

    await fs.writeFile(filePath, frontmatter + body, "utf-8");
    return { created: filePath };
  },
};

actionRegistry.set(fetchExternalData.name, fetchExternalData);
actionRegistry.set(createObsidianNote.name, createObsidianNote);

export class ActionExecutor {
  static listActions(): string[] {
    return Array.from(actionRegistry.keys());
  }

  static async run(actionName: string, params: Record<string, any>) {
    const action = actionRegistry.get(actionName);
    if (!action) throw new Error(`Acao '${actionName}' nao registrada.`);
    return await action.execute(params);
  }

  static register(action: ActionDefinition) {
    actionRegistry.set(action.name, action);
  }
}
