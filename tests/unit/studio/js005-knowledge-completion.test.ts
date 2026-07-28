/**
 * JS-005 — Knowledge Graph Completion & RC-3 Readiness
 */

import { afterEach, describe, expect, it } from "vitest";
import { join } from "node:path";
import {
  buildGraphHealthReport,
  buildKnowledgeCoverage,
  buildKnowledgeDashboard,
  buildKnowledgeGraph,
  evaluateReleaseReadiness,
  generateKnowledgeRecommendations,
  installJagStudio,
  resetStudioStoreForTests,
} from "@studio";
import {
  resetPlatformSdkForTests,
  resetPlatformSdkStoreForTests,
} from "@/lib/platform-sdk";

const root = join(__dirname, "../../..");
const ORG = "org.studio.js005";

/** JS-004 observed baseline edge counts (approximate floors to beat). */
const JS004_VALIDATES_BASELINE = 2;
const JS004_EXPOSES_BASELINE = 0;

afterEach(() => {
  resetStudioStoreForTests();
  resetPlatformSdkStoreForTests();
  resetPlatformSdkForTests();
});

describe("JS-005 Knowledge Graph Completion", () => {
  it(
    "densifies relationships from repository evidence",
    () => {
      installJagStudio({
        organizationId: ORG,
        freshSdk: true,
        repositoryRoot: root,
      });
      const g = buildKnowledgeGraph({ root, force: true });
      const validates = g.edges.filter(
        (e) => e.kind === "VALIDATES" || e.kind === "VALIDATED_BY"
      ).length;
      const exposes = g.edges.filter((e) => e.kind === "EXPOSES").length;
      const depends = g.edges.filter((e) => e.kind === "DEPENDS_ON").length;
      const documents = g.edges.filter((e) => e.kind === "DOCUMENTS").length;
      const affects = g.edges.filter((e) => e.kind === "AFFECTS").length;
      const provides = g.edges.filter((e) => e.kind === "PROVIDES").length;

      expect(g.edges.length).toBeGreaterThan(1500);
      expect(validates).toBeGreaterThan(JS004_VALIDATES_BASELINE * 10);
      expect(exposes).toBeGreaterThan(JS004_EXPOSES_BASELINE);
      expect(depends).toBeGreaterThan(0);
      expect(documents).toBeGreaterThan(0);
      expect(affects).toBeGreaterThan(0);
      expect(provides).toBeGreaterThan(0);

      // Consistency
      const ids = new Set(g.nodes.map((n) => n.id));
      for (const e of g.edges) {
        expect(ids.has(e.from)).toBe(true);
        expect(ids.has(e.to)).toBe(true);
      }
    },
    120_000
  );

  it(
    "computes coverage metrics and API intelligence from the graph",
    () => {
      installJagStudio({
        organizationId: ORG,
        freshSdk: true,
        repositoryRoot: root,
      });
      buildKnowledgeGraph({ root, force: true });
      const coverage = buildKnowledgeCoverage(root);

      expect(coverage.byProduct.length).toBeGreaterThan(0);
      expect(coverage.byPackage.length).toBeGreaterThan(0);
      expect(coverage.byModule.length).toBeGreaterThan(0);
      expect(coverage.byService.length).toBeGreaterThan(0);
      expect(Array.isArray(coverage.untestedServices)).toBe(true);
      expect(Array.isArray(coverage.weaklyTestedApis)).toBe(true);
      expect(coverage.apiIntelligence.length).toBeGreaterThan(0);
      expect(coverage.apiIntelligence[0]!.missing).toBeDefined();

      const academyPkg = coverage.byPackage.find((p) =>
        p.id.includes("academyos")
      );
      expect(academyPkg).toBeTruthy();
    },
    120_000
  );

  it(
    "evaluates AcademyOS RC-3 readiness from governance + graph evidence",
    () => {
      installJagStudio({
        organizationId: ORG,
        freshSdk: true,
        repositoryRoot: root,
      });
      buildKnowledgeGraph({ root, force: true });
      const readiness = evaluateReleaseReadiness({
        productId: "academyos",
        targetStage: "RC-3",
        root,
      });

      expect(readiness.productId).toBe("academyos");
      expect(readiness.targetStage).toBe("RC-3");
      expect(readiness.readinessScore).toBeGreaterThanOrEqual(0);
      expect(readiness.readinessScore).toBeLessThanOrEqual(100);
      expect(typeof readiness.gatePassed).toBe("boolean");
      expect(typeof readiness.policyPassed).toBe("boolean");
      expect(readiness.summary.length).toBeGreaterThan(10);
      expect(Array.isArray(readiness.blockers)).toBe(true);
      // Blockers cite evidence sources from governance/graph
      for (const b of readiness.blockers.slice(0, 5)) {
        expect(b.evidence.length).toBeGreaterThan(0);
        expect([
          "gate",
          "policy",
          "graph",
          "certification",
          "per",
        ]).toContain(b.source);
      }
    },
    120_000
  );

  it(
    "generates evidence-backed recommendations with confidence and impact",
    () => {
      installJagStudio({
        organizationId: ORG,
        freshSdk: true,
        repositoryRoot: root,
      });
      buildKnowledgeGraph({ root, force: true });
      const report = generateKnowledgeRecommendations({
        root,
        productId: "academyos",
      });

      expect(report.recommendations.length).toBeGreaterThan(0);
      const sample = report.recommendations[0]!;
      expect(sample.severity).toBeTruthy();
      expect(sample.confidence).toBeTruthy();
      expect(sample.evidence.length).toBeGreaterThan(0);
      expect(sample.affectedProducts.length).toBeGreaterThan(0);
      expect(sample.estimatedImpact).toBeTruthy();
      expect(sample.score).toBeGreaterThan(0);

      // Deterministic ordering
      const again = generateKnowledgeRecommendations({
        root,
        productId: "academyos",
      });
      expect(again.recommendations.map((r) => r.id)).toEqual(
        report.recommendations.map((r) => r.id)
      );
    },
    120_000
  );

  it(
    "exposes graph health metrics, trends, and extended dashboard",
    () => {
      installJagStudio({
        organizationId: ORG,
        freshSdk: true,
        repositoryRoot: root,
      });
      buildKnowledgeGraph({ root, force: true });
      const health = buildGraphHealthReport({
        root,
        productId: "academyos",
      });
      expect(health.relationshipCompleteness).toBeGreaterThan(0);
      expect(health.nodeCount).toBeGreaterThan(100);
      expect(health.relationshipCount).toBeGreaterThan(100);
      expect(health.trend.length).toBeGreaterThanOrEqual(1);
      expect(health.rc3Readiness).toBeGreaterThanOrEqual(0);
      expect(health.recommendedWork.length).toBeGreaterThan(0);

      const dash = buildKnowledgeDashboard(root);
      expect(dash.relationshipCoverage).toBeGreaterThan(0);
      expect(dash.rc3Readiness).toBeGreaterThanOrEqual(0);
      expect(dash.recommendedWork.length).toBeGreaterThan(0);
      expect(Array.isArray(dash.untestedServices)).toBe(true);
      expect(Array.isArray(dash.undocumentedApis)).toBe(true);
    },
    120_000
  );
});
