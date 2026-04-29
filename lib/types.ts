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

export type NeuralEditorMode = "edit" | "preview";

export interface NeuralMemoryCapture {
  id: string;
  text: string;
  summary: string;
  timestamp: string;
  reply?: string;
}

export interface NeuralConversationEntry {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  notePath?: string;
  tags: string[];
}

export interface NeuralNote {
  id: string;
  title: string;
  slug: string;
  type: "category" | "subcategory";
  path: string;
  folderPath: string;
  parentPath: string | null;
  markdown: string;
  preview: string;
  tags: string[];
  links: string[];
  memories: NeuralMemoryCapture[];
  createdAt: string;
  updatedAt: string;
}

export interface NeuralFolder {
  id: string;
  name: string;
  slug: string;
  path: string;
  depth: number;
  parentPath: string | null;
  notePath: string;
  childPaths: string[];
}

export interface NeuralTag {
  id: string;
  label: string;
  slug: string;
  count: number;
  tone: "brand" | "emerald" | "sky" | "amber" | "rose";
}

export interface NeuralFolderTreeNode {
  folder: NeuralFolder;
  note?: NeuralNote;
  children: NeuralFolderTreeNode[];
}

export interface NeuralClassificationResult {
  parentCategory: string;
  subcategory: string;
  noteTitle: string;
  folderPath: string;
  notePath: string;
  parentNotePath: string;
  tags: string[];
  summary: string;
  introduction: string;
  parentIntroduction: string;
  relations: string[];
  keywords: string[];
  confidence: number;
}

export interface NeuralVault {
  version: number;
  notes: NeuralNote[];
  folders: NeuralFolder[];
  tags: NeuralTag[];
  interactions: NeuralConversationEntry[];
  activeNotePath: string;
  updatedAt: string;
  lastClassification?: NeuralClassificationResult;
}

export interface NeuralProcessingResult {
  reply: string;
  classification: NeuralClassificationResult;
  vault: NeuralVault;
  activeNotePath: string;
  source: "remote" | "fallback";
  memoryContext?: string;
}
