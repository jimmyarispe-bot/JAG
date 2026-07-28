/**
 * Product Quality Score — transparent weighted evidence score.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { buildArchitectureView } from "../architecture/analyzer";
import { analyzeDependencies } from "../dependencies/analyzer";
import { buildDocumentationIntelligence } from "../documentation/intelligence";
import { buildArchitectureDashboard } from "../graph/dashboard";
import { createPerEngine } from "../per/engine";
import { createProductRegistryService } from "../products/registry";
import { buildTestingWorkspace } from "../testing/workspace";
import type { StudioProductId } from "../types";
import {
  getQualityWeights,
  type QualityWeightKey,
  type QualityWeights,
} from "./config";

export type QualityComponent = {
  readonly key: QualityWeightKey;
  readonly label: string;
  readonly rawScore: number;
  readonly weight: number;
  readonly weighted: number;
  readonly evidence: readonly string[];
};

export type ProductQualityScore = {
  readonly productId: string;
  readonly overall: number;
  readonly weights: QualityWeights;
  readonly components: readonly QualityComponent[];
  readonly generatedAt: string;
  readonly methodology: string;
};

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n * 10) / 10));
}

export function computeProductQualityScore(input: {
  productId: StudioProductId | string;
  root?: string;
}): ProductQualityScore {
  const root = input.root ?? process.cwd();
  const weights = getQualityWeights();
  const product = createProductRegistryService().get(
    input.productId as StudioProductId
  );
  const testing = buildTestingWorkspace(root);
  const architecture = buildArchitectureView(root);
  const docs = buildDocumentationIntelligence(root);
  const deps = analyzeDependencies({ root });
  const archDash = buildArchitectureDashboard(root);
  const pers = createPerEngine().list().filter(
    (p) =>
      p.originatingPack === input.productId ||
      p.packsMentioning.includes(input.productId)
  );
  const openPers = pers.filter(
    (p) => p.status === "Open" || p.status === "Accepted"
  ).length;

  const hasPerf =
    existsSync(join(root, "perf-bundle-budget-report.json")) ||
    existsSync(join(root, "docs/academyos/rc2"));
  const hasA11y =
    existsSync(join(root, "docs/academyos/rc2")) ||
    testing.suites.some((s) => /a11y|accessib/i.test(s.name));

  const critical = deps.issues.filter((i) => i.severity === "Critical").length;
  const securityScore = clamp(
    100 - critical * 30 - deps.issues.filter((i) => i.severity === "Error").length * 5
  );
  const debtScore = clamp(100 - openPers * 4 - archDash.dependencyRisk * 0.4);
  const releaseReadiness = clamp(
    (product?.completionPercent ?? 0) * 0.5 +
      (product?.certification === "Certified"
        ? 50
        : product?.certification === "Pending"
          ? 30
          : 10)
  );

  const raw: Record<QualityWeightKey, { score: number; evidence: string[]; label: string }> = {
    testHealth: {
      label: "Test health",
      score: testing.overallPassRate,
      evidence: [`passRate=${testing.overallPassRate}`, `suites=${testing.suites.length}`],
    },
    architectureHealth: {
      label: "Architecture health",
      score: clamp(
        (architecture.healthScore + archDash.architectureHealthScore) / 2
      ),
      evidence: [
        `layerHealth=${architecture.healthScore}`,
        `graphHealth=${archDash.architectureHealthScore}`,
        `violations=${architecture.violations.length}`,
      ],
    },
    documentationCoverage: {
      label: "Documentation coverage",
      score: clamp((docs.coveragePercent + archDash.documentationCoverage) / 2),
      evidence: [
        `docs=${docs.coveragePercent}`,
        `apiDocs=${archDash.documentationCoverage}`,
      ],
    },
    performanceBaselines: {
      label: "Performance baselines",
      score: hasPerf ? 85 : input.productId === "academyos" ? 40 : 60,
      evidence: [hasPerf ? "baseline present" : "baseline missing"],
    },
    securityFindings: {
      label: "Security findings",
      score: securityScore,
      evidence: [`critical=${critical}`, `risk=${deps.riskScore}`],
    },
    technicalDebt: {
      label: "Technical debt (inverted)",
      score: debtScore,
      evidence: [`openPers=${openPers}`, `dependencyRisk=${archDash.dependencyRisk}`],
    },
    accessibility: {
      label: "Accessibility",
      score: hasA11y ? 90 : input.productId === "academyos" ? 35 : 70,
      evidence: [hasA11y ? "a11y evidence" : "a11y gap"],
    },
    releaseReadiness: {
      label: "Release readiness",
      score: releaseReadiness,
      evidence: [
        `completion=${product?.completionPercent ?? 0}`,
        `status=${product?.releaseStatus ?? "Development"}`,
        `certification=${product?.certification ?? "None"}`,
      ],
    },
  };

  const components: QualityComponent[] = (
    Object.keys(weights) as QualityWeightKey[]
  ).map((key) => {
    const w = weights[key];
    const r = raw[key];
    const weighted = Math.round(((r.score * w) / 100) * 10) / 10;
    return {
      key,
      label: r.label,
      rawScore: r.score,
      weight: w,
      weighted,
      evidence: Object.freeze(r.evidence),
    };
  });

  const overall = clamp(
    components.reduce((a, c) => a + c.weighted, 0)
  );

  return {
    productId: input.productId,
    overall,
    weights,
    components: Object.freeze(components),
    generatedAt: new Date().toISOString(),
    methodology:
      "overall = Σ (rawScore_i × weight_i / 100); weights configurable via setQualityWeights; evidence from Studio catalog, tests, docs, deps, PERs.",
  };
}

export function createQualityService() {
  return {
    score: computeProductQualityScore,
    scoreAll(root?: string) {
      return Object.freeze(
        createProductRegistryService()
          .list()
          .map((p) => computeProductQualityScore({ productId: p.id, root }))
      );
    },
  };
}
