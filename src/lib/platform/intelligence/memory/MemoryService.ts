/**
 * Application-facing MemoryService — Sprint 204.
 */

import {
  createMemoryRecord,
  getMemoryRecord,
  listMemoryRecords,
  runMemoryEngine,
} from "./MemoryEngine";
import {
  buildSimilarSituationViews,
  type MemoryInsight,
  type SimilarSituationView,
} from "./MemoryInsights";
import type { MemoryPattern } from "./MemoryPattern";
import { MemoryRegistry } from "./MemoryRegistry";
import type {
  MemoryCreateInput,
  MemoryLesson,
  MemoryRecord,
} from "./MemoryRecord";
import type { MemorySearchFilters } from "./MemorySearch";
import type { MemorySimilarityQuery } from "./MemorySimilarity";
import type { MemoryTimeline } from "./MemoryTimeline";
import { recordMemoryObservation } from "./observability";

export type MemoryServiceSearchResult = {
  readonly records: readonly MemoryRecord[];
  readonly patterns: readonly MemoryPattern[];
  readonly insights: readonly MemoryInsight[];
  readonly timeline: MemoryTimeline;
  readonly observationId: string;
  readonly durationMs: number;
};

let obsSeq = 0;

export const MemoryService = {
  registry: MemoryRegistry,

  create(input: MemoryCreateInput): MemoryRecord {
    const started = Date.now();
    const record = createMemoryRecord(input);
    const observationId = `mobs-${++obsSeq}-${Date.now()}`;
    recordMemoryObservation({
      id: observationId,
      kind: "memory_created",
      organizationId: record.organizationId,
      at: new Date().toISOString(),
      durationMs: Date.now() - started,
      detail: `Created ${record.type} memory: ${record.title}`,
      memoryIds: [record.id],
      metadata: { type: record.type, outcome: record.outcome },
    });
    return record;
  },

  recordLesson(input: {
    readonly organizationId: string;
    readonly organizationName: string;
    readonly title: string;
    readonly description: string;
    readonly lesson: MemoryLesson;
    readonly relatedDecisionIds?: readonly string[];
    readonly tags?: readonly string[];
    readonly confidence?: number;
    readonly createdBy: string;
  }): MemoryRecord {
    return this.create({
      type: "lesson_learned",
      organizationId: input.organizationId,
      organizationName: input.organizationName,
      title: input.title,
      description: input.description,
      lesson: input.lesson,
      relatedDecisionIds: input.relatedDecisionIds,
      tags: input.tags ?? ["lesson"],
      confidence: input.confidence ?? 0.75,
      outcome: "mixed",
      outcomeSummary: [
        ...input.lesson.whatWorked.map((x) => `Worked: ${x}`),
        ...input.lesson.whatFailed.map((x) => `Failed: ${x}`),
      ]
        .slice(0, 4)
        .join(" · "),
      createdBy: input.createdBy,
    });
  },

  get(id: string): MemoryRecord | null {
    const started = Date.now();
    const record = getMemoryRecord(id);
    if (record) {
      recordMemoryObservation({
        id: `mobs-${++obsSeq}-${Date.now()}`,
        kind: "memory_retrieval",
        organizationId: record.organizationId,
        at: new Date().toISOString(),
        durationMs: Date.now() - started,
        detail: `Retrieved memory ${record.id}`,
        memoryIds: [record.id],
      });
    }
    return record;
  },

  list(organizationId?: string): readonly MemoryRecord[] {
    const all = listMemoryRecords();
    return organizationId
      ? all.filter((r) => r.organizationId === organizationId)
      : all;
  },

  search(
    organizationId: string,
    filters: MemorySearchFilters = {}
  ): MemoryServiceSearchResult {
    const started = Date.now();
    const run = runMemoryEngine({
      organizationId,
      search: filters,
    });
    const observationId = `mobs-${++obsSeq}-${Date.now()}`;
    recordMemoryObservation({
      id: observationId,
      kind: "memory_retrieval",
      organizationId,
      at: new Date().toISOString(),
      durationMs: Date.now() - started,
      detail: `Search returned ${run.records.length} memories, ${run.patterns.length} pattern(s).`,
      memoryIds: run.records.slice(0, 20).map((r) => r.id),
      metadata: { q: filters.q ?? "", type: String(filters.type ?? "all") },
    });
    recordMemoryObservation({
      id: `mobs-${++obsSeq}-${Date.now()}`,
      kind: "pattern_detection",
      organizationId,
      at: new Date().toISOString(),
      durationMs: run.durationMs,
      detail: `Detected ${run.patterns.length} advisory pattern(s).`,
      memoryIds: run.patterns.flatMap((p) => p.memoryIds).slice(0, 20),
    });
    return {
      records: run.records,
      patterns: run.patterns,
      insights: run.insights,
      timeline: run.timeline,
      observationId,
      durationMs: Date.now() - started,
    };
  },

  similarSituations(
    query: MemorySimilarityQuery,
    limit = 5
  ): {
    readonly situations: readonly SimilarSituationView[];
    readonly observationId: string;
    readonly durationMs: number;
  } {
    const started = Date.now();
    const run = runMemoryEngine({
      organizationId: query.organizationId,
      similarTo: query,
      similarLimit: limit,
    });
    const observationId = `mobs-${++obsSeq}-${Date.now()}`;
    recordMemoryObservation({
      id: observationId,
      kind: "similarity_search",
      organizationId: query.organizationId,
      at: new Date().toISOString(),
      durationMs: Date.now() - started,
      detail: `Similarity search returned ${run.similar.length} situation(s).`,
      memoryIds: run.similar.map((h) => h.memory.id),
      metadata: { title: query.title ?? "" },
    });
    return {
      situations: buildSimilarSituationViews(
        run.similar,
        query.organizationId
      ),
      observationId,
      durationMs: Date.now() - started,
    };
  },
} as const;
