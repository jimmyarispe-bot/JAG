/**
 * Organizational Memory loaders for Command Center — Sprint 204.
 */

import {
  MemoryService,
  MEMORY_TYPES,
  type MemoryLesson,
  type MemoryRecord,
  type MemorySearchFilters,
  type MemoryType,
  type SimilarSituationView,
  listMemoryObservations,
} from "@/lib/platform/intelligence/memory/index";
import { listOrganizationsForSession } from "@/lib/jag-business/organizations-view";
import { resolveActiveWorkspaceOrganization } from "@/lib/jag-platform/active-organization";
import type { JagPlatformSession } from "@/lib/jag-platform/session";
import { recordJagAuditEvent } from "../audit/store";

export { listMemoryObservations };

export type JagMemoryWorkspaceModel = {
  readonly organizationId: string | null;
  readonly organizationName: string | null;
  readonly organizations: readonly { id: string; label: string }[];
  readonly records: readonly MemoryRecord[];
  readonly selected: MemoryRecord | null;
  readonly patterns: readonly {
    id: string;
    label: string;
    summary: string;
    occurrenceCount: number;
    confidence: number;
  }[];
  readonly insights: readonly {
    id: string;
    title: string;
    detail: string;
    confidence: number;
  }[];
  readonly timeline: readonly {
    memoryId: string;
    at: string;
    type: string;
    title: string;
    outcome: string;
    summary: string;
  }[];
  readonly filters: MemorySearchFilters;
  readonly types: readonly MemoryType[];
  readonly advisoryNotice: string;
  readonly explanation: string;
};

export function loadMemoryWorkspace(
  session: JagPlatformSession,
  options?: MemorySearchFilters & { memoryId?: string }
): JagMemoryWorkspaceModel {
  const orgs = listOrganizationsForSession(session);
  const org = resolveActiveWorkspaceOrganization(session, options?.organizationId);

  const advisoryNotice =
    "Institutional memory — organizational experience, not chat history. Patterns are advisory.";

  if (!org) {
    return {
      organizationId: null,
      organizationName: null,
      organizations: [],
      records: [],
      selected: null,
      patterns: [],
      insights: [],
      timeline: [],
      filters: options ?? {},
      types: MEMORY_TYPES,
      advisoryNotice,
      explanation: "Select an organization to browse institutional memory.",
    };
  }

  const result = MemoryService.search(org.id, {
    ...options,
    organizationId: org.id,
  });

  const selected = options?.memoryId
    ? MemoryService.get(options.memoryId)
    : null;

  return {
    organizationId: org.id,
    organizationName: org.name,
    organizations: orgs.map((o) => ({ id: o.id, label: o.name })),
    records: result.records,
    selected:
      selected && selected.organizationId === org.id ? selected : null,
    patterns: result.patterns.map((p) => ({
      id: p.id,
      label: p.label,
      summary: p.summary,
      occurrenceCount: p.occurrenceCount,
      confidence: p.confidence,
    })),
    insights: result.insights.map((i) => ({
      id: i.id,
      title: i.title,
      detail: i.detail,
      confidence: i.confidence,
    })),
    timeline: result.timeline.entries,
    filters: { ...options, organizationId: org.id },
    types: MEMORY_TYPES,
    advisoryNotice,
    explanation: `${result.records.length} memories · ${result.patterns.length} advisory pattern(s) · ${result.durationMs}ms`,
  };
}

export function loadSimilarSituations(input: {
  readonly organizationId: string;
  readonly title: string;
  readonly description?: string;
  readonly tags?: readonly string[];
  readonly type?: string;
  readonly decisionId?: string;
  readonly contributorIds?: readonly string[];
  readonly limit?: number;
}): readonly SimilarSituationView[] {
  return MemoryService.similarSituations(
    {
      organizationId: input.organizationId,
      title: input.title,
      description: input.description,
      tags: input.tags,
      type: input.type,
      decisionId: input.decisionId,
      contributorIds: input.contributorIds,
    },
    input.limit ?? 5
  ).situations;
}

export function recordDecisionOutcomeMemory(input: {
  readonly session: JagPlatformSession;
  readonly organizationId: string;
  readonly organizationName: string;
  readonly decisionId: string;
  readonly decisionTitle: string;
  readonly contributorId?: string;
  readonly result: "success" | "failure";
  readonly expectedOutcome: string;
  readonly actualOutcome: string;
  readonly lessonsLearned: string;
  readonly confidence: number;
}): MemoryRecord {
  const record = MemoryService.create({
    type: "outcome",
    organizationId: input.organizationId,
    organizationName: input.organizationName,
    title: `Outcome: ${input.decisionTitle}`,
    description: `Expected: ${input.expectedOutcome}. Actual: ${input.actualOutcome}`,
    outcome: input.result === "success" ? "success" : "failure",
    outcomeSummary: input.actualOutcome,
    confidence: input.confidence,
    relatedDecisionIds: [input.decisionId],
    relatedContributorIds: input.contributorId ? [input.contributorId] : [],
    tags: ["decision", "outcome", input.result],
    lesson: input.lessonsLearned
      ? {
          whatWorked:
            input.result === "success" ? [input.lessonsLearned] : [],
          whatFailed:
            input.result === "failure" ? [input.lessonsLearned] : [],
          unexpectedOutcomes: [],
          recommendations: [input.lessonsLearned],
        }
      : undefined,
    evidence: [
      {
        id: `ev-outcome-${input.decisionId}`,
        source: "Decision Center",
        summary: input.actualOutcome,
      },
    ],
    createdBy: input.session.displayName,
  });

  recordJagAuditEvent({
    action: "memory_created",
    actorUserId: input.session.userId,
    actorLabel: input.session.displayName,
    organizationId: input.organizationId,
    decisionId: input.decisionId,
    detail: `Institutional memory recorded for outcome of ${input.decisionTitle}`,
    metadata: { memoryId: record.id, result: input.result },
  });

  return record;
}

export function recordLessonLearnedMemory(input: {
  readonly session: JagPlatformSession;
  readonly organizationId: string;
  readonly organizationName: string;
  readonly title: string;
  readonly description: string;
  readonly lesson: MemoryLesson;
  readonly relatedDecisionIds?: readonly string[];
  readonly tags?: readonly string[];
}): MemoryRecord {
  const record = MemoryService.recordLesson({
    organizationId: input.organizationId,
    organizationName: input.organizationName,
    title: input.title,
    description: input.description,
    lesson: input.lesson,
    relatedDecisionIds: input.relatedDecisionIds,
    tags: input.tags,
    createdBy: input.session.displayName,
  });

  recordJagAuditEvent({
    action: "memory_created",
    actorUserId: input.session.userId,
    actorLabel: input.session.displayName,
    organizationId: input.organizationId,
    detail: `Lesson learned: ${input.title}`,
    metadata: { memoryId: record.id },
  });

  return record;
}

export function runHistoricalContextForBriefing(input: {
  readonly organizationId: string;
  readonly organizationName: string;
}): {
  readonly situations: readonly SimilarSituationView[];
  readonly lessons: readonly MemoryRecord[];
  readonly patternSummaries: readonly string[];
} {
  const search = MemoryService.search(input.organizationId, {});
  const situations = MemoryService.similarSituations(
    {
      organizationId: input.organizationId,
      title: `${input.organizationName} executive review`,
      description: "weekly briefing historical context",
      tags: ["decision", "outcome", "lesson"],
    },
    5
  ).situations;

  return {
    situations,
    lessons: search.records
      .filter((r) => r.type === "lesson_learned" || r.lesson)
      .slice(0, 5),
    patternSummaries: search.patterns.slice(0, 4).map((p) => p.summary),
  };
}
