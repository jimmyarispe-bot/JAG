/**
 * Business Model Intelligence — public API (Sprint 037).
 *
 * Continuously understand, evaluate, simulate, compare, redesign, and optimize
 * how organizations create, deliver, and capture value.
 */

export {
  BUSINESS_MODEL_INTELLIGENCE_VERSION,
  BMC_BLOCKS,
  BUSINESS_MODEL_ARTIFACT_STATUSES,
  BUSINESS_MODEL_CONFIDENCE_LEVELS,
  BUSINESS_MODEL_HEALTH_STATUSES,
  BUSINESS_MODEL_PRIORITY_BANDS,
  BUSINESS_MODEL_SCENARIO_KINDS,
  LEAN_CANVAS_BLOCKS,
  ORGANIZATION_DESIGN_KINDS,
  SIMULATION_FORECAST_DIMENSIONS,
  type BmcBlock,
  type BmcBlockRecord,
  type BusinessModelArtifactStatus,
  type BusinessModelBaseline,
  type BusinessModelCanvasResult,
  type BusinessModelComparisonResult,
  type BusinessModelConfidenceLevel,
  type BusinessModelConfidenceScore,
  type BusinessModelDashboardResult,
  type BusinessModelEvolutionRoadmap,
  type BusinessModelEvolutionStep,
  type BusinessModelHealthResult,
  type BusinessModelHealthStatus,
  type BusinessModelHistoryRecord,
  type BusinessModelLensImpact,
  type BusinessModelMetadata,
  type BusinessModelOpportunityRecord,
  type BusinessModelPriorityBand,
  type BusinessModelProjectionResult,
  type BusinessModelPublisher,
  type BusinessModelQueryRequest,
  type BusinessModelQueryResult,
  type BusinessModelRecommendationRecord,
  type BusinessModelRequest,
  type BusinessModelResult,
  type BusinessModelRiskRecord,
  type BusinessModelScenarioKind,
  type BusinessModelScenarioRecord,
  type BusinessModelScenarioSuite,
  type BusinessModelScore,
  type BusinessModelSimulationRecord,
  type CompetitivePositionResult,
  type ExecutiveBusinessBrief,
  type FinancialSignal,
  type FundingResultLight,
  type GraphScope,
  type HumanCapitalResultLight,
  type ImprovementResultLight,
  type LeanCanvasBlock,
  type LeanCanvasBlockRecord,
  type LeanCanvasResult,
  type OpportunityResultLight,
  type OrganizationDesignKind,
  type OrganizationDesignRecord,
  type OrganizationDesignSuite,
  type RevenueResultLight,
  type SimulationForecastDimension,
  type SimulationForecastPoint,
} from "@/lib/platform/intelligence/business-model/types";

export type {
  BusinessModelCanvasBuilder as BusinessModelCanvasBuilderContract,
  BusinessModelDashboard as BusinessModelDashboardContract,
  BusinessModelDependencies,
  BusinessModelEngine as BusinessModelEngineContract,
  BusinessModelEvolutionPlanner as BusinessModelEvolutionPlannerContract,
  BusinessModelHealth as BusinessModelHealthContract,
  BusinessModelIntelligence as BusinessModelIntelligenceContract,
  BusinessModelIntelligenceEngine as BusinessModelIntelligenceEngineContract,
  BusinessModelIntelligenceService as BusinessModelIntelligenceServiceContract,
  BusinessModelOpportunityAnalyzer as BusinessModelOpportunityAnalyzerContract,
  BusinessModelProjection as BusinessModelProjectionContract,
  BusinessModelQueries as BusinessModelQueriesContract,
  BusinessModelRecommendationComposer as BusinessModelRecommendationComposerContract,
  BusinessModelRegistry as BusinessModelRegistryContract,
  BusinessModelRepository as BusinessModelRepositoryContract,
  BusinessModelRiskAnalyzer as BusinessModelRiskAnalyzerContract,
  BusinessModelScenarioPlanner as BusinessModelScenarioPlannerContract,
  BusinessModelService as BusinessModelServiceContract,
  BusinessModelSimulator as BusinessModelSimulatorContract,
  CompetitivePositionAnalyzer as CompetitivePositionAnalyzerContract,
  ExecutiveBusinessBriefGenerator as ExecutiveBusinessBriefGeneratorContract,
  LeanCanvasBuilder as LeanCanvasBuilderContract,
  OrganizationDesignEngine as OrganizationDesignEngineContract,
} from "@/lib/platform/intelligence/business-model/contracts";

export {
  buildConfidence,
  buildLenses,
  businessModelModels,
  BusinessModelModels,
  clamp,
  clamp01,
  defaultBusinessModelBaseline,
  defaultCreateId,
  defaultPeriodLabel,
  deriveBusinessModelBaseline,
  emptyBusinessModelScope,
  levelFromValue,
  priorityFromRisk,
  priorityFromScore,
  scoreNarrative,
  statusFromScore,
} from "@/lib/platform/intelligence/business-model/models";

export {
  BusinessModelCanvasBuilder,
  LeanCanvasBuilder,
} from "@/lib/platform/intelligence/business-model/canvas-intelligence";

export { OrganizationDesignEngine } from "@/lib/platform/intelligence/business-model/design-intelligence";

export { BusinessModelScenarioPlanner } from "@/lib/platform/intelligence/business-model/scenario-intelligence";

export { BusinessModelSimulator } from "@/lib/platform/intelligence/business-model/business-model-simulator";

export {
  BusinessModelRegistry,
  BusinessModelRegistryStore,
} from "@/lib/platform/intelligence/business-model/business-model-registry";

export {
  BusinessModelDashboard,
  BusinessModelEvolutionPlanner,
  BusinessModelHealth,
  BusinessModelIntelligence,
  BusinessModelOpportunityAnalyzer,
  BusinessModelRecommendationComposer,
  BusinessModelRiskAnalyzer,
  CompetitivePositionAnalyzer,
  defaultBusinessModelConfidence,
  ExecutiveBusinessBriefGenerator,
} from "@/lib/platform/intelligence/business-model/business-model-intelligence";

export {
  BusinessModelProjection,
  BusinessModelQueries,
} from "@/lib/platform/intelligence/business-model/projection";

export {
  BusinessModelRepository,
  BusinessModelRepositoryStore,
} from "@/lib/platform/intelligence/business-model/repository";

export {
  BusinessModelEngine,
  BusinessModelEngineImpl,
  BusinessModelIntelligenceEngine,
  BusinessModelIntelligenceEngineImpl,
} from "@/lib/platform/intelligence/business-model/business-model-engine";

export {
  BusinessModelIntelligenceService,
  BusinessModelIntelligenceServiceImpl,
  BusinessModelService,
  BusinessModelServiceImpl,
} from "@/lib/platform/intelligence/business-model/service";

import { BusinessModelIntelligenceEngine } from "@/lib/platform/intelligence/business-model/business-model-engine";
import type { BusinessModelDependencies } from "@/lib/platform/intelligence/business-model/contracts";
import { BusinessModelIntelligenceService } from "@/lib/platform/intelligence/business-model/service";
import {
  createOiosOperatingSystem,
  type CreateOiosOptions,
  type OiosStack,
} from "@/lib/platform/oios";
import {
  createOrganizationDnaIntelligence,
  type CreateOrganizationDnaOptions,
  type OrganizationDnaStack,
} from "@/lib/platform/intelligence/organization-dna";

/** Wired Business Model Intelligence stack. */
export interface BusinessModelStack {
  service: BusinessModelIntelligenceService;
  engine: BusinessModelIntelligenceEngine;
  organizationDna: OrganizationDnaStack | null;
  oios: OiosStack | null;
}

export interface CreateBusinessModelOptions extends BusinessModelDependencies {
  /** Attach / create Organizational DNA stack. */
  organizationDna?: OrganizationDnaStack;
  organizationDnaOptions?: CreateOrganizationDnaOptions;
  /** When true (default), auto-wire createOrganizationDnaIntelligence if not provided. */
  wireOrganizationDna?: boolean;
  /** Attach / create OIOS Core stack. */
  oios?: OiosStack;
  oiosOptions?: CreateOiosOptions;
  /** When true (default), auto-wire createOiosOperatingSystem if not provided. */
  wireOios?: boolean;
}

/**
 * Create a fully wired Business Model Intelligence stack (DI entry point).
 */
export function createBusinessModelIntelligence(
  options: CreateBusinessModelOptions = {}
): BusinessModelStack {
  const wireDna = options.wireOrganizationDna !== false;
  const wireOios = options.wireOios !== false;

  const organizationDna =
    options.organizationDna ??
    (wireDna
      ? createOrganizationDnaIntelligence({
          ...(options.organizationDnaOptions ?? {}),
          wireGraphAnalyzer: false,
          wireDecision: false,
          wirePredictive: false,
          wireBoardGovernance: false,
        })
      : null);

  const oios =
    options.oios ??
    (wireOios
      ? createOiosOperatingSystem({
          ...(options.oiosOptions ?? {}),
          organizationDnaStack:
            options.oiosOptions?.organizationDnaStack ??
            organizationDna ??
            undefined,
          wireOrganizationDna: false,
        })
      : null);

  const engine = new BusinessModelIntelligenceEngine(options);
  const service = new BusinessModelIntelligenceService({
    ...options,
    engine,
  });

  return {
    service,
    engine,
    organizationDna,
    oios,
  };
}
