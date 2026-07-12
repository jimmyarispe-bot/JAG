/**
 * Organizational DNA & Company Builder — public API (Sprint 030).
 *
 * Foundational organizational profile and company builder that every future
 * intelligence domain consumes. Integrates optionally with Founder, Executive,
 * Predictive, Decision, and Board Governance intelligence.
 */

export {
  ORGANIZATION_DNA_VERSION,
  ORGANIZATION_STAGES,
  DNA_CONFIDENCE_LEVELS,
  DNA_PRIORITY_BANDS,
  READINESS_STATUSES,
  DNA_ARTIFACT_STATUSES,
  BUSINESS_MODEL_ARCHETYPES,
  REVENUE_STREAM_KINDS,
  FUNDING_MODEL_KINDS,
  COMPANY_BUILDER_ARTIFACT_KINDS,
  type OrganizationStage,
  type DnaConfidenceLevel,
  type DnaPriorityBand,
  type ReadinessStatus,
  type DnaArtifactStatus,
  type BusinessModelArchetype,
  type RevenueStreamKind,
  type FundingModelKind,
  type CompanyBuilderArtifactKind,
  type OrganizationDnaMetadata,
  type GraphScope,
  type DnaConfidenceScore,
  type OrganizationMission,
  type OrganizationVision,
  type OrganizationValues,
  type OrganizationCulture,
  type OrganizationalGoals,
  type OrganizationConstraints,
  type OrganizationCapabilities,
  type CustomerPersona,
  type ValueProposition,
  type RevenueStream,
  type RevenueModel,
  type FundingModel,
  type GoToMarketPlan,
  type LeanCanvas,
  type SwotAnalysis,
  type BusinessModel,
  type BusinessPlan,
  type ReadinessDimension,
  type CompanyReadinessAssessment,
  type ReadinessScoring,
  type RoadmapMilestone,
  type ExecutiveRoadmap,
  type OrganizationBlueprint,
  type KpiRecommendation,
  type ExecutivePriority,
  type OrganizationalScore,
  type CompanyBuilderSeed,
  type OrganizationProfile,
  type OrganizationDNA,
  type OrganizationDnaBaseline,
  type OrganizationDnaHistoryRecord,
  type CompanyBuilderArtifact,
  type OrganizationDnaQueryRequest,
  type OrganizationDnaQueryResult,
  type OrganizationDnaProjectionResult,
  type OrganizationDnaRequest,
  type OrganizationDnaResult,
} from "@/lib/platform/intelligence/organization-dna/types";

export type {
  OrganizationDnaDependencies,
  OrganizationDnaEngine as OrganizationDnaEngineContract,
  OrganizationService as OrganizationServiceContract,
  CompanyBuilder as CompanyBuilderContract,
  OrganizationStageDetector as OrganizationStageDetectorContract,
  OrganizationLifecycle as OrganizationLifecycleContract,
  BusinessModelEngine as BusinessModelEngineContract,
  BusinessPlanBuilder as BusinessPlanBuilderContract,
  LeanCanvasGenerator as LeanCanvasGeneratorContract,
  SwotGenerator as SwotGeneratorContract,
  ValuePropositionBuilder as ValuePropositionBuilderContract,
  CustomerPersonaBuilder as CustomerPersonaBuilderContract,
  RevenueModelBuilder as RevenueModelBuilderContract,
  FundingModelBuilder as FundingModelBuilderContract,
  GoToMarketPlanner as GoToMarketPlannerContract,
  CompanyReadinessAssessmentEngine as CompanyReadinessAssessmentEngineContract,
  ReadinessScoringEngine as ReadinessScoringEngineContract,
  ExecutiveRoadmapBuilder as ExecutiveRoadmapBuilderContract,
  OrganizationBlueprintBuilder as OrganizationBlueprintBuilderContract,
  OrganizationDnaRepository as OrganizationDnaRepositoryContract,
  OrganizationDnaQueries as OrganizationDnaQueriesContract,
  OrganizationDnaProjection as OrganizationDnaProjectionContract,
} from "@/lib/platform/intelligence/organization-dna/contracts";

export {
  clamp,
  clamp01,
  defaultOrganizationDnaBaseline,
  deriveOrganizationDnaBaseline,
  detectStageFromSignals,
  emptyDnaScope,
  levelFromValue,
  nextStage,
  normalizeSeed,
  organizationDnaModels,
  previousStage,
  priorityFromRisk,
  priorityFromScore,
  readinessFromScore,
  resolveArtifactKinds,
  stageIndex,
} from "@/lib/platform/intelligence/organization-dna/models";

export {
  OrganizationMissionBuilder,
} from "@/lib/platform/intelligence/organization-dna/organization-mission";

export {
  OrganizationVisionBuilder,
} from "@/lib/platform/intelligence/organization-dna/organization-vision";

export {
  OrganizationValuesBuilder,
} from "@/lib/platform/intelligence/organization-dna/organization-values";

export {
  OrganizationCultureBuilder,
} from "@/lib/platform/intelligence/organization-dna/organization-culture";

export {
  OrganizationalGoalsBuilder,
} from "@/lib/platform/intelligence/organization-dna/organizational-goals";

export {
  OrganizationConstraintsBuilder,
} from "@/lib/platform/intelligence/organization-dna/organization-constraints";

export {
  OrganizationCapabilitiesBuilder,
} from "@/lib/platform/intelligence/organization-dna/organization-capabilities";

export { CustomerPersonaBuilder } from "@/lib/platform/intelligence/organization-dna/customer-persona-builder";
export { ValuePropositionBuilder } from "@/lib/platform/intelligence/organization-dna/value-proposition-builder";
export { RevenueModelBuilder } from "@/lib/platform/intelligence/organization-dna/revenue-model-builder";
export { FundingModelBuilder } from "@/lib/platform/intelligence/organization-dna/funding-model-builder";
export { GoToMarketPlanner } from "@/lib/platform/intelligence/organization-dna/go-to-market-planner";
export { LeanCanvasGenerator } from "@/lib/platform/intelligence/organization-dna/lean-canvas-generator";
export { SwotGenerator } from "@/lib/platform/intelligence/organization-dna/swot-generator";
export { BusinessModelEngine } from "@/lib/platform/intelligence/organization-dna/business-model-engine";
export { BusinessPlanBuilder } from "@/lib/platform/intelligence/organization-dna/business-plan-builder";

export {
  CompanyReadinessAssessmentEngine,
  ReadinessScoringEngine,
} from "@/lib/platform/intelligence/organization-dna/company-readiness-assessment";

export {
  ExecutiveRoadmapBuilder,
  OrganizationBlueprintBuilder,
} from "@/lib/platform/intelligence/organization-dna/executive-roadmap";

export {
  OrganizationStageDetector,
} from "@/lib/platform/intelligence/organization-dna/organization-stage-detector";

export {
  OrganizationLifecycle,
} from "@/lib/platform/intelligence/organization-dna/organization-lifecycle";

export {
  OrganizationProfileBuilder,
  OrganizationalScoreBuilder,
  ExecutivePrioritiesBuilder,
  KpiRecommendationsBuilder,
} from "@/lib/platform/intelligence/organization-dna/organization-profile";

export { CompanyBuilder } from "@/lib/platform/intelligence/organization-dna/company-builder";

export {
  OrganizationDnaComposer,
} from "@/lib/platform/intelligence/organization-dna/organization-dna";

export {
  OrganizationDnaProjection,
  OrganizationDnaQueries,
} from "@/lib/platform/intelligence/organization-dna/projection";

export { OrganizationDnaRepository } from "@/lib/platform/intelligence/organization-dna/repository";

export {
  OrganizationDnaEngine,
  OrganizationDnaEngineImpl,
} from "@/lib/platform/intelligence/organization-dna/organization-dna-engine";

export {
  OrganizationService,
  OrganizationServiceImpl,
} from "@/lib/platform/intelligence/organization-dna/organization-service";

import { OrganizationDnaEngine } from "@/lib/platform/intelligence/organization-dna/organization-dna-engine";
import type { OrganizationDnaDependencies } from "@/lib/platform/intelligence/organization-dna/contracts";
import { OrganizationService } from "@/lib/platform/intelligence/organization-dna/organization-service";
import {
  createBoardGovernanceIntelligence,
  type BoardGovernanceStack,
  type CreateBoardGovernanceOptions,
} from "@/lib/platform/intelligence/board-governance";
import {
  createExecutiveDecisionIntelligence,
  type CreateExecutiveDecisionOptions,
  type ExecutiveDecisionStack,
} from "@/lib/platform/intelligence/executive-decision";
import {
  createExecutiveGraphAnalyzer,
  type CreateExecutiveGraphAnalyzerOptions,
  type ExecutiveGraphAnalyzerStack,
} from "@/lib/platform/intelligence/executive-graph";
import {
  createPredictiveIntelligence,
  type CreatePredictiveIntelligenceOptions,
  type PredictiveIntelligenceStack,
} from "@/lib/platform/intelligence/predictive-intelligence";

/** Wired Organizational DNA & Company Builder stack. */
export interface OrganizationDnaStack {
  service: OrganizationService;
  engine: OrganizationDnaEngine;
  graphAnalyzer: ExecutiveGraphAnalyzerStack | null;
  decision: ExecutiveDecisionStack | null;
  predictive: PredictiveIntelligenceStack | null;
  boardGovernance: BoardGovernanceStack | null;
}

export interface CreateOrganizationDnaOptions
  extends OrganizationDnaDependencies {
  /** Attach / create an Executive Graph Analyzer for graphInput builds. */
  graphAnalyzer?: ExecutiveGraphAnalyzerStack;
  graphAnalyzerOptions?: CreateExecutiveGraphAnalyzerOptions;
  /** When true (default), auto-wire createExecutiveGraphAnalyzer if not provided. */
  wireGraphAnalyzer?: boolean;
  /** Attach / create Executive Decision Intelligence. */
  decision?: ExecutiveDecisionStack;
  decisionOptions?: CreateExecutiveDecisionOptions;
  /** When true (default), auto-wire createExecutiveDecisionIntelligence if not provided. */
  wireDecision?: boolean;
  /** Attach / create Predictive Intelligence. */
  predictive?: PredictiveIntelligenceStack;
  predictiveOptions?: CreatePredictiveIntelligenceOptions;
  /** When true (default), auto-wire createPredictiveIntelligence if not provided. */
  wirePredictive?: boolean;
  /** Attach / create Board & Governance Intelligence. */
  boardGovernance?: BoardGovernanceStack;
  boardGovernanceOptions?: CreateBoardGovernanceOptions;
  /** When true (default), auto-wire createBoardGovernanceIntelligence if not provided. */
  wireBoardGovernance?: boolean;
}

/**
 * Create a fully wired Organizational DNA & Company Builder stack (DI entry point).
 */
export function createOrganizationDnaIntelligence(
  options: CreateOrganizationDnaOptions = {}
): OrganizationDnaStack {
  const wireGraph = options.wireGraphAnalyzer !== false;
  const wireDecision = options.wireDecision !== false;
  const wirePredictive = options.wirePredictive !== false;
  const wireBoard = options.wireBoardGovernance !== false;

  const graphAnalyzer =
    options.graphAnalyzer ??
    (wireGraph
      ? createExecutiveGraphAnalyzer(options.graphAnalyzerOptions ?? {})
      : null);

  const decision =
    options.decision ??
    (wireDecision
      ? createExecutiveDecisionIntelligence({
          ...(options.decisionOptions ?? {}),
          graphAnalyzer:
            options.decisionOptions?.graphAnalyzer ?? graphAnalyzer ?? undefined,
          wireGraphAnalyzer: false,
        })
      : null);

  const predictive =
    options.predictive ??
    (wirePredictive
      ? createPredictiveIntelligence({
          ...(options.predictiveOptions ?? {}),
          graphAnalyzer:
            options.predictiveOptions?.graphAnalyzer ??
            graphAnalyzer ??
            undefined,
          decision:
            options.predictiveOptions?.decision ?? decision ?? undefined,
          wireGraphAnalyzer: false,
          wireDecision: false,
        })
      : null);

  const boardGovernance =
    options.boardGovernance ??
    (wireBoard
      ? createBoardGovernanceIntelligence({
          ...(options.boardGovernanceOptions ?? {}),
          graphAnalyzer:
            options.boardGovernanceOptions?.graphAnalyzer ??
            graphAnalyzer ??
            undefined,
          decision:
            options.boardGovernanceOptions?.decision ?? decision ?? undefined,
          predictive:
            options.boardGovernanceOptions?.predictive ??
            predictive ??
            undefined,
          wireGraphAnalyzer: false,
          wireDecision: false,
          wirePredictive: false,
        })
      : null);

  const buildAndAnalyze =
    options.buildAndAnalyze ??
    (graphAnalyzer
      ? (input?: Parameters<ExecutiveGraphAnalyzerStack["buildAndAnalyze"]>[0]) =>
          graphAnalyzer.buildAndAnalyze(input)
      : undefined);

  const engine = new OrganizationDnaEngine({
    ...options,
    buildAndAnalyze,
  });

  const service = new OrganizationService({
    ...options,
    engine,
    buildAndAnalyze,
  });

  return {
    service,
    engine,
    graphAnalyzer,
    decision,
    predictive,
    boardGovernance,
  };
}
