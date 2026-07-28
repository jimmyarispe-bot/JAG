/**
 * JS-004 — JAG Knowledge Graph™
 */

import { afterEach, describe, expect, it } from "vitest";
import { join } from "node:path";
import {
  analyzeKnowledgeImpact,
  buildKnowledgeDashboard,
  buildKnowledgeGraph,
  findNeighbors,
  findNode,
  findPath,
  findPERs,
  findProducts,
  findTests,
  getKnowledgeGraph,
  installJagStudio,
  reasonOverGraph,
  resetStudioStoreForTests,
  searchGraph,
} from "@studio";
import {
  resetPlatformSdkForTests,
  resetPlatformSdkStoreForTests,
} from "@/lib/platform-sdk";

const root = join(__dirname, "../../..");
const ORG = "org.studio.js004";

afterEach(() => {
  resetStudioStoreForTests();
  resetPlatformSdkStoreForTests();
  resetPlatformSdkForTests();
});

describe("JS-004 Knowledge Graph", () => {
  it(
    "constructs a unified graph with required layers and relationships",
    () => {
      installJagStudio({
        organizationId: ORG,
        freshSdk: true,
        repositoryRoot: root,
      });
      const g1 = buildKnowledgeGraph({ root, force: true });
      expect(g1.nodes.length).toBeGreaterThan(50);
      expect(g1.edges.length).toBeGreaterThan(20);
      expect(g1.countsByKind.product).toBeGreaterThanOrEqual(4);
      expect(g1.countsByKind.package).toBeGreaterThanOrEqual(2);
      expect(g1.countsByKind.module).toBeGreaterThanOrEqual(8);
      expect(g1.countsByKind.api).toBeGreaterThan(0);
      expect(g1.countsByKind.service).toBeGreaterThan(0);
      expect(g1.countsByKind.document).toBeGreaterThan(0);
      expect(g1.countsByKind.test).toBeGreaterThan(0);
      expect(g1.countsByKind.per).toBeGreaterThan(0);
      expect(g1.countsByKind.release).toBeGreaterThan(0);

      expect(findNode("package:academyos", root)?.kind).toBe("package");
      expect(findNode("package:studio", root)?.kind).toBe("package");
      expect(findNode("product:academyos", root)?.kind).toBe("product");
      expect(findNode("module:academyos:Finance", root)?.kind).toBe("module");

      const contains = g1.edges.some((e) => e.kind === "CONTAINS");
      const validates = g1.edges.some((e) => e.kind === "VALIDATES");
      const references = g1.edges.some((e) => e.kind === "REFERENCES");
      const certifies = g1.edges.some((e) => e.kind === "CERTIFIES");
      expect(contains).toBe(true);
      expect(validates).toBe(true);
      expect(references).toBe(true);
      expect(certifies).toBe(true);

      // Incremental: cached until force
      const g2 = buildKnowledgeGraph({ root, force: false });
      expect(g2.version).toBe(g1.version);
      expect(getKnowledgeGraph()?.version).toBe(g1.version);

      const g3 = buildKnowledgeGraph({ root, force: true });
      expect(g3.nodes.length).toBe(g1.nodes.length);
    },
    90_000
  );

  it(
    "supports deterministic queries, path finding, and search",
    () => {
      installJagStudio({
        organizationId: ORG,
        freshSdk: true,
        repositoryRoot: root,
      });
      buildKnowledgeGraph({ root, force: true });

      const products = findProducts(root);
      expect(products.some((p) => p.id === "product:academyos")).toBe(true);

      const neighbors = findNeighbors("package:academyos", root);
      expect(neighbors.length).toBeGreaterThan(0);

      const path = findPath("package:academyos", "product:academyos", root);
      expect(path).not.toBeNull();
      expect(path![0]).toBe("package:academyos");
      expect(path![path!.length - 1]).toBe("product:academyos");

      // Determinism: same path twice
      expect(findPath("package:academyos", "product:academyos", root)).toEqual(
        path
      );

      const pers = findPERs("package:academyos", root);
      expect(pers.length).toBeGreaterThan(0);

      const hits = searchGraph({ q: "tuition finance", root, limit: 20 });
      expect(hits.length).toBeGreaterThan(0);
      expect(hits[0]!.score).toBeGreaterThanOrEqual(hits[hits.length - 1]!.score);

      const studioTests = findTests("package:studio", root);
      expect(Array.isArray(studioTests)).toBe(true);
    },
    90_000
  );

  it(
    "produces impact reports and deterministic reasoning answers",
    () => {
      installJagStudio({
        organizationId: ORG,
        freshSdk: true,
        repositoryRoot: root,
      });
      buildKnowledgeGraph({ root, force: true });

      const impact = analyzeKnowledgeImpact({
        targetId: "package:academyos",
        root,
        maxDepth: 2,
      });
      expect(impact.target?.id).toBe("package:academyos");
      expect(impact.summary).toContain("API");
      expect(impact.affectedProducts.length).toBeGreaterThan(0);

      const blocked = reasonOverGraph({
        question: "Why is this release blocked?",
        root,
        productId: "academyos",
      });
      expect(blocked.intent).toBe("release_blocked");
      expect(blocked.evidence.length).toBeGreaterThanOrEqual(0);
      expect(blocked.confidence).toBeTruthy();

      const rc3 = reasonOverGraph({
        question: "What is preventing RC-3?",
        root,
        productId: "academyos",
      });
      expect(rc3.intent).toBe("preventing_rc3");

      const owner = reasonOverGraph({
        question: "Which package owns this API studio releases?",
        root,
      });
      expect(owner.intent).toBe("api_owner");

      const untested = reasonOverGraph({
        question: "Which services have no tests?",
        root,
      });
      expect(untested.intent).toBe("untested_services");

      // Deterministic answers
      expect(
        reasonOverGraph({
          question: "What is preventing RC-3?",
          root,
          productId: "academyos",
        }).answer
      ).toBe(rc3.answer);
    },
    120_000
  );

  it(
    "exposes knowledge dashboard health and graph consistency",
    () => {
      installJagStudio({
        organizationId: ORG,
        freshSdk: true,
        repositoryRoot: root,
      });
      const g = buildKnowledgeGraph({ root, force: true });
      const dash = buildKnowledgeDashboard(root);
      expect(dash.nodeCount).toBe(g.nodes.length);
      expect(dash.relationshipCount).toBe(g.edges.length);
      expect(dash.healthScore).toBeGreaterThanOrEqual(0);
      expect(dash.documentationCoverage).toBeGreaterThanOrEqual(0);
      expect(dash.testCoverage).toBeGreaterThanOrEqual(0);
      expect(dash.reasoningQueries.length).toBeGreaterThan(5);
      expect(Array.isArray(dash.orphanNodes)).toBe(true);

      // Consistency: every edge endpoint exists
      const ids = new Set(g.nodes.map((n) => n.id));
      for (const e of g.edges) {
        expect(ids.has(e.from)).toBe(true);
        expect(ids.has(e.to)).toBe(true);
      }
    },
    90_000
  );
});
