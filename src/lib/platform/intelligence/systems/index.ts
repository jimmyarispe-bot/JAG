export * from "@/lib/platform/intelligence/systems/types";
export type {
  SystemsDependencies,
  SystemsAreaIntelligence as SystemsAreaIntelligenceContract,
  SystemsForecastEngineContract,
  SystemsScenarioEngineContract,
  SystemsTrendEngineContract,
  SystemsAnalysisEngineContract,
  DependencyEngineContract,
  FeedbackLoopEngineContract,
  ConstraintEngineContract,
  BottleneckEngineContract,
  NetworkDynamicsEngineContract,
  EarlyWarningEngineContract,
  SystemsReasonerContract,
  SystemsRegistry as SystemsRegistryContract,
  SystemsRepository as SystemsRepositoryContract,
  SystemsEngine as SystemsEngineContract,
  SystemsIntelligenceEngine as SystemsIntelligenceEngineContract,
  SystemsIntelligenceService as SystemsIntelligenceServiceContract,
  SystemsService as SystemsServiceContract,
} from "@/lib/platform/intelligence/systems/contracts";
export * from "@/lib/platform/intelligence/systems/models";
export * from "@/lib/platform/intelligence/systems/area-factory";
export * from "@/lib/platform/intelligence/systems/system-mapping-intelligence";
export * from "@/lib/platform/intelligence/systems/dependency-analysis-intelligence";
export * from "@/lib/platform/intelligence/systems/feedback-loop-analysis-intelligence";
export * from "@/lib/platform/intelligence/systems/constraint-identification-intelligence";
export * from "@/lib/platform/intelligence/systems/bottleneck-detection-intelligence";
export * from "@/lib/platform/intelligence/systems/flow-optimization-intelligence";
export * from "@/lib/platform/intelligence/systems/emergent-behavior-intelligence";
export * from "@/lib/platform/intelligence/systems/network-dynamics-intelligence";
export * from "@/lib/platform/intelligence/systems/organizational-complexity-intelligence";
export * from "@/lib/platform/intelligence/systems/interdependency-modeling-intelligence";
export * from "@/lib/platform/intelligence/systems/cascading-risk-intelligence";
export * from "@/lib/platform/intelligence/systems/system-stability-intelligence";
export * from "@/lib/platform/intelligence/systems/leverage-point-identification-intelligence";
export * from "@/lib/platform/intelligence/systems/resource-flow-intelligence";
export * from "@/lib/platform/intelligence/systems/adaptive-capacity-intelligence";
export * from "@/lib/platform/intelligence/systems/system-evolution-intelligence";
export * from "@/lib/platform/intelligence/systems/scenario-interaction-intelligence";
export * from "@/lib/platform/intelligence/systems/systems-forecast-engine";
export * from "@/lib/platform/intelligence/systems/systems-scenario-engine";
export * from "@/lib/platform/intelligence/systems/systems-trend-engine";
export * from "@/lib/platform/intelligence/systems/systems-analysis-engine";
export * from "@/lib/platform/intelligence/systems/dependency-engine";
export * from "@/lib/platform/intelligence/systems/feedback-loop-engine";
export * from "@/lib/platform/intelligence/systems/constraint-engine";
export * from "@/lib/platform/intelligence/systems/bottleneck-engine";
export * from "@/lib/platform/intelligence/systems/network-dynamics-engine";
export * from "@/lib/platform/intelligence/systems/early-warning-engine";
export * from "@/lib/platform/intelligence/systems/knowledge-contribution";
export * from "@/lib/platform/intelligence/systems/closed-learning-loop";
export * from "@/lib/platform/intelligence/systems/systems-reasoner";
export * from "@/lib/platform/intelligence/systems/systems-intelligence";
export * from "@/lib/platform/intelligence/systems/projection";
export * from "@/lib/platform/intelligence/systems/systems-registry";
export * from "@/lib/platform/intelligence/systems/repository";
export * from "@/lib/platform/intelligence/systems/systems-engine";
export * from "@/lib/platform/intelligence/systems/service";

import type { SystemsDependencies } from "@/lib/platform/intelligence/systems/contracts";
import { SystemsIntelligenceEngine } from "@/lib/platform/intelligence/systems/systems-engine";
import { SystemsIntelligenceService } from "@/lib/platform/intelligence/systems/service";
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

export interface SystemsStack {
  service: SystemsIntelligenceService;
  engine: SystemsIntelligenceEngine;
  organizationDna: OrganizationDnaStack | null;
  oios: OiosStack | null;
}

export interface CreateSystemsOptions extends SystemsDependencies {
  organizationDna?: OrganizationDnaStack;
  organizationDnaOptions?: CreateOrganizationDnaOptions;
  wireOrganizationDna?: boolean;
  oios?: OiosStack;
  oiosOptions?: CreateOiosOptions;
  wireOios?: boolean;
}

export function createSystemsIntelligence(options: CreateSystemsOptions = {}): SystemsStack {
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
  const engine = new SystemsIntelligenceEngine(options);
  const service = new SystemsIntelligenceService({ ...options, engine });
  return { service, engine, organizationDna, oios };
}
