/**
 * Executive Graph Analyzer — edge helpers (Sprint 025).
 */

import { createEdge } from "@/lib/platform/intelligence/executive-graph/model";
import type { GraphEdge, GraphEdgeKind } from "@/lib/platform/intelligence/executive-graph/types";

let edgeSeq = 0;

/** Reset sequential edge ids (tests only). */
export function resetGraphEdgeSeqForTests(): void {
  edgeSeq = 0;
}

export function nextEdgeId(kind: GraphEdgeKind): string {
  edgeSeq += 1;
  return `edge:${kind}:${edgeSeq}`;
}

export function buildEdge(input: {
  kind: GraphEdgeKind;
  sourceId: string;
  targetId: string;
  weight?: number;
  confidence?: number;
  direction?: "positive" | "negative" | "neutral";
  ruleId?: string;
  reason?: string;
}): GraphEdge {
  return createEdge({
    id: nextEdgeId(input.kind),
    kind: input.kind,
    sourceId: input.sourceId,
    targetId: input.targetId,
    weight: input.weight,
    confidence: input.confidence,
    direction: input.direction,
    ruleId: input.ruleId,
    reason: input.reason,
  });
}

export function isCausalEdge(kind: GraphEdgeKind): boolean {
  return kind === "CAUSES" || kind === "CONTRIBUTES_TO" || kind === "GENERATES" || kind === "DECLINES";
}

export function isBlockingEdge(kind: GraphEdgeKind): boolean {
  return kind === "BLOCKS" || kind === "CONSTRAINS";
}

export function isSupportiveEdge(kind: GraphEdgeKind): boolean {
  return kind === "SUPPORTS" || kind === "IMPROVES" || kind === "FUNDS";
}
