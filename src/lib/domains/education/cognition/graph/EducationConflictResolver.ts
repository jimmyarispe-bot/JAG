/**
 * Detect and reconcile conflicting / duplicate recommendations.
 */

import type { EducationRecommendation } from "../framework";
import { createEducationTrace } from "../framework";
import type { EducationGraphContributorInput } from "./EducationGraphContext";
import type {
  EducationGraphConflict,
  EducationGraphRecommendation,
} from "./EducationGraphResult";
import type { EducationGraphNodeKind } from "./EducationGraphNode";

export interface SourcedRecommendation {
  recommendation: EducationRecommendation;
  contributorId: string;
  nodeKind: EducationGraphNodeKind;
}

/** Known contradictory kind pairs (either order). */
const CONTRADICTIONS: ReadonlyArray<readonly [string, string]> = [
  ["approve_enrollment", "hold_pending_documents"],
  ["approve_enrollment", "waitlist"],
  ["recognize_perfect_attendance", "recommend_intervention"],
  ["recognize_improvement", "recommend_intervention"],
  ["continue_monitoring", "recommend_intervention"],
];

function isContradiction(a: string, b: string): boolean {
  return CONTRADICTIONS.some(
    ([x, y]) => (a === x && b === y) || (a === y && b === x)
  );
}

/** Prefer blocking / warning kinds over approval / recognition when conflicting. */
function severityScore(kind: string): number {
  if (
    kind.includes("hold") ||
    kind.includes("waitlist") ||
    kind.includes("intervention") ||
    kind.includes("escalate")
  ) {
    return 3;
  }
  if (
    kind.includes("notify") ||
    kind.includes("schedule") ||
    kind.includes("review")
  ) {
    return 2;
  }
  if (
    kind.includes("recognize") ||
    kind.includes("approve") ||
    kind.includes("monitor")
  ) {
    return 1;
  }
  return 2;
}

export interface ConflictResolutionResult {
  recommendations: EducationGraphRecommendation[];
  conflicts: EducationGraphConflict[];
}

export function resolveEducationRecommendationConflicts(
  sourced: readonly SourcedRecommendation[]
): ConflictResolutionResult {
  const conflicts: EducationGraphConflict[] = [];
  const byKind = new Map<string, SourcedRecommendation[]>();

  for (const item of sourced) {
    const list = byKind.get(item.recommendation.kind) ?? [];
    list.push(item);
    byKind.set(item.recommendation.kind, list);
  }

  let merged: EducationGraphRecommendation[] = [];

  for (const [kind, group] of byKind) {
    if (group.length === 1) {
      merged.push(toGraphRecommendation(group[0]!, []));
      continue;
    }

    const contributorIds = [...new Set(group.map((g) => g.contributorId))];
    conflicts.push({
      id: `conflict.duplicate.${kind}`,
      kind: "duplicate_recommendations",
      summary: `Duplicate recommendation kind "${kind}" from ${contributorIds.join(", ")}`,
      recommendationIds: group.map((g) => g.recommendation.id),
      contributorIds,
    });

    const priorities = new Set(group.map((g) => g.recommendation.priority));
    if (priorities.size > 1) {
      conflicts.push({
        id: `conflict.priority.${kind}`,
        kind: "contradictory_priorities",
        summary: `Contradictory priorities for "${kind}": ${[...priorities].join(", ")}`,
        recommendationIds: group.map((g) => g.recommendation.id),
        contributorIds,
      });
    }

    merged.push(mergeSameKind(group, ["duplicate_recommendations"]));
  }

  const suppressed = new Set<string>();

  for (let i = 0; i < merged.length; i++) {
    for (let j = i + 1; j < merged.length; j++) {
      const a = merged[i]!;
      const b = merged[j]!;
      if (suppressed.has(a.id) || suppressed.has(b.id)) continue;
      if (!isContradiction(a.kind, b.kind)) continue;

      conflicts.push({
        id: `conflict.kinds.${a.kind}.${b.kind}`,
        kind: "conflicting_recommendations",
        summary: `Conflicting recommendations: "${a.title}" vs "${b.title}"`,
        recommendationIds: [a.id, b.id],
        contributorIds: [
          ...new Set([...a.originContributorIds, ...b.originContributorIds]),
        ],
      });

      const keepA = preferRecommendation(a, b);
      const winner = keepA ? a : b;
      const loser = keepA ? b : a;
      suppressed.add(loser.id);

      const idx = keepA ? i : j;
      merged[idx] = {
        ...winner,
        conflictFlags: [
          ...new Set([
            ...winner.conflictFlags,
            "conflicting_recommendations",
          ]),
        ],
        attributes: {
          ...winner.attributes,
          suppressedRecommendationId: loser.id,
        },
      };
    }
  }

  return {
    recommendations: merged.filter((r) => !suppressed.has(r.id)),
    conflicts,
  };
}

function mergeSameKind(
  group: SourcedRecommendation[],
  flags: string[]
): EducationGraphRecommendation {
  const sorted = [...group].sort(
    (a, b) =>
      a.recommendation.priority - b.recommendation.priority ||
      b.recommendation.confidence - a.recommendation.confidence
  );
  const winner = sorted[0]!;
  const origins = [...new Set(group.map((g) => g.contributorId))];
  const nodeKinds = [...new Set(group.map((g) => g.nodeKind))];
  const evidenceIds = [
    ...new Set(group.flatMap((g) => g.recommendation.evidenceIds)),
  ];
  const actions = flattenActions(group.map((g) => g.recommendation));
  const confidence = Math.max(
    ...group.map((g) => g.recommendation.confidence)
  );
  const priority = Math.min(...group.map((g) => g.recommendation.priority));

  return {
    id: winner.recommendation.id,
    kind: winner.recommendation.kind,
    title: winner.recommendation.title,
    explanation: winner.recommendation.explanation,
    confidence,
    priority,
    evidenceIds,
    suggestedActions: actions,
    originContributorIds: origins.sort(),
    originNodeKinds: nodeKinds.sort(),
    constitutionalTrace: createEducationTrace({
      contributorId: origins.length === 1 ? origins[0]! : "education.graph",
      rationale: winner.recommendation.explanation,
    }),
    conflictFlags: flags,
    attributes: {
      ...winner.recommendation.attributes,
      mergedFrom: group.map((g) => g.recommendation.id),
      originContributorIds: origins,
    },
  };
}

function toGraphRecommendation(
  item: SourcedRecommendation,
  flags: string[]
): EducationGraphRecommendation {
  const origins = [item.contributorId];
  return {
    id: item.recommendation.id,
    kind: item.recommendation.kind,
    title: item.recommendation.title,
    explanation: item.recommendation.explanation,
    confidence: item.recommendation.confidence,
    priority: item.recommendation.priority,
    evidenceIds: item.recommendation.evidenceIds,
    suggestedActions: item.recommendation.suggestedActions,
    originContributorIds: origins,
    originNodeKinds: [item.nodeKind],
    constitutionalTrace: item.recommendation.constitutionalTrace,
    conflictFlags: flags,
    attributes: {
      ...item.recommendation.attributes,
      originContributorIds: origins,
    },
  };
}

function preferRecommendation(
  a: EducationGraphRecommendation,
  b: EducationGraphRecommendation
): boolean {
  const sevA = severityScore(a.kind);
  const sevB = severityScore(b.kind);
  if (sevA !== sevB) return sevA > sevB;
  if (a.priority !== b.priority) return a.priority < b.priority;
  return a.confidence >= b.confidence;
}

function flattenActions(
  recommendations: EducationRecommendation[]
): EducationGraphRecommendation["suggestedActions"] {
  const seen = new Set<string>();
  const out: EducationGraphRecommendation["suggestedActions"][number][] = [];
  for (const rec of recommendations) {
    for (const action of rec.suggestedActions) {
      if (seen.has(action.actionId)) continue;
      seen.add(action.actionId);
      out.push(action);
    }
  }
  return out.sort((a, b) => a.priority - b.priority);
}

export function collectSourcedRecommendations(
  inputs: readonly EducationGraphContributorInput[],
  resolveKind: (contributorId: string) => EducationGraphNodeKind
): SourcedRecommendation[] {
  const out: SourcedRecommendation[] = [];
  for (const input of inputs) {
    const nodeKind = input.nodeKind ?? resolveKind(input.contributorId);
    for (const recommendation of input.result.recommendations) {
      out.push({
        recommendation,
        contributorId: input.contributorId,
        nodeKind,
      });
    }
  }
  return out;
}
