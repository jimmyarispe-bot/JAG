/**
 * Aggregate contributor outputs into a unified Education graph result.
 */

import type { EducationGraphContext } from "./EducationGraphContext";
import {
  collectSourcedRecommendations,
  resolveEducationRecommendationConflicts,
} from "./EducationConflictResolver";
import { aggregateEducationEvidence } from "./EducationEvidenceAggregator";
import {
  EDUCATION_DEFAULT_GRAPH_EDGES,
} from "./EducationGraphEdge";
import {
  createEducationGraphNode,
  EDUCATION_GRAPH_NODE_KINDS,
  nodeKindFromContributorId,
  type EducationGraphNode,
  type EducationGraphNodeKind,
} from "./EducationGraphNode";
import type { EducationGraphResult } from "./EducationGraphResult";
import {
  mergeEducationActionProposals,
  prioritizeEducationRecommendations,
  resolveGraphConfidence,
  resolveGraphPriority,
  resolveGraphReadiness,
} from "./EducationPriorityResolver";

export function aggregateEducationGraph(
  context: EducationGraphContext
): EducationGraphResult {
  const inputs = context.inputs;
  const edges = context.edges ?? EDUCATION_DEFAULT_GRAPH_EDGES;

  const resolveKind = (contributorId: string): EducationGraphNodeKind => {
    const input = inputs.find((i) => i.contributorId === contributorId);
    return (
      input?.nodeKind ??
      nodeKindFromContributorId(contributorId) ??
      "compliance"
    );
  };

  const evidenceAgg = aggregateEducationEvidence(inputs);
  const sourced = collectSourcedRecommendations(inputs, resolveKind);
  const conflictResolved = resolveEducationRecommendationConflicts(sourced);
  const recommendations = prioritizeEducationRecommendations(
    conflictResolved.recommendations
  );
  const suggestedActions = mergeEducationActionProposals(recommendations);

  const readiness = resolveGraphReadiness(
    inputs.map((i) => i.result.readiness)
  );
  const confidence = resolveGraphConfidence({
    readiness,
    confidences: inputs.map((i) => i.result.confidence),
  });
  const priority = resolveGraphPriority({ readiness, recommendations });

  const blockingIssues = uniqueStrings(
    inputs.flatMap((i) => i.result.blockingIssues)
  );
  const warnings = uniqueStrings(inputs.flatMap((i) => i.result.warnings));

  const consultedContributorIds = inputs.map((i) => i.contributorId).sort();
  const nodes = buildNodes(inputs, resolveKind);

  const subjectId =
    context.subjectId ??
    inputs[0]?.result.subjectId ??
    "education.unknown";

  const explanation = buildUnifiedExplanation({
    readiness,
    consultedContributorIds,
    blockingIssues,
    warnings,
    recommendationCount: recommendations.length,
    conflictCount:
      evidenceAgg.conflicts.length + conflictResolved.conflicts.length,
  });

  return {
    subjectId,
    readiness,
    confidence,
    priority,
    explanation,
    evidence: evidenceAgg.evidence,
    recommendations,
    suggestedActions,
    blockingIssues,
    warnings,
    conflicts: [...evidenceAgg.conflicts, ...conflictResolved.conflicts],
    nodes,
    edges: [...edges],
    consultedContributorIds,
    analyzedAt: context.now ?? new Date().toISOString(),
    attributes: {
      ...context.attributes,
      organizationId: context.organizationId,
      inputCount: inputs.length,
    },
  };
}

function buildNodes(
  inputs: EducationGraphContext["inputs"],
  resolveKind: (contributorId: string) => EducationGraphNodeKind
): EducationGraphNode[] {
  const activeByKind = new Map<EducationGraphNodeKind, string>();
  for (const input of inputs) {
    const kind = input.nodeKind ?? resolveKind(input.contributorId);
    activeByKind.set(kind, input.contributorId);
  }

  return EDUCATION_GRAPH_NODE_KINDS.map((kind) =>
    createEducationGraphNode({
      kind,
      contributorId: activeByKind.get(kind),
      active: activeByKind.has(kind),
    })
  );
}

function buildUnifiedExplanation(input: {
  readiness: string;
  consultedContributorIds: readonly string[];
  blockingIssues: readonly string[];
  warnings: readonly string[];
  recommendationCount: number;
  conflictCount: number;
}): string {
  const parts = [
    `Education Intelligence Graph readiness: ${input.readiness}`,
    `Consulted: ${input.consultedContributorIds.join(", ") || "none"}`,
    `${input.recommendationCount} prioritized recommendation(s)`,
  ];
  if (input.blockingIssues.length) {
    parts.push(`Blocking: ${input.blockingIssues.join("; ")}`);
  }
  if (input.warnings.length) {
    parts.push(`Warnings: ${input.warnings.join("; ")}`);
  }
  if (input.conflictCount > 0) {
    parts.push(`${input.conflictCount} conflict(s) reconciled`);
  }
  return parts.join(" | ");
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values)];
}
