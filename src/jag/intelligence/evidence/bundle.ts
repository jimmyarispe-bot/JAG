/**
 * EvidenceBundle — curated graph + flattened Evidence for providers.
 */

import type { Evidence } from "@/jag/intelligence/contracts/evidence";
import { sortGraphMembers } from "@/jag/intelligence/evidence/graph-utils";
import type {
  EvidenceBundle,
  EvidenceGraph,
} from "@/jag/intelligence/evidence/types";

/**
 * Build a provider-ready bundle from a completed graph.
 * Providers receive this; they do not discover evidence.
 */
export function buildEvidenceBundle(
  graph: EvidenceGraph,
  bundleId?: string
): EvidenceBundle {
  const { orderedNodeIds } = sortGraphMembers(graph);
  const evidence: Evidence[] = graph.nodes.map((node) =>
    Object.freeze({
      id: node.evidenceIds[0] ?? `ev.${node.id}`,
      summary: node.summary ?? node.label ?? node.refId,
      references: Object.freeze([
        Object.freeze({
          kind: node.kind,
          refId: node.refId,
          label: node.label,
        }),
      ]),
      sourceCapabilityIds: node.sourceCapabilityIds,
    })
  );

  return Object.freeze({
    id: bundleId ?? `bundle.${graph.id}`,
    graph,
    evidence: Object.freeze(evidence),
    orderedNodeIds: Object.freeze(orderedNodeIds),
  });
}
