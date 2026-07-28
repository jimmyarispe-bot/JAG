/**
 * Knowledge Graph Health dashboard for Studio.
 */

import { buildKnowledgeGraph } from "./builder";
import type { KnowledgeGraphHealth } from "./types";
import { findDocumentation, findTests } from "../queries/engine";
import { createKnowledgeReasoningService } from "../reasoning/engine";

export function buildKnowledgeDashboard(root?: string): KnowledgeGraphHealth & {
  readonly reasoningQueries: readonly string[];
} {
  const g = buildKnowledgeGraph({ root });
  const referenced = new Set(g.edges.flatMap((e) => [e.from, e.to]));
  const orphanNodes = g.nodes
    .filter((n) => !referenced.has(n.id) && n.kind !== "role")
    .map((n) => n.id)
    .sort();

  const packages = g.nodes.filter((n) => n.kind === "package");
  const disconnectedPackages = packages
    .filter((p) => {
      const hasEdge = g.edges.some((e) => e.from === p.id || e.to === p.id);
      return !hasEdge;
    })
    .map((p) => p.id)
    .sort();

  const withDocs = packages.filter((p) => findDocumentation(p.id, root).length > 0)
    .length;
  const documentationCoverage =
    packages.length === 0
      ? 100
      : Math.round((withDocs / packages.length) * 1000) / 10;

  const services = g.nodes.filter((n) => n.kind === "service");
  const withTests = services.filter((s) => findTests(s.id, root).length > 0)
    .length;
  const testCoverage =
    services.length === 0
      ? 100
      : Math.round((withTests / Math.max(services.length, 1)) * 1000) / 10;

  const ageMs = Date.now() - new Date(g.builtAt).getTime();
  const knowledgeFreshness =
    ageMs < 60_000
      ? "fresh"
      : ageMs < 15 * 60_000
        ? "warm"
        : "stale";

  const healthScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        100 -
          orphanNodes.length * 0.5 -
          disconnectedPackages.length * 5 +
          documentationCoverage * 0.15 +
          testCoverage * 0.1
      )
    )
  );

  return {
    generatedAt: new Date().toISOString(),
    nodeCount: g.nodes.length,
    relationshipCount: g.edges.length,
    orphanNodes: Object.freeze(orphanNodes.slice(0, 50)),
    disconnectedPackages: Object.freeze(disconnectedPackages),
    documentationCoverage,
    testCoverage,
    knowledgeFreshness,
    healthScore,
    countsByKind: Object.freeze({ ...g.countsByKind }),
    edgeCountsByKind: Object.freeze(
      Object.fromEntries(
        Object.entries(g.edgeCountsByKind).map(([k, v]) => [k, v ?? 0])
      )
    ),
    reasoningQueries: createKnowledgeReasoningService().intents,
  };
}

export function createKnowledgeDashboardService() {
  return {
    build: buildKnowledgeDashboard,
  };
}
