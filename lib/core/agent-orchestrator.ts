import type { AgentResult, ConversationPlan, GoogleAction, ObsidianStructuredNote } from "@/lib/types";

// ============================================
// GROQ - FAST INFERENCE API
// ============================================

export class ObyronOrchestrator {
  private static async callGroq(messages: { role: string; content: string }[]): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

    if (!apiKey) {
      throw new Error("GROQ_API_KEY nao configurada no .env.local");
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.5,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error("[GROQ API ERROR]", JSON.stringify(errorData, null, 2));
      const errMsg = errorData?.error?.message || response.statusText;
      throw new Error(`Groq API Error [${response.status}]: ${errMsg}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "";
  }

  /**
   * Modo conversacional com memoria e automacoes.
   */
  static async chat(input: string, context?: string): Promise<ConversationPlan> {
    const now = new Date();
    const systemPrompt = `Voce e o Obyron, um assistente de inteligencia artificial que atua como segundo cerebro do usuario.
Responda EXCLUSIVAMENTE com JSON valido, sem markdown e sem texto fora do JSON.

Formato obrigatorio:
{
  "reply": "Resposta falada em portugues, direta e natural.",
  "obsidian_actions": [
    {
      "title": "string",
      "folder": "string",
      "descricao": "string",
      "conteudo": "string",
      "relacionamentos": ["string"]
    }
  ],
  "google_actions": [
    {
      "service": "calendar" | "sheets",
      "operation": "create_event" | "list_events" | "append_row" | "read_range",
      "params": {}
    }
  ]
}

REGRAS DE MEMORIA:
1. A prioridade sempre e responder ao usuario no campo "reply" com explicacao util, clara e completa para aparecer no site.
2. Use a memoria recebida para responder perguntas sobre fatos que o usuario ja compartilhou.
3. Se a memoria responder a pergunta, responda com base nela e nao invente.
4. Se o usuario pedir explicacao, conselho, resumo, plano, analise ou estudo, explique no "reply" e tambem crie uma sintese organizada em "obsidian_actions".
5. Se o usuario compartilhar um fato estavel e util sobre si, familia, rotina, preferencias, projetos ou referencias recorrentes, salve em "obsidian_actions" mesmo sem pedido explicito.
6. Nao transforme a resposta principal em apenas "vou registrar na memoria"; o registro no Obsidian e paralelo a resposta.
7. Quando o usuario disser algo como "minha irma se chama Ana", crie uma nota recuperavel, por exemplo:
   {
     "title": "Irma",
     "folder": "Pessoas/Familia/Irma",
     "descricao": "Informacoes sobre a irma do usuario",
     "conteudo": "Nome: Ana",
     "relacionamentos": []
   }
8. Agrupe listas e categorias em uma nota unica quando fizer sentido.
9. Nao crie notas vazias nem irrelevantes.

REGRAS DE AUTOMACAO GOOGLE:
1. Use "google_actions" apenas quando o usuario pedir claramente uma acao externa.
2. Acoes suportadas:
   - calendar/create_event: criar evento com summary, start, end e opcionalmente description, location, calendarId, timeZone.
   - calendar/list_events: consultar eventos com timeMin, timeMax, maxResults, calendarId.
   - sheets/append_row: adicionar uma linha com values e opcionalmente spreadsheetId, spreadsheetRef, sheetName ou range.
   - sheets/read_range: ler uma faixa com range e opcionalmente spreadsheetId ou spreadsheetRef.
3. Para calendar/create_event, summary, start e end sao obrigatorios. Se o usuario informar nome, data, horario e duracao, calcule "end" somando a duracao a "start".
4. Quando datas e horas forem citadas, converta para ISO 8601 no fuso America/Sao_Paulo quando possivel.
5. Para pedidos relativos como "amanha", "segunda" ou "hoje", use a data atual informada abaixo.
6. Se faltar nome do evento, data, horario ou duracao, faca uma pergunta curta em "reply" e deixe "google_actions" vazio.
7. Quando criar evento, responda em "reply" confirmando o que vai ser criado antes do resultado tecnico ser anexado pelo sistema.

REGRAS DE RESPOSTA:
1. "reply" deve soar natural como resposta final ao usuario.
2. Em perguntas de conhecimento, explique primeiro; no maximo a ultima frase pode mencionar que tambem organizou no Obsidian.
3. Se a intencao principal for automacao, a resposta pode antecipar a acao brevemente.
4. Use "relacionamentos" apenas para conexoes transversais reais.
5. Nao inclua campos fora do schema.

DATA_ATUAL:
${now.toISOString()}
FUSO_PADRAO:
America/Sao_Paulo`;

    const contextBlock = context ? `\n\nMEMORIA DISPONIVEL:\n${context}` : "";
    const messages = [
      { role: "system", content: systemPrompt + contextBlock },
      { role: "user", content: input },
    ];

    const apiKey = process.env.GROQ_API_KEY;
    const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(`Groq API Error: ${errorData?.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const rawContent = data.choices[0]?.message?.content || "{}";

    try {
      return this.sanitizeConversationPlan(JSON.parse(rawContent));
    } catch {
      return { reply: "Tive um problema na matriz de pensamento.", obsidian_actions: [], google_actions: [] };
    }
  }

  private static sanitizeConversationPlan(rawValue: any): ConversationPlan {
    const obsidianActions = Array.isArray(rawValue?.obsidian_actions)
      ? rawValue.obsidian_actions.filter((item: any): item is ObsidianStructuredNote => {
          return Boolean(item?.title && item?.descricao && item?.conteudo);
        })
      : [];

    const googleActions = Array.isArray(rawValue?.google_actions)
      ? rawValue.google_actions.filter((item: any): item is GoogleAction => {
          return Boolean(item?.service && item?.operation && item?.params && typeof item.params === "object");
        })
      : [];

    return {
      reply: typeof rawValue?.reply === "string" ? rawValue.reply : "Nao consegui responder direito desta vez.",
      obsidian_actions: obsidianActions,
      google_actions: googleActions,
    };
  }

  /**
   * Pipeline completo: Planner -> Executor -> Critic
   */
  static async runTask(input: string, context?: string): Promise<AgentResult> {
    const planPrompt = `Voce e o PLANNER do Sistema Obyron Neural.
Entenda a tarefa, decomponha em etapas claras e minimize custo computacional.
Responda APENAS com passos numerados.
${context ? `CONTEXTO:\n${context}\n` : ""}
TAREFA: ${input}`;
    const plan = await this.callGroq([{ role: "user", content: planPrompt }]);

    const execPrompt = `Voce e o EXECUTOR do Sistema Obyron Neural.
Implemente a solucao pratica baseada no plano. Sem explicacoes desnecessarias.
PLANO:\n${plan}`;
    const implementation = await this.callGroq([{ role: "user", content: execPrompt }]);

    const criticPrompt = `Voce e o CRITIC do Sistema Obyron Neural.
Revise a implementacao. Maximo 5 pontos. Foque em seguranca, performance e escalabilidade.
Se nao houver falhas criticas, responda "APROVADO".
IMPLEMENTACAO:\n${implementation}`;
    const review = await this.callGroq([{ role: "user", content: criticPrompt }]);

    return { plan, implementation, review };
  }

  /**
   * Modo rapido: execucao direta
   */
  static async quickExecute(input: string): Promise<string> {
    return this.callGroq([
      { role: "user", content: `Execute esta tarefa diretamente, sem plano. Seja conciso.\n\nTarefa: ${input}` },
    ]);
  }
}
