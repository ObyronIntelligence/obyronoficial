import type { NeuralClassificationResult } from "@/lib/types";

type CategoryRule = {
  name: string;
  description: string;
  keywords: string[];
  defaultSubcategory: string;
};

type SubjectAlias = {
  label: string;
  category?: string;
  patterns: string[];
};

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
  "em",
  "no",
  "na",
  "nos",
  "nas",
  "um",
  "uma",
  "eu",
  "voce",
  "voces",
  "minha",
  "meu",
  "meus",
  "minhas",
  "sobre",
  "com",
  "para",
  "pra",
  "por",
  "que",
  "isso",
  "essa",
  "esse",
  "estou",
  "estava",
  "agora",
  "ontem",
  "hoje",
  "amanha",
  "ola",
  "falar",
  "fala",
  "pode",
  "mim",
]);

const CATEGORY_RULES: CategoryRule[] = [
  {
    name: "Estudos",
    description: "os estudos e aprendizados do usuario",
    keywords: [
      "estudar",
      "aprend",
      "curso",
      "aula",
      "faculdade",
      "prova",
      "livro",
      "certificacao",
      "treinar",
      "linguagem",
    ],
    defaultSubcategory: "Geral",
  },
  {
    name: "Projetos",
    description: "projetos, produtos e ideias em construcao",
    keywords: [
      "projeto",
      "app",
      "aplicativo",
      "sistema",
      "produto",
      "startup",
      "roadmap",
      "feature",
      "deploy",
      "neural",
      "obyron",
    ],
    defaultSubcategory: "Projeto Atual",
  },
  {
    name: "Trabalho",
    description: "as frentes profissionais e entregas de trabalho",
    keywords: ["cliente", "empresa", "reuniao", "sprint", "entrega", "ticket", "trabalho", "prazo"],
    defaultSubcategory: "Operacao",
  },
  {
    name: "Esportes",
    description: "esportes, clubes, jogadores e competicoes acompanhadas pelo usuario",
    keywords: [
      "futebol",
      "basquete",
      "esporte",
      "clube",
      "time",
      "jogo",
      "campeonato",
      "torcida",
      "gremio",
      "corinthians",
      "palmeiras",
      "sao paulo",
    ],
    defaultSubcategory: "Geral",
  },
  {
    name: "Pessoas",
    description: "pessoas importantes e relacionamentos do usuario",
    keywords: [
      "familia",
      "irma",
      "irmao",
      "mae",
      "pai",
      "amigo",
      "amiga",
      "namorada",
      "namorado",
      "filho",
      "filha",
      "esposa",
      "marido",
    ],
    defaultSubcategory: "Relacionamentos",
  },
  {
    name: "Saude",
    description: "saude, energia e bem-estar",
    keywords: ["saude", "treino", "academia", "sono", "alimentacao", "medico", "remedio", "exercicio"],
    defaultSubcategory: "Bem-estar",
  },
  {
    name: "Financas",
    description: "financas, compras e planejamento financeiro",
    keywords: ["dinheiro", "gasto", "investimento", "orcamento", "compra", "salario", "financa"],
    defaultSubcategory: "Planejamento",
  },
  {
    name: "Rotina",
    description: "rotina, agenda e habitos",
    keywords: ["rotina", "agenda", "habito", "manha", "noite", "semana", "calendario"],
    defaultSubcategory: "Dia a dia",
  },
  {
    name: "Ideias",
    description: "ideias, referencias e intuicoes criativas",
    keywords: ["ideia", "pensei", "imagino", "referencia", "inspiracao", "brainstorm"],
    defaultSubcategory: "Laboratorio",
  },
  {
    name: "Lazer",
    description: "lazer, hobbies e interesses pessoais",
    keywords: ["filme", "serie", "jogo", "musica", "viagem", "hobby", "livre"],
    defaultSubcategory: "Interesses",
  },
];

const SUBJECT_ALIASES: SubjectAlias[] = [
  { label: "JavaScript", category: "Estudos", patterns: ["javascript"] },
  { label: "TypeScript", category: "Estudos", patterns: ["typescript"] },
  { label: "React", category: "Estudos", patterns: ["react"] },
  { label: "Next.js", category: "Estudos", patterns: ["next.js", "nextjs"] },
  { label: "Node.js", category: "Estudos", patterns: ["node.js", "nodejs"] },
  { label: "Supabase", category: "Estudos", patterns: ["supabase"] },
  { label: "OpenAI", category: "Estudos", patterns: ["openai"] },
  { label: "LangChain", category: "Estudos", patterns: ["langchain"] },
  { label: "Python", category: "Estudos", patterns: ["python"] },
  { label: "Java", category: "Estudos", patterns: ["java"] },
  { label: "Ingles", category: "Estudos", patterns: ["ingles", "english"] },
  { label: "Obsidian", category: "Projetos", patterns: ["obsidian"] },
  { label: "Neural", category: "Projetos", patterns: ["neural"] },
  { label: "Obyron", category: "Projetos", patterns: ["obyron"] },
  { label: "Gremio", category: "Esportes", patterns: ["gremio"] },
  { label: "Corinthians", category: "Esportes", patterns: ["corinthians"] },
  { label: "Sao Paulo Futebol Clube", category: "Esportes", patterns: ["sao paulo futebol clube", "sao paulo"] },
];

const LEADING_ARTICLE_REGEX = /^(o|a|os|as|um|uma|uns|umas)\s+/i;
const MOJIBAKE_REGEX = /[ÃÂâ�]/;

function repairMojibake(value: string) {
  if (!MOJIBAKE_REGEX.test(value)) {
    return value;
  }

  try {
    return decodeURIComponent(escape(value));
  } catch {
    return value;
  }
}

function normalizeText(value: string) {
  return repairMojibake(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function slugify(value: string) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toTitleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase())
    .join(" ");
}

function tokenize(value: string) {
  return normalizeText(value)
    .replace(/[^a-z0-9+#.\s/-]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function scoreCategory(input: string, rule: CategoryRule) {
  const normalized = normalizeText(input);
  return rule.keywords.reduce((score, keyword) => {
    return normalized.includes(keyword) ? score + 1 : score;
  }, 0);
}

function cleanSubject(candidate: string) {
  return candidate
    .replace(LEADING_ARTICLE_REGEX, "")
    .replace(/[.?!,;:]+$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function extractSubjectFromPattern(input: string, patterns: RegExp[]) {
  const repairedInput = repairMojibake(input);

  for (const pattern of patterns) {
    const match = repairedInput.match(pattern);
    const candidate = match?.[1] ? cleanSubject(match[1]) : "";
    if (candidate) {
      return candidate;
    }
  }

  return "";
}

function extractCapitalizedSubject(input: string) {
  const repairedInput = repairMojibake(input);
  const matches = repairedInput.match(/\b[A-Z][A-Za-z0-9+#.-]*(?:\s+[A-Z][A-Za-z0-9+#.-]*)*/g) || [];
  const blacklist = new Set(["Eu", "Hoje", "Ontem", "Amanha", "Minha", "Meu", "Ola"]);
  return matches.find((item) => !blacklist.has(item)) || "";
}

function extractKeywords(input: string) {
  return Array.from(new Set(tokenize(input))).slice(0, 6);
}

function detectAlias(input: string) {
  const normalized = normalizeText(input);

  return SUBJECT_ALIASES.find((alias) =>
    alias.patterns.some((pattern) => {
      const normalizedPattern = normalizeText(pattern);
      return normalized === normalizedPattern || normalized.includes(normalizedPattern);
    }),
  );
}

function deriveSummary(input: string) {
  const sentence = repairMojibake(input).replace(/\s+/g, " ").trim();
  if (sentence.length <= 140) {
    return sentence;
  }

  return `${sentence.slice(0, 137).trim()}...`;
}

function deriveRelations(input: string, parentCategory: string, subcategory: string) {
  const relations = new Set<string>([parentCategory]);
  const normalized = normalizeText(input);

  if (normalized.includes("obsidian")) relations.add("Obsidian");
  if (normalized.includes("ia")) relations.add("IA");
  if (normalized.includes("projeto") && parentCategory !== "Projetos") relations.add("Projetos");
  if (normalized.includes("estudo") && parentCategory !== "Estudos") relations.add("Estudos");
  if (subcategory !== parentCategory) relations.add(subcategory);

  return Array.from(relations).filter((item) => item !== subcategory);
}

function extractSubcategory(input: string, category: CategoryRule) {
  const alias = detectAlias(input);
  if (alias) {
    return alias.label;
  }

  if (category.name === "Pessoas") {
    const normalized = normalizeText(input);
    const rolePatterns: Record<string, RegExp> = {
      Irma: /\birma\b/i,
      Irmao: /\birmao\b/i,
      Mae: /\bmae\b/i,
      Pai: /\bpai\b/i,
      Namorada: /\bnamorada\b/i,
      Namorado: /\bnamorado\b/i,
      Amizades: /\bamig[oa]s?\b/i,
    };

    for (const [label, pattern] of Object.entries(rolePatterns)) {
      if (pattern.test(normalized)) {
        return label;
      }
    }
  }

  const extracted = extractSubjectFromPattern(input, [
    /(?:estudar|estudando|aprendendo|curso de|aula de)\s+([A-Za-z0-9+#.\s-]{2,})/i,
    /(?:projeto|produto|sistema|app)\s+(?:de\s+)?([A-Za-z0-9+#.\s-]{2,})/i,
    /(?:sobre|com|em)\s+([A-Za-z0-9+#.\s-]{2,})/i,
  ]);

  if (extracted) {
    return toTitleCase(extracted.split(" ").slice(0, 3).join(" "));
  }

  const capitalized = extractCapitalizedSubject(input);
  if (capitalized) {
    return cleanSubject(capitalized);
  }

  const keywords = extractKeywords(input);
  if (keywords.length > 0) {
    return toTitleCase(keywords.slice(0, 2).join(" "));
  }

  return category.defaultSubcategory;
}

function buildIntroduction(parentCategory: string, subcategory: string) {
  return `Esta nota reune conteudos relacionados a ${subcategory.toLowerCase()} dentro de ${parentCategory.toLowerCase()}.`;
}

function buildParentIntroduction(rule: CategoryRule) {
  return `Esta pasta reune todas as anotacoes relacionadas a ${rule.description}.`;
}

export const classificationService = {
  normalizeText,
  slugify,
  classifyText(input: string): NeuralClassificationResult {
    const baseInput = repairMojibake(input.trim());
    const detectedAlias = detectAlias(baseInput);
    const rankedCategories = CATEGORY_RULES
      .map((rule) => ({ rule, score: scoreCategory(baseInput, rule) }))
      .sort((first, second) => second.score - first.score);

    const best = rankedCategories[0];
    const aliasCategory = detectedAlias?.category
      ? CATEGORY_RULES.find((rule) => rule.name === detectedAlias.category)
      : undefined;
    const categoryRule = aliasCategory || (best && best.score > 0 ? best.rule : CATEGORY_RULES[0]);
    const subcategory = extractSubcategory(baseInput, categoryRule);
    const parentCategory = categoryRule.name;
    const parentSlug = slugify(parentCategory);
    const subcategorySlug = slugify(subcategory || categoryRule.defaultSubcategory);
    const keywords = extractKeywords(baseInput);
    const tags = Array.from(
      new Set([parentSlug, subcategorySlug !== parentSlug ? subcategorySlug : ""].filter(Boolean)),
    );

    const confidenceBase = aliasCategory ? 0.72 : best && best.score > 0 ? 0.55 + best.score * 0.08 : 0.48;
    const confidence = Math.min(confidenceBase, 0.96);

    return {
      parentCategory,
      subcategory,
      noteTitle: subcategory,
      folderPath: `${parentCategory}/${subcategory}`,
      notePath: `${parentCategory}/${subcategory}/${subcategory}.md`,
      parentNotePath: `${parentCategory}/${parentCategory}.md`,
      tags,
      summary: deriveSummary(baseInput),
      introduction: buildIntroduction(parentCategory, subcategory),
      parentIntroduction: buildParentIntroduction(categoryRule),
      relations: deriveRelations(baseInput, parentCategory, subcategory),
      keywords,
      confidence,
    };
  },
  buildFallbackReply(result: NeuralClassificationResult) {
    return `Entendi. Organizei isso em ${result.parentCategory} > ${result.subcategory} e vou manter essa memoria conectada para as proximas conversas.`;
  },
};
