import type {
  NeuralClassificationResult,
  NeuralConversationEntry,
  NeuralMemoryCapture,
  NeuralNote,
  NeuralVault,
} from "@/lib/types";
import { classificationService } from "@/lib/services/classification-service";
import { foldersService } from "@/lib/services/folders-service";
import { tagsService } from "@/lib/services/tags-service";

const STORAGE_KEY = "obyron-neural-vault-v1";
const OBSIDIAN_SYNC_ROOT = "Neural";

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeForMatch(value: string) {
  return classificationService.normalizeText(value).replace(/\s+/g, " ").trim();
}

function getNowIso() {
  return new Date().toISOString();
}

function extractPreview(markdown: string) {
  const cleaned = markdown
    .replace(/^#.*$/gm, "")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/[#*_`>-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length <= 180) {
    return cleaned;
  }

  return `${cleaned.slice(0, 177).trim()}...`;
}

function deriveHierarchyTags(folderPath: string) {
  return folderPath
    .split("/")
    .map((segment) => classificationService.slugify(segment))
    .filter(Boolean);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceTitle(markdown: string, title: string) {
  const trimmed = markdown.trim();
  if (!trimmed) {
    return `# ${title}`;
  }

  if (/^#\s+/m.test(trimmed)) {
    return trimmed.replace(/^#\s+.*/m, `# ${title}`);
  }

  return `# ${title}\n\n${trimmed}`;
}

function replaceSection(markdown: string, heading: string, body: string) {
  const section = `## ${heading}\n\n${body.trim()}`;
  const regex = new RegExp(`## ${escapeRegExp(heading)}\\n[\\s\\S]*?(?=\\n##\\s|$)`, "m");

  if (regex.test(markdown)) {
    return markdown.replace(regex, section);
  }

  return `${markdown.trim()}\n\n${section}`.trim();
}

function syncTagsSection(markdown: string, tags: string[]) {
  return replaceSection(
    markdown,
    "Tags",
    tags.length > 0 ? tags.map((tag) => `#${tag}`).join(" ") : "#memoria",
  );
}

function composeCategoryMarkdown(
  title: string,
  introduction: string,
  childTitles: string[],
  tags: string[],
  currentMarkdown?: string,
) {
  let markdown = replaceTitle(currentMarkdown || "", title);
  markdown = replaceSection(markdown, "Introducao", introduction);
  markdown = replaceSection(
    markdown,
    "Subpastas",
    childTitles.length > 0 ? childTitles.map((child) => `* [[${child}]]`).join("\n") : "* [[Sem registros]]",
  );
  markdown = replaceSection(
    markdown,
    "Tags",
    tags.length > 0 ? tags.map((tag) => `#${classificationService.slugify(tag)}`).join(" ") : "#memoria",
  );
  return `${markdown.trim()}\n`;
}

function formatCapture(capture: NeuralMemoryCapture) {
  const date = new Date(capture.timestamp);
  const label = date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `- **${label}** - ${capture.text}`;
}

function composeSubcategoryMarkdown(
  title: string,
  parentTitle: string,
  introduction: string,
  tags: string[],
  captures: NeuralMemoryCapture[],
  relations: string[],
  currentMarkdown?: string,
) {
  let markdown = replaceTitle(currentMarkdown || "", title);
  markdown = replaceSection(markdown, "Introducao", introduction);
  markdown = replaceSection(markdown, "Pertence a", `* [[${parentTitle}]]`);
  markdown = replaceSection(
    markdown,
    "Tags",
    tags.length > 0 ? tags.map((tag) => `#${classificationService.slugify(tag)}`).join(" ") : "#memoria",
  );
  markdown = replaceSection(
    markdown,
    "Memorias",
    captures.length > 0 ? captures.map(formatCapture).join("\n") : "- Nenhuma memoria registrada ainda.",
  );
  markdown = replaceSection(
    markdown,
    "Relacoes",
    Array.from(new Set([parentTitle, ...relations]))
      .filter((item) => item && item !== title)
      .map((item) => `* [[${item}]]`)
      .join("\n"),
  );
  return `${markdown.trim()}\n`;
}

function createConversationEntry(
  role: NeuralConversationEntry["role"],
  text: string,
  timestamp: string,
  notePath: string,
  tags: string[],
): NeuralConversationEntry {
  return {
    id: createId(role),
    role,
    text,
    timestamp,
    notePath,
    tags,
  };
}

function makeNoteBase(
  title: string,
  path: string,
  folderPath: string,
  type: NeuralNote["type"],
  parentPath: string | null,
  createdAt: string,
) {
  return {
    id: createId("note"),
    title,
    slug: classificationService.slugify(title),
    type,
    path,
    folderPath,
    parentPath,
    markdown: `# ${title}\n`,
    preview: "",
    tags: [],
    links: [],
    memories: [],
    createdAt,
    updatedAt: createdAt,
  } satisfies NeuralNote;
}

function refreshNote(note: NeuralNote, markdown: string, extraTags: string[]) {
  const tags = deriveHierarchyTags(note.folderPath);
  const nextMarkdown = syncTagsSection(markdown, tags);
  const links = tagsService.parseWikiLinks(nextMarkdown);

  return {
    ...note,
    markdown: nextMarkdown,
    preview: extractPreview(nextMarkdown),
    tags,
    links,
    updatedAt: getNowIso(),
  };
}

type CanonicalNoteGroup = {
  classification: NeuralClassificationResult;
  captures: NeuralMemoryCapture[];
  markdown: string;
  createdAt: string;
  updatedAt: string;
};

function mergeCaptures(captures: NeuralMemoryCapture[]) {
  const seen = new Set<string>();

  return captures
    .filter((capture) => {
      const key = normalizeForMatch(capture.text);
      if (!key || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .sort((first, second) => first.timestamp.localeCompare(second.timestamp));
}

function deriveTagsFromNotePath(notePath: string | undefined) {
  if (!notePath) {
    return [];
  }

  const segments = notePath.split("/").filter(Boolean);
  if (segments.length < 2) {
    return [];
  }

  return deriveHierarchyTags(segments.slice(0, -1).join("/"));
}

function migrateInteractions(interactions: NeuralConversationEntry[]) {
  let activeNotePath = "";
  let activeTags: string[] = [];

  return interactions.map((entry) => {
    if (entry.role === "user") {
      const classification = classificationService.classifyText(entry.text);
      activeNotePath = classification.notePath;
      activeTags = classification.tags;

      return {
        ...entry,
        notePath: classification.notePath,
        tags: classification.tags,
      };
    }

    const fallbackTags = activeTags.length > 0 ? activeTags : deriveTagsFromNotePath(entry.notePath);

    return {
      ...entry,
      notePath: activeNotePath || entry.notePath,
      tags: fallbackTags,
    };
  });
}

function rebuildVault(parsed: NeuralVault) {
  const subcategoryNotes = (parsed.notes || []).filter(
    (note) => note.type === "subcategory" || note.memories.length > 0 || note.parentPath,
  );

  if (subcategoryNotes.length === 0) {
    return null;
  }

  const groups = new Map<string, CanonicalNoteGroup>();
  const categoryMarkdown = new Map<string, string>();

  for (const note of parsed.notes || []) {
    if (note.type === "category") {
      categoryMarkdown.set(note.path, note.markdown);
    }
  }

  for (const note of subcategoryNotes) {
    const sourceText =
      note.memories[note.memories.length - 1]?.text ||
      note.memories[0]?.text ||
      note.title ||
      note.path;
    const classification = classificationService.classifyText(sourceText);
    const existing = groups.get(classification.notePath);

    groups.set(classification.notePath, {
      classification,
      captures: mergeCaptures([...(existing?.captures || []), ...note.memories]),
      markdown:
        !existing || note.updatedAt >= existing.updatedAt
          ? note.markdown
          : existing.markdown,
      createdAt:
        existing && existing.createdAt.localeCompare(note.createdAt) < 0
          ? existing.createdAt
          : note.createdAt,
      updatedAt:
        existing && existing.updatedAt.localeCompare(note.updatedAt) > 0
          ? existing.updatedAt
          : note.updatedAt,
    });
  }

  let folders: NeuralVault["folders"] = [];
  const notes: NeuralNote[] = [];
  const parentNotes = new Map<string, NeuralNote>();
  const childTitlesByParent = new Map<string, string[]>();

  for (const group of Array.from(groups.values())) {
    folders = foldersService.ensureFolder(folders, group.classification.parentCategory, null);
    folders = foldersService.ensureFolder(
      folders,
      group.classification.folderPath,
      group.classification.parentCategory,
    );

    const currentChildren = childTitlesByParent.get(group.classification.parentCategory) || [];
    childTitlesByParent.set(group.classification.parentCategory, [
      ...currentChildren,
      group.classification.subcategory,
    ]);
  }

  for (const [parentCategory, childTitles] of Array.from(childTitlesByParent.entries())) {
    const rule =
      parsed.lastClassification?.parentCategory === parentCategory
        ? parsed.lastClassification
        : classificationService.classifyText(parentCategory);
    const parentNotePath = `${parentCategory}/${parentCategory}.md`;
    const baseParent =
      parentNotes.get(parentNotePath) ||
      makeNoteBase(parentCategory, parentNotePath, parentCategory, "category", null, parsed.updatedAt || getNowIso());

    parentNotes.set(
      parentNotePath,
      refreshNote(
        baseParent,
        composeCategoryMarkdown(
          parentCategory,
          rule.parentCategory === parentCategory
            ? rule.parentIntroduction
            : `Esta pasta reune todas as anotacoes relacionadas a ${classificationService.normalizeText(parentCategory)}.`,
          Array.from(new Set(childTitles)).sort((first, second) => first.localeCompare(second)),
          [parentCategory],
          categoryMarkdown.get(parentNotePath) || baseParent.markdown,
        ),
        [parentCategory],
      ),
    );
  }

  for (const group of Array.from(groups.values())) {
    const childNote = refreshNote(
      {
        ...makeNoteBase(
          group.classification.noteTitle,
          group.classification.notePath,
          group.classification.folderPath,
          "subcategory",
          group.classification.parentNotePath,
          group.createdAt,
        ),
        memories: group.captures,
        updatedAt: group.updatedAt,
      },
      composeSubcategoryMarkdown(
        group.classification.noteTitle,
        group.classification.parentCategory,
        group.classification.introduction,
        group.classification.tags,
        group.captures,
        group.classification.relations,
        group.markdown,
      ),
      group.classification.tags,
    );

    childNote.createdAt = group.createdAt;
    childNote.updatedAt = group.updatedAt;
    notes.push(childNote);
  }

  notes.push(...Array.from(parentNotes.values()));
  notes.sort((first, second) => second.updatedAt.localeCompare(first.updatedAt));

  const interactions = migrateInteractions(parsed.interactions || []);
  const activeNotePath =
    interactions.filter((entry) => entry.role === "user").at(-1)?.notePath ||
    notes.find((note) => note.type === "subcategory")?.path ||
    notes[0]?.path ||
    createBaseVault().activeNotePath;

  return {
    version: 1,
    notes,
    folders,
    tags: tagsService.collectTags(notes),
    interactions,
    activeNotePath,
    updatedAt: parsed.updatedAt || getNowIso(),
    lastClassification: groups.get(activeNotePath)?.classification,
  } satisfies NeuralVault;
}

function createBaseVault() {
  const timestamp = getNowIso();
  const onboardingClassification = classificationService.classifyText(
    "A Neural registra memorias de voz e organiza anotacoes em markdown.",
  );
  const emptyVault: NeuralVault = {
    version: 1,
    notes: [],
    folders: [],
    tags: [],
    interactions: [
      {
        id: createId("assistant"),
        role: "assistant",
        text: "A Neural esta pronta para ouvir, responder por voz e organizar a memoria automaticamente.",
        timestamp,
        notePath: onboardingClassification.notePath,
        tags: ["neural", "memoria"],
      },
    ],
    activeNotePath: onboardingClassification.notePath,
    updatedAt: timestamp,
  };

  const seededVault = notesService.applyVoiceCapture(
    emptyVault,
    "A Neural registra memorias de voz e organiza anotacoes em markdown.",
    "Use o microfone para criar novas notas automaticamente e navegar pela memoria da Neural.",
    onboardingClassification,
    { skipInteraction: true },
  );

  return seededVault;
}

export const notesService = {
  createBaseVault,
  loadVault() {
    if (typeof window === "undefined") {
      return createBaseVault();
    }

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        const freshVault = createBaseVault();
        this.saveVault(freshVault);
        return freshVault;
      }

      const parsed = JSON.parse(stored) as NeuralVault;
      const rebuiltVault = rebuildVault(parsed);
      const safeVault: NeuralVault = rebuiltVault || createBaseVault();

      this.saveVault(safeVault);
      return safeVault;
    } catch {
      const fallbackVault = createBaseVault();
      this.saveVault(fallbackVault);
      return fallbackVault;
    }
  },
  saveVault(vault: NeuralVault) {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(vault));
  },
  applyVoiceCapture(
    vault: NeuralVault,
    userText: string,
    assistantReply: string,
    classification: NeuralClassificationResult,
    options?: { skipInteraction?: boolean },
  ) {
    const timestamp = getNowIso();
    let folders = [...vault.folders];
    let notes = [...vault.notes];

    const parentFolderPath = classification.parentCategory;
    const childFolderPath = classification.folderPath;

    folders = foldersService.ensureFolder(folders, parentFolderPath, null);
    folders = foldersService.ensureFolder(folders, childFolderPath, parentFolderPath);

    let parentNote =
      notes.find((note) => note.path === classification.parentNotePath) ||
      makeNoteBase(
        classification.parentCategory,
        classification.parentNotePath,
        parentFolderPath,
        "category",
        null,
        timestamp,
      );

    let childNote =
      notes.find((note) => note.path === classification.notePath) ||
      makeNoteBase(
        classification.noteTitle,
        classification.notePath,
        childFolderPath,
        "subcategory",
        classification.parentNotePath,
        timestamp,
      );

    const normalizedUserText = normalizeForMatch(userText);
    const alreadyStored = childNote.memories.some((memory) => normalizeForMatch(memory.text) === normalizedUserText);
    const nextCapture: NeuralMemoryCapture = {
      id: createId("memory"),
      text: userText.trim(),
      summary: classification.summary,
      timestamp,
      reply: assistantReply,
    };

    const captures = alreadyStored ? childNote.memories : [...childNote.memories, nextCapture];

    const childTitles = folders
      .filter((folder) => folder.parentPath === parentFolderPath)
      .map((folder) => folder.name)
      .sort((first, second) => first.localeCompare(second));

    parentNote = refreshNote(
      {
        ...parentNote,
        tags: tagsService.mergeTags(parentNote.tags, [classification.parentCategory]),
      },
      composeCategoryMarkdown(
        classification.parentCategory,
        classification.parentIntroduction,
        childTitles,
        [classification.parentCategory],
        parentNote.markdown,
      ),
      [classification.parentCategory],
    );

    childNote = refreshNote(
      {
        ...childNote,
        memories: captures,
        tags: tagsService.mergeTags(childNote.tags, classification.tags),
      },
      composeSubcategoryMarkdown(
        classification.noteTitle,
        classification.parentCategory,
        classification.introduction,
        classification.tags,
        captures,
        classification.relations,
        childNote.markdown,
      ),
      classification.tags,
    );

    notes = notes.filter((note) => note.path !== parentNote.path && note.path !== childNote.path);
    notes.push(parentNote, childNote);
    notes.sort((first, second) => second.updatedAt.localeCompare(first.updatedAt));

    const interactions = options?.skipInteraction
      ? vault.interactions
      : [
          ...vault.interactions,
          createConversationEntry("user", userText, timestamp, childNote.path, classification.tags),
          createConversationEntry("assistant", assistantReply, timestamp, childNote.path, classification.tags),
        ];

    const nextVault: NeuralVault = {
      ...vault,
      notes,
      folders,
      interactions,
      activeNotePath: childNote.path,
      updatedAt: timestamp,
      lastClassification: classification,
      tags: tagsService.collectTags(notes),
    };

    return nextVault;
  },
  updateNoteMarkdown(vault: NeuralVault, notePath: string, markdown: string) {
    const notes = vault.notes.map((note) => {
      if (note.path !== notePath) {
        return note;
      }

      return refreshNote(note, markdown, note.tags);
    });

    const nextVault: NeuralVault = {
      ...vault,
      notes,
      tags: tagsService.collectTags(notes),
      updatedAt: getNowIso(),
    };

    return nextVault;
  },
  selectNote(vault: NeuralVault, notePath: string) {
    return {
      ...vault,
      activeNotePath: notePath,
    };
  },
  getActiveNote(vault: NeuralVault) {
    return vault.notes.find((note) => note.path === vault.activeNotePath) || vault.notes[0];
  },
  getNoteByTitle(vault: NeuralVault, title: string) {
    const normalizedTitle = normalizeForMatch(title);
    return vault.notes.find((note) => normalizeForMatch(note.title) === normalizedTitle);
  },
  filterNotes(
    vault: NeuralVault,
    options: {
      query: string;
      selectedTagSlugs: string[];
      folderPath?: string | null;
    },
  ) {
    const normalizedQuery = normalizeForMatch(options.query);
    const scopedPaths = options.folderPath
      ? foldersService.flattenFolderScope(options.folderPath, vault.folders)
      : null;

    return vault.notes.filter((note) => {
      const matchesQuery =
        !normalizedQuery ||
        normalizeForMatch(note.title).includes(normalizedQuery) ||
        normalizeForMatch(note.path).includes(normalizedQuery) ||
        normalizeForMatch(note.markdown).includes(normalizedQuery);

      const matchesTags =
        options.selectedTagSlugs.length === 0 ||
        options.selectedTagSlugs.every((tag) => note.tags.includes(tag));

      const matchesFolder = !scopedPaths || scopedPaths.has(note.folderPath);

      return matchesQuery && matchesTags && matchesFolder;
    });
  },
  async syncNotes(vault: NeuralVault, notePaths: string[]) {
    const uniquePaths = Array.from(new Set(notePaths));
    const syncTargets = vault.notes.filter((note) => uniquePaths.includes(note.path));

    await Promise.allSettled(
      syncTargets.map(async (note) => {
        await fetch("/api/obsidian", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "write",
            path: `${OBSIDIAN_SYNC_ROOT}/${note.path}`,
            content: note.markdown,
          }),
        });
      }),
    );
  },
};
