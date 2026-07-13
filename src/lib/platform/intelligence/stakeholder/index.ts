export * from "@/lib/platform/intelligence/stakeholder/types";
export type {
  StakeholderDependencies,
  StakeholderAreaIntelligence as StakeholderAreaIntelligenceContract,
  StakeholderForecastEngineContract,
  StakeholderScenarioEngineContract,
  StakeholderTrendEngineContract,
  StakeholderAnalysisEngineContract,
  StakeholderMappingEngineContract,
  InfluenceEngineContract,
  RelationshipEngineContract,
  SentimentEngineContract,
  EngagementEngineContract,
  ConflictDetectionEngineContract,
  EarlyWarningEngineContract,
  StakeholderReasonerContract,
  StakeholderRegistry as StakeholderRegistryContract,
  StakeholderRepository as StakeholderRepositoryContract,
  StakeholderEngine as StakeholderEngineContract,
  StakeholderIntelligenceEngine as StakeholderIntelligenceEngineContract,
  StakeholderIntelligenceService as StakeholderIntelligenceServiceContract,
  StakeholderService as StakeholderServiceContract,
} from "@/lib/platform/intelligence/stakeholder/contracts";
export * from "@/lib/platform/intelligence/stakeholder/models";
export * from "@/lib/platform/intelligence/stakeholder/area-factory";
export * from "@/lib/platform/intelligence/stakeholder/stakeholder-identification-intelligence";
export * from "@/lib/platform/intelligence/stakeholder/stakeholder-mapping-intelligence";
export * from "@/lib/platform/intelligence/stakeholder/influence-analysis-intelligence";
export * from "@/lib/platform/intelligence/stakeholder/interest-analysis-intelligence";
export * from "@/lib/platform/intelligence/stakeholder/engagement-intelligence";
export * from "@/lib/platform/intelligence/stakeholder/communication-intelligence";
export * from "@/lib/platform/intelligence/stakeholder/trust-relationship-intelligence";
export * from "@/lib/platform/intelligence/stakeholder/board-stakeholders-intelligence";
export * from "@/lib/platform/intelligence/stakeholder/investor-donor-intelligence";
export * from "@/lib/platform/intelligence/stakeholder/customer-stakeholders-intelligence";
export * from "@/lib/platform/intelligence/stakeholder/employee-stakeholders-intelligence";
export * from "@/lib/platform/intelligence/stakeholder/partner-stakeholders-intelligence";
export * from "@/lib/platform/intelligence/stakeholder/community-stakeholders-intelligence";
export * from "@/lib/platform/intelligence/stakeholder/government-stakeholders-intelligence";
export * from "@/lib/platform/intelligence/stakeholder/satisfaction-sentiment-intelligence";
export * from "@/lib/platform/intelligence/stakeholder/conflict-detection-intelligence";
export * from "@/lib/platform/intelligence/stakeholder/collaboration-opportunities-intelligence";
export * from "@/lib/platform/intelligence/stakeholder/stakeholder-forecast-engine";
export * from "@/lib/platform/intelligence/stakeholder/stakeholder-scenario-engine";
export * from "@/lib/platform/intelligence/stakeholder/stakeholder-trend-engine";
export * from "@/lib/platform/intelligence/stakeholder/stakeholder-analysis-engine";
export * from "@/lib/platform/intelligence/stakeholder/stakeholder-mapping-engine";
export * from "@/lib/platform/intelligence/stakeholder/influence-engine";
export * from "@/lib/platform/intelligence/stakeholder/relationship-engine";
export * from "@/lib/platform/intelligence/stakeholder/sentiment-engine";
export * from "@/lib/platform/intelligence/stakeholder/engagement-engine";
export * from "@/lib/platform/intelligence/stakeholder/conflict-detection-engine";
export * from "@/lib/platform/intelligence/stakeholder/early-warning-engine";
export * from "@/lib/platform/intelligence/stakeholder/knowledge-contribution";
export * from "@/lib/platform/intelligence/stakeholder/closed-learning-loop";
export * from "@/lib/platform/intelligence/stakeholder/stakeholder-reasoner";
export * from "@/lib/platform/intelligence/stakeholder/stakeholder-intelligence";
export * from "@/lib/platform/intelligence/stakeholder/projection";
export * from "@/lib/platform/intelligence/stakeholder/stakeholder-registry";
export * from "@/lib/platform/intelligence/stakeholder/repository";
export * from "@/lib/platform/intelligence/stakeholder/stakeholder-engine";
export * from "@/lib/platform/intelligence/stakeholder/service";

import type { StakeholderDependencies } from "@/lib/platform/intelligence/stakeholder/contracts";
import { StakeholderIntelligenceEngine } from "@/lib/platform/intelligence/stakeholder/stakeholder-engine";
import { StakeholderIntelligenceService } from "@/lib/platform/intelligence/stakeholder/service";
import {
  createOrganizationDnaIntelligence,
  type CreateOrganizationDnaOptions,
  type OrganizationDnaStack,
} from "@/lib/platform/intelligence/organization-dna";
import {
  createOiosOperatingSystem,
  type CreateOiosOptions,
  type OiosStack,
} from "@/lib/platform/oios";

export interface StakeholderStack {
  service: StakeholderIntelligenceService;
  engine: StakeholderIntelligenceEngine;
  organizationDna: OrganizationDnaStack | null;
  oios: OiosStack | null;
}

export interface CreateStakeholderOptions extends StakeholderDependencies {
  organizationDna?: OrganizationDnaStack;
  organizationDnaOptions?: CreateOrganizationDnaOptions;
  wireOrganizationDna?: boolean;
  oios?: OiosStack;
  oiosOptions?: CreateOiosOptions;
  wireOios?: boolean;
}

export function createStakeholderIntelligence(options: CreateStakeholderOptions = {}): StakeholderStack {
  const organizationDna =
    options.organizationDna ??
    (options.wireOrganizationDna === false
      ? null
      : createOrganizationDnaIntelligence({
          ...options.organizationDnaOptions,
          wireGraphAnalyzer: false,
          wireDecision: false,
          wirePredictive: false,
          wireBoardGovernance: false,
        }));
  const oios =
    options.oios ??
    (options.wireOios === false
      ? null
      : createOiosOperatingSystem({
          ...options.oiosOptions,
          organizationDnaStack: options.oiosOptions?.organizationDnaStack ?? organizationDna ?? undefined,
          wireOrganizationDna: false,
        }));
  const engine = new StakeholderIntelligenceEngine(options);
  const service = new StakeholderIntelligenceService({ ...options, engine });
  return { service, engine, organizationDna, oios };
}
