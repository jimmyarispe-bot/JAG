/**
 * Trace findings back through the evidence graph to organizational artifacts.
 */

import type { Finding } from "@/jag/intelligence/contracts/finding";
import type { EvidenceReference } from "@/jag/intelligence/contracts/evidence";
import { createEvidenceResolver } from "@/jag/intelligence/evidence/resolver";
import type {
  EvidenceGraph,
  EvidenceNode,
  EvidenceNodeId,
} from "@/jag/intelligence/evidence/types";

export type EvidenceTracePath = {
  readonly evidenceId: string;
  readonly nodeIds: readonly EvidenceNodeId[];
  readonly nodes: readonly EvidenceNode[];
  readonly artifactRefs: readonly EvidenceReference[];
};

export type FindingEvidenceTrace = {
  readonly findingId: string;
  readonly paths: readonly EvidenceTracePath[];
  readonly rootedInOrganizationalArtifacts: boolean;
};

/**
 * For each finding evidenceId, walk outbound organizational edges
 * (and include the seed node) so the finding is traceable to artifacts.
 */
export function traceFindingThroughGraph(
  finding: Finding,
  graph: EvidenceGraph
): FindingEvidenceTrace {
  const resolver = createEvidenceResolver();
  const paths: EvidenceTracePath[] = [];

  for (const evidenceId of finding.evidenceIds) {
    const seeds = resolver.nodesForEvidenceId(graph, evidenceId);
    if (seeds.length === 0) {
      paths.push({
        evidenceId,
        nodeIds: Object.freeze([]),
        nodes: Object.freeze([]),
        artifactRefs: Object.freeze([]),
      });
      continue;
    }

    for (const seed of seeds) {
      const ordered: EvidenceNode[] = [];
      const seen = new Set<string>();
      const queue: EvidenceNode[] = [seed];
      while (queue.length > 0) {
        const node = queue.shift()!;
        if (seen.has(node.id)) continue;
        seen.add(node.id);
        ordered.push(node);
        for (const edge of resolver.edgesFrom(graph, node.id)) {
          if (!edge.toNodeId) continue;
          const next = resolver.getNode(graph, edge.toNodeId);
          if (next) queue.push(next);
        }
        // Also walk inbound to reach governing artifacts (decision→policy etc.)
        for (const edge of resolver.edgesTo(graph, node.id)) {
          const prev = resolver.getNode(graph, edge.fromNodeId);
          if (prev) queue.push(prev);
        }
      }

      ordered.sort((a, b) => a.id.localeCompare(b.id));
      paths.push({
        evidenceId,
        nodeIds: Object.freeze(ordered.map((n) => n.id)),
        nodes: Object.freeze(ordered),
        artifactRefs: Object.freeze(
          ordered.map((n) =>
            Object.freeze({
              kind: n.kind,
              refId: n.refId,
              label: n.label,
            })
          )
        ),
      });
    }
  }

  const rooted =
    paths.length > 0 &&
    paths.every(
      (p) =>
        p.artifactRefs.length > 0 &&
        p.artifactRefs.every((r) => typeof r.kind === "string" && r.refId)
    );

  return {
    findingId: finding.id,
    paths: Object.freeze(paths),
    rootedInOrganizationalArtifacts: rooted,
  };
}
