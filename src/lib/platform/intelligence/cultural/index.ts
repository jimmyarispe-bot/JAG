export * from "@/lib/platform/intelligence/cultural/types";
export type {
  CulturalDependencies,
  CulturalAreaIntelligence as CulturalAreaIntelligenceContract,
  CulturalForecastEngineContract,
  CulturalScenarioEngineContract,
  CulturalTrendEngineContract,
  CulturalAnalysisEngineContract,
  CultureMappingEngineContract,
  EngagementEngineContract,
  MissionAlignmentEngineContract,
  ValuesAlignmentEngineContract,
  CollaborationEngineContract,
  EarlyWarningEngineContract,
  CulturalReasonerContract,
  CulturalRegistry as CulturalRegistryContract,
  CulturalRepository as CulturalRepositoryContract,
  CulturalEngine as CulturalEngineContract,
  CulturalIntelligenceEngine as CulturalIntelligenceEngineContract,
  CulturalIntelligenceService as CulturalIntelligenceServiceContract,
  CulturalService as CulturalServiceContract,
} from "@/lib/platform/intelligence/cultural/contracts";
export * from "@/lib/platform/intelligence/cultural/models";
export * from "@/lib/platform/intelligence/cultural/area-factory";
export * from "@/lib/platform/intelligence/cultural/organizational-culture-intelligence";
export * from "@/lib/platform/intelligence/cultural/team-culture-intelligence";
export * from "@/lib/platform/intelligence/cultural/leadership-culture-intelligence";
export * from "@/lib/platform/intelligence/cultural/mission-alignment-intelligence";
export * from "@/lib/platform/intelligence/cultural/values-alignment-intelligence";
export * from "@/lib/platform/intelligence/cultural/employee-engagement-intelligence";
export * from "@/lib/platform/intelligence/cultural/collaboration-culture-intelligence";
export * from "@/lib/platform/intelligence/cultural/communication-culture-intelligence";
export * from "@/lib/platform/intelligence/cultural/innovation-culture-intelligence";
export * from "@/lib/platform/intelligence/cultural/learning-culture-intelligence";
export * from "@/lib/platform/intelligence/cultural/psychological-safety-intelligence";
export * from "@/lib/platform/intelligence/cultural/inclusion-belonging-intelligence";
export * from "@/lib/platform/intelligence/cultural/cross-cultural-intelligence";
export * from "@/lib/platform/intelligence/cultural/community-culture-intelligence";
export * from "@/lib/platform/intelligence/cultural/cultural-risk-intelligence";
export * from "@/lib/platform/intelligence/cultural/cultural-opportunity-intelligence";
export * from "@/lib/platform/intelligence/cultural/cultural-transformation-intelligence";
export * from "@/lib/platform/intelligence/cultural/cultural-forecast-engine";
export * from "@/lib/platform/intelligence/cultural/cultural-scenario-engine";
export * from "@/lib/platform/intelligence/cultural/cultural-trend-engine";
export * from "@/lib/platform/intelligence/cultural/cultural-analysis-engine";
export * from "@/lib/platform/intelligence/cultural/culture-mapping-engine";
export * from "@/lib/platform/intelligence/cultural/engagement-engine";
export * from "@/lib/platform/intelligence/cultural/mission-alignment-engine";
export * from "@/lib/platform/intelligence/cultural/values-alignment-engine";
export * from "@/lib/platform/intelligence/cultural/collaboration-engine";
export * from "@/lib/platform/intelligence/cultural/early-warning-engine";
export * from "@/lib/platform/intelligence/cultural/knowledge-contribution";
export * from "@/lib/platform/intelligence/cultural/closed-learning-loop";
export * from "@/lib/platform/intelligence/cultural/cultural-reasoner";
export * from "@/lib/platform/intelligence/cultural/cultural-intelligence";
export * from "@/lib/platform/intelligence/cultural/projection";
export * from "@/lib/platform/intelligence/cultural/cultural-registry";
export * from "@/lib/platform/intelligence/cultural/repository";
export * from "@/lib/platform/intelligence/cultural/cultural-engine";
export * from "@/lib/platform/intelligence/cultural/service";

import type { CulturalDependencies } from "@/lib/platform/intelligence/cultural/contracts";
import { CulturalIntelligenceEngine } from "@/lib/platform/intelligence/cultural/cultural-engine";
import { CulturalIntelligenceService } from "@/lib/platform/intelligence/cultural/service";
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

export interface CulturalStack {
  service: CulturalIntelligenceService;
  engine: CulturalIntelligenceEngine;
  organizationDna: OrganizationDnaStack | null;
  oios: OiosStack | null;
}

export interface CreateCulturalOptions extends CulturalDependencies {
  organizationDna?: OrganizationDnaStack;
  organizationDnaOptions?: CreateOrganizationDnaOptions;
  wireOrganizationDna?: boolean;
  oios?: OiosStack;
  oiosOptions?: CreateOiosOptions;
  wireOios?: boolean;
}

export function createCulturalIntelligence(options: CreateCulturalOptions = {}): CulturalStack {
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
  const engine = new CulturalIntelligenceEngine(options);
  const service = new CulturalIntelligenceService({ ...options, engine });
  return { service, engine, organizationDna, oios };
}
