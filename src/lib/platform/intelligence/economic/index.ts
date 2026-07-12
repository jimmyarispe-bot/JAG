export * from "@/lib/platform/intelligence/economic/types";
export type {
  EconomicDependencies,
  EconomicAreaIntelligence as EconomicAreaIntelligenceContract,
  EconomicForecastEngineContract,
  EconomicScenarioEngineContract,
  EconomicTrendEngineContract,
  EconomicAnalysisEngineContract,
  EconomicReasonerContract,
  EconomicRegistry as EconomicRegistryContract,
  EconomicRepository as EconomicRepositoryContract,
  EconomicEngine as EconomicEngineContract,
  EconomicIntelligenceEngine as EconomicIntelligenceEngineContract,
  EconomicIntelligenceService as EconomicIntelligenceServiceContract,
  EconomicService as EconomicServiceContract,
} from "@/lib/platform/intelligence/economic/contracts";
export * from "@/lib/platform/intelligence/economic/models";
export * from "@/lib/platform/intelligence/economic/area-factory";
export * from "@/lib/platform/intelligence/economic/inflation-intelligence";
export * from "@/lib/platform/intelligence/economic/interest-rates-intelligence";
export * from "@/lib/platform/intelligence/economic/gdp-intelligence";
export * from "@/lib/platform/intelligence/economic/employment-intelligence";
export * from "@/lib/platform/intelligence/economic/labor-market-intelligence";
export * from "@/lib/platform/intelligence/economic/wage-trends-intelligence";
export * from "@/lib/platform/intelligence/economic/housing-intelligence";
export * from "@/lib/platform/intelligence/economic/healthcare-intelligence";
export * from "@/lib/platform/intelligence/economic/energy-intelligence";
export * from "@/lib/platform/intelligence/economic/supply-chains-intelligence";
export * from "@/lib/platform/intelligence/economic/commodity-prices-intelligence";
export * from "@/lib/platform/intelligence/economic/currency-intelligence";
export * from "@/lib/platform/intelligence/economic/government-spending-intelligence";
export * from "@/lib/platform/intelligence/economic/tax-environment-intelligence";
export * from "@/lib/platform/intelligence/economic/consumer-spending-intelligence";
export * from "@/lib/platform/intelligence/economic/industry-conditions-intelligence";
export * from "@/lib/platform/intelligence/economic/regional-economics-intelligence";
export * from "@/lib/platform/intelligence/economic/international-economics-intelligence";
export * from "@/lib/platform/intelligence/economic/economic-forecast-engine";
export * from "@/lib/platform/intelligence/economic/economic-scenario-engine";
export * from "@/lib/platform/intelligence/economic/economic-trend-engine";
export * from "@/lib/platform/intelligence/economic/economic-analysis-engine";
export * from "@/lib/platform/intelligence/economic/knowledge-contribution";
export * from "@/lib/platform/intelligence/economic/closed-learning-loop";
export * from "@/lib/platform/intelligence/economic/economic-reasoner";
export * from "@/lib/platform/intelligence/economic/economic-intelligence";
export * from "@/lib/platform/intelligence/economic/projection";
export * from "@/lib/platform/intelligence/economic/economic-registry";
export * from "@/lib/platform/intelligence/economic/repository";
export * from "@/lib/platform/intelligence/economic/economic-engine";
export * from "@/lib/platform/intelligence/economic/service";

import type { EconomicDependencies } from "@/lib/platform/intelligence/economic/contracts";
import { EconomicIntelligenceEngine } from "@/lib/platform/intelligence/economic/economic-engine";
import { EconomicIntelligenceService } from "@/lib/platform/intelligence/economic/service";
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

export interface EconomicStack {
  service: EconomicIntelligenceService;
  engine: EconomicIntelligenceEngine;
  organizationDna: OrganizationDnaStack | null;
  oios: OiosStack | null;
}

export interface CreateEconomicOptions extends EconomicDependencies {
  organizationDna?: OrganizationDnaStack;
  organizationDnaOptions?: CreateOrganizationDnaOptions;
  wireOrganizationDna?: boolean;
  oios?: OiosStack;
  oiosOptions?: CreateOiosOptions;
  wireOios?: boolean;
}

export function createEconomicIntelligence(options: CreateEconomicOptions = {}): EconomicStack {
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
  const engine = new EconomicIntelligenceEngine(options);
  const service = new EconomicIntelligenceService({ ...options, engine });
  return { service, engine, organizationDna, oios };
}
