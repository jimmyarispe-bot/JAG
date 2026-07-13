export * from "@/lib/platform/intelligence/wisdom/types";
export type {
  WisdomDependencies,
  WisdomAreaIntelligence as WisdomAreaIntelligenceContract,
  WisdomForecastEngineContract,
  WisdomScenarioEngineContract,
  WisdomTrendEngineContract,
  WisdomAnalysisEngineContract,
  StrategicReasoningEngineContract,
  CrossDomainSynthesisEngineContract,
  TradeOffEngineContract,
  UncertaintyEngineContract,
  ExecutiveJudgmentEngineContract,
  ConfidenceEngineContract,
  EarlyWarningEngineContract,
  WisdomReasonerContract,
  WisdomRegistry as WisdomRegistryContract,
  WisdomRepository as WisdomRepositoryContract,
  WisdomEngine as WisdomEngineContract,
  WisdomIntelligenceEngine as WisdomIntelligenceEngineContract,
  WisdomIntelligenceService as WisdomIntelligenceServiceContract,
  WisdomService as WisdomServiceContract,
} from "@/lib/platform/intelligence/wisdom/contracts";
export * from "@/lib/platform/intelligence/wisdom/models";
export * from "@/lib/platform/intelligence/wisdom/area-factory";
export * from "@/lib/platform/intelligence/wisdom/executive-judgment-intelligence";
export * from "@/lib/platform/intelligence/wisdom/strategic-reasoning-intelligence";
export * from "@/lib/platform/intelligence/wisdom/trade-off-analysis-intelligence";
export * from "@/lib/platform/intelligence/wisdom/long-term-thinking-intelligence";
export * from "@/lib/platform/intelligence/wisdom/cross-domain-synthesis-intelligence";
export * from "@/lib/platform/intelligence/wisdom/decision-quality-assessment-intelligence";
export * from "@/lib/platform/intelligence/wisdom/uncertainty-analysis-intelligence";
export * from "@/lib/platform/intelligence/wisdom/confidence-calibration-intelligence";
export * from "@/lib/platform/intelligence/wisdom/organizational-prioritization-intelligence";
export * from "@/lib/platform/intelligence/wisdom/mission-alignment-intelligence";
export * from "@/lib/platform/intelligence/wisdom/values-alignment-intelligence";
export * from "@/lib/platform/intelligence/wisdom/ethical-judgment-intelligence";
export * from "@/lib/platform/intelligence/wisdom/strategic-timing-intelligence";
export * from "@/lib/platform/intelligence/wisdom/opportunity-cost-analysis-intelligence";
export * from "@/lib/platform/intelligence/wisdom/executive-recommendation-validation-intelligence";
export * from "@/lib/platform/intelligence/wisdom/organizational-judgment-evolution-intelligence";
export * from "@/lib/platform/intelligence/wisdom/institutional-wisdom-intelligence";
export * from "@/lib/platform/intelligence/wisdom/wisdom-forecast-engine";
export * from "@/lib/platform/intelligence/wisdom/wisdom-scenario-engine";
export * from "@/lib/platform/intelligence/wisdom/wisdom-trend-engine";
export * from "@/lib/platform/intelligence/wisdom/wisdom-analysis-engine";
export * from "@/lib/platform/intelligence/wisdom/strategic-reasoning-engine";
export * from "@/lib/platform/intelligence/wisdom/cross-domain-synthesis-engine";
export * from "@/lib/platform/intelligence/wisdom/trade-off-engine";
export * from "@/lib/platform/intelligence/wisdom/uncertainty-engine";
export * from "@/lib/platform/intelligence/wisdom/executive-judgment-engine";
export * from "@/lib/platform/intelligence/wisdom/confidence-engine";
export * from "@/lib/platform/intelligence/wisdom/early-warning-engine";
export * from "@/lib/platform/intelligence/wisdom/knowledge-contribution";
export * from "@/lib/platform/intelligence/wisdom/closed-learning-loop";
export * from "@/lib/platform/intelligence/wisdom/wisdom-reasoner";
export * from "@/lib/platform/intelligence/wisdom/wisdom-intelligence";
export * from "@/lib/platform/intelligence/wisdom/projection";
export * from "@/lib/platform/intelligence/wisdom/wisdom-registry";
export * from "@/lib/platform/intelligence/wisdom/repository";
export * from "@/lib/platform/intelligence/wisdom/wisdom-engine";
export * from "@/lib/platform/intelligence/wisdom/service";

import type { WisdomDependencies } from "@/lib/platform/intelligence/wisdom/contracts";
import { WisdomIntelligenceEngine } from "@/lib/platform/intelligence/wisdom/wisdom-engine";
import { WisdomIntelligenceService } from "@/lib/platform/intelligence/wisdom/service";
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

export interface WisdomStack {
  service: WisdomIntelligenceService;
  engine: WisdomIntelligenceEngine;
  organizationDna: OrganizationDnaStack | null;
  oios: OiosStack | null;
}

export interface CreateWisdomOptions extends WisdomDependencies {
  organizationDna?: OrganizationDnaStack;
  organizationDnaOptions?: CreateOrganizationDnaOptions;
  wireOrganizationDna?: boolean;
  oios?: OiosStack;
  oiosOptions?: CreateOiosOptions;
  wireOios?: boolean;
}

export function createWisdomIntelligence(options: CreateWisdomOptions = {}): WisdomStack {
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
  const engine = new WisdomIntelligenceEngine(options);
  const service = new WisdomIntelligenceService({ ...options, engine });
  return { service, engine, organizationDna, oios };
}
