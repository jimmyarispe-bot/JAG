export * from "@/lib/platform/intelligence/institutional-memory/types";
export type {
  InstitutionalMemoryDependencies,
  InstitutionalMemoryAreaIntelligence as InstitutionalMemoryAreaIntelligenceContract,
  InstitutionalMemoryForecastEngineContract,
  InstitutionalMemoryScenarioEngineContract,
  InstitutionalMemoryTrendEngineContract,
  InstitutionalMemoryAnalysisEngineContract,
  KnowledgeAnalysisEngineContract,
  KnowledgeGraphEngineContract,
  SemanticSearchEngineContract,
  ExpertiseEngineContract,
  KnowledgeValidationEngineContract,
  KnowledgeEvolutionEngineContract,
  EarlyWarningEngineContract,
  InstitutionalMemoryReasonerContract,
  InstitutionalMemoryRegistry as InstitutionalMemoryRegistryContract,
  InstitutionalMemoryRepository as InstitutionalMemoryRepositoryContract,
  InstitutionalMemoryEngine as InstitutionalMemoryEngineContract,
  InstitutionalMemoryIntelligenceEngine as InstitutionalMemoryIntelligenceEngineContract,
  InstitutionalMemoryIntelligenceService as InstitutionalMemoryIntelligenceServiceContract,
  InstitutionalMemoryService as InstitutionalMemoryServiceContract,
} from "@/lib/platform/intelligence/institutional-memory/contracts";
export * from "@/lib/platform/intelligence/institutional-memory/models";
export * from "@/lib/platform/intelligence/institutional-memory/area-factory";
export * from "@/lib/platform/intelligence/institutional-memory/organizational-memory-intelligence";
export * from "@/lib/platform/intelligence/institutional-memory/knowledge-graph-intelligence";
export * from "@/lib/platform/intelligence/institutional-memory/knowledge-mapping-intelligence";
export * from "@/lib/platform/intelligence/institutional-memory/expertise-intelligence-intelligence";
export * from "@/lib/platform/intelligence/institutional-memory/institutional-memory-area-intelligence";
export * from "@/lib/platform/intelligence/institutional-memory/lessons-learned-intelligence";
export * from "@/lib/platform/intelligence/institutional-memory/decision-history-intelligence";
export * from "@/lib/platform/intelligence/institutional-memory/policy-knowledge-intelligence";
export * from "@/lib/platform/intelligence/institutional-memory/process-knowledge-intelligence";
export * from "@/lib/platform/intelligence/institutional-memory/relationship-knowledge-intelligence";
export * from "@/lib/platform/intelligence/institutional-memory/semantic-search-intelligence";
export * from "@/lib/platform/intelligence/institutional-memory/knowledge-validation-intelligence";
export * from "@/lib/platform/intelligence/institutional-memory/knowledge-evolution-intelligence";
export * from "@/lib/platform/intelligence/institutional-memory/knowledge-gap-detection-intelligence";
export * from "@/lib/platform/intelligence/institutional-memory/knowledge-transfer-intelligence";
export * from "@/lib/platform/intelligence/institutional-memory/knowledge-quality-intelligence";
export * from "@/lib/platform/intelligence/institutional-memory/knowledge-synthesis-intelligence";
export * from "@/lib/platform/intelligence/institutional-memory/institutional-memory-forecast-engine";
export * from "@/lib/platform/intelligence/institutional-memory/institutional-memory-scenario-engine";
export * from "@/lib/platform/intelligence/institutional-memory/institutional-memory-trend-engine";
export * from "@/lib/platform/intelligence/institutional-memory/institutional-memory-analysis-engine";
export * from "@/lib/platform/intelligence/institutional-memory/knowledge-graph-engine";
export * from "@/lib/platform/intelligence/institutional-memory/semantic-search-engine";
export * from "@/lib/platform/intelligence/institutional-memory/expertise-engine";
export * from "@/lib/platform/intelligence/institutional-memory/knowledge-validation-engine";
export * from "@/lib/platform/intelligence/institutional-memory/knowledge-evolution-engine";
export * from "@/lib/platform/intelligence/institutional-memory/early-warning-engine";
export * from "@/lib/platform/intelligence/institutional-memory/knowledge-contribution";
export * from "@/lib/platform/intelligence/institutional-memory/closed-learning-loop";
export * from "@/lib/platform/intelligence/institutional-memory/institutional-memory-reasoner";
export * from "@/lib/platform/intelligence/institutional-memory/institutional-memory-intelligence";
export * from "@/lib/platform/intelligence/institutional-memory/projection";
export * from "@/lib/platform/intelligence/institutional-memory/institutional-memory-registry";
export * from "@/lib/platform/intelligence/institutional-memory/repository";
export * from "@/lib/platform/intelligence/institutional-memory/institutional-memory-engine";
export * from "@/lib/platform/intelligence/institutional-memory/service";

import type { InstitutionalMemoryDependencies } from "@/lib/platform/intelligence/institutional-memory/contracts";
import { InstitutionalMemoryIntelligenceEngine } from "@/lib/platform/intelligence/institutional-memory/institutional-memory-engine";
import { InstitutionalMemoryIntelligenceService } from "@/lib/platform/intelligence/institutional-memory/service";
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

export interface InstitutionalMemoryStack {
  service: InstitutionalMemoryIntelligenceService;
  engine: InstitutionalMemoryIntelligenceEngine;
  organizationDna: OrganizationDnaStack | null;
  oios: OiosStack | null;
}

export interface CreateInstitutionalMemoryOptions extends InstitutionalMemoryDependencies {
  organizationDna?: OrganizationDnaStack;
  organizationDnaOptions?: CreateOrganizationDnaOptions;
  wireOrganizationDna?: boolean;
  oios?: OiosStack;
  oiosOptions?: CreateOiosOptions;
  wireOios?: boolean;
}

export function createInstitutionalMemoryIntelligence(options: CreateInstitutionalMemoryOptions = {}): InstitutionalMemoryStack {
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
  const engine = new InstitutionalMemoryIntelligenceEngine(options);
  const service = new InstitutionalMemoryIntelligenceService({ ...options, engine });
  return { service, engine, organizationDna, oios };
}
