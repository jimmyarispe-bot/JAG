/**
 * Sprint JS-001 — JAG Studio Foundation™
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  getPlatformSdk,
  resetPlatformSdkForTests,
  resetPlatformSdkStoreForTests,
} from "@/lib/platform-sdk";
import {
  buildArchitectureView,
  buildDocumentationIntelligence,
  buildStudioDashboard,
  createPerEngine,
  createProductRegistryService,
  createReleaseManager,
  createRepositoryService,
  createStudioInsightProvider,
  createTestingWorkspaceService,
  installJagStudio,
  resetStudioStoreForTests,
  scanRepository,
} from "@studio";

const root = join(__dirname, "../../..");
const ORG = "org.studio";

afterEach(() => {
  resetStudioStoreForTests();
  resetPlatformSdkStoreForTests();
  resetPlatformSdkForTests();
});

describe("JAG Studio Foundation", () => {
  it(
    "installs, scans repository, and produces a unified dashboard",
    () => {
    const install = installJagStudio({
      organizationId: ORG,
      freshSdk: true,
      repositoryRoot: root,
    });
    expect(install.enabled).toBe(true);
    expect(install.insightProviderId).toBe("studio.platform-insights");
    expect(install.productsSeeded).toBeGreaterThanOrEqual(4);
    expect(install.persSynced).toBeGreaterThan(0);

    const providers = getPlatformSdk().registry.listInsightProviders();
    expect(providers.some((p) => p.id === "studio.platform-insights")).toBe(
      true
    );

    const scan = scanRepository(root);
    expect(scan.rootsFound).toContain("packages");
    expect(scan.rootsFound).toContain("docs");
    expect(scan.rootsFound).toContain("tests");
    expect(scan.counts.package).toBeGreaterThanOrEqual(2);
    expect(scan.entries.some((e) => e.packageId === "academyos")).toBe(true);
    expect(scan.entries.some((e) => e.packageId === "studio")).toBe(true);
    expect(scan.entries.some((e) => e.kind === "api")).toBe(true);
    expect(scan.entries.some((e) => e.kind === "test")).toBe(true);
    expect(scan.entries.some((e) => e.kind === "doc")).toBe(true);

    const repoSearch = createRepositoryService().search({
      root,
      kind: "api",
      q: "studio",
    });
    expect(repoSearch.length).toBeGreaterThan(0);

    const architecture = buildArchitectureView(root);
    expect(architecture.nodes.length).toBeGreaterThanOrEqual(7);
    expect(architecture.edges.length).toBeGreaterThan(0);
    expect(architecture.healthScore).toBeGreaterThan(0);
    expect(
      architecture.nodes.some((n) => n.layer === "Industry Packs")
    ).toBe(true);
    expect(architecture.nodes.some((n) => n.layer === "Studio")).toBe(true);

    const products = createProductRegistryService().list();
    expect(products.map((p) => p.id)).toEqual(
      expect.arrayContaining([
        "academyos",
        "healthcareos",
        "governmentos",
        "manufacturingos",
      ])
    );
    const academy = products.find((p) => p.id === "academyos");
    expect(academy?.releaseStatus).toBe("RC-2");

    const release = createReleaseManager().create({
      productId: "healthcareos",
      version: "0.1.0-alpha",
      status: "Alpha",
      releaseNotes: "Scaffold",
      createdBy: "u1",
    });
    expect("error" in release).toBe(false);
    if ("error" in release) return;
    const advanced = createReleaseManager().advance({
      releaseId: release.id,
      status: "Beta",
      actor: "u1",
      note: "Promoted to Beta",
      skipGateCheck: true, // gate enforcement covered in JS-003 tests
    });
    expect(advanced && !("error" in advanced) && advanced.status).toBe("Beta");

    const pers = createPerEngine().sync(root);
    expect(pers.some((p) => p.id === "PER-EI-InsightProviders")).toBe(true);
    const ei = pers.find((p) => p.id === "PER-EI-InsightProviders");
    expect(ei?.promoteToFoundation).toBe(true);
    expect(ei?.packsMentioning).toEqual(
      expect.arrayContaining(["academyos", "studio"])
    );

    createTestingWorkspaceService().recordRun({
      suiteId: "studio",
      passed: 2,
      failed: 0,
      coveragePercent: 80,
      actor: "ci",
    });
    createTestingWorkspaceService().recordRun({
      suiteId: "academyos",
      passed: 23,
      failed: 0,
      coveragePercent: 70,
      actor: "ci",
    });
    const testing = createTestingWorkspaceService().view(root);
    expect(testing.suites.some((s) => s.domain === "Studio")).toBe(true);
    expect(testing.suites.some((s) => s.domain === "AcademyOS")).toBe(true);
    expect(testing.overallPassRate).toBe(100);

    const docs = buildDocumentationIntelligence(root);
    expect(docs.missingDocumentation.length).toBe(0);
    expect(docs.docs.some((d) => d.category === "Studio")).toBe(true);

    const dashboard = buildStudioDashboard(root);
    expect(dashboard.platformHealth).toBeGreaterThan(0);
    expect(dashboard.products.length).toBeGreaterThanOrEqual(4);
    expect(dashboard.openPers.length).toBeGreaterThan(0);
    expect(dashboard.recommendedWork.length).toBeGreaterThan(0);
    expect(dashboard.architecture.nodes.length).toBeGreaterThan(0);
    expect(dashboard.insights.architectureHealth).toBeGreaterThan(0);

    const insights = createStudioInsightProvider().evaluate({
      organizationId: ORG,
      asOf: new Date().toISOString(),
      signals: {},
    });
    expect(Array.isArray(insights)).toBe(true);
  },
    90_000
  );
});

describe("Docs", () => {
  it("ships studio documentation", () => {
    expect(existsSync(join(root, "docs/studio/01_OVERVIEW.md"))).toBe(true);
    expect(existsSync(join(root, "docs/studio/07_API.md"))).toBe(true);
    expect(existsSync(join(root, "docs/studio/13_GOVERNANCE.md"))).toBe(true);
    expect(existsSync(join(root, "docs/studio/17_QUALITY.md"))).toBe(true);
    expect(existsSync(join(root, "docs/studio/18_KNOWLEDGE_GRAPH.md"))).toBe(
      true
    );
    expect(
      existsSync(join(root, "docs/studio/06_PLATFORM_ENHANCEMENT_REQUESTS.md"))
    ).toBe(true);
  });
});
