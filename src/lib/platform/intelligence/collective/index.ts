export * from "@/lib/platform/intelligence/collective/types";
export type {
  CollectiveDependencies,
  CollectiveAreaIntelligence as CollectiveAreaIntelligenceContract,
  CollectiveForecastEngineContract,
  CollectiveScenarioEngineContract,
  CollectiveTrendEngineContract,
  CollectiveAnalysisEngineContract,
  ConsensusEngineContract,
  DistributedExpertiseEngineContract,
  CrossDomainSynthesisEngineContract,
  CollaborationEngineContract,
  ConflictResolutionEngineContract,
  EarlyWarningEngineContract,
  CollectiveReasonerContract,
  CollectiveRegistry as CollectiveRegistryContract,
  CollectiveRepository as CollectiveRepositoryContract,
  CollectiveEngine as CollectiveEngineContract,
  CollectiveIntelligenceEngine as CollectiveIntelligenceEngineContract,
  CollectiveIntelligenceService as CollectiveIntelligenceServiceContract,
  CollectiveService as CollectiveServiceContract,
} from "@/lib/platform/intelligence/collective/contracts";
export * from "@/lib/platform/intelligence/collective/models";
export * from "@/lib/platform/intelligence/collective/area-factory";
export * from "@/lib/platform/intelligence/collective/collective-reasoning-intelligence";
export * from "@/lib/platform/intelligence/collective/consensus-analysis-intelligence";
export * from "@/lib/platform/intelligence/collective/distributed-expertise-intelligence";
export * from "@/lib/platform/intelligence/collective/collaborative-intelligence-intelligence";
export * from "@/lib/platform/intelligence/collective/multi-domain-synthesis-intelligence";
export * from "@/lib/platform/intelligence/collective/cross-functional-intelligence-intelligence";
export * from "@/lib/platform/intelligence/collective/organizational-alignment-intelligence";
export * from "@/lib/platform/intelligence/collective/team-decision-intelligence-intelligence";
export * from "@/lib/platform/intelligence/collective/expert-weighting-intelligence";
export * from "@/lib/platform/intelligence/collective/perspective-diversity-intelligence";
export * from "@/lib/platform/intelligence/collective/conflict-resolution-intelligence";
export * from "@/lib/platform/intelligence/collective/collaborative-learning-intelligence";
export * from "@/lib/platform/intelligence/collective/organizational-coordination-intelligence";
export * from "@/lib/platform/intelligence/collective/shared-decision-quality-intelligence";
export * from "@/lib/platform/intelligence/collective/collective-opportunity-detection-intelligence";
export * from "@/lib/platform/intelligence/collective/collective-risk-assessment-intelligence";
export * from "@/lib/platform/intelligence/collective/collective-intelligence-evolution-intelligence";
export * from "@/lib/platform/intelligence/collective/collective-forecast-engine";
export * from "@/lib/platform/intelligence/collective/collective-scenario-engine";
export * from "@/lib/platform/intelligence/collective/collective-trend-engine";
export * from "@/lib/platform/intelligence/collective/collective-analysis-engine";
export * from "@/lib/platform/intelligence/collective/consensus-engine";
export * from "@/lib/platform/intelligence/collective/distributed-expertise-engine";
export * from "@/lib/platform/intelligence/collective/cross-domain-synthesis-engine";
export * from "@/lib/platform/intelligence/collective/collaboration-engine";
export * from "@/lib/platform/intelligence/collective/conflict-resolution-engine";
export * from "@/lib/platform/intelligence/collective/early-warning-engine";
export * from "@/lib/platform/intelligence/collective/knowledge-contribution";
export * from "@/lib/platform/intelligence/collective/closed-learning-loop";
export * from "@/lib/platform/intelligence/collective/collective-reasoner";
export * from "@/lib/platform/intelligence/collective/collective-intelligence";
export * from "@/lib/platform/intelligence/collective/projection";
export * from "@/lib/platform/intelligence/collective/collective-registry";
export * from "@/lib/platform/intelligence/collective/repository";
export * from "@/lib/platform/intelligence/collective/collective-engine";
export * from "@/lib/platform/intelligence/collective/service";

import type { CollectiveDependencies } from "@/lib/platform/intelligence/collective/contracts";
import { CollectiveIntelligenceEngine } from "@/lib/platform/intelligence/collective/collective-engine";
import { CollectiveIntelligenceService } from "@/lib/platform/intelligence/collective/service";
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

export interface CollectiveStack {
  service: CollectiveIntelligenceService;
  engine: CollectiveIntelligenceEngine;
  organizationDna: OrganizationDnaStack | null;
  oios: OiosStack | null;
}

export interface CreateCollectiveOptions extends CollectiveDependencies {
  organizationDna?: OrganizationDnaStack;
  organizationDnaOptions?: CreateOrganizationDnaOptions;
  wireOrganizationDna?: boolean;
  oios?: OiosStack;
  oiosOptions?: CreateOiosOptions;
  wireOios?: boolean;
}

export function createCollectiveIntelligence(options: CreateCollectiveOptions = {}): CollectiveStack {
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
  const engine = new CollectiveIntelligenceEngine(options);
  const service = new CollectiveIntelligenceService({ ...options, engine });
  return { service, engine, organizationDna, oios };
}
