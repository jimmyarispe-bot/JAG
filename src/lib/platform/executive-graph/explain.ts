/**
 * Executive Intelligence Graph — explainNode().
 */

import { confidenceRank, maxConfidence } from "@/lib/platform/executive-graph/edge";
import type {
  ExecutiveGraph,
  ExecutiveGraphConfidence,
  ExecutiveGraphEvidence,
  ExplainNodeResult,
} from "@/lib/platform/executive-graph/types";

const CAUSAL_IN = new Set(["CAUSES", "CONTRIBUTES_TO", "DECLINES", "BLOCKS", "DEPENDS_ON"]);
const CAUSAL_OUT = new Set([
  "CAUSES",
  "CONTRIBUTES_TO",
  "DECLINES",
  "IMPROVES",
  "SUPPORTS",
  "GENERATES",
  "MEASURES",
]);

/**
 * Explain a node: immediate causes, impacts, evidence, confidence, narrative.
 */
export function explainNode(graph: ExecutiveGraph, nodeId: string): ExplainNodeResult {
  const node = graph.nodes.find((n) => n.id === nodeId) ?? null;
  if (!node) {
    return {
      nodeId,
      node: null,
      immediateCauses: [],
      immediateImpacts: [],
      supportingEvidence: [],
      confidence: "Unknown",
      explanation: `Node ${nodeId} was not found in the executive graph.`,
      edgesIn: [],
      edgesOut: [],
    };
  }

  const edgesIn = graph.edges.filter(
    (e) => e.targetId === nodeId && CAUSAL_IN.has(e.type)
  );
  const edgesOut = graph.edges.filter(
    (e) => e.sourceId === nodeId && CAUSAL_OUT.has(e.type)
  );

  const causeIds = new Set(edgesIn.map((e) => e.sourceId));
  const impactIds = new Set(edgesOut.map((e) => e.targetId));

  const immediateCauses = graph.nodes.filter((n) => causeIds.has(n.id));
  const immediateImpacts = graph.nodes.filter((n) => impactIds.has(n.id));

  const supportingEvidence: ExecutiveGraphEvidence[] = [];
  let confidence: ExecutiveGraphConfidence = "Unknown";
  for (const edge of [...edgesIn, ...edgesOut]) {
    confidence = maxConfidence(confidence, edge.confidence);
    for (const ev of edge.evidence) supportingEvidence.push(ev);
  }

  const causeLines = edgesIn
    .map((e) => {
      const source = graph.nodes.find((n) => n.id === e.sourceId);
      return source?.label ?? e.sourceId;
    })
    .filter((v, i, arr) => arr.indexOf(v) === i);

  let explanation: string;
  if (causeLines.length) {
    explanation = `${node.label} decreased because:\n${causeLines
      .map((c) => `• ${c}`)
      .join("\n")}`;
    // Prefer "changed" language when not clearly a decline node
    if (node.type === "HealthScore" || edgesIn.some((e) => e.type === "MEASURES")) {
      explanation = `${node.label} is driven by:\n${causeLines
        .map((c) => `• ${c}`)
        .join("\n")}`;
    } else if (edgesIn.every((e) => e.type === "IMPROVES" || e.type === "SUPPORTS")) {
      explanation = `${node.label} improved because:\n${causeLines
        .map((c) => `• ${c}`)
        .join("\n")}`;
    } else if (
      edgesIn.some((e) => e.type === "CONTRIBUTES_TO" || e.type === "CAUSES" || e.type === "DECLINES")
    ) {
      const reasons = edgesIn
        .map((e) => e.reason)
        .filter(Boolean)
        .slice(0, 3);
      explanation = `${node.label} is under pressure because:\n${causeLines
        .map((c) => `• ${c}`)
        .join("\n")}`;
      if (reasons.length) {
        explanation += `\n\n${reasons.join(" ")}`;
      }
    }
  } else if (edgesOut.length) {
    const impacts = edgesOut
      .map((e) => graph.nodes.find((n) => n.id === e.targetId)?.label ?? e.targetId)
      .filter((v, i, arr) => arr.indexOf(v) === i);
    explanation = `${node.label} influences:\n${impacts.map((i) => `• ${i}`).join("\n")}`;
  } else {
    explanation = `${node.label} has no linked causal edges in the current graph.`;
  }

  // Stable confidence when only MEASURES edges
  if (confidence === "Unknown" && edgesIn.length + edgesOut.length > 0) {
    const ranked = [...edgesIn, ...edgesOut].sort(
      (a, b) => confidenceRank(b.confidence) - confidenceRank(a.confidence)
    );
    confidence = ranked[0]?.confidence ?? "Unknown";
  }

  return {
    nodeId,
    node,
    immediateCauses,
    immediateImpacts,
    supportingEvidence,
    confidence,
    explanation,
    edgesIn,
    edgesOut,
  };
}
