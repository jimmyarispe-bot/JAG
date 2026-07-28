/**
 * JS-002 — Repository Intelligence & Architecture Graph
 */

import { afterEach, describe, expect, it } from "vitest";
import { join } from "node:path";
import {
  analyzeDependencies,
  analyzeImpact,
  buildArchitectureDashboard,
  buildArchitectureGraph,
  buildStudioInsightsSummary,
  createCatalogService,
  createGraphService,
  createRecommendationEngine,
  createSearchService,
  indexRepositoryCatalog,
  installJagStudio,
  resetStudioStoreForTests,
} from "@studio";
import {
  resetPlatformSdkForTests,
  resetPlatformSdkStoreForTests,
} from "@/lib/platform-sdk";

const root = join(__dirname, "../../..");
const ORG = "org.studio.js002";

afterEach(() => {
  resetStudioStoreForTests();
  resetPlatformSdkStoreForTests();
  resetPlatformSdkForTests();
});

describe("JS-002 Architecture Graph & Catalog", () => {
  it(
    "indexes a persistent catalog and reuses it until force rebuild",
    () => {
      const first = indexRepositoryCatalog({ root, force: true });
      expect(first.entries.length).toBeGreaterThan(20);
      expect(first.counts.package).toBeGreaterThanOrEqual(2);
      expect(first.counts.api).toBeGreaterThan(0);
      expect(first.counts.doc).toBeGreaterThan(0);
      expect(first.counts.test).toBeGreaterThan(0);
      expect(first.entries.some((e) => e.kind === "service")).toBe(true);
      expect(first.entries.some((e) => e.kind === "insight_provider")).toBe(
        true
      );
      expect(first.entries.some((e) => e.kind === "per")).toBe(true);

      const second = indexRepositoryCatalog({ root, force: false });
      expect(second.version).toBe(first.version);
      expect(second.indexedAt).toBe(first.indexedAt);

      const third = indexRepositoryCatalog({ root, force: true });
      expect(third.entries.length).toBeGreaterThanOrEqual(first.entries.length);

      const studioPkgs = createCatalogService().search({
        root,
        kind: "package",
        q: "studio",
      });
      expect(studioPkgs.some((e) => e.name === "studio")).toBe(true);
    },
    45_000
  );

  it(
    "builds a multi-package architecture graph with relationships",
    () => {
      const graph = buildArchitectureGraph({ root, force: true });
      expect(graph.nodes.length).toBeGreaterThan(10);
      expect(graph.edges.length).toBeGreaterThan(0);
      expect(graph.nodes.some((n) => n.kind === "package")).toBe(true);
      expect(graph.nodes.some((n) => n.kind === "api")).toBe(true);
      expect(
        graph.nodes.some((n) => n.ownerPackage === "academyos")
      ).toBe(true);
      expect(graph.nodes.some((n) => n.ownerPackage === "studio")).toBe(true);

      const svc = createGraphService();
      const summary = svc.summarize(root);
      expect(summary.nodeCount).toBe(graph.nodes.length);
      expect(summary.edgeCount).toBe(graph.edges.length);

      const pkg = graph.nodes.find((n) => n.id === "package:studio");
      if (pkg) {
        const deps = svc.dependencies(pkg.id, root);
        expect(Array.isArray(deps)).toBe(true);
      }
    },
    45_000
  );

  it(
    "detects dependency issues and generates evidence-based recommendations",
    () => {
      const deps = analyzeDependencies({ root, force: true });
      expect(deps.issues.length).toBeGreaterThan(0);
      expect(deps.riskScore).toBeGreaterThanOrEqual(0);
      expect(
        deps.issues.every((i) => i.evidence.length > 0 && i.rule.length > 0)
      ).toBe(true);

      const recs = createRecommendationEngine().generate({ root });
      expect(recs.recommendations.length).toBeGreaterThan(0);
      expect(
        recs.recommendations.every((r) => r.evidence.length > 0 && r.score > 0)
      ).toBe(true);
      expect(
        Object.values(recs.countsBySeverity).reduce((a, b) => a + b, 0)
      ).toBe(recs.recommendations.length);
    },
    45_000
  );

  it(
    "semantic search finds concepts across packages, APIs, docs, and tests",
    () => {
      indexRepositoryCatalog({ root, force: true });
      const search = createSearchService();

      const attendance = search.search({
        query: "student attendance",
        root,
        limit: 30,
      });
      expect(attendance.hits.length).toBeGreaterThan(0);
      expect(attendance.tokens).toContain("attendance");

      const insights = search.search({
        query: "Insight Providers",
        root,
        limit: 20,
      });
      expect(
        insights.hits.some(
          (h) =>
            h.entry.kind === "insight_provider" ||
            h.entry.keywords.includes("insight") ||
            h.entry.path.includes("insight")
        )
      ).toBe(true);

      const tuition = search.search({ query: "tuition", root, limit: 20 });
      expect(tuition.hits.length).toBeGreaterThan(0);

      const perms = search.search({
        query: "role permissions",
        root,
        limit: 20,
      });
      expect(perms.hits.length).toBeGreaterThan(0);
    },
    45_000
  );

  it(
    "impact analysis estimates blast radius for a proposed change",
    () => {
      indexRepositoryCatalog({ root, force: true });
      const impact = analyzeImpact({
        root,
        target: "academyos",
        changeKind: "modify_service",
      });
      expect(impact.affectedPackages.length).toBeGreaterThan(0);
      expect(impact.summary.length).toBeGreaterThan(10);
      expect(["Low", "Medium", "High", "Critical"]).toContain(impact.severity);

      const apiImpact = analyzeImpact({
        root,
        target: "studio",
        changeKind: "remove_api",
      });
      expect(apiImpact.affectedNodes.length).toBeGreaterThan(0);
    },
    45_000
  );

  it(
    "architecture dashboard and insight summary expose JS-002 signals",
    () => {
      installJagStudio({
        organizationId: ORG,
        freshSdk: true,
        repositoryRoot: root,
      });
      const dash = buildArchitectureDashboard(root);
      expect(dash.packageDependencyGraph.nodes.length).toBeGreaterThan(0);
      expect(dash.apiMap.length).toBeGreaterThan(0);
      expect(dash.insightProviderMap.length).toBeGreaterThan(0);
      expect(Object.keys(dash.testCoverageByPackage).length).toBeGreaterThan(0);
      expect(dash.architectureHealthScore).toBeGreaterThanOrEqual(0);
      expect(dash.dependencyRisk).toBeGreaterThanOrEqual(0);

      const summary = buildStudioInsightsSummary(root);
      expect(summary.dependencyRisk).toBeGreaterThanOrEqual(0);
      expect(summary.apiReuse).toBeGreaterThanOrEqual(0);
      expect(summary.connectorReuse).toBeGreaterThanOrEqual(0);
      expect(summary.technicalDebtTrend).toBeGreaterThanOrEqual(0);
      expect(summary.recommendationCountBySeverity).toBeDefined();
      expect(summary.testCoverageByPackage).toBeDefined();
    },
    60_000
  );
});
