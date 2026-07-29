/**
 * Produce a single prioritized recommendation list (no duplicates).
 */

import type { EducationActionProposal, EducationReadiness } from "../framework";
import { readinessPriorityRank } from "../framework";
import type { EducationGraphRecommendation } from "./EducationGraphResult";

export function prioritizeEducationRecommendations(
  recommendations: readonly EducationGraphRecommendation[]
): EducationGraphRecommendation[] {
  const byKind = new Map<string, EducationGraphRecommendation>();
  for (const rec of recommendations) {
    const existing = byKind.get(rec.kind);
    if (!existing) {
      byKind.set(rec.kind, rec);
      continue;
    }
    // Keep more urgent / higher confidence
    const preferNew =
      rec.priority < existing.priority ||
      (rec.priority === existing.priority &&
        rec.confidence > existing.confidence);
    if (preferNew) byKind.set(rec.kind, rec);
  }

  return [...byKind.values()].sort(
    (a, b) => a.priority - b.priority || b.confidence - a.confidence
  );
}

export function mergeEducationActionProposals(
  recommendations: readonly EducationGraphRecommendation[]
): EducationActionProposal[] {
  const seen = new Set<string>();
  const out: EducationActionProposal[] = [];
  for (const rec of recommendations) {
    for (const proposal of rec.suggestedActions) {
      if (seen.has(proposal.actionId)) continue;
      seen.add(proposal.actionId);
      out.push(proposal);
    }
  }
  return out.sort((a, b) => a.priority - b.priority);
}

export function resolveGraphReadiness(
  readinessList: readonly EducationReadiness[]
): EducationReadiness {
  if (readinessList.includes("blocked")) return "blocked";
  if (readinessList.includes("conditional")) return "conditional";
  return "ready";
}

export function resolveGraphConfidence(input: {
  readiness: EducationReadiness;
  confidences: readonly number[];
}): number {
  if (input.confidences.length === 0) return 0;
  if (input.readiness === "blocked") {
    return clamp(
      Math.min(...input.confidences.map((c) => Math.min(c, 0.7)))
    );
  }
  const avg =
    input.confidences.reduce((a, b) => a + b, 0) / input.confidences.length;
  if (input.readiness === "conditional") {
    return clamp(Math.min(avg, 0.82));
  }
  return clamp(Math.max(avg, 0.85));
}

export function resolveGraphPriority(input: {
  readiness: EducationReadiness;
  recommendations: readonly EducationGraphRecommendation[];
}): number {
  if (input.recommendations.length === 0) {
    return readinessPriorityRank(input.readiness);
  }
  return Math.min(
    readinessPriorityRank(input.readiness),
    ...input.recommendations.map((r) => r.priority)
  );
}

function clamp(n: number): number {
  return Math.max(0, Math.min(1, Number(n.toFixed(4))));
}
