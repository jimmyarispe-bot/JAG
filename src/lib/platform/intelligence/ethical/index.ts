export * from "@/lib/platform/intelligence/ethical/types";
export type {
  EthicalDependencies,
  EthicalAreaIntelligence as EthicalAreaIntelligenceContract,
  EthicalForecastEngineContract,
  EthicalScenarioEngineContract,
  EthicalTrendEngineContract,
  EthicalAnalysisEngineContract,
  ValuesAlignmentEngineContract,
  FairnessEngineContract,
  HumanImpactEngineContract,
  AiEthicsEngineContract,
  GovernanceEthicsEngineContract,
  EarlyWarningEngineContract,
  EthicalReasonerContract,
  EthicalRegistry as EthicalRegistryContract,
  EthicalRepository as EthicalRepositoryContract,
  EthicalEngine as EthicalEngineContract,
  EthicalIntelligenceEngine as EthicalIntelligenceEngineContract,
  EthicalIntelligenceService as EthicalIntelligenceServiceContract,
  EthicalService as EthicalServiceContract,
} from "@/lib/platform/intelligence/ethical/contracts";
export * from "@/lib/platform/intelligence/ethical/models";
export * from "@/lib/platform/intelligence/ethical/area-factory";
export * from "@/lib/platform/intelligence/ethical/ethical-decision-analysis-intelligence";
export * from "@/lib/platform/intelligence/ethical/values-alignment-intelligence";
export * from "@/lib/platform/intelligence/ethical/fairness-intelligence";
export * from "@/lib/platform/intelligence/ethical/transparency-intelligence";
export * from "@/lib/platform/intelligence/ethical/accountability-intelligence";
export * from "@/lib/platform/intelligence/ethical/human-impact-intelligence";
export * from "@/lib/platform/intelligence/ethical/ai-ethics-intelligence";
export * from "@/lib/platform/intelligence/ethical/responsible-automation-intelligence";
export * from "@/lib/platform/intelligence/ethical/bias-discrimination-intelligence";
export * from "@/lib/platform/intelligence/ethical/governance-ethics-intelligence";
export * from "@/lib/platform/intelligence/ethical/privacy-data-ethics-intelligence";
export * from "@/lib/platform/intelligence/ethical/sustainability-ethics-intelligence";
export * from "@/lib/platform/intelligence/ethical/social-responsibility-intelligence";
export * from "@/lib/platform/intelligence/ethical/ethical-risk-intelligence";
export * from "@/lib/platform/intelligence/ethical/ethical-opportunity-intelligence";
export * from "@/lib/platform/intelligence/ethical/ethical-stewardship-intelligence";
export * from "@/lib/platform/intelligence/ethical/recommendation-validation-intelligence";
export * from "@/lib/platform/intelligence/ethical/ethical-forecast-engine";
export * from "@/lib/platform/intelligence/ethical/ethical-scenario-engine";
export * from "@/lib/platform/intelligence/ethical/ethical-trend-engine";
export * from "@/lib/platform/intelligence/ethical/ethical-analysis-engine";
export * from "@/lib/platform/intelligence/ethical/values-alignment-engine";
export * from "@/lib/platform/intelligence/ethical/fairness-engine";
export * from "@/lib/platform/intelligence/ethical/human-impact-engine";
export * from "@/lib/platform/intelligence/ethical/ai-ethics-engine";
export * from "@/lib/platform/intelligence/ethical/governance-ethics-engine";
export * from "@/lib/platform/intelligence/ethical/early-warning-engine";
export * from "@/lib/platform/intelligence/ethical/knowledge-contribution";
export * from "@/lib/platform/intelligence/ethical/closed-learning-loop";
export * from "@/lib/platform/intelligence/ethical/ethical-reasoner";
export * from "@/lib/platform/intelligence/ethical/ethical-intelligence";
export * from "@/lib/platform/intelligence/ethical/projection";
export * from "@/lib/platform/intelligence/ethical/ethical-registry";
export * from "@/lib/platform/intelligence/ethical/repository";
export * from "@/lib/platform/intelligence/ethical/ethical-engine";
export * from "@/lib/platform/intelligence/ethical/service";

import type { EthicalDependencies } from "@/lib/platform/intelligence/ethical/contracts";
import { EthicalIntelligenceEngine } from "@/lib/platform/intelligence/ethical/ethical-engine";
import { EthicalIntelligenceService } from "@/lib/platform/intelligence/ethical/service";
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

export interface EthicalStack {
  service: EthicalIntelligenceService;
  engine: EthicalIntelligenceEngine;
  organizationDna: OrganizationDnaStack | null;
  oios: OiosStack | null;
}

export interface CreateEthicalOptions extends EthicalDependencies {
  organizationDna?: OrganizationDnaStack;
  organizationDnaOptions?: CreateOrganizationDnaOptions;
  wireOrganizationDna?: boolean;
  oios?: OiosStack;
  oiosOptions?: CreateOiosOptions;
  wireOios?: boolean;
}

export function createEthicalIntelligence(options: CreateEthicalOptions = {}): EthicalStack {
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
  const engine = new EthicalIntelligenceEngine(options);
  const service = new EthicalIntelligenceService({ ...options, engine });
  return { service, engine, organizationDna, oios };
}
