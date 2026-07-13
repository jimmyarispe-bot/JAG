export * from "@/lib/platform/intelligence/resilience/types";
export type {
  ResilienceDependencies,
  ResilienceAreaIntelligence as ResilienceAreaIntelligenceContract,
  ResilienceForecastEngineContract,
  ResilienceScenarioEngineContract,
  ResilienceTrendEngineContract,
  ResilienceAnalysisEngineContract,
  StressTestEngineContract,
  RecoveryEngineContract,
  ContinuityEngineContract,
  AdaptiveCapacityEngineContract,
  EarlyWarningEngineContract,
  ResilienceReasonerContract,
  ResilienceRegistry as ResilienceRegistryContract,
  ResilienceRepository as ResilienceRepositoryContract,
  ResilienceEngine as ResilienceEngineContract,
  ResilienceIntelligenceEngine as ResilienceIntelligenceEngineContract,
  ResilienceIntelligenceService as ResilienceIntelligenceServiceContract,
  ResilienceService as ResilienceServiceContract,
} from "@/lib/platform/intelligence/resilience/contracts";
export * from "@/lib/platform/intelligence/resilience/models";
export * from "@/lib/platform/intelligence/resilience/area-factory";
export * from "@/lib/platform/intelligence/resilience/organizational-resilience-intelligence";
export * from "@/lib/platform/intelligence/resilience/business-continuity-intelligence";
export * from "@/lib/platform/intelligence/resilience/disaster-recovery-intelligence";
export * from "@/lib/platform/intelligence/resilience/operational-recovery-intelligence";
export * from "@/lib/platform/intelligence/resilience/financial-resilience-intelligence";
export * from "@/lib/platform/intelligence/resilience/workforce-resilience-intelligence";
export * from "@/lib/platform/intelligence/resilience/supply-chain-resilience-intelligence";
export * from "@/lib/platform/intelligence/resilience/cyber-resilience-intelligence";
export * from "@/lib/platform/intelligence/resilience/infrastructure-resilience-intelligence";
export * from "@/lib/platform/intelligence/resilience/vendor-resilience-intelligence";
export * from "@/lib/platform/intelligence/resilience/crisis-readiness-intelligence";
export * from "@/lib/platform/intelligence/resilience/adaptive-capacity-intelligence";
export * from "@/lib/platform/intelligence/resilience/redundancy-planning-intelligence";
export * from "@/lib/platform/intelligence/resilience/recovery-time-analysis-intelligence";
export * from "@/lib/platform/intelligence/resilience/stress-testing-intelligence";
export * from "@/lib/platform/intelligence/resilience/resilience-optimization-intelligence";
export * from "@/lib/platform/intelligence/resilience/long-term-adaptability-intelligence";
export * from "@/lib/platform/intelligence/resilience/resilience-forecast-engine";
export * from "@/lib/platform/intelligence/resilience/resilience-scenario-engine";
export * from "@/lib/platform/intelligence/resilience/resilience-trend-engine";
export * from "@/lib/platform/intelligence/resilience/resilience-analysis-engine";
export * from "@/lib/platform/intelligence/resilience/stress-test-engine";
export * from "@/lib/platform/intelligence/resilience/recovery-engine";
export * from "@/lib/platform/intelligence/resilience/continuity-engine";
export * from "@/lib/platform/intelligence/resilience/adaptive-capacity-engine";
export * from "@/lib/platform/intelligence/resilience/early-warning-engine";
export * from "@/lib/platform/intelligence/resilience/knowledge-contribution";
export * from "@/lib/platform/intelligence/resilience/closed-learning-loop";
export * from "@/lib/platform/intelligence/resilience/resilience-reasoner";
export * from "@/lib/platform/intelligence/resilience/resilience-intelligence";
export * from "@/lib/platform/intelligence/resilience/projection";
export * from "@/lib/platform/intelligence/resilience/resilience-registry";
export * from "@/lib/platform/intelligence/resilience/repository";
export * from "@/lib/platform/intelligence/resilience/resilience-engine";
export * from "@/lib/platform/intelligence/resilience/service";

import type { ResilienceDependencies } from "@/lib/platform/intelligence/resilience/contracts";
import { ResilienceIntelligenceEngine } from "@/lib/platform/intelligence/resilience/resilience-engine";
import { ResilienceIntelligenceService } from "@/lib/platform/intelligence/resilience/service";
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

export interface ResilienceStack {
  service: ResilienceIntelligenceService;
  engine: ResilienceIntelligenceEngine;
  organizationDna: OrganizationDnaStack | null;
  oios: OiosStack | null;
}

export interface CreateResilienceOptions extends ResilienceDependencies {
  organizationDna?: OrganizationDnaStack;
  organizationDnaOptions?: CreateOrganizationDnaOptions;
  wireOrganizationDna?: boolean;
  oios?: OiosStack;
  oiosOptions?: CreateOiosOptions;
  wireOios?: boolean;
}

export function createResilienceIntelligence(options: CreateResilienceOptions = {}): ResilienceStack {
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
  const engine = new ResilienceIntelligenceEngine(options);
  const service = new ResilienceIntelligenceService({ ...options, engine });
  return { service, engine, organizationDna, oios };
}
