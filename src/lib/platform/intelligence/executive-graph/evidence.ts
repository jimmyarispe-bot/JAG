/**
 * Executive Graph Analyzer — evidence helpers (Sprint 025).
 */

import type { EvidenceHelper } from "@/lib/platform/intelligence/executive-graph/contracts";
import type { GraphEvidence } from "@/lib/platform/intelligence/executive-graph/types";

let evidenceSeq = 0;

export function createEvidence(
  partial: Omit<GraphEvidence, "id"> & { id?: string }
): GraphEvidence {
  evidenceSeq += 1;
  return {
    id: partial.id ?? `ev-${evidenceSeq}`,
    label: partial.label,
    detail: partial.detail,
    sourceDomain: partial.sourceDomain,
    sourceId: partial.sourceId,
    value: partial.value,
    weight: partial.weight ?? 1,
  };
}

export function mergeEvidence(
  existing: GraphEvidence[],
  incoming: GraphEvidence[]
): GraphEvidence[] {
  const byId = new Map<string, GraphEvidence>();
  for (const item of existing) {
    byId.set(item.id, item);
  }
  for (const item of incoming) {
    byId.set(item.id, item);
  }
  return Array.from(byId.values());
}

export const evidenceHelper: EvidenceHelper = {
  create: createEvidence,
  merge: mergeEvidence,
};
