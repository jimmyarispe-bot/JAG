/**
 * Insights over institutional memory — Sprint 204.
 */

import { detectMemoryPatterns, type MemoryPattern } from "./MemoryPattern";
import type { MemoryRecord } from "./MemoryRecord";
import type { MemorySimilarityHit } from "./MemorySimilarity";

export type MemoryInsight = {
  readonly id: string;
  readonly kind:
    | "pattern"
    | "best_intervention"
    | "recurrence"
    | "lesson"
    | "thin_memory";
  readonly title: string;
  readonly detail: string;
  readonly confidence: number;
  readonly memoryIds: readonly string[];
  readonly advisoryNotice: string;
};

export type SimilarSituationView = {
  readonly memoryId: string;
  readonly title: string;
  readonly date: string;
  readonly outcome: string;
  readonly outcomeSummary: string;
  readonly lessons: readonly string[];
  readonly confidence: number;
  readonly similarityScore: number;
  readonly href: string;
};

export function buildSimilarSituationViews(
  hits: readonly MemorySimilarityHit[],
  organizationId: string
): readonly SimilarSituationView[] {
  return hits.map((h) => {
    const lesson = h.memory.lesson;
    const lessons = [
      ...(lesson?.whatWorked.map((x) => `Worked: ${x}`) ?? []),
      ...(lesson?.whatFailed.map((x) => `Failed: ${x}`) ?? []),
      ...(lesson?.recommendations.map((x) => `Recommend: ${x}`) ?? []),
    ].slice(0, 4);
    return {
      memoryId: h.memory.id,
      title: h.memory.title,
      date: h.memory.date,
      outcome: h.memory.outcome,
      outcomeSummary: h.memory.outcomeSummary ?? h.memory.description.slice(0, 160),
      lessons:
        lessons.length > 0
          ? lessons
          : ["No structured lesson recorded for this situation."],
      confidence: h.memory.confidence,
      similarityScore: h.score,
      href: `/jag/memory?org=${encodeURIComponent(organizationId)}&id=${encodeURIComponent(h.memory.id)}`,
    };
  });
}

export function buildMemoryInsights(
  organizationId: string,
  records: readonly MemoryRecord[],
  patterns?: readonly MemoryPattern[]
): readonly MemoryInsight[] {
  const orgRecords = records.filter((r) => r.organizationId === organizationId);
  const pats = patterns ?? detectMemoryPatterns(organizationId, orgRecords);
  const insights: MemoryInsight[] = [];

  if (orgRecords.length === 0) {
    return [
      {
        id: `ins-thin-${organizationId}`,
        kind: "thin_memory",
        title: "Thin institutional memory",
        detail:
          "No organizational memories recorded yet. Outcomes and lessons will appear here as decisions complete.",
        confidence: 0,
        memoryIds: [],
        advisoryNotice: "Advisory — not a performance judgment.",
      },
    ];
  }

  for (const p of pats.slice(0, 4)) {
    insights.push({
      id: `ins-${p.id}`,
      kind: "pattern",
      title: p.label,
      detail: p.summary,
      confidence: p.confidence,
      memoryIds: p.memoryIds,
      advisoryNotice: p.advisoryNotice,
    });
  }

  const successes = orgRecords.filter((r) => r.outcome === "success");
  if (successes.length > 0) {
    const best = successes
      .slice()
      .sort((a, b) => b.confidence - a.confidence)[0]!;
    insights.push({
      id: `ins-best-${best.id}`,
      kind: "best_intervention",
      title: "Highest-confidence successful intervention",
      detail: `${best.title} (${best.date}) — ${best.outcomeSummary ?? best.description}`,
      confidence: best.confidence,
      memoryIds: [best.id],
      advisoryNotice: "Advisory reference — context may differ.",
    });
  }

  const lessons = orgRecords.filter((r) => r.type === "lesson_learned" || r.lesson);
  for (const l of lessons.slice(0, 3)) {
    insights.push({
      id: `ins-lesson-${l.id}`,
      kind: "lesson",
      title: l.title,
      detail: l.outcomeSummary ?? l.description,
      confidence: l.confidence,
      memoryIds: [l.id],
      advisoryNotice: "Lesson learned from institutional experience.",
    });
  }

  return insights;
}
