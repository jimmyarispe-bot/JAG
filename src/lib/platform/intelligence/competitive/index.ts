export * from "@/lib/platform/intelligence/competitive/types";
export type {
  CompetitiveDependencies,
  CompetitiveAreaIntelligence as CompetitiveAreaIntelligenceContract,
  CompetitiveForecastEngineContract,
  CompetitiveScenarioEngineContract,
  CompetitiveTrendEngineContract,
  CompetitiveAnalysisEngineContract,
  CompetitiveReasonerContract,
  CompetitiveRegistry as CompetitiveRegistryContract,
  CompetitiveRepository as CompetitiveRepositoryContract,
  CompetitiveEngine as CompetitiveEngineContract,
  CompetitiveIntelligenceEngine as CompetitiveIntelligenceEngineContract,
  CompetitiveIntelligenceService as CompetitiveIntelligenceServiceContract,
  CompetitiveService as CompetitiveServiceContract,
} from "@/lib/platform/intelligence/competitive/contracts";
export * from "@/lib/platform/intelligence/competitive/models";
export * from "@/lib/platform/intelligence/competitive/area-factory";
export * from "@/lib/platform/intelligence/competitive/direct-peer-schools-intelligence";
export * from "@/lib/platform/intelligence/competitive/indirect-substitutes-intelligence";
export * from "@/lib/platform/intelligence/competitive/tuition-aid-positioning-intelligence";
export * from "@/lib/platform/intelligence/competitive/program-curriculum-differentiation-intelligence";
export * from "@/lib/platform/intelligence/competitive/enrollment-admissions-dynamics-intelligence";
export * from "@/lib/platform/intelligence/competitive/regional-market-share-intelligence";
export * from "@/lib/platform/intelligence/competitive/talent-faculty-competition-intelligence";
export * from "@/lib/platform/intelligence/competitive/brand-reputation-choice-drivers-intelligence";
export * from "@/lib/platform/intelligence/competitive/partnership-alliance-landscape-intelligence";
export * from "@/lib/platform/intelligence/competitive/technology-delivery-models-intelligence";
export * from "@/lib/platform/intelligence/competitive/expansion-launch-signals-intelligence";
export * from "@/lib/platform/intelligence/competitive/consolidation-network-strategy-intelligence";
export * from "@/lib/platform/intelligence/competitive/competitive-forecast-engine";
export * from "@/lib/platform/intelligence/competitive/competitive-scenario-engine";
export * from "@/lib/platform/intelligence/competitive/competitive-trend-engine";
export * from "@/lib/platform/intelligence/competitive/competitive-analysis-engine";
export * from "@/lib/platform/intelligence/competitive/knowledge-contribution";
export * from "@/lib/platform/intelligence/competitive/closed-learning-loop";
export * from "@/lib/platform/intelligence/competitive/competitive-reasoner";
export * from "@/lib/platform/intelligence/competitive/competitive-intelligence";
export * from "@/lib/platform/intelligence/competitive/projection";
export * from "@/lib/platform/intelligence/competitive/competitive-registry";
export * from "@/lib/platform/intelligence/competitive/repository";
export * from "@/lib/platform/intelligence/competitive/competitive-engine";
export * from "@/lib/platform/intelligence/competitive/service";

import type { CompetitiveDependencies } from "@/lib/platform/intelligence/competitive/contracts";
import { CompetitiveIntelligenceEngine } from "@/lib/platform/intelligence/competitive/competitive-engine";
import { CompetitiveIntelligenceService } from "@/lib/platform/intelligence/competitive/service";
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

export interface CompetitiveStack {
  service: CompetitiveIntelligenceService;
  engine: CompetitiveIntelligenceEngine;
  organizationDna: OrganizationDnaStack | null;
  oios: OiosStack | null;
}

export interface CreateCompetitiveOptions extends CompetitiveDependencies {
  organizationDna?: OrganizationDnaStack;
  organizationDnaOptions?: CreateOrganizationDnaOptions;
  wireOrganizationDna?: boolean;
  oios?: OiosStack;
  oiosOptions?: CreateOiosOptions;
  wireOios?: boolean;
}

export function createCompetitiveIntelligence(options: CreateCompetitiveOptions = {}): CompetitiveStack {
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
  const engine = new CompetitiveIntelligenceEngine(options);
  const service = new CompetitiveIntelligenceService({ ...options, engine });
  return { service, engine, organizationDna, oios };
}
