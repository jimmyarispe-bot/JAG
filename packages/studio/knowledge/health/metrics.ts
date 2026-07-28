/**
 * JS-005 — Graph health metrics + trend history.
 */

import { buildKnowledgeCoverage } from "../coverage/metrics";
import { buildKnowledgeGraph } from "../graph/builder";
import { generateKnowledgeRecommendations } from "../recommendations/engine";
import { evaluateReleaseReadiness } from "../release/readiness";

export type GraphHealthSnapshot = {
  readonly at: string;
  readonly graphVersion: string;
  readonly nodeCount: number;
  readonly relationshipCount: number;
  readonly relationshipCompleteness: number;
  readonly orphanNodeCount: number;
  readonly undocumentedApis: number;
  readonly untestedServices: number;
  readonly disconnectedModules: number;
  readonly staleDocumentation: number;
  readonly stalePerReferences: number;
  readonly graphFreshness: "fresh" | "warm" | "stale";
  readonly healthScore: number;
  readonly reasoningConfidence: number;
  readonly repositoryCoverage: number;
  readonly rc3Readiness: number;
};

export type GraphHealthReport = GraphHealthSnapshot & {
  readonly generatedAt: string;
  readonly trend: readonly GraphHealthSnapshot[];
  readonly recommendedWork: readonly string[];
  readonly relationshipCoverage: number;
  readonly untestedServiceIds: readonly string[];
  readonly undocumentedApiIds: readonly string[];
};

const g = globalThis as typeof globalThis & {
  __jagStudioKnowledgeHealthTrend?: GraphHealthSnapshot[];
};

function trendStore(): GraphHealthSnapshot[] {
  if (!g.__jagStudioKnowledgeHealthTrend) g.__jagStudioKnowledgeHealthTrend = [];
  return g.__jagStudioKnowledgeHealthTrend;
}

export function clearKnowledgeHealthTrend(): void {
  g.__jagStudioKnowledgeHealthTrend = [];
}

export function buildGraphHealthReport(input?: {
  root?: string;
  productId?: string;
}): GraphHealthReport {
  const root = input?.root;
  const productId = input?.productId ?? "academyos";
  const graph = buildKnowledgeGraph({ root });
  const coverage = buildKnowledgeCoverage(root);
  const recs = generateKnowledgeRecommendations({ root, productId });
  const readiness = evaluateReleaseReadiness({
    productId,
    targetStage: "RC-3",
    root,
  });

  const services = graph.nodes.filter((n) => n.kind === "service");
  const apis = graph.nodes.filter((n) => n.kind === "api");
  const modules = graph.nodes.filter((n) => n.kind === "module");
  const docs = graph.nodes.filter((n) => n.kind === "document");
  const pers = graph.nodes.filter((n) => n.kind === "per");

  const referenced = new Set(graph.edges.flatMap((e) => [e.from, e.to]));
  const orphanNodeCount = graph.nodes.filter(
    (n) => !referenced.has(n.id) && n.kind !== "role"
  ).length;

  // Expected relationship kinds density vs nodes that should participate
  const expectedLinks = Math.max(
    1,
    services.length + apis.length + modules.length
  );
  const validates = graph.edges.filter(
    (e) => e.kind === "VALIDATES" || e.kind === "VALIDATED_BY"
  ).length;
  const exposes = graph.edges.filter((e) => e.kind === "EXPOSES").length;
  const docsEdges = graph.edges.filter(
    (e) => e.kind === "DOCUMENTS" || e.kind === "DESCRIBES"
  ).length;
  const depends = graph.edges.filter((e) => e.kind === "DEPENDS_ON").length;
  const relationshipCompleteness = Math.min(
    100,
    Math.round(
      ((validates + exposes + docsEdges + depends) /
        Math.max(expectedLinks * 2, 1)) *
        1000
    ) / 10
  );

  const disconnectedModules = modules.filter(
    (m) => !graph.edges.some((e) => e.from === m.id || e.to === m.id)
  ).length;

  const staleCutoff = Date.now() - 180 * 24 * 60 * 60 * 1000;
  const staleDocumentation = docs.filter((d) => {
    const t = Date.parse(d.updatedAt);
    return Number.isFinite(t) && t < staleCutoff;
  }).length;

  const stalePerReferences = pers.filter(
    (p) =>
      p.metadata.status === "Open" ||
      !graph.edges.some((e) => e.from === p.id && e.kind === "AFFECTS")
  ).length;

  const ageMs = Date.now() - new Date(graph.builtAt).getTime();
  const graphFreshness =
    ageMs < 60_000 ? "fresh" : ageMs < 15 * 60_000 ? "warm" : "stale";

  const untestedServices = coverage.untestedServices.length;
  const undocumentedApis = coverage.undocumentedApis.length;

  const highConf = recs.recommendations.filter((r) => r.confidence === "High")
    .length;
  const reasoningConfidence =
    recs.recommendations.length === 0
      ? 100
      : Math.round((highConf / recs.recommendations.length) * 1000) / 10;

  const packagesWithNodes = new Set(
    graph.nodes.map((n) => n.ownerPackage).filter(Boolean)
  ).size;
  const repositoryCoverage = Math.min(
    100,
    Math.round((packagesWithNodes / Math.max(graph.countsByKind.package, 1)) * 1000) /
      10
  );

  const healthScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        relationshipCompleteness * 0.35 +
          readiness.readinessScore * 0.25 +
          Math.max(0, 100 - untestedServices) * 0.15 +
          Math.max(0, 100 - undocumentedApis * 0.5) * 0.1 +
          Math.max(0, 100 - orphanNodeCount * 0.3) * 0.15
      )
    )
  );

  const snapshot: GraphHealthSnapshot = {
    at: new Date().toISOString(),
    graphVersion: graph.version,
    nodeCount: graph.nodes.length,
    relationshipCount: graph.edges.length,
    relationshipCompleteness,
    orphanNodeCount,
    undocumentedApis,
    untestedServices,
    disconnectedModules,
    staleDocumentation,
    stalePerReferences,
    graphFreshness,
    healthScore,
    reasoningConfidence,
    repositoryCoverage,
    rc3Readiness: readiness.readinessScore,
  };

  const trend = trendStore();
  const last = trend[trend.length - 1];
  if (!last || last.graphVersion !== snapshot.graphVersion || last.relationshipCount !== snapshot.relationshipCount) {
    trend.push(snapshot);
    if (trend.length > 30) trend.splice(0, trend.length - 30);
  }

  const recommendedWork = recs.recommendations.slice(0, 12).map((r) => r.title);

  return {
    ...snapshot,
    generatedAt: snapshot.at,
    trend: Object.freeze([...trend]),
    recommendedWork: Object.freeze(recommendedWork),
    relationshipCoverage: relationshipCompleteness,
    untestedServiceIds: Object.freeze(coverage.untestedServices.slice(0, 40)),
    undocumentedApiIds: Object.freeze(coverage.undocumentedApis.slice(0, 40)),
  };
}

export function createGraphHealthService() {
  return { build: buildGraphHealthReport };
}
