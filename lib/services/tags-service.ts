import type { NeuralNote, NeuralTag } from "@/lib/types";
import { classificationService } from "@/lib/services/classification-service";

const TAG_TONES: NeuralTag["tone"][] = ["brand", "emerald", "sky", "amber", "rose"];

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

function parseMarkdownTags(markdown: string) {
  const matches = markdown.match(/(^|\s)#([a-z0-9/_-]+)/gi) || [];
  return matches.map((match) => match.trim().replace(/^#/, "").replace(/^\s+#/, ""));
}

function parseWikiLinks(markdown: string) {
  const linkMatches = markdown.match(/\[\[([^\]]+)\]\]/g) || [];
  return unique(
    linkMatches
      .map((match) => match.replace("[[", "").replace("]]", "").trim())
      .filter(Boolean),
  );
}

export const tagsService = {
  parseMarkdownTags,
  parseWikiLinks,
  collectTags(notes: NeuralNote[]): NeuralTag[] {
    const counts = new Map<string, number>();

    for (const note of notes) {
      for (const tag of note.tags) {
        const slug = classificationService.slugify(tag);
        counts.set(slug, (counts.get(slug) || 0) + 1);
      }
    }

    return Array.from(counts.entries())
      .sort((first, second) => second[1] - first[1] || first[0].localeCompare(second[0]))
      .map(([slug, count], index) => ({
        id: slug,
        slug,
        label: slug.replace(/-/g, " "),
        count,
        tone: TAG_TONES[index % TAG_TONES.length],
      }));
  },
  mergeTags(...groups: string[][]) {
    return unique(
      groups
        .flat()
        .map((tag) => classificationService.slugify(tag))
        .filter(Boolean),
    );
  },
  toneClasses(tone: NeuralTag["tone"]) {
    switch (tone) {
      case "emerald":
        return "border-emerald-400/25 bg-emerald-400/10 text-emerald-200";
      case "sky":
        return "border-sky-400/25 bg-sky-400/10 text-sky-200";
      case "amber":
        return "border-amber-400/25 bg-amber-400/10 text-amber-200";
      case "rose":
        return "border-rose-400/25 bg-rose-400/10 text-rose-200";
      default:
        return "border-[hsl(var(--brand)/0.2)] bg-[hsl(var(--brand)/0.12)] text-brand";
    }
  },
};

