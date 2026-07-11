/**
 * Executive Intelligence Graph — insights from nodes/edges/trends/health.
 */

import { confidenceRank } from "@/lib/platform/executive-graph/edge";
import type {
  ExecutiveGraph,
  ExecutiveGraphConfidence,
  ExecutiveGraphInsightBucket,
  ExecutiveGraphInsights,
  ExecutiveGraphNode,
} from "@/lib/platform/executive-graph/types";
import type { ExecutiveTrends } from "@/lib/executive/trends";
import type { ExecutiveHealthScore } from "@/lib/executive/health-score";

function bucket(
  partial: Omit<ExecutiveGraphInsightBucket, "confidence"> & {
    confidence?: ExecutiveGraphConfidence;
  }
): ExecutiveGraphInsightBucket {
  return {
    confidence: partial.confidence ?? "Medium",
    ...partial,
  };
}

function nodeById(nodes: ExecutiveGraphNode[], id: string): ExecutiveGraphNode | undefined {
  return nodes.find((n) => n.id === id);
}

export function buildExecutiveGraphInsights(input: {
  nodes: ExecutiveGraphNode[];
  edges: ExecutiveGraph["edges"];
  trends: ExecutiveTrends;
  health: ExecutiveHealthScore;
}): ExecutiveGraphInsights {
  const { nodes, edges, trends, health } = input;

  const topPositiveDrivers = trends.topImprovements.map((t, i) =>
    bucket({
      id: `positive:${t.metric}`,
      title: t.label,
      summary: t.sentence ?? `${t.label} is improving.`,
      nodeIds: nodes.filter((n) => n.key.includes(t.metric) || n.metadata.logicalKey === `kpi.${t.metric}`).map((n) => n.id),
      confidence: "High",
      score: 100 - i * 10,
    })
  );

  // Also include health strengths.
  for (const [i, s] of health.strengths.slice(0, 3).entries()) {
    topPositiveDrivers.push(
      bucket({
        id: `strength:${i}`,
        title: s,
        summary: s,
        nodeIds: [],
        confidence: "Medium",
        score: 70 - i * 5,
      })
    );
  }

  const topNegativeDrivers = trends.topDeclines.map((t, i) =>
    bucket({
      id: `negative:${t.metric}`,
      title: t.label,
      summary: t.sentence ?? `${t.label} is declining.`,
      nodeIds: nodes
        .filter(
          (n) =>
            n.key.includes(t.metric.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)) ||
            String(n.metadata.logicalKey ?? "").includes(t.metric)
        )
        .map((n) => n.id),
      confidence: "High",
      score: 100 - i * 10,
    })
  );

  for (const [i, r] of health.risks.slice(0, 3).entries()) {
    topNegativeDrivers.push(
      bucket({
        id: `risk:${i}`,
        title: r,
        summary: r,
        nodeIds: [],
        confidence: "Medium",
        score: 70 - i * 5,
      })
    );
  }

  // Root causes: nodes with outgoing CONTRIBUTES_TO/CAUSES and no incoming causal edges.
  const causalOut = new Set(
    edges
      .filter((e) => e.type === "CONTRIBUTES_TO" || e.type === "CAUSES" || e.type === "DECLINES")
      .map((e) => e.sourceId)
  );
  const causalIn = new Set(
    edges
      .filter((e) => e.type === "CONTRIBUTES_TO" || e.type === "CAUSES" || e.type === "DECLINES")
      .map((e) => e.targetId)
  );

  const rootCauses: ExecutiveGraphInsightBucket[] = [];
  for (const sourceId of causalOut) {
    if (causalIn.has(sourceId)) continue;
    const node = nodeById(nodes, sourceId);
    if (!node) continue;
    const outEdges = edges.filter((e) => e.sourceId === sourceId);
    const best = outEdges.sort(
      (a, b) => confidenceRank(b.confidence) - confidenceRank(a.confidence)
    )[0];
    rootCauses.push(
      bucket({
        id: `root:${sourceId}`,
        title: node.label,
        summary: best?.reason ?? `${node.label} is an upstream driver.`,
        nodeIds: [sourceId, ...outEdges.map((e) => e.targetId)],
        confidence: best?.confidence ?? "Medium",
        score: confidenceRank(best?.confidence ?? "Medium") * 20,
      })
    );
  }
  rootCauses.sort((a, b) => b.score - a.score);

  const emergingRisks: ExecutiveGraphInsightBucket[] = [];
  for (const edge of edges) {
    if (edge.type !== "CONTRIBUTES_TO" && edge.type !== "DECLINES") continue;
    if (edge.targetId.includes("Tax") || edge.targetId.includes("Compliance") || edge.targetId.includes("Lifecycle")) {
      const target = nodeById(nodes, edge.targetId);
      emergingRisks.push(
        bucket({
          id: `emerging:${edge.id}`,
          title: target?.label ?? edge.targetId,
          summary: edge.reason ?? "Emerging risk signal.",
          nodeIds: [edge.sourceId, edge.targetId],
          confidence: edge.confidence,
          score: confidenceRank(edge.confidence) * 15,
        })
      );
    }
  }
  for (const alertNode of nodes.filter((n) => n.type === "Alert")) {
    emergingRisks.push(
      bucket({
        id: `alert-risk:${alertNode.id}`,
        title: alertNode.label,
        summary: String(alertNode.metadata.body ?? alertNode.label),
        nodeIds: [alertNode.id],
        confidence: "High",
        score: 80,
      })
    );
  }

  const strategicOpportunities: ExecutiveGraphInsightBucket[] = [];
  for (const edge of edges.filter((e) => e.type === "IMPROVES" || e.type === "SUPPORTS")) {
    const source = nodeById(nodes, edge.sourceId);
    const target = nodeById(nodes, edge.targetId);
    strategicOpportunities.push(
      bucket({
        id: `opp:${edge.id}`,
        title: `${source?.label ?? "Driver"} → ${target?.label ?? "Outcome"}`,
        summary: edge.reason ?? "Positive momentum to reinforce.",
        nodeIds: [edge.sourceId, edge.targetId],
        confidence: edge.confidence,
        score: confidenceRank(edge.confidence) * 18,
      })
    );
  }
  for (const [i, s] of health.strengths.slice(0, 2).entries()) {
    strategicOpportunities.push(
      bucket({
        id: `opp-strength:${i}`,
        title: s,
        summary: `Build on strength: ${s}`,
        nodeIds: [],
        confidence: "Medium",
        score: 60 - i * 5,
      })
    );
  }

  return {
    topPositiveDrivers: topPositiveDrivers.slice(0, 5),
    topNegativeDrivers: topNegativeDrivers.slice(0, 5),
    rootCauses: rootCauses.slice(0, 5),
    emergingRisks: emergingRisks
      .sort((a, b) => b.score - a.score)
      .slice(0, 5),
    strategicOpportunities: strategicOpportunities
      .sort((a, b) => b.score - a.score)
      .slice(0, 5),
  };
}
