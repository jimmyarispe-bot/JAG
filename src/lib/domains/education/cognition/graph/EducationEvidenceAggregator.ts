/**
 * Aggregate evidence refs across contributors — dedupe by evidence id.
 */

import type { CognitiveEvidenceRef } from "@/lib/jag/runtime";
import type { EducationGraphContributorInput } from "./EducationGraphContext";
import type {
  EducationGraphConflict,
  EducationGraphEvidenceItem,
} from "./EducationGraphResult";

export interface EvidenceAggregationResult {
  evidence: EducationGraphEvidenceItem[];
  conflicts: EducationGraphConflict[];
}

export function aggregateEducationEvidence(
  inputs: readonly EducationGraphContributorInput[]
): EvidenceAggregationResult {
  const byId = new Map<
    string,
    { ref: CognitiveEvidenceRef; origins: Set<string> }
  >();
  const conflicts: EducationGraphConflict[] = [];

  for (const input of inputs) {
    for (const ref of input.result.evidence) {
      const existing = byId.get(ref.id);
      if (!existing) {
        byId.set(ref.id, {
          ref,
          origins: new Set([input.contributorId]),
        });
        continue;
      }
      existing.origins.add(input.contributorId);
      // Overlapping evidence: same id from multiple contributors
      if (existing.origins.size > 1) {
        const conflictId = `conflict.evidence.${ref.id}`;
        if (!conflicts.some((c) => c.id === conflictId)) {
          conflicts.push({
            id: conflictId,
            kind: "overlapping_evidence",
            summary: `Evidence "${ref.id}" contributed by multiple contributors`,
            recommendationIds: [],
            contributorIds: [...existing.origins],
          });
        }
      }
      // Prefer richer attributes / newer retrievedAt when merging
      const existingAt = Date.parse(existing.ref.retrievedAt);
      const nextAt = Date.parse(ref.retrievedAt);
      if (
        (!Number.isNaN(nextAt) &&
          !Number.isNaN(existingAt) &&
          nextAt > existingAt) ||
        Object.keys(ref.attributes ?? {}).length >
          Object.keys(existing.ref.attributes ?? {}).length
      ) {
        existing.ref = ref;
      }
    }
  }

  const evidence: EducationGraphEvidenceItem[] = [...byId.values()].map(
    (entry) => ({
      ref: entry.ref,
      originContributorIds: [...entry.origins].sort(),
    })
  );

  return { evidence, conflicts };
}
