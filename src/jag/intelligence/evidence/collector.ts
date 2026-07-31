/**
 * EvidenceCollector — assemble nodes from curated organizational seeds.
 * No persistence. No runtime engine access.
 */

import {
  FORBIDDEN_EVIDENCE_KINDS,
  ORGANIZATIONAL_EVIDENCE_KINDS,
} from "@/jag/intelligence/evidence/reference-kinds";
import { correlateEvidenceNodes } from "@/jag/intelligence/evidence/correlation";
import {
  freezeGraph,
  nodeIdFor,
  sortGraphMembers,
} from "@/jag/intelligence/evidence/graph-utils";
import { defaultPriorityForKind } from "@/jag/intelligence/evidence/priority";
import type {
  EvidenceCollectorInput,
  EvidenceGraph,
  EvidenceNode,
} from "@/jag/intelligence/evidence/types";

export type EvidenceCollectorResult = {
  readonly ok: boolean;
  readonly graph?: EvidenceGraph;
  readonly issues: readonly { readonly code: string; readonly message: string }[];
};

function isOrganizationalKind(kind: string): boolean {
  return (ORGANIZATIONAL_EVIDENCE_KINDS as readonly string[]).includes(kind);
}

function isForbiddenKind(kind: string): boolean {
  return (FORBIDDEN_EVIDENCE_KINDS as readonly string[]).includes(kind);
}

/**
 * Collect an EvidenceGraph from EI Evidence seeds + optional declared links.
 */
export function collectEvidenceGraph(
  input: EvidenceCollectorInput
): EvidenceCollectorResult {
  const issues: { code: string; message: string }[] = [];
  const nodeMap = new Map<string, EvidenceNode>();

  for (const seed of input.seeds) {
    if (!seed.id || !seed.summary || !seed.references?.length) {
      issues.push({
        code: "invalid_seed",
        message: `Seed "${seed.id ?? "?"}" is structurally invalid`,
      });
      continue;
    }
    for (const ref of seed.references) {
      if (isForbiddenKind(ref.kind)) {
        issues.push({
          code: "forbidden_kind",
          message: `Forbidden evidence kind "${ref.kind}" on seed ${seed.id}`,
        });
        continue;
      }
      if (!isOrganizationalKind(ref.kind)) {
        issues.push({
          code: "unknown_kind",
          message: `Unknown evidence kind "${ref.kind}" on seed ${seed.id}`,
        });
        continue;
      }

      const id = nodeIdFor(ref.kind, ref.refId);
      const existing = nodeMap.get(id);
      if (existing) {
        const evidenceIds = existing.evidenceIds.includes(seed.id)
          ? existing.evidenceIds
          : Object.freeze([...existing.evidenceIds, seed.id]);
        nodeMap.set(id, {
          ...existing,
          evidenceIds,
          label: existing.label ?? ref.label,
          summary: existing.summary ?? seed.summary,
          correlationKey: existing.correlationKey ?? seed.correlationKey,
          sourceCapabilityIds:
            existing.sourceCapabilityIds ?? seed.sourceCapabilityIds,
        });
      } else {
        nodeMap.set(id, {
          id,
          kind: ref.kind,
          refId: ref.refId,
          label: ref.label,
          summary: seed.summary,
          priority: seed.priority ?? defaultPriorityForKind(ref.kind),
          evidenceIds: Object.freeze([seed.id]),
          correlationKey: seed.correlationKey,
          sourceCapabilityIds: seed.sourceCapabilityIds,
        });
      }
    }
  }

  if (issues.some((i) => i.code === "forbidden_kind")) {
    return { ok: false, issues };
  }

  const nodes = [...nodeMap.values()];
  const { edges, correlations, skippedCycleEdges } = correlateEvidenceNodes(
    nodes,
    input.declaredLinks ?? []
  );
  const sorted = sortGraphMembers({ nodes, edges });

  const graph = freezeGraph({
    id: input.graphId ?? `graph.${input.organizationId ?? "org"}.${sorted.nodes.length}`,
    organizationId: input.organizationId,
    nodes: sorted.nodes,
    edges: sorted.edges,
    correlations: Object.freeze(
      [...correlations].sort((a, b) => a.id.localeCompare(b.id))
    ),
    skippedCycleEdges: Object.freeze(skippedCycleEdges),
  });

  return {
    ok: issues.length === 0,
    graph,
    issues,
  };
}

export type EvidenceCollector = {
  collect(input: EvidenceCollectorInput): EvidenceCollectorResult;
};

export function createEvidenceCollector(): EvidenceCollector {
  return { collect: collectEvidenceGraph };
}
