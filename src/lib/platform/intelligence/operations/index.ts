/**
 * Operations Intelligence — public API (Sprint 038).
 *
 * Continuously monitor and optimize day-to-day organizational operations —
 * workflow health, process monitoring, staffing analytics, automation
 * opportunities, capacity planning, and resource utilization.
 */

export {
  AUTOMATION_OPPORTUNITY_KINDS,
  CAPACITY_PLANNING_HORIZONS,
  OPERATIONS_ARTIFACT_STATUSES,
  OPERATIONS_CONFIDENCE_LEVELS,
  OPERATIONS_HEALTH_STATUSES,
  OPERATIONS_INTELLIGENCE_VERSION,
  OPERATIONS_PRIORITY_BANDS,
  PROCESS_MONITORING_AREAS,
  WORKFLOW_HEALTH_DIMENSIONS,
  type AutomationOpportunityKind,
  type AutomationOpportunityRecord,
  type AutomationOpportunitySuite,
  type BusinessModelResultLight,
  type CapacityHorizonRecord,
  type CapacityPlanResult,
  type CapacityPlanningHorizon,
  type ExecutiveOperationsBrief,
  type FinancialSignal,
  type GraphScope,
  type HumanCapitalResultLight,
  type ImprovementResultLight,
  type OperationsArtifactStatus,
  type OperationsBaseline,
  type OperationsConfidenceLevel,
  type OperationsConfidenceScore,
  type OperationsDashboardResult,
  type OperationsHealthResult,
  type OperationsHealthStatus,
  type OperationsHistoryRecord,
  type OperationsLensImpact,
  type OperationsMetadata,
  type OperationsOpportunityRecord,
  type OperationsPriorityBand,
  type OperationsProjectionResult,
  type OperationsPublisher,
  type OperationsQueryRequest,
  type OperationsQueryResult,
  type OperationsRecommendationRecord,
  type OperationsRequest,
  type OperationsResult,
  type OperationsRiskRecord,
  type OperationsScore,
  type ProcessMonitoringArea,
  type ProcessMonitoringRecord,
  type ProcessMonitoringSuite,
  type ResourceUtilizationResult,
  type StaffingAnalyticsResult,
  type WorkflowHealthDimension,
  type WorkflowHealthDimensionRecord,
  type WorkflowHealthResult,
} from "@/lib/platform/intelligence/operations/types";

export type {
  AutomationOpportunityEngine as AutomationOpportunityEngineContract,
  CapacityPlanner as CapacityPlannerContract,
  ExecutiveOperationsBriefGenerator as ExecutiveOperationsBriefGeneratorContract,
  OperationsDashboard as OperationsDashboardContract,
  OperationsDependencies,
  OperationsEngine as OperationsEngineContract,
  OperationsHealth as OperationsHealthContract,
  OperationsIntelligence as OperationsIntelligenceContract,
  OperationsIntelligenceEngine as OperationsIntelligenceEngineContract,
  OperationsIntelligenceService as OperationsIntelligenceServiceContract,
  OperationsOpportunityAnalyzer as OperationsOpportunityAnalyzerContract,
  OperationsProjection as OperationsProjectionContract,
  OperationsQueries as OperationsQueriesContract,
  OperationsRecommendationComposer as OperationsRecommendationComposerContract,
  OperationsRegistry as OperationsRegistryContract,
  OperationsRepository as OperationsRepositoryContract,
  OperationsRiskAnalyzer as OperationsRiskAnalyzerContract,
  OperationsService as OperationsServiceContract,
  ProcessMonitoringEngine as ProcessMonitoringEngineContract,
  ResourceUtilizationAnalyzer as ResourceUtilizationAnalyzerContract,
  StaffingAnalyticsEngine as StaffingAnalyticsEngineContract,
  WorkflowHealthEngine as WorkflowHealthEngineContract,
} from "@/lib/platform/intelligence/operations/contracts";

export {
  buildConfidence,
  buildLenses,
  clamp,
  clamp01,
  defaultCreateId,
  defaultOperationsBaseline,
  defaultPeriodLabel,
  deriveOperationsBaseline,
  emptyOperationsScope,
  levelFromValue,
  operationsModels,
  OperationsModels,
  priorityFromRisk,
  priorityFromScore,
  scoreNarrative,
  statusFromScore,
} from "@/lib/platform/intelligence/operations/models";

export {
  ProcessMonitoringEngine,
  WorkflowHealthEngine,
} from "@/lib/platform/intelligence/operations/workflow-intelligence";

export {
  CapacityPlanner,
  ResourceUtilizationAnalyzer,
  StaffingAnalyticsEngine,
} from "@/lib/platform/intelligence/operations/capacity-intelligence";

export { AutomationOpportunityEngine } from "@/lib/platform/intelligence/operations/automation-intelligence";

export {
  OperationsRegistry,
  OperationsRegistryStore,
} from "@/lib/platform/intelligence/operations/operations-registry";

export {
  defaultOperationsConfidence,
  ExecutiveOperationsBriefGenerator,
  OperationsDashboard,
  OperationsHealth,
  OperationsIntelligence,
  OperationsOpportunityAnalyzer,
  OperationsRecommendationComposer,
  OperationsRiskAnalyzer,
} from "@/lib/platform/intelligence/operations/operations-intelligence";

export {
  OperationsProjection,
  OperationsQueries,
} from "@/lib/platform/intelligence/operations/projection";

export {
  OperationsRepository,
  OperationsRepositoryStore,
} from "@/lib/platform/intelligence/operations/repository";

export {
  OperationsEngine,
  OperationsEngineImpl,
  OperationsIntelligenceEngine,
  OperationsIntelligenceEngineImpl,
} from "@/lib/platform/intelligence/operations/operations-engine";

export {
  OperationsIntelligenceService,
  OperationsIntelligenceServiceImpl,
  OperationsService,
  OperationsServiceImpl,
} from "@/lib/platform/intelligence/operations/service";

import { OperationsIntelligenceEngine } from "@/lib/platform/intelligence/operations/operations-engine";
import type { OperationsDependencies } from "@/lib/platform/intelligence/operations/contracts";
import { OperationsIntelligenceService } from "@/lib/platform/intelligence/operations/service";
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

/** Wired Operations Intelligence stack. */
export interface OperationsStack {
  service: OperationsIntelligenceService;
  engine: OperationsIntelligenceEngine;
  organizationDna: OrganizationDnaStack | null;
  oios: OiosStack | null;
}

export interface CreateOperationsOptions extends OperationsDependencies {
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
 * Create a fully wired Operations Intelligence stack (DI entry point).
 */
export function createOperationsIntelligence(
  options: CreateOperationsOptions = {}
): OperationsStack {
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

  const engine = new OperationsIntelligenceEngine(options);
  const service = new OperationsIntelligenceService({
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
