/**
 * MemoryEngine — store, pattern, similarity orchestration.
 */

import { buildMemoryInsights, type MemoryInsight } from "./MemoryInsights";
import { detectMemoryPatterns, type MemoryPattern } from "./MemoryPattern";
import type { MemoryCreateInput, MemoryRecord } from "./MemoryRecord";
import { searchMemories, type MemorySearchFilters } from "./MemorySearch";
import {
  findSimilarMemories,
  type MemorySimilarityHit,
  type MemorySimilarityQuery,
} from "./MemorySimilarity";
import { buildMemoryTimeline, type MemoryTimeline } from "./MemoryTimeline";

const ADVISORY =
  "Institutional memory — organizational experience, not chat history. Advisory when used for future recommendations.";

let seq = 0;
const records: MemoryRecord[] = [];

export function resetMemoryEngineForTests(): void {
  records.length = 0;
  seq = 0;
}

export function listMemoryRecords(): readonly MemoryRecord[] {
  return records;
}

export function getMemoryRecord(id: string): MemoryRecord | null {
  return records.find((r) => r.id === id) ?? null;
}

export function createMemoryRecord(input: MemoryCreateInput): MemoryRecord {
  const now = new Date().toISOString();
  const record: MemoryRecord = {
    id: `mem-${++seq}-${Date.now()}`,
    type: input.type,
    organizationId: input.organizationId,
    organizationName: input.organizationName,
    date: input.date ?? now.slice(0, 10),
    title: input.title.trim(),
    description: input.description.trim(),
    evidence: input.evidence ?? [],
    outcome: input.outcome ?? "unknown",
    outcomeSummary: input.outcomeSummary,
    confidence: Math.max(0, Math.min(1, input.confidence ?? 0.6)),
    relatedDecisionIds: input.relatedDecisionIds ?? [],
    relatedForecastIds: input.relatedForecastIds ?? [],
    relatedScenarioIds: input.relatedScenarioIds ?? [],
    relatedContributorIds: input.relatedContributorIds ?? [],
    relatedPolicyIds: input.relatedPolicyIds ?? [],
    relatedGoalIds: input.relatedGoalIds ?? [],
    tags: input.tags ?? [],
    lesson: input.lesson,
    createdAt: now,
    createdBy: input.createdBy,
    advisoryNotice: ADVISORY,
  };
  records.unshift(record);
  return record;
}

export function runMemoryEngine(options: {
  readonly organizationId: string;
  readonly search?: MemorySearchFilters;
  readonly similarTo?: MemorySimilarityQuery;
  readonly similarLimit?: number;
}): {
  readonly records: readonly MemoryRecord[];
  readonly patterns: readonly MemoryPattern[];
  readonly insights: readonly MemoryInsight[];
  readonly timeline: MemoryTimeline;
  readonly similar: readonly MemorySimilarityHit[];
  readonly durationMs: number;
} {
  const started = Date.now();
  const orgRecords = records.filter(
    (r) => r.organizationId === options.organizationId
  );
  const filtered = options.search
    ? searchMemories(orgRecords, {
        ...options.search,
        organizationId: options.organizationId,
      })
    : orgRecords;
  const patterns = detectMemoryPatterns(options.organizationId, orgRecords);
  const insights = buildMemoryInsights(
    options.organizationId,
    orgRecords,
    patterns
  );
  const timeline = buildMemoryTimeline(options.organizationId, orgRecords);
  const similar = options.similarTo
    ? findSimilarMemories(
        { ...options.similarTo, organizationId: options.organizationId },
        orgRecords,
        options.similarLimit ?? 5
      )
    : [];

  return {
    records: filtered,
    patterns,
    insights,
    timeline,
    similar,
    durationMs: Date.now() - started,
  };
}
