/**
 * Customer Intelligence — public API (Sprint 039).
 *
 * Continuously monitor and improve the family and student experience across
 * the school lifecycle — inquiry → enrollment → engagement → satisfaction →
 * retention → community belonging.
 */

export {
  COMMUNITY_BELONGING_PILLARS,
  CUSTOMER_ARTIFACT_STATUSES,
  CUSTOMER_CONFIDENCE_LEVELS,
  CUSTOMER_HEALTH_STATUSES,
  CUSTOMER_INTELLIGENCE_VERSION,
  CUSTOMER_PRIORITY_BANDS,
  ENGAGEMENT_DIMENSIONS,
  JOURNEY_STAGES,
  RETENTION_RISK_FACTORS,
  SATISFACTION_SIGNALS,
  type CommunityBelongingPillar,
  type CommunityHealthResult,
  type CommunityPillarRecord,
  type CustomerArtifactStatus,
  type CustomerBaseline,
  type CustomerConfidenceLevel,
  type CustomerConfidenceScore,
  type CustomerDashboardResult,
  type CustomerHealthResult,
  type CustomerHealthStatus,
  type CustomerHistoryRecord,
  type CustomerLensImpact,
  type CustomerMetadata,
  type CustomerOpportunityRecord,
  type CustomerPriorityBand,
  type CustomerProjectionResult,
  type CustomerPublisher,
  type CustomerQueryRequest,
  type CustomerQueryResult,
  type CustomerRecommendationRecord,
  type CustomerRequest,
  type CustomerResult,
  type CustomerRiskRecord,
  type CustomerScore,
  type EngagementDimension,
  type EngagementDimensionRecord,
  type EngagementResult,
  type ExecutiveCustomerBrief,
  type GraphScope,
  type JourneyMapResult,
  type JourneyStage,
  type JourneyStageRecord,
  type OperationsResultLight,
  type RetentionFactorRecord,
  type RetentionRiskFactor,
  type RetentionWatchlistResult,
  type RevenueResultLight,
  type SatisfactionSignal,
  type SatisfactionSignalRecord,
  type SatisfactionSuite,
} from "@/lib/platform/intelligence/customer/types";

export type {
  CommunityBelongingEngine as CommunityBelongingEngineContract,
  CustomerDashboard as CustomerDashboardContract,
  CustomerDependencies,
  CustomerEngine as CustomerEngineContract,
  CustomerHealth as CustomerHealthContract,
  CustomerIntelligence as CustomerIntelligenceContract,
  CustomerIntelligenceEngine as CustomerIntelligenceEngineContract,
  CustomerIntelligenceService as CustomerIntelligenceServiceContract,
  CustomerOpportunityAnalyzer as CustomerOpportunityAnalyzerContract,
  CustomerProjection as CustomerProjectionContract,
  CustomerQueries as CustomerQueriesContract,
  CustomerRecommendationComposer as CustomerRecommendationComposerContract,
  CustomerRegistry as CustomerRegistryContract,
  CustomerRepository as CustomerRepositoryContract,
  CustomerRiskAnalyzer as CustomerRiskAnalyzerContract,
  CustomerService as CustomerServiceContract,
  EngagementEngine as EngagementEngineContract,
  ExecutiveCustomerBriefGenerator as ExecutiveCustomerBriefGeneratorContract,
  JourneyMapEngine as JourneyMapEngineContract,
  RetentionRiskEngine as RetentionRiskEngineContract,
  SatisfactionEngine as SatisfactionEngineContract,
} from "@/lib/platform/intelligence/customer/contracts";

export {
  buildConfidence,
  buildLenses,
  clamp,
  clamp01,
  customerModels,
  CustomerModels,
  defaultCreateId,
  defaultCustomerBaseline,
  defaultPeriodLabel,
  deriveCustomerBaseline,
  emptyCustomerScope,
  levelFromValue,
  priorityFromRisk,
  priorityFromScore,
  scoreNarrative,
  statusFromScore,
} from "@/lib/platform/intelligence/customer/models";

export { JourneyMapEngine } from "@/lib/platform/intelligence/customer/journey-intelligence";

export {
  EngagementEngine,
  SatisfactionEngine,
} from "@/lib/platform/intelligence/customer/engagement-intelligence";

export {
  CommunityBelongingEngine,
  RetentionRiskEngine,
} from "@/lib/platform/intelligence/customer/retention-intelligence";

export {
  CustomerRegistry,
  CustomerRegistryStore,
} from "@/lib/platform/intelligence/customer/customer-registry";

export {
  defaultCustomerConfidence,
  CustomerDashboard,
  CustomerHealth,
  CustomerIntelligence,
  CustomerOpportunityAnalyzer,
  CustomerRecommendationComposer,
  CustomerRiskAnalyzer,
  ExecutiveCustomerBriefGenerator,
} from "@/lib/platform/intelligence/customer/customer-intelligence";

export {
  CustomerProjection,
  CustomerQueries,
} from "@/lib/platform/intelligence/customer/projection";

export {
  CustomerRepository,
  CustomerRepositoryStore,
} from "@/lib/platform/intelligence/customer/repository";

export {
  CustomerEngine,
  CustomerEngineImpl,
  CustomerIntelligenceEngine,
  CustomerIntelligenceEngineImpl,
} from "@/lib/platform/intelligence/customer/customer-engine";

export {
  CustomerIntelligenceService,
  CustomerIntelligenceServiceImpl,
  CustomerService,
  CustomerServiceImpl,
} from "@/lib/platform/intelligence/customer/service";

import { CustomerIntelligenceEngine } from "@/lib/platform/intelligence/customer/customer-engine";
import type { CustomerDependencies } from "@/lib/platform/intelligence/customer/contracts";
import { CustomerIntelligenceService } from "@/lib/platform/intelligence/customer/service";
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

/** Wired Customer Intelligence stack. */
export interface CustomerStack {
  service: CustomerIntelligenceService;
  engine: CustomerIntelligenceEngine;
  organizationDna: OrganizationDnaStack | null;
  oios: OiosStack | null;
}

export interface CreateCustomerOptions extends CustomerDependencies {
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
 * Create a fully wired Customer Intelligence stack (DI entry point).
 */
export function createCustomerIntelligence(
  options: CreateCustomerOptions = {}
): CustomerStack {
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

  const engine = new CustomerIntelligenceEngine(options);
  const service = new CustomerIntelligenceService({
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
