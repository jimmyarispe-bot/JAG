/** Opportunity Intelligence public API (Sprint 035). */
export * from "@/lib/platform/intelligence/opportunity/types";
export type {
  BaselineInput,
  OpportunityDependencies,
  OpportunityEngine as OpportunityEngineContract,
  OpportunityIntelligenceEngine as OpportunityIntelligenceEngineContract,
  OpportunityIntelligenceService as OpportunityIntelligenceServiceContract,
  OpportunityService as OpportunityServiceContract,
  OpportunityRepository as OpportunityRepositoryContract,
  OpportunityCategoryEngine as OpportunityCategoryEngineContract,
  OpportunityAnalysisEngine as OpportunityAnalysisEngineContract,
  OpportunityRankingEngine as OpportunityRankingEngineContract,
  OpportunityExchange as OpportunityExchangeContract,
  OpportunityRegistry as OpportunityRegistryContract,
  OpportunityIntelligence as OpportunityIntelligenceContract,
  OpportunityHealth as OpportunityHealthContract,
  OpportunityDashboard as OpportunityDashboardContract,
  TopOpportunitiesDashboard as TopOpportunitiesDashboardContract,
  QuickWinsDashboard as QuickWinsDashboardContract,
  StrategicInvestmentDashboard as StrategicInvestmentDashboardContract,
  MissionOpportunityDashboard as MissionOpportunityDashboardContract,
  OpportunityHeatMap as OpportunityHeatMapContract,
  OpportunityPipelineComposer as OpportunityPipelineComposerContract,
  ExecutiveOpportunityBriefGenerator as ExecutiveOpportunityBriefGeneratorContract,
  OpportunityProjection as OpportunityProjectionContract,
  OpportunityQueries as OpportunityQueriesContract,
  OpportunityScoring as OpportunityScoringContract,
  ROIAnalysis as ROIAnalysisContract,
  ImpactAnalysis as ImpactAnalysisContract,
  RiskAnalysis as RiskAnalysisContract,
  ConfidenceScoring as ConfidenceScoringContract,
  DependencyAnalysis as DependencyAnalysisContract,
  ResourceRequirements as ResourceRequirementsContract,
  TimeToValueAnalysis as TimeToValueAnalysisContract,
  StrategicAlignment as StrategicAlignmentContract,
  RevenueOpportunities as RevenueOpportunitiesContract,
  FundingOpportunities as FundingOpportunitiesContract,
  CostReductionOpportunities as CostReductionOpportunitiesContract,
  PricingOpportunities as PricingOpportunitiesContract,
  MarketExpansionOpportunities as MarketExpansionOpportunitiesContract,
  GeographicExpansionOpportunities as GeographicExpansionOpportunitiesContract,
  CustomerGrowthOpportunities as CustomerGrowthOpportunitiesContract,
  RetentionOpportunities as RetentionOpportunitiesContract,
  PartnershipOpportunities as PartnershipOpportunitiesContract,
  StrategicAllianceOpportunities as StrategicAllianceOpportunitiesContract,
  AcquisitionOpportunities as AcquisitionOpportunitiesContract,
  MergerOpportunities as MergerOpportunitiesContract,
  TechnologyOpportunities as TechnologyOpportunitiesContract,
  AutomationOpportunities as AutomationOpportunitiesContract,
  VendorOptimizationOpportunities as VendorOptimizationOpportunitiesContract,
  ProcurementSavingsOpportunities as ProcurementSavingsOpportunitiesContract,
  RealEstateOpportunities as RealEstateOpportunitiesContract,
  AssetOptimizationOpportunities as AssetOptimizationOpportunitiesContract,
  LicensingOpportunities as LicensingOpportunitiesContract,
  IntellectualPropertyOpportunities as IntellectualPropertyOpportunitiesContract,
  InnovationOpportunities as InnovationOpportunitiesContract,
  MissionImpactOpportunities as MissionImpactOpportunitiesContract,
} from "@/lib/platform/intelligence/opportunity/contracts";
export * from "@/lib/platform/intelligence/opportunity/models";
export * from "@/lib/platform/intelligence/opportunity/categories";
export * from "@/lib/platform/intelligence/opportunity/analysis";
export * from "@/lib/platform/intelligence/opportunity/ranking";
export * from "@/lib/platform/intelligence/opportunity/opportunity-exchange";
export * from "@/lib/platform/intelligence/opportunity/opportunity-registry";
export * from "@/lib/platform/intelligence/opportunity/opportunity-intelligence";
export * from "@/lib/platform/intelligence/opportunity/projection";
export * from "@/lib/platform/intelligence/opportunity/repository";
export * from "@/lib/platform/intelligence/opportunity/opportunity-engine";
export * from "@/lib/platform/intelligence/opportunity/service";

import type { OpportunityDependencies } from "@/lib/platform/intelligence/opportunity/contracts";
import { OpportunityIntelligenceEngine } from "@/lib/platform/intelligence/opportunity/opportunity-engine";
import { OpportunityIntelligenceService } from "@/lib/platform/intelligence/opportunity/service";
import { createOiosOperatingSystem, type CreateOiosOptions, type OiosStack } from "@/lib/platform/oios";
import {
  createOrganizationDnaIntelligence,
  type CreateOrganizationDnaOptions,
  type OrganizationDnaStack,
} from "@/lib/platform/intelligence/organization-dna";

export interface OpportunityStack {
  service: OpportunityIntelligenceService;
  engine: OpportunityIntelligenceEngine;
  organizationDna: OrganizationDnaStack | null;
  oios: OiosStack | null;
}

export interface CreateOpportunityOptions extends OpportunityDependencies {
  organizationDna?: OrganizationDnaStack;
  organizationDnaOptions?: CreateOrganizationDnaOptions;
  wireOrganizationDna?: boolean;
  oios?: OiosStack;
  oiosOptions?: CreateOiosOptions;
  wireOios?: boolean;
}

export function createOpportunityIntelligence(
  options: CreateOpportunityOptions = {}
): OpportunityStack {
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
  const engine = new OpportunityIntelligenceEngine(options);
  const service = new OpportunityIntelligenceService({ ...options, engine });
  return { service, engine, organizationDna, oios };
}
