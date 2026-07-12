/**
 * Market Intelligence — public API (Sprint 043 / 0.1.0).
 */

export {
  MARKET_INTELLIGENCE_VERSION,
  MARKET_CAPABILITIES,
  MARKET_SIGNAL_KINDS,
  MARKET_CONFIDENCE_LEVELS,
  MARKET_PRIORITY_BANDS,
  MARKET_HEALTH_STATUSES,
  MARKET_ARTIFACT_STATUSES,
  type BusinessModelResultLight,
  type CompetitiveDashboardResult,
  type CompetitiveSuite,
  type CompetitorRecord,
  type CustomerDemandSuite,
  type CustomerResultLight,
  type DemandSignalRecord,
  type DemographicCohortRecord,
  type DemographicSuite,
  type DocumentResultLight,
  type EconomicIndicatorRecord,
  type EconomicTrendSuite,
  type ExecutiveMarketBrief,
  type ExpansionCandidateRecord,
  type ExpansionDashboardResult,
  type FundingResultLight,
  type GeographicExpansionSuite,
  type GraphScope,
  type IndustrySegmentRecord,
  type IndustrySuite,
  type KnowledgeResultLight,
  type LegalComplianceRiskResultLight,
  type MaTargetRecord,
  type MarketArtifactStatus,
  type MarketBaseline,
  type MarketCapability,
  type MarketConfidenceLevel,
  type MarketConfidenceScore,
  type MarketDashboardResult,
  type MarketHealthResult,
  type MarketHealthStatus,
  type MarketHistoryRecord,
  type MarketKnowledgeContribution,
  type MarketKnowledgeDraft,
  type MarketLens,
  type MarketMetadata,
  type MarketOpportunityRecord,
  type MarketPriorityBand,
  type MarketProjectionResult,
  type MarketPublisher,
  type MarketQueryRequest,
  type MarketQueryResult,
  type MarketReasoningResult,
  type MarketRecommendationRecord,
  type MarketRequest,
  type MarketResult,
  type MarketRiskRecord,
  type MarketScore,
  type MarketSignalKind,
  type MarketSignalRecord,
  type MarketSignalsSuite,
  type MarketSizeEstimate,
  type MarketSizeSuite,
  type MergersAcquisitionsSuite,
  type OperationsResultLight,
  type OpportunityResultLight,
  type PartnershipRecord,
  type PartnershipSuite,
  type PredictiveResultLight,
  type PricingBandRecord,
  type PricingSuite,
  type RevenueResultLight,
  type TechnologyTrendRecord,
  type TechnologyTrendSuite,
  type TrendDashboardResult,
  type WhiteSpaceOpportunityRecord,
  type WhiteSpaceSuite,
} from "@/lib/platform/intelligence/market/types";

export type {
  CompetitiveIntelligence as CompetitiveIntelligenceContract,
  CustomerDemandIntelligence as CustomerDemandIntelligenceContract,
  DemographicIntelligence as DemographicIntelligenceContract,
  EconomicTrendIntelligence as EconomicTrendIntelligenceContract,
  ExecutiveMarketBriefGenerator as ExecutiveMarketBriefGeneratorContract,
  GeographicExpansionIntelligence as GeographicExpansionIntelligenceContract,
  IndustryIntelligence as IndustryIntelligenceContract,
  MarketDashboard as MarketDashboardContract,
  MarketDependencies,
  MarketEngine as MarketEngineContract,
  MarketHealth as MarketHealthContract,
  MarketIntelligence as MarketIntelligenceContract,
  MarketIntelligenceEngine as MarketIntelligenceEngineContract,
  MarketIntelligenceService as MarketIntelligenceServiceContract,
  MarketKnowledgeContributionEngine as MarketKnowledgeContributionEngineContract,
  MarketOpportunityAnalyzer as MarketOpportunityAnalyzerContract,
  MarketProjection as MarketProjectionContract,
  MarketQueries as MarketQueriesContract,
  MarketReasoner as MarketReasonerContract,
  MarketRecommendationComposer as MarketRecommendationComposerContract,
  MarketRegistry as MarketRegistryContract,
  MarketRepository as MarketRepositoryContract,
  MarketRiskAnalyzer as MarketRiskAnalyzerContract,
  MarketService as MarketServiceContract,
  MarketSizeIntelligence as MarketSizeIntelligenceContract,
  MarketSpecializedDashboards as MarketSpecializedDashboardsContract,
  MergersAcquisitionsIntelligence as MergersAcquisitionsIntelligenceContract,
  PartnershipIntelligence as PartnershipIntelligenceContract,
  PricingIntelligence as PricingIntelligenceContract,
  TechnologyTrendIntelligence as TechnologyTrendIntelligenceContract,
  WhiteSpaceIntelligence as WhiteSpaceIntelligenceContract,
} from "@/lib/platform/intelligence/market/contracts";

export {
  buildConfidence,
  buildLens,
  clamp,
  clamp01,
  defaultCreateId,
  defaultMarketBaseline,
  defaultPeriodLabel,
  deriveMarketBaseline,
  emptyMarketScope,
  levelFromValue,
  marketModels,
  MarketModels,
  priorityFromRisk,
  priorityFromScore,
  scoreNarrative,
  statusFromScore,
} from "@/lib/platform/intelligence/market/models";

export { IndustryIntelligence } from "@/lib/platform/intelligence/market/industry-intelligence";
export { CompetitiveIntelligence } from "@/lib/platform/intelligence/market/competitive-intelligence";
export { MarketSizeIntelligence } from "@/lib/platform/intelligence/market/market-size-intelligence";
export { PricingIntelligence } from "@/lib/platform/intelligence/market/pricing-intelligence";
export { CustomerDemandIntelligence } from "@/lib/platform/intelligence/market/customer-demand-intelligence";
export { DemographicIntelligence } from "@/lib/platform/intelligence/market/demographic-intelligence";
export { GeographicExpansionIntelligence } from "@/lib/platform/intelligence/market/geographic-expansion-intelligence";
export { EconomicTrendIntelligence } from "@/lib/platform/intelligence/market/economic-trend-intelligence";
export { TechnologyTrendIntelligence } from "@/lib/platform/intelligence/market/technology-trend-intelligence";
export { PartnershipIntelligence } from "@/lib/platform/intelligence/market/partnership-intelligence";
export { MergersAcquisitionsIntelligence } from "@/lib/platform/intelligence/market/mergers-acquisitions-intelligence";
export { WhiteSpaceIntelligence } from "@/lib/platform/intelligence/market/white-space-intelligence";
export { MarketReasoner } from "@/lib/platform/intelligence/market/market-reasoner";
export { MarketKnowledgeContributionEngine } from "@/lib/platform/intelligence/market/knowledge-contribution";
export {
  composeMarketSignals,
  defaultMarketConfidence,
  ExecutiveMarketBriefGenerator,
  MarketDashboard,
  MarketHealth,
  MarketIntelligence,
  MarketOpportunityAnalyzer,
  MarketRecommendationComposer,
  MarketRiskAnalyzer,
  MarketSpecializedDashboards,
} from "@/lib/platform/intelligence/market/market-intelligence";
export {
  MarketProjection,
  MarketQueries,
} from "@/lib/platform/intelligence/market/projection";
export {
  MarketRegistry,
  MarketRegistryStore,
} from "@/lib/platform/intelligence/market/market-registry";
export {
  MarketRepository,
  MarketRepositoryStore,
} from "@/lib/platform/intelligence/market/repository";
export {
  MarketEngine,
  MarketEngineImpl,
  MarketIntelligenceEngine,
  MarketIntelligenceEngineImpl,
} from "@/lib/platform/intelligence/market/market-engine";
export {
  MarketIntelligenceService,
  MarketIntelligenceServiceImpl,
  MarketService,
  MarketServiceImpl,
} from "@/lib/platform/intelligence/market/service";

import { MarketIntelligenceEngine } from "@/lib/platform/intelligence/market/market-engine";
import type { MarketDependencies } from "@/lib/platform/intelligence/market/contracts";
import { MarketIntelligenceService } from "@/lib/platform/intelligence/market/service";
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

export interface MarketStack {
  service: MarketIntelligenceService;
  engine: MarketIntelligenceEngine;
  organizationDna: OrganizationDnaStack | null;
  oios: OiosStack | null;
}

export interface CreateMarketOptions extends MarketDependencies {
  organizationDna?: OrganizationDnaStack;
  organizationDnaOptions?: CreateOrganizationDnaOptions;
  wireOrganizationDna?: boolean;
  oios?: OiosStack;
  oiosOptions?: CreateOiosOptions;
  wireOios?: boolean;
}

export function createMarketIntelligence(options: CreateMarketOptions = {}): MarketStack {
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
            options.oiosOptions?.organizationDnaStack ?? organizationDna ?? undefined,
          wireOrganizationDna: false,
        })
      : null);
  const engine = new MarketIntelligenceEngine(options);
  const service = new MarketIntelligenceService({ ...options, engine });

  return { service, engine, organizationDna, oios };
}
