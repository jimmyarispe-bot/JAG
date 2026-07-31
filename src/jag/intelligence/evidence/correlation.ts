/**
 * Apply deterministic correlation rules to produce edges + correlation records.
 */

import {
  EVIDENCE_CORRELATION_RULES,
  findCorrelationRule,
} from "@/jag/intelligence/evidence/correlation-rules";
import { wouldCreateCycle } from "@/jag/intelligence/evidence/graph-utils";
import type {
  DeclaredEvidenceLink,
  EvidenceCorrelation,
  EvidenceEdge,
  EvidenceNode,
} from "@/jag/intelligence/evidence/types";
import type { EvidenceCorrelationRule } from "@/jag/intelligence/evidence/correlation-rules";

function nodesByRefId(nodes: readonly EvidenceNode[]): Map<string, EvidenceNode[]> {
  const map = new Map<string, EvidenceNode[]>();
  for (const node of nodes) {
    const list = map.get(node.refId) ?? [];
    list.push(node);
    map.set(node.refId, list);
  }
  return map;
}

function pairKey(fromId: string, toKey: string, ruleId: string): string {
  return `${ruleId}|${fromId}|${toKey}`;
}

function addEdge(
  edges: EvidenceEdge[],
  correlations: EvidenceCorrelation[],
  skippedCycleEdges: EvidenceEdge[],
  seen: Set<string>,
  from: EvidenceNode,
  to: EvidenceNode | undefined,
  rule: EvidenceCorrelationRule
): void {
  const toKey = to?.id ?? "sink:recommendation";
  const key = pairKey(from.id, toKey, rule.id);
  if (seen.has(key)) return;
  seen.add(key);

  const edge: EvidenceEdge = {
    id: `edge:${rule.id}:${from.id}->${toKey}`,
    type: rule.edgeType,
    fromNodeId: from.id,
    toNodeId: to?.id,
    toSink: rule.toSink,
    ruleId: rule.id,
    explanation: rule.explanation,
  };

  if (
    edge.toNodeId &&
    wouldCreateCycle(edges, edge.fromNodeId, edge.toNodeId)
  ) {
    skippedCycleEdges.push(edge);
    return;
  }

  edges.push(edge);
  correlations.push({
    id: `corr:${edge.id}`,
    ruleId: rule.id,
    fromKind: from.kind,
    toKind: to?.kind,
    toSink: rule.toSink,
    fromNodeId: from.id,
    toNodeId: to?.id,
    edgeId: edge.id,
    explanation: rule.explanation,
  });
}

/**
 * Correlate nodes using declared links and shared correlation keys.
 */
export function correlateEvidenceNodes(
  nodes: readonly EvidenceNode[],
  declaredLinks: readonly DeclaredEvidenceLink[] = []
): {
  edges: EvidenceEdge[];
  correlations: EvidenceCorrelation[];
  skippedCycleEdges: EvidenceEdge[];
} {
  const edges: EvidenceEdge[] = [];
  const correlations: EvidenceCorrelation[] = [];
  const skippedCycleEdges: EvidenceEdge[] = [];
  const seen = new Set<string>();
  const byRef = nodesByRefId(nodes);

  const sortedLinks = [...declaredLinks].sort((a, b) => {
    // Canonical rules before explicit related links (deterministic + cycle-safe).
    const rank = (link: DeclaredEvidenceLink) =>
      link.ruleId === "related" ? 1 : 0;
    const byRank = rank(a) - rank(b);
    if (byRank !== 0) return byRank;
    return `${a.fromRefId}->${a.toRefId}`.localeCompare(
      `${b.fromRefId}->${b.toRefId}`
    );
  });

  for (const link of sortedLinks) {
    const fromCandidates = byRef.get(link.fromRefId) ?? [];
    const toCandidates = byRef.get(link.toRefId) ?? [];
    for (const from of fromCandidates) {
      for (const to of toCandidates) {
        if (link.ruleId === "related") {
          addEdge(edges, correlations, skippedCycleEdges, seen, from, to, {
            id: "related",
            fromKind: from.kind,
            toKind: to.kind,
            edgeType: "related",
            explanation: "Explicit related-link between organizational artifacts",
            order: 90,
          });
          continue;
        }
        const rule = findCorrelationRule(from.kind, to.kind);
        if (!rule) continue;
        if (link.ruleId && link.ruleId !== rule.id) continue;
        addEdge(edges, correlations, skippedCycleEdges, seen, from, to, rule);
      }
    }
  }

  const byKey = new Map<string, EvidenceNode[]>();
  for (const node of nodes) {
    if (!node.correlationKey) continue;
    const list = byKey.get(node.correlationKey) ?? [];
    list.push(node);
    byKey.set(node.correlationKey, list);
  }

  for (const key of [...byKey.keys()].sort()) {
    const group = [...byKey.get(key)!].sort((a, b) => a.id.localeCompare(b.id));
    for (const rule of EVIDENCE_CORRELATION_RULES) {
      if (rule.toSink === "recommendation") {
        for (const from of group.filter((n) => n.kind === "analytics")) {
          addEdge(
            edges,
            correlations,
            skippedCycleEdges,
            seen,
            from,
            undefined,
            rule
          );
        }
        continue;
      }
      const fromNodes = group.filter((n) => n.kind === rule.fromKind);
      const toNodes = group.filter((n) => n.kind === rule.toKind);
      for (const from of fromNodes) {
        for (const to of toNodes) {
          addEdge(edges, correlations, skippedCycleEdges, seen, from, to, rule);
        }
      }
    }
  }

  edges.sort((a, b) => a.id.localeCompare(b.id));
  correlations.sort((a, b) => a.id.localeCompare(b.id));
  skippedCycleEdges.sort((a, b) => a.id.localeCompare(b.id));

  return { edges, correlations, skippedCycleEdges };
}
