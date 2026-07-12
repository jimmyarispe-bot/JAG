/**
 * Organizational DNA — OrganizationService (Sprint 030).
 *
 * Public façade over OrganizationDnaEngine with repository accessors.
 */

import type {
  OrganizationDnaDependencies,
  OrganizationDnaRepository as OrganizationDnaRepositoryContract,
  OrganizationService as OrganizationServiceContract,
} from "@/lib/platform/intelligence/organization-dna/contracts";
import {
  OrganizationDnaEngine as OrganizationDnaEngineImpl,
  type OrganizationDnaEngine,
} from "@/lib/platform/intelligence/organization-dna/organization-dna-engine";
import type {
  CompanyBuilderSeed,
  OrganizationDnaBaseline,
  OrganizationDnaQueryRequest,
  OrganizationDnaQueryResult,
  OrganizationDnaRequest,
  OrganizationDnaResult,
  OrganizationStage,
  GraphScope,
} from "@/lib/platform/intelligence/organization-dna/types";
import type {
  Graph,
  GraphAnalysisResult,
  GraphBuildInput,
} from "@/lib/platform/intelligence/executive-graph/types";
import type { ExecutiveDecisionResult } from "@/lib/platform/intelligence/executive-decision/types";
import type { PredictionResult } from "@/lib/platform/intelligence/predictive-intelligence/types";
import type { GovernanceResult } from "@/lib/platform/intelligence/board-governance/types";

export interface OrganizationServiceDependencies
  extends OrganizationDnaDependencies {
  engine?: OrganizationDnaEngine;
}

/**
 * OrganizationService — Sprint 030 service entry point.
 */
export class OrganizationServiceImpl implements OrganizationServiceContract {
  private readonly engine: OrganizationDnaEngineImpl;

  constructor(dependencies: OrganizationServiceDependencies = {}) {
    this.engine =
      (dependencies.engine as OrganizationDnaEngineImpl | undefined) ??
      new OrganizationDnaEngineImpl(dependencies);
  }

  build(request: OrganizationDnaRequest): OrganizationDnaResult {
    return this.engine.build(request);
  }

  buildFromSeed(
    seed: CompanyBuilderSeed,
    options: {
      graph?: Graph;
      analysis?: GraphAnalysisResult;
      graphInput?: GraphBuildInput;
      decisionResult?: ExecutiveDecisionResult;
      predictionResult?: PredictionResult;
      governanceResult?: GovernanceResult;
      baselineOverrides?: Partial<OrganizationDnaBaseline>;
      stageOverride?: OrganizationStage | null;
      scope?: GraphScope;
    } = {}
  ): OrganizationDnaResult {
    return this.engine.build({
      requestId: `seed-${seed.name ?? "org"}`,
      seed,
      graph: options.graph,
      analysis: options.analysis,
      graphInput: options.graphInput,
      decisionResult: options.decisionResult,
      predictionResult: options.predictionResult,
      governanceResult: options.governanceResult,
      baselineOverrides: options.baselineOverrides,
      stageOverride: options.stageOverride,
      scope: options.scope,
    });
  }

  query(
    result: OrganizationDnaResult,
    request: OrganizationDnaQueryRequest
  ): OrganizationDnaQueryResult {
    return this.engine.queries.ask(result, request);
  }

  repository(): OrganizationDnaRepositoryContract {
    return this.engine.repository;
  }
}

/** Alias matching Sprint 030 naming. */
export { OrganizationServiceImpl as OrganizationService };
