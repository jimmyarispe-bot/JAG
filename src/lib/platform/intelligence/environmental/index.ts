export * from "@/lib/platform/intelligence/environmental/types";
export type {
  EnvironmentalDependencies,
  EnvironmentalAreaIntelligence as EnvironmentalAreaIntelligenceContract,
  EnvironmentalForecastEngineContract,
  EnvironmentalScenarioEngineContract,
  EnvironmentalTrendEngineContract,
  EnvironmentalAnalysisEngineContract,
  ClimateRiskEngineContract,
  DisasterImpactEngineContract,
  SustainabilityEngineContract,
  InfrastructureResilienceEngineContract,
  EarlyWarningEngineContract,
  EnvironmentalReasonerContract,
  EnvironmentalRegistry as EnvironmentalRegistryContract,
  EnvironmentalRepository as EnvironmentalRepositoryContract,
  EnvironmentalEngine as EnvironmentalEngineContract,
  EnvironmentalIntelligenceEngine as EnvironmentalIntelligenceEngineContract,
  EnvironmentalIntelligenceService as EnvironmentalIntelligenceServiceContract,
  EnvironmentalService as EnvironmentalServiceContract,
} from "@/lib/platform/intelligence/environmental/contracts";
export * from "@/lib/platform/intelligence/environmental/models";
export * from "@/lib/platform/intelligence/environmental/area-factory";
export * from "@/lib/platform/intelligence/environmental/climate-intelligence";
export * from "@/lib/platform/intelligence/environmental/weather-risk-intelligence";
export * from "@/lib/platform/intelligence/environmental/natural-disaster-intelligence";
export * from "@/lib/platform/intelligence/environmental/environmental-regulation-intelligence";
export * from "@/lib/platform/intelligence/environmental/sustainability-intelligence";
export * from "@/lib/platform/intelligence/environmental/energy-intelligence";
export * from "@/lib/platform/intelligence/environmental/water-resources-intelligence";
export * from "@/lib/platform/intelligence/environmental/air-quality-intelligence";
export * from "@/lib/platform/intelligence/environmental/waste-management-intelligence";
export * from "@/lib/platform/intelligence/environmental/carbon-emissions-intelligence";
export * from "@/lib/platform/intelligence/environmental/biodiversity-intelligence";
export * from "@/lib/platform/intelligence/environmental/infrastructure-resilience-intelligence";
export * from "@/lib/platform/intelligence/environmental/facility-risk-intelligence";
export * from "@/lib/platform/intelligence/environmental/supply-chain-environmental-risk-intelligence";
export * from "@/lib/platform/intelligence/environmental/insurance-exposure-intelligence";
export * from "@/lib/platform/intelligence/environmental/environmental-funding-intelligence";
export * from "@/lib/platform/intelligence/environmental/esg-impact-intelligence";
export * from "@/lib/platform/intelligence/environmental/environmental-forecast-engine";
export * from "@/lib/platform/intelligence/environmental/environmental-scenario-engine";
export * from "@/lib/platform/intelligence/environmental/environmental-trend-engine";
export * from "@/lib/platform/intelligence/environmental/environmental-analysis-engine";
export * from "@/lib/platform/intelligence/environmental/climate-risk-engine";
export * from "@/lib/platform/intelligence/environmental/disaster-impact-engine";
export * from "@/lib/platform/intelligence/environmental/sustainability-engine";
export * from "@/lib/platform/intelligence/environmental/infrastructure-resilience-engine";
export * from "@/lib/platform/intelligence/environmental/early-warning-engine";
export * from "@/lib/platform/intelligence/environmental/knowledge-contribution";
export * from "@/lib/platform/intelligence/environmental/closed-learning-loop";
export * from "@/lib/platform/intelligence/environmental/environmental-reasoner";
export * from "@/lib/platform/intelligence/environmental/environmental-intelligence";
export * from "@/lib/platform/intelligence/environmental/projection";
export * from "@/lib/platform/intelligence/environmental/environmental-registry";
export * from "@/lib/platform/intelligence/environmental/repository";
export * from "@/lib/platform/intelligence/environmental/environmental-engine";
export * from "@/lib/platform/intelligence/environmental/service";

import type { EnvironmentalDependencies } from "@/lib/platform/intelligence/environmental/contracts";
import { EnvironmentalIntelligenceEngine } from "@/lib/platform/intelligence/environmental/environmental-engine";
import { EnvironmentalIntelligenceService } from "@/lib/platform/intelligence/environmental/service";
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

export interface EnvironmentalStack {
  service: EnvironmentalIntelligenceService;
  engine: EnvironmentalIntelligenceEngine;
  organizationDna: OrganizationDnaStack | null;
  oios: OiosStack | null;
}

export interface CreateEnvironmentalOptions extends EnvironmentalDependencies {
  organizationDna?: OrganizationDnaStack;
  organizationDnaOptions?: CreateOrganizationDnaOptions;
  wireOrganizationDna?: boolean;
  oios?: OiosStack;
  oiosOptions?: CreateOiosOptions;
  wireOios?: boolean;
}

export function createEnvironmentalIntelligence(options: CreateEnvironmentalOptions = {}): EnvironmentalStack {
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
  const engine = new EnvironmentalIntelligenceEngine(options);
  const service = new EnvironmentalIntelligenceService({ ...options, engine });
  return { service, engine, organizationDna, oios };
}
