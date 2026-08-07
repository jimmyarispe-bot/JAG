/**
 * Slice 2.2 — pure authoring helpers (no DB).
 * Sections live in instrument_version.metadata.sections (jsonb).
 * Question UX fields live in listening_questions.config (jsonb).
 */

import type { ListeningQuestionType } from "./types";
import { LISTENING_V1_QUESTION_TYPES } from "./types";

export type ListeningSection = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly displayOrder: number;
};

export type ListeningQuestionConfig = {
  readonly sectionId?: string | null;
  /** Denormalized for public RPC (version metadata is not returned). */
  readonly sectionTitle?: string | null;
  readonly sectionDescription?: string | null;
  readonly placeholder?: string;
  readonly defaultValue?: string | number | null;
  readonly min?: number | null;
  readonly max?: number | null;
  readonly step?: number | null;
  readonly likertLowLabel?: string;
  readonly likertHighLabel?: string;
};

export type ListeningAuthoringQuestion = {
  readonly id: string;
  readonly prompt: string;
  readonly help_text: string;
  readonly required: boolean;
  readonly question_type: string;
  readonly display_order: number;
  readonly config?: Record<string, unknown> | null;
  readonly options: readonly {
    readonly id: string;
    readonly label: string;
    readonly option_key: string;
    readonly value_numeric?: number | null;
  }[];
};

const SECONDS_PER_QUESTION: Record<string, number> = {
  short_text: 20,
  long_text: 45,
  single_choice: 12,
  multi_choice: 18,
  likert: 10,
  numeric: 12,
};

export function newListeningSectionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `sec_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function parseListeningSections(
  metadata: unknown
): ListeningSection[] {
  if (!metadata || typeof metadata !== "object") return [];
  const raw = (metadata as { sections?: unknown }).sections;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row, index) => {
      if (!row || typeof row !== "object") return null;
      const r = row as Record<string, unknown>;
      const id = String(r.id ?? "").trim();
      const title = String(r.title ?? "").trim();
      if (!id || !title) return null;
      return {
        id,
        title,
        description: String(r.description ?? ""),
        displayOrder: Number(r.displayOrder ?? r.display_order ?? index + 1) || index + 1,
      } satisfies ListeningSection;
    })
    .filter((s): s is ListeningSection => s != null)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

export function serializeListeningSections(
  sections: readonly ListeningSection[]
): { sections: ListeningSection[] } {
  return {
    sections: sections.map((s, i) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      displayOrder: i + 1,
    })),
  };
}

export function parseQuestionConfig(
  config: unknown
): ListeningQuestionConfig {
  if (!config || typeof config !== "object") return {};
  const c = config as Record<string, unknown>;
  return {
    sectionId:
      c.sectionId === null || c.sectionId === undefined
        ? null
        : String(c.sectionId),
    placeholder:
      c.placeholder === undefined || c.placeholder === null
        ? undefined
        : String(c.placeholder),
    defaultValue:
      c.defaultValue === undefined
        ? null
        : (c.defaultValue as string | number | null),
    min: c.min === undefined || c.min === null ? null : Number(c.min),
    max: c.max === undefined || c.max === null ? null : Number(c.max),
    step: c.step === undefined || c.step === null ? null : Number(c.step),
    likertLowLabel:
      c.likertLowLabel === undefined
        ? undefined
        : String(c.likertLowLabel),
    likertHighLabel:
      c.likertHighLabel === undefined
        ? undefined
        : String(c.likertHighLabel),
  };
}

export function mergeQuestionConfig(
  existing: unknown,
  patch: ListeningQuestionConfig
): Record<string, unknown> {
  const base =
    existing && typeof existing === "object"
      ? { ...(existing as Record<string, unknown>) }
      : {};
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    base[key] = value;
  }
  return base;
}

export function validateQuestionDraft(input: {
  readonly prompt: string;
  readonly questionType: string;
  readonly options?: readonly { label: string }[];
  readonly config?: ListeningQuestionConfig;
}): { ok: true } | { ok: false; error: string } {
  const prompt = input.prompt.trim();
  if (!prompt) return { ok: false, error: "Question title is required." };
  if (
    !(LISTENING_V1_QUESTION_TYPES as readonly string[]).includes(
      input.questionType
    )
  ) {
    return { ok: false, error: "Unsupported question type." };
  }
  const choiceTypes = new Set(["single_choice", "multi_choice", "likert"]);
  if (choiceTypes.has(input.questionType)) {
    const labels = (input.options ?? [])
      .map((o) => o.label.trim())
      .filter(Boolean);
    if (labels.length < 2) {
      return {
        ok: false,
        error: "Choice and Likert questions need at least two options.",
      };
    }
  }
  const cfg = input.config ?? {};
  if (input.questionType === "numeric") {
    if (
      cfg.min != null &&
      cfg.max != null &&
      !Number.isNaN(cfg.min) &&
      !Number.isNaN(cfg.max) &&
      cfg.min > cfg.max
    ) {
      return { ok: false, error: "Minimum cannot exceed maximum." };
    }
  }
  return { ok: true };
}

/** Rough completion estimate for publish confirmation. */
export function estimateCompletionMinutes(
  questions: readonly { question_type: string }[]
): number {
  if (questions.length === 0) return 0;
  const seconds = questions.reduce((sum, q) => {
    return sum + (SECONDS_PER_QUESTION[q.question_type] ?? 15);
  }, 0);
  return Math.max(1, Math.ceil(seconds / 60));
}

export function moveIdInOrder(
  orderedIds: readonly string[],
  id: string,
  direction: "up" | "down"
): string[] {
  const next = [...orderedIds];
  const index = next.indexOf(id);
  if (index < 0) return next;
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= next.length) return next;
  const tmp = next[index]!;
  next[index] = next[swapWith]!;
  next[swapWith] = tmp;
  return next;
}

export function reorderSections(
  sections: readonly ListeningSection[],
  sectionId: string,
  direction: "up" | "down"
): ListeningSection[] {
  const ordered = [...sections].sort((a, b) => a.displayOrder - b.displayOrder);
  const ids = ordered.map((s) => s.id);
  const nextIds = moveIdInOrder(ids, sectionId, direction);
  return nextIds.map((id, i) => {
    const s = ordered.find((x) => x.id === id)!;
    return { ...s, displayOrder: i + 1 };
  });
}

export function groupQuestionsBySection(
  sections: readonly ListeningSection[],
  questions: readonly ListeningAuthoringQuestion[]
): {
  readonly sections: readonly {
    readonly section: ListeningSection | null;
    readonly questions: ListeningAuthoringQuestion[];
  }[];
} {
  const orderedSections = [...sections].sort(
    (a, b) => a.displayOrder - b.displayOrder
  );
  const orderedQuestions = [...questions].sort(
    (a, b) => a.display_order - b.display_order
  );
  const bySection = new Map<string, ListeningAuthoringQuestion[]>();
  const ungrouped: ListeningAuthoringQuestion[] = [];

  for (const q of orderedQuestions) {
    const cfg = parseQuestionConfig(q.config);
    const sid = cfg.sectionId;
    if (sid && orderedSections.some((s) => s.id === sid)) {
      const list = bySection.get(sid) ?? [];
      list.push(q);
      bySection.set(sid, list);
    } else {
      ungrouped.push(q);
    }
  }

  const blocks: {
    section: ListeningSection | null;
    questions: ListeningAuthoringQuestion[];
  }[] = [];

  if (ungrouped.length > 0 || orderedSections.length === 0) {
    blocks.push({ section: null, questions: ungrouped });
  }
  for (const section of orderedSections) {
    blocks.push({
      section,
      questions: bySection.get(section.id) ?? [],
    });
  }
  return { sections: blocks };
}

export function buildSurveyPreviewModel(input: {
  readonly title: string;
  readonly introduction?: string;
  readonly sections: readonly ListeningSection[];
  readonly questions: readonly ListeningAuthoringQuestion[];
}) {
  const grouped = groupQuestionsBySection(input.sections, input.questions);
  let number = 0;
  const blocks = grouped.sections.map((block) => ({
    section: block.section,
    questions: block.questions.map((q) => {
      number += 1;
      return {
        number,
        id: q.id,
        prompt: q.prompt,
        helpText: q.help_text,
        required: q.required,
        questionType: q.question_type as ListeningQuestionType,
        config: parseQuestionConfig(q.config),
        options: q.options.map((o) => ({
          id: o.id,
          label: o.label,
          optionKey: o.option_key,
        })),
      };
    }),
  }));

  return {
    title: input.title,
    introduction: input.introduction ?? "",
    questionCount: number,
    estimatedMinutes: estimateCompletionMinutes(input.questions),
    blocks,
  };
}

export const LISTENING_EMPTY_COPY = {
  initiatives: {
    title: "No listening initiatives yet",
    description:
      "Start with an initiative — the program that owns instruments, versions, and campaigns for this organization.",
    action: "Create initiative",
  },
  instruments: {
    title: "No instruments yet",
    description:
      "Create an instrument to begin drafting questions. Each instrument can have draft and published versions.",
    action: "Create instrument",
  },
  versions: {
    title: "No versions yet",
    description:
      "Create a draft version to open the question builder. Published versions stay immutable.",
    action: "New draft version",
  },
  campaigns: {
    title: "No campaigns yet",
    description:
      "Publish a version first, then open a campaign to generate a public listening link.",
    action: "Open version to publish",
  },
  questions: {
    title: "No questions yet",
    description:
      "Add your first question, optionally group into sections, then preview before publishing.",
    action: "Add question",
  },
} as const;
