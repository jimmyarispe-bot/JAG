/**
 * Shared Decision Center evidence context — compute once per request.
 */

import { analyzeDependencies } from "../dependencies/analyzer";
import type { DependencyReport } from "../dependencies/analyzer";
import { buildArchitectureView } from "../architecture/analyzer";
import { buildDocumentationIntelligence } from "../documentation/intelligence";
import { buildKnowledgeCoverage } from "../knowledge/coverage/metrics";
import type { KnowledgeCoverageReport } from "../knowledge/coverage/metrics";
import { buildKnowledgeGraph } from "../knowledge/graph/builder";
import type { KnowledgeGraph } from "../knowledge/graph/types";
import { generateKnowledgeRecommendations } from "../knowledge/recommendations/engine";
import type { RecommendationReport } from "../knowledge/recommendations/engine";
import { evaluateReleaseReadiness } from "../knowledge/release/readiness";
import type { ReleaseReadinessReport } from "../knowledge/release/readiness";
import { createPerEngine } from "../per/engine";
import { evaluatePolicies } from "../policies/engine";
import { createProductRegistryService } from "../products/registry";
import { evaluateReleaseGates } from "../releases/gates";
import type { GateEvaluationReport } from "../releases/gates";
import { buildTestingWorkspace } from "../testing/workspace";
import type {
  ArchitectureView,
  DocumentationIntelligence,
  StudioPer,
  StudioProduct,
  TestingWorkspaceView,
} from "../types";

export type DecisionEvidenceContext = {
  readonly root: string | undefined;
  readonly graph: KnowledgeGraph;
  readonly coverage: KnowledgeCoverageReport;
  readonly products: readonly StudioProduct[];
  readonly pers: readonly StudioPer[];
  readonly academyReadiness: ReleaseReadinessReport;
  readonly academyGates: GateEvaluationReport;
  readonly academyRecommendations: RecommendationReport;
  readonly architecture: ArchitectureView;
  readonly dependencies: DependencyReport;
  readonly testing: TestingWorkspaceView;
  readonly docs: DocumentationIntelligence;
  readonly qualityByProduct: Readonly<Record<string, number>>;
};

type EvidenceCache = {
  key: string;
  ctx: DecisionEvidenceContext;
};

const g = globalThis as typeof globalThis & {
  __jagStudioDecisionEvidence?: EvidenceCache | null;
};

export function clearDecisionEvidenceContext(): void {
  g.__jagStudioDecisionEvidence = null;
}

export function buildDecisionEvidenceContext(
  root?: string
): DecisionEvidenceContext {
  const resolved = root ?? process.cwd();
  const cached = g.__jagStudioDecisionEvidence;
  if (cached && cached.key.startsWith(`${resolved}:`)) {
    return cached.ctx;
  }

  const graph = buildKnowledgeGraph({ root: resolved });
  const cacheKey = `${resolved}:${graph.version}`;
  if (cached?.key === cacheKey) {
    return cached.ctx;
  }

  const coverage = buildKnowledgeCoverage(resolved);
  const products = createProductRegistryService().list();
  const pers = createPerEngine().sync(resolved);
  const architecture = buildArchitectureView(resolved);
  const dependencies = analyzeDependencies({ root: resolved });
  const testing = buildTestingWorkspace(resolved);
  const docs = buildDocumentationIntelligence(resolved);
  const policies = evaluatePolicies({
    productId: "academyos",
    root: resolved,
  });

  const academyGates = evaluateReleaseGates({
    productId: "academyos",
    targetStage: "RC-3",
    root: resolved,
    evidence: {
      architecture,
      dependencies,
      testing,
      docs,
      policies,
    },
  });

  const academyReadiness = evaluateReleaseReadiness({
    productId: "academyos",
    targetStage: "RC-3",
    root: resolved,
  });

  const academyRecommendations = generateKnowledgeRecommendations({
    root: resolved,
    productId: "academyos",
  });

  // Quality proxy from shared evidence (avoid re-scanning via computeProductQualityScore).
  const qualityByProduct: Record<string, number> = {};
  for (const p of products) {
    if (p.id === "academyos") {
      qualityByProduct[p.id] = academyReadiness.readinessScore;
    } else if (p.releaseStatus === "Development" && p.certification === "None") {
      qualityByProduct[p.id] = p.completionPercent;
    } else {
      qualityByProduct[p.id] = Math.round(
        (p.completionPercent * 0.6 + architecture.healthScore * 0.4) * 10
      ) / 10;
    }
  }

  const ctx: DecisionEvidenceContext = {
    root: resolved,
    graph,
    coverage,
    products,
    pers,
    academyReadiness,
    academyGates,
    academyRecommendations,
    architecture,
    dependencies,
    testing,
    docs,
    qualityByProduct: Object.freeze(qualityByProduct),
  };

  g.__jagStudioDecisionEvidence = { key: cacheKey, ctx };
  return ctx;
}
