import { buildArchitectureView } from "../architecture/analyzer";
import { ensureCertificationRecord } from "../certification/engine";
import { buildDocumentationIntelligence } from "../documentation/intelligence";
import { getApprovalWorkflow } from "../governance/approvals";
import { buildArchitectureDashboard } from "../graph/dashboard";
import { createPerEngine } from "../per/engine";
import { evaluatePolicies } from "../policies/engine";
import { createProductRegistryService } from "../products/registry";
import { computeProductQualityScore } from "../quality/scorer";
import { createReleaseManager } from "../release/manager";
import { buildTestingWorkspace } from "../testing/workspace";
import type { StudioDashboard, StudioInsightsSummary } from "../types";

export function buildStudioInsightsSummary(root?: string): StudioInsightsSummary {
  const architecture = buildArchitectureView(root);
  const products = createProductRegistryService().list();
  const testing = buildTestingWorkspace(root);
  const docs = buildDocumentationIntelligence(root);
  const pers = createPerEngine().list();
  const releases = createReleaseManager().list();
  const archDash = buildArchitectureDashboard(root);
  const academyQuality = computeProductQualityScore({
    productId: "academyos",
    root,
  });
  const academyPolicy = evaluatePolicies({ productId: "academyos", root });
  const academyCert = ensureCertificationRecord("academyos", root, {
    lightweight: true,
  });
  const awaitingApprovalCount = products.filter((p) => {
    const wf = getApprovalWorkflow({ productId: p.id });
    return Boolean(wf.nextRole) && !wf.complete && !wf.blocked;
  }).length;
  const blockedReleaseCount = products.filter((p) => {
    if (p.id === "academyos") return academyCert.outstandingBlockers.length > 0;
    const cert = ensureCertificationRecord(p.id, root, { lightweight: true });
    return cert.outstandingBlockers.length > 0;
  }).length;

  const productCompletion =
    products.length === 0
      ? 0
      : Math.round(
          (products.reduce((a, p) => a + p.completionPercent, 0) /
            products.length) *
            10
        ) / 10;

  const releasedOrCertified = releases.filter(
    (r) => r.status === "Released" || r.status === "Certified" || r.status === "RC"
  ).length;
  const releaseReadiness =
    releases.length === 0
      ? 0
      : Math.round((releasedOrCertified / Math.max(releases.length, 1)) * 1000) /
        10;

  const openPers = pers.filter(
    (p) => p.status === "Open" || p.status === "Accepted"
  ).length;
  const technicalDebt = Math.min(
    100,
    openPers * 4 +
      architecture.violations.length * 5 +
      Math.round(archDash.dependencyRisk * 0.3)
  );
  const perGrowth = openPers;

  const academy = products.find((p) => p.id === "academyos");
  const sdkAdoption = academy ? Math.min(100, academy.completionPercent) : 50;
  const connectorHealth =
    architecture.packageHealth.connectors?.healthy === false ? 60 : 90;

  const apiCount = archDash.apiMap.length;
  const documentedApis = archDash.apiMap.filter((a) =>
    Object.keys(archDash.testCoverageByPackage).length >= 0
  ).length;
  // API reuse: fraction of APIs under shared packages (studio/platform) vs pack-only
  const sharedApis = archDash.apiMap.filter(
    (a) =>
      a.packageId == null ||
      a.path.includes("/studio/") ||
      a.path.includes("platform")
  ).length;
  const apiReuse =
    apiCount === 0 ? 0 : Math.round((sharedApis / apiCount) * 1000) / 10;
  const connectorReuse = Math.min(
    100,
    archDash.connectorMap.length * 20 +
      (archDash.connectorMap.some((c) => c.path.includes("connectors/"))
        ? 20
        : 0)
  );

  // Debt trend proxy: current debt vs recommendation pressure
  const recTotal = Object.values(archDash.recommendationCounts).reduce(
    (a, b) => a + b,
    0
  );
  const technicalDebtTrend = Math.min(100, technicalDebt + Math.round(recTotal / 2));

  const recommendedWork: string[] = [];
  if (architecture.healthScore < 90) {
    recommendedWork.push("Resolve architecture violations and missing layers.");
  }
  if (archDash.dependencyRisk > 40) {
    recommendedWork.push(
      `Dependency risk is ${archDash.dependencyRisk} — review circular deps and unused APIs.`
    );
  }
  if (openPers > 0) {
    recommendedWork.push(`Triage ${openPers} open PER(s); promote multi-pack PERs.`);
  }
  const promote = pers.filter((p) => p.promoteToFoundation);
  if (promote.length > 0) {
    recommendedWork.push(
      `${promote.length} PER(s) recommended for Platform Foundation promotion.`
    );
  }
  if ((academy?.completionPercent ?? 0) < 100) {
    recommendedWork.push("Advance AcademyOS toward Certified / Released.");
  }
  if (docs.missingDocumentation.length > 0) {
    recommendedWork.push("Fill missing Studio documentation files.");
  }
  if (testing.totalFailures > 0) {
    recommendedWork.push("Investigate failing suites in Testing Workspace.");
  }
  if (recommendedWork.length === 0) {
    recommendedWork.push("Platform healthy — plan next industry pack scaffold.");
  }

  void documentedApis;

  return {
    architectureHealth: Math.round(
      (architecture.healthScore * 0.5 + archDash.architectureHealthScore * 0.5) *
        10
    ) / 10,
    productCompletion,
    releaseReadiness: Math.min(
      100,
      releaseReadiness ||
        (academy?.releaseStatus === "RC" ||
        academy?.releaseStatus === "RC-1" ||
        academy?.releaseStatus === "RC-2" ||
        academy?.releaseStatus === "RC-3" ||
        academy?.releaseStatus === "RC-4"
          ? 75
          : 20)
    ),
    testHealth: testing.overallPassRate,
    technicalDebt,
    documentationCoverage: Math.round(
      (docs.coveragePercent * 0.5 + archDash.documentationCoverage * 0.5) * 10
    ) / 10,
    perGrowth,
    sdkAdoption,
    connectorHealth,
    openPers,
    recommendedWork: Object.freeze(recommendedWork),
    dependencyRisk: archDash.dependencyRisk,
    apiReuse,
    connectorReuse,
    technicalDebtTrend,
    recommendationCountBySeverity: Object.freeze({
      Info: archDash.recommendationCounts.Info ?? 0,
      Warning: archDash.recommendationCounts.Warning ?? 0,
      Error: archDash.recommendationCounts.Error ?? 0,
      Critical: archDash.recommendationCounts.Critical ?? 0,
    }),
    testCoverageByPackage: archDash.testCoverageByPackage,
    productQualityScore: academyQuality.overall,
    policyCompliancePercent: academyPolicy.compliancePercent,
    blockedReleaseCount,
    awaitingApprovalCount,
  };
}

export function buildStudioDashboard(root?: string): StudioDashboard {
  createPerEngine().sync(root);
  const products = createProductRegistryService().list();
  const architecture = buildArchitectureView(root);
  const openPers = createPerEngine()
    .list()
    .filter((p) => p.status === "Open" || p.status === "Accepted");
  const testing = buildTestingWorkspace(root);
  const insights = buildStudioInsightsSummary(root);
  const releaseStatus: Record<string, (typeof products)[number]["releaseStatus"]> =
    {};
  for (const p of products) releaseStatus[p.id] = p.releaseStatus;

  const platformHealth = Math.round(
    (insights.architectureHealth * 0.25 +
      insights.testHealth * 0.25 +
      (100 - Math.min(100, insights.technicalDebt)) * 0.2 +
      insights.documentationCoverage * 0.15 +
      insights.productCompletion * 0.15) *
      10
  ) / 10;

  return {
    platformHealth,
    products,
    releaseStatus: Object.freeze(releaseStatus),
    architecture,
    openPers: Object.freeze(openPers),
    testing,
    recommendedWork: insights.recommendedWork,
    insights,
    generatedAt: new Date().toISOString(),
  };
}
