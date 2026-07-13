export * from "@/lib/platform/intelligence/ecosystem/types";
export type {
  EcosystemDependencies,
  EcosystemAreaIntelligence as EcosystemAreaIntelligenceContract,
  EcosystemForecastEngineContract,
  EcosystemScenarioEngineContract,
  EcosystemTrendEngineContract,
  EcosystemAnalysisEngineContract,
  NetworkMappingEngineContract,
  PartnershipEngineContract,
  DependencyEngineContract,
  CollaborationEngineContract,
  NetworkEffectEngineContract,
  EarlyWarningEngineContract,
  EcosystemReasonerContract,
  EcosystemRegistry as EcosystemRegistryContract,
  EcosystemRepository as EcosystemRepositoryContract,
  EcosystemEngine as EcosystemEngineContract,
  EcosystemIntelligenceEngine as EcosystemIntelligenceEngineContract,
  EcosystemIntelligenceService as EcosystemIntelligenceServiceContract,
  EcosystemService as EcosystemServiceContract,
} from "@/lib/platform/intelligence/ecosystem/contracts";
export * from "@/lib/platform/intelligence/ecosystem/models";
export * from "@/lib/platform/intelligence/ecosystem/area-factory";
export * from "@/lib/platform/intelligence/ecosystem/ecosystem-mapping-intelligence";
export * from "@/lib/platform/intelligence/ecosystem/strategic-partnerships-intelligence";
export * from "@/lib/platform/intelligence/ecosystem/supplier-ecosystems-intelligence";
export * from "@/lib/platform/intelligence/ecosystem/customer-ecosystems-intelligence";
export * from "@/lib/platform/intelligence/ecosystem/community-networks-intelligence";
export * from "@/lib/platform/intelligence/ecosystem/industry-networks-intelligence";
export * from "@/lib/platform/intelligence/ecosystem/technology-ecosystems-intelligence";
export * from "@/lib/platform/intelligence/ecosystem/academic-research-partnerships-intelligence";
export * from "@/lib/platform/intelligence/ecosystem/government-ecosystems-intelligence";
export * from "@/lib/platform/intelligence/ecosystem/investor-funding-networks-intelligence";
export * from "@/lib/platform/intelligence/ecosystem/nonprofit-ngo-relationships-intelligence";
export * from "@/lib/platform/intelligence/ecosystem/platform-ecosystems-intelligence";
export * from "@/lib/platform/intelligence/ecosystem/alliance-intelligence";
export * from "@/lib/platform/intelligence/ecosystem/network-effects-intelligence";
export * from "@/lib/platform/intelligence/ecosystem/ecosystem-dependencies-intelligence";
export * from "@/lib/platform/intelligence/ecosystem/collaboration-opportunities-intelligence";
export * from "@/lib/platform/intelligence/ecosystem/ecosystem-risk-intelligence";
export * from "@/lib/platform/intelligence/ecosystem/ecosystem-forecast-engine";
export * from "@/lib/platform/intelligence/ecosystem/ecosystem-scenario-engine";
export * from "@/lib/platform/intelligence/ecosystem/ecosystem-trend-engine";
export * from "@/lib/platform/intelligence/ecosystem/ecosystem-analysis-engine";
export * from "@/lib/platform/intelligence/ecosystem/network-mapping-engine";
export * from "@/lib/platform/intelligence/ecosystem/partnership-engine";
export * from "@/lib/platform/intelligence/ecosystem/dependency-engine";
export * from "@/lib/platform/intelligence/ecosystem/collaboration-engine";
export * from "@/lib/platform/intelligence/ecosystem/network-effect-engine";
export * from "@/lib/platform/intelligence/ecosystem/early-warning-engine";
export * from "@/lib/platform/intelligence/ecosystem/knowledge-contribution";
export * from "@/lib/platform/intelligence/ecosystem/closed-learning-loop";
export * from "@/lib/platform/intelligence/ecosystem/ecosystem-reasoner";
export * from "@/lib/platform/intelligence/ecosystem/ecosystem-intelligence";
export * from "@/lib/platform/intelligence/ecosystem/projection";
export * from "@/lib/platform/intelligence/ecosystem/ecosystem-registry";
export * from "@/lib/platform/intelligence/ecosystem/repository";
export * from "@/lib/platform/intelligence/ecosystem/ecosystem-engine";
export * from "@/lib/platform/intelligence/ecosystem/service";

import type { EcosystemDependencies } from "@/lib/platform/intelligence/ecosystem/contracts";
import { EcosystemIntelligenceEngine } from "@/lib/platform/intelligence/ecosystem/ecosystem-engine";
import { EcosystemIntelligenceService } from "@/lib/platform/intelligence/ecosystem/service";
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

export interface EcosystemStack {
  service: EcosystemIntelligenceService;
  engine: EcosystemIntelligenceEngine;
  organizationDna: OrganizationDnaStack | null;
  oios: OiosStack | null;
}

export interface CreateEcosystemOptions extends EcosystemDependencies {
  organizationDna?: OrganizationDnaStack;
  organizationDnaOptions?: CreateOrganizationDnaOptions;
  wireOrganizationDna?: boolean;
  oios?: OiosStack;
  oiosOptions?: CreateOiosOptions;
  wireOios?: boolean;
}

export function createEcosystemIntelligence(options: CreateEcosystemOptions = {}): EcosystemStack {
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
  const engine = new EcosystemIntelligenceEngine(options);
  const service = new EcosystemIntelligenceService({ ...options, engine });
  return { service, engine, organizationDna, oios };
}
