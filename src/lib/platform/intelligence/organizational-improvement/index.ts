/** Organizational Improvement Engine public API (Sprint 036). */
export * from "@/lib/platform/intelligence/organizational-improvement/types";
export type {
  BaselineInput,
  ImprovementDependencies,
  OrganizationalImprovementEngine as OrganizationalImprovementEngineContract,
  ImprovementEngine as ImprovementEngineContract,
  ImprovementIntelligenceService as ImprovementIntelligenceServiceContract,
  ImprovementService as ImprovementServiceContract,
  ImprovementRepository as ImprovementRepositoryContract,
  ImprovementSourceEngine as ImprovementSourceEngineContract,
  ImprovementAnalysisEngine as ImprovementAnalysisEngineContract,
  ImprovementPlanner as ImprovementPlannerContract,
  ImprovementRegistry as ImprovementRegistryContract,
  ImprovementIntelligence as ImprovementIntelligenceContract,
  ImprovementHealth as ImprovementHealthContract,
  ImprovementDashboard as ImprovementDashboardContract,
  MissionImprovementDashboard as MissionImprovementDashboardContract,
  FinancialImprovementDashboard as FinancialImprovementDashboardContract,
  PeopleImprovementDashboard as PeopleImprovementDashboardContract,
  TodaysPrioritiesComposer as TodaysPrioritiesComposerContract,
  ImprovementHeatMap as ImprovementHeatMapContract,
  ContinuousImprovementLoop as ContinuousImprovementLoopContract,
  DailyExecutiveBriefGenerator as DailyExecutiveBriefGeneratorContract,
  ExecutiveImprovementBriefGenerator as ExecutiveImprovementBriefGeneratorContract,
  ImprovementProjection as ImprovementProjectionContract,
  ImprovementQueries as ImprovementQueriesContract,
  PriorityScoring as PriorityScoringContract,
  ImpactScoring as ImpactScoringContract,
  MissionAlignmentAnalysis as MissionAlignmentAnalysisContract,
  FinancialImpactAnalysis as FinancialImpactAnalysisContract,
  RiskReductionAnalysis as RiskReductionAnalysisContract,
  TimeToValueAnalysis as TimeToValueAnalysisContract,
  ResourceRequirementsAnalysis as ResourceRequirementsAnalysisContract,
  OrganizationalCapacityAnalysis as OrganizationalCapacityAnalysisContract,
  DependencyResolution as DependencyResolutionContract,
  ImprovementConfidenceAnalysis as ImprovementConfidenceAnalysisContract,
  QuickWinsPlanner as QuickWinsPlannerContract,
  StrategicInitiativesPlanner as StrategicInitiativesPlannerContract,
  LongTermTransformationPlanner as LongTermTransformationPlannerContract,
  WeeklyPlanComposer as WeeklyPlanComposerContract,
  MonthlyPlanComposer as MonthlyPlanComposerContract,
  QuarterlyPlanComposer as QuarterlyPlanComposerContract,
  AnnualRoadmapComposer as AnnualRoadmapComposerContract,
  OrganizationHealthSource as OrganizationHealthSourceContract,
  ExecutiveGraphSource as ExecutiveGraphSourceContract,
  ExecutiveDecisionSource as ExecutiveDecisionSourceContract,
  PredictiveSource as PredictiveSourceContract,
  HumanCapitalSource as HumanCapitalSourceContract,
  RevenueSource as RevenueSourceContract,
  FundingSource as FundingSourceContract,
  OpportunitySource as OpportunitySourceContract,
  BoardGovernanceSource as BoardGovernanceSourceContract,
  FutureDomainsSource as FutureDomainsSourceContract,
  SourceAnalyzer as SourceAnalyzerContract,
} from "@/lib/platform/intelligence/organizational-improvement/contracts";
export * from "@/lib/platform/intelligence/organizational-improvement/models";
export * from "@/lib/platform/intelligence/organizational-improvement/sources";
export * from "@/lib/platform/intelligence/organizational-improvement/analysis";
export * from "@/lib/platform/intelligence/organizational-improvement/planner";
export * from "@/lib/platform/intelligence/organizational-improvement/improvement-registry";
export * from "@/lib/platform/intelligence/organizational-improvement/improvement-intelligence";
export * from "@/lib/platform/intelligence/organizational-improvement/projection";
export * from "@/lib/platform/intelligence/organizational-improvement/repository";
export * from "@/lib/platform/intelligence/organizational-improvement/improvement-engine";
export * from "@/lib/platform/intelligence/organizational-improvement/service";

import type { ImprovementDependencies } from "@/lib/platform/intelligence/organizational-improvement/contracts";
import { OrganizationalImprovementEngine } from "@/lib/platform/intelligence/organizational-improvement/improvement-engine";
import { ImprovementIntelligenceService } from "@/lib/platform/intelligence/organizational-improvement/service";
import { createOiosOperatingSystem, type CreateOiosOptions, type OiosStack } from "@/lib/platform/oios";
import {
  createOrganizationDnaIntelligence,
  type CreateOrganizationDnaOptions,
  type OrganizationDnaStack,
} from "@/lib/platform/intelligence/organization-dna";
import type { OpportunityStack } from "@/lib/platform/intelligence/opportunity";

export interface ImprovementStack {
  service: ImprovementIntelligenceService;
  engine: OrganizationalImprovementEngine;
  organizationDna: OrganizationDnaStack | null;
  oios: OiosStack | null;
}

export interface CreateImprovementOptions extends ImprovementDependencies {
  organizationDna?: OrganizationDnaStack;
  organizationDnaOptions?: CreateOrganizationDnaOptions;
  wireOrganizationDna?: boolean;
  oios?: OiosStack;
  oiosOptions?: CreateOiosOptions;
  wireOios?: boolean;
  /** When true, optionally create an opportunity stack. Default false — platform injects context. */
  wireOpportunity?: boolean;
  opportunity?: OpportunityStack;
  opportunityFactory?: () => OpportunityStack;
}

export function createOrganizationalImprovementIntelligence(
  options: CreateImprovementOptions = {}
): ImprovementStack {
  const wireDna = options.wireOrganizationDna !== false;
  const wireOios = options.wireOios !== false;
  const wireOpportunity = options.wireOpportunity === true;

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

  // Opportunity stack is optional and not auto-created unless wireOpportunity is true.
  // Platform injects opportunity context on requests; keep wiring light by default.
  if (wireOpportunity && !options.opportunity && options.opportunityFactory) {
    options.opportunityFactory();
  }

  const engine = new OrganizationalImprovementEngine(options);
  const service = new ImprovementIntelligenceService({ ...options, engine });
  return { service, engine, organizationDna, oios };
}
