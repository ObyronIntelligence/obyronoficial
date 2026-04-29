// Tipagem centralizada do sistema Obyron Neural

export interface AgentResult {
  plan: string;
  implementation: string;
  review: string;
}

export interface NeuralMessage {
  role: "user" | "system";
  content: string;
  timestamp?: number;
}

export interface ObsidianStructuredNote {
  title: string;
  folder?: string;
  projeto?: string;
  tipo?: string;
  descricao: string;
  conteudo: string;
  relacionamentos?: string[];
}

export interface GoogleAction {
  service: "calendar" | "sheets";
  operation: "create_event" | "list_events" | "append_row" | "read_range";
  params: Record<string, any>;
}

export interface ConversationPlan {
  reply: string;
  obsidian_actions: ObsidianStructuredNote[];
  google_actions: GoogleAction[];
}

export interface MemorySearchResult {
  path: string;
  title: string;
  score: number;
  snippet: string;
  content: string;
}

export interface MemorySyncResult {
  status: "ok" | "error";
  message: string;
  documentsProcessed?: number;
}

export interface ActionDefinition {
  name: string;
  description: string;
  execute: (params: Record<string, any>) => Promise<any>;
}

export interface NeuralApiResponse {
  reply: string;
  automationResults?: string[];
  meta?: {
    plan: string;
    review: string;
    context?: string;
  };
  error?: string;
}
