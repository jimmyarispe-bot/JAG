export * from "@/lib/platform/intelligence/reputation/types";
export type {
  ReputationDependencies,
  ReputationAreaIntelligence as ReputationAreaIntelligenceContract,
  ReputationForecastEngineContract,
  ReputationScenarioEngineContract,
  ReputationTrendEngineContract,
  ReputationAnalysisEngineContract,
  TrustEngineContract,
  SentimentEngineContract,
  NarrativeAnalysisEngineContract,
  MediaIntelligenceEngineContract,
  CrisisDetectionEngineContract,
  EarlyWarningEngineContract,
  ReputationReasonerContract,
  ReputationRegistry as ReputationRegistryContract,
  ReputationRepository as ReputationRepositoryContract,
  ReputationEngine as ReputationEngineContract,
  ReputationIntelligenceEngine as ReputationIntelligenceEngineContract,
  ReputationIntelligenceService as ReputationIntelligenceServiceContract,
  ReputationService as ReputationServiceContract,
} from "@/lib/platform/intelligence/reputation/contracts";
export * from "@/lib/platform/intelligence/reputation/models";
export * from "@/lib/platform/intelligence/reputation/area-factory";
export * from "@/lib/platform/intelligence/reputation/brand-reputation-intelligence";
export * from "@/lib/platform/intelligence/reputation/organizational-trust-intelligence";
export * from "@/lib/platform/intelligence/reputation/public-perception-intelligence";
export * from "@/lib/platform/intelligence/reputation/customer-reputation-intelligence";
export * from "@/lib/platform/intelligence/reputation/employee-reputation-intelligence";
export * from "@/lib/platform/intelligence/reputation/executive-reputation-intelligence";
export * from "@/lib/platform/intelligence/reputation/media-intelligence-intelligence";
export * from "@/lib/platform/intelligence/reputation/press-coverage-intelligence";
export * from "@/lib/platform/intelligence/reputation/social-narrative-intelligence";
export * from "@/lib/platform/intelligence/reputation/community-reputation-intelligence";
export * from "@/lib/platform/intelligence/reputation/partner-reputation-intelligence";
export * from "@/lib/platform/intelligence/reputation/investor-donor-confidence-intelligence";
export * from "@/lib/platform/intelligence/reputation/regulatory-reputation-intelligence";
export * from "@/lib/platform/intelligence/reputation/crisis-reputation-intelligence";
export * from "@/lib/platform/intelligence/reputation/misinformation-detection-intelligence";
export * from "@/lib/platform/intelligence/reputation/reputation-recovery-intelligence";
export * from "@/lib/platform/intelligence/reputation/credibility-intelligence";
export * from "@/lib/platform/intelligence/reputation/reputation-forecast-engine";
export * from "@/lib/platform/intelligence/reputation/reputation-scenario-engine";
export * from "@/lib/platform/intelligence/reputation/reputation-trend-engine";
export * from "@/lib/platform/intelligence/reputation/reputation-analysis-engine";
export * from "@/lib/platform/intelligence/reputation/trust-engine";
export * from "@/lib/platform/intelligence/reputation/sentiment-engine";
export * from "@/lib/platform/intelligence/reputation/narrative-analysis-engine";
export * from "@/lib/platform/intelligence/reputation/media-intelligence-engine";
export * from "@/lib/platform/intelligence/reputation/crisis-detection-engine";
export * from "@/lib/platform/intelligence/reputation/early-warning-engine";
export * from "@/lib/platform/intelligence/reputation/knowledge-contribution";
export * from "@/lib/platform/intelligence/reputation/closed-learning-loop";
export * from "@/lib/platform/intelligence/reputation/reputation-reasoner";
export * from "@/lib/platform/intelligence/reputation/reputation-intelligence";
export * from "@/lib/platform/intelligence/reputation/projection";
export * from "@/lib/platform/intelligence/reputation/reputation-registry";
export * from "@/lib/platform/intelligence/reputation/repository";
export * from "@/lib/platform/intelligence/reputation/reputation-engine";
export * from "@/lib/platform/intelligence/reputation/service";

import type { ReputationDependencies } from "@/lib/platform/intelligence/reputation/contracts";
import { ReputationIntelligenceEngine } from "@/lib/platform/intelligence/reputation/reputation-engine";
import { ReputationIntelligenceService } from "@/lib/platform/intelligence/reputation/service";
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

export interface ReputationStack {
  service: ReputationIntelligenceService;
  engine: ReputationIntelligenceEngine;
  organizationDna: OrganizationDnaStack | null;
  oios: OiosStack | null;
}

export interface CreateReputationOptions extends ReputationDependencies {
  organizationDna?: OrganizationDnaStack;
  organizationDnaOptions?: CreateOrganizationDnaOptions;
  wireOrganizationDna?: boolean;
  oios?: OiosStack;
  oiosOptions?: CreateOiosOptions;
  wireOios?: boolean;
}

export function createReputationIntelligence(options: CreateReputationOptions = {}): ReputationStack {
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
  const engine = new ReputationIntelligenceEngine(options);
  const service = new ReputationIntelligenceService({ ...options, engine });
  return { service, engine, organizationDna, oios };
}
