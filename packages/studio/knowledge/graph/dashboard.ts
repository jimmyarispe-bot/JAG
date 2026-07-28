/**
 * Knowledge Graph dashboard — JS-004 health + JS-005 completion metrics.
 */

import { buildGraphHealthReport } from "../health/metrics";
import { generateKnowledgeRecommendations } from "../recommendations/engine";
import { evaluateReleaseReadiness } from "../release/readiness";
import { createKnowledgeReasoningService } from "../reasoning/engine";
import { buildKnowledgeGraph } from "./builder";
import type { KnowledgeGraphHealth } from "./types";

export type KnowledgeStudioDashboard = KnowledgeGraphHealth & {
  readonly reasoningQueries: readonly string[];
  readonly relationshipCoverage: number;
  readonly repositoryCoverage: number;
  readonly reasoningConfidence: number;
  readonly untestedServices: readonly string[];
  readonly undocumentedApis: readonly string[];
  readonly rc3Readiness: number;
  readonly rc3Ready: boolean;
  readonly rc3Summary: string;
  readonly recommendedWork: readonly string[];
  readonly trend: ReturnType<typeof buildGraphHealthReport>["trend"];
};

export function buildKnowledgeDashboard(root?: string): KnowledgeStudioDashboard {
  const g = buildKnowledgeGraph({ root });
  const health = buildGraphHealthReport({ root, productId: "academyos" });
  const readiness = evaluateReleaseReadiness({
    productId: "academyos",
    targetStage: "RC-3",
    root,
  });
  const recs = generateKnowledgeRecommendations({
    root,
    productId: "academyos",
  });

  const referenced = new Set(g.edges.flatMap((e) => [e.from, e.to]));
  const orphanNodes = g.nodes
    .filter((n) => !referenced.has(n.id) && n.kind !== "role")
    .map((n) => n.id)
    .sort();

  const packages = g.nodes.filter((n) => n.kind === "package");
  const disconnectedPackages = packages
    .filter((p) => !g.edges.some((e) => e.from === p.id || e.to === p.id))
    .map((p) => p.id)
    .sort();

  return {
    generatedAt: health.generatedAt,
    nodeCount: g.nodes.length,
    relationshipCount: g.edges.length,
    orphanNodes: Object.freeze(orphanNodes.slice(0, 50)),
    disconnectedPackages: Object.freeze(disconnectedPackages),
    documentationCoverage: Math.max(
      0,
      100 - health.undocumentedApis * 0.5
    ),
    testCoverage: Math.max(0, 100 - health.untestedServices),
    knowledgeFreshness: health.graphFreshness,
    healthScore: health.healthScore,
    countsByKind: Object.freeze({ ...g.countsByKind }),
    edgeCountsByKind: Object.freeze(
      Object.fromEntries(
        Object.entries(g.edgeCountsByKind).map(([k, v]) => [k, v ?? 0])
      )
    ),
    reasoningQueries: createKnowledgeReasoningService().intents,
    relationshipCoverage: health.relationshipCoverage,
    repositoryCoverage: health.repositoryCoverage,
    reasoningConfidence: health.reasoningConfidence,
    untestedServices: health.untestedServiceIds,
    undocumentedApis: health.undocumentedApiIds,
    rc3Readiness: readiness.readinessScore,
    rc3Ready: readiness.ready,
    rc3Summary: readiness.summary,
    recommendedWork: Object.freeze(
      recs.recommendations.slice(0, 12).map((r) => r.title)
    ),
    trend: health.trend,
  };
}

export function createKnowledgeDashboardService() {
  return {
    build: buildKnowledgeDashboard,
  };
}
