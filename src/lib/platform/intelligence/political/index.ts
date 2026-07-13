export * from "@/lib/platform/intelligence/political/types";
export type {
  PoliticalDependencies,
  PoliticalAreaIntelligence as PoliticalAreaIntelligenceContract,
  PoliticalForecastEngineContract,
  PoliticalScenarioEngineContract,
  PoliticalTrendEngineContract,
  PoliticalAnalysisEngineContract,
  LegislativeTrackingEngineContract,
  RegulatoryImpactEngineContract,
  PoliticalRiskEngineContract,
  GovernmentFundingEngineContract,
  EarlyWarningEngineContract,
  PoliticalReasonerContract,
  PoliticalRegistry as PoliticalRegistryContract,
  PoliticalRepository as PoliticalRepositoryContract,
  PoliticalEngine as PoliticalEngineContract,
  PoliticalIntelligenceEngine as PoliticalIntelligenceEngineContract,
  PoliticalIntelligenceService as PoliticalIntelligenceServiceContract,
  PoliticalService as PoliticalServiceContract,
} from "@/lib/platform/intelligence/political/contracts";
export * from "@/lib/platform/intelligence/political/models";
export * from "@/lib/platform/intelligence/political/area-factory";
export * from "@/lib/platform/intelligence/political/legislative-intelligence";
export * from "@/lib/platform/intelligence/political/regulatory-intelligence";
export * from "@/lib/platform/intelligence/political/government-policy-intelligence";
export * from "@/lib/platform/intelligence/political/elections-leadership-intelligence";
export * from "@/lib/platform/intelligence/political/public-funding-intelligence";
export * from "@/lib/platform/intelligence/political/tax-policy-intelligence";
export * from "@/lib/platform/intelligence/political/education-policy-intelligence";
export * from "@/lib/platform/intelligence/political/healthcare-policy-intelligence";
export * from "@/lib/platform/intelligence/political/labor-employment-policy-intelligence";
export * from "@/lib/platform/intelligence/political/international-relations-intelligence";
export * from "@/lib/platform/intelligence/political/trade-tariffs-intelligence";
export * from "@/lib/platform/intelligence/political/immigration-policy-intelligence";
export * from "@/lib/platform/intelligence/political/judicial-decisions-intelligence";
export * from "@/lib/platform/intelligence/political/government-contracting-intelligence";
export * from "@/lib/platform/intelligence/political/public-sentiment-intelligence";
export * from "@/lib/platform/intelligence/political/lobbying-advocacy-intelligence";
export * from "@/lib/platform/intelligence/political/geopolitical-risk-intelligence";
export * from "@/lib/platform/intelligence/political/political-forecast-engine";
export * from "@/lib/platform/intelligence/political/political-scenario-engine";
export * from "@/lib/platform/intelligence/political/political-trend-engine";
export * from "@/lib/platform/intelligence/political/political-analysis-engine";
export * from "@/lib/platform/intelligence/political/legislative-tracking-engine";
export * from "@/lib/platform/intelligence/political/regulatory-impact-engine";
export * from "@/lib/platform/intelligence/political/political-risk-engine";
export * from "@/lib/platform/intelligence/political/government-funding-engine";
export * from "@/lib/platform/intelligence/political/early-warning-engine";
export * from "@/lib/platform/intelligence/political/knowledge-contribution";
export * from "@/lib/platform/intelligence/political/closed-learning-loop";
export * from "@/lib/platform/intelligence/political/political-reasoner";
export * from "@/lib/platform/intelligence/political/political-intelligence";
export * from "@/lib/platform/intelligence/political/projection";
export * from "@/lib/platform/intelligence/political/political-registry";
export * from "@/lib/platform/intelligence/political/repository";
export * from "@/lib/platform/intelligence/political/political-engine";
export * from "@/lib/platform/intelligence/political/service";

import type { PoliticalDependencies } from "@/lib/platform/intelligence/political/contracts";
import { PoliticalIntelligenceEngine } from "@/lib/platform/intelligence/political/political-engine";
import { PoliticalIntelligenceService } from "@/lib/platform/intelligence/political/service";
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

export interface PoliticalStack {
  service: PoliticalIntelligenceService;
  engine: PoliticalIntelligenceEngine;
  organizationDna: OrganizationDnaStack | null;
  oios: OiosStack | null;
}

export interface CreatePoliticalOptions extends PoliticalDependencies {
  organizationDna?: OrganizationDnaStack;
  organizationDnaOptions?: CreateOrganizationDnaOptions;
  wireOrganizationDna?: boolean;
  oios?: OiosStack;
  oiosOptions?: CreateOiosOptions;
  wireOios?: boolean;
}

export function createPoliticalIntelligence(options: CreatePoliticalOptions = {}): PoliticalStack {
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
  const engine = new PoliticalIntelligenceEngine(options);
  const service = new PoliticalIntelligenceService({ ...options, engine });
  return { service, engine, organizationDna, oios };
}
