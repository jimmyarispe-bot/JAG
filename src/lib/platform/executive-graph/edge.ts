/** Executive Intelligence Graph — edge constructors */

import type {
  ExecutiveGraphConfidence,
  ExecutiveGraphEdge,
  ExecutiveGraphEdgeType,
  ExecutiveGraphEvidence,
} from "@/lib/platform/executive-graph/types";

let edgeSeq = 0;

export function resetEdgeSeqForTests(): void {
  edgeSeq = 0;
}

export function createEdge(input: {
  type: ExecutiveGraphEdgeType;
  sourceId: string;
  targetId: string;
  confidence: ExecutiveGraphConfidence;
  ruleId: string;
  evidence?: ExecutiveGraphEvidence[];
  activityReferences?: string[];
  reason?: string;
  weight?: number;
  at?: string;
}): ExecutiveGraphEdge {
  edgeSeq += 1;
  const at = input.at ?? new Date().toISOString();
  return {
    id: `edge:${input.ruleId}:${edgeSeq}`,
    type: input.type,
    sourceId: input.sourceId,
    targetId: input.targetId,
    confidence: input.confidence,
    ruleId: input.ruleId,
    evidence: input.evidence ?? [],
    activityReferences: input.activityReferences ?? [],
    createdAt: at,
    updatedAt: at,
    weight: input.weight,
    reason: input.reason,
  };
}

export function confidenceRank(c: ExecutiveGraphConfidence): number {
  switch (c) {
    case "High":
      return 4;
    case "Medium":
      return 3;
    case "Low":
      return 2;
    default:
      return 1;
  }
}

export function maxConfidence(
  a: ExecutiveGraphConfidence,
  b: ExecutiveGraphConfidence
): ExecutiveGraphConfidence {
  return confidenceRank(a) >= confidenceRank(b) ? a : b;
}
