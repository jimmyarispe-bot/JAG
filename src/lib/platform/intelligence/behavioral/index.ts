export * from "@/lib/platform/intelligence/behavioral/types";
export type {
  BehavioralDependencies,
  BehavioralAreaIntelligence as BehavioralAreaIntelligenceContract,
  BehavioralForecastEngineContract,
  BehavioralScenarioEngineContract,
  BehavioralTrendEngineContract,
  BehavioralAnalysisEngineContract,
  DecisionModelingEngineContract,
  CognitiveBiasEngineContract,
  MotivationEngineContract,
  CollaborationEngineContract,
  ChangeAdoptionEngineContract,
  EarlyWarningEngineContract,
  BehavioralReasonerContract,
  BehavioralRegistry as BehavioralRegistryContract,
  BehavioralRepository as BehavioralRepositoryContract,
  BehavioralEngine as BehavioralEngineContract,
  BehavioralIntelligenceEngine as BehavioralIntelligenceEngineContract,
  BehavioralIntelligenceService as BehavioralIntelligenceServiceContract,
  BehavioralService as BehavioralServiceContract,
} from "@/lib/platform/intelligence/behavioral/contracts";
export * from "@/lib/platform/intelligence/behavioral/models";
export * from "@/lib/platform/intelligence/behavioral/area-factory";
export * from "@/lib/platform/intelligence/behavioral/decision-behavior-intelligence";
export * from "@/lib/platform/intelligence/behavioral/cognitive-bias-intelligence";
export * from "@/lib/platform/intelligence/behavioral/motivation-intelligence";
export * from "@/lib/platform/intelligence/behavioral/incentive-modeling-intelligence";
export * from "@/lib/platform/intelligence/behavioral/organizational-change-intelligence";
export * from "@/lib/platform/intelligence/behavioral/change-resistance-intelligence";
export * from "@/lib/platform/intelligence/behavioral/leadership-behavior-intelligence";
export * from "@/lib/platform/intelligence/behavioral/team-dynamics-intelligence";
export * from "@/lib/platform/intelligence/behavioral/collaboration-intelligence";
export * from "@/lib/platform/intelligence/behavioral/communication-patterns-intelligence";
export * from "@/lib/platform/intelligence/behavioral/conflict-behavior-intelligence";
export * from "@/lib/platform/intelligence/behavioral/customer-behavior-intelligence";
export * from "@/lib/platform/intelligence/behavioral/employee-behavior-intelligence";
export * from "@/lib/platform/intelligence/behavioral/learning-adaptation-intelligence";
export * from "@/lib/platform/intelligence/behavioral/adoption-forecasting-intelligence";
export * from "@/lib/platform/intelligence/behavioral/behavioral-risk-intelligence";
export * from "@/lib/platform/intelligence/behavioral/behavioral-opportunity-intelligence";
export * from "@/lib/platform/intelligence/behavioral/behavioral-forecast-engine";
export * from "@/lib/platform/intelligence/behavioral/behavioral-scenario-engine";
export * from "@/lib/platform/intelligence/behavioral/behavioral-trend-engine";
export * from "@/lib/platform/intelligence/behavioral/behavioral-analysis-engine";
export * from "@/lib/platform/intelligence/behavioral/decision-modeling-engine";
export * from "@/lib/platform/intelligence/behavioral/cognitive-bias-engine";
export * from "@/lib/platform/intelligence/behavioral/motivation-engine";
export * from "@/lib/platform/intelligence/behavioral/collaboration-engine";
export * from "@/lib/platform/intelligence/behavioral/change-adoption-engine";
export * from "@/lib/platform/intelligence/behavioral/early-warning-engine";
export * from "@/lib/platform/intelligence/behavioral/knowledge-contribution";
export * from "@/lib/platform/intelligence/behavioral/closed-learning-loop";
export * from "@/lib/platform/intelligence/behavioral/behavioral-reasoner";
export * from "@/lib/platform/intelligence/behavioral/behavioral-intelligence";
export * from "@/lib/platform/intelligence/behavioral/projection";
export * from "@/lib/platform/intelligence/behavioral/behavioral-registry";
export * from "@/lib/platform/intelligence/behavioral/repository";
export * from "@/lib/platform/intelligence/behavioral/behavioral-engine";
export * from "@/lib/platform/intelligence/behavioral/service";

import type { BehavioralDependencies } from "@/lib/platform/intelligence/behavioral/contracts";
import { BehavioralIntelligenceEngine } from "@/lib/platform/intelligence/behavioral/behavioral-engine";
import { BehavioralIntelligenceService } from "@/lib/platform/intelligence/behavioral/service";
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

export interface BehavioralStack {
  service: BehavioralIntelligenceService;
  engine: BehavioralIntelligenceEngine;
  organizationDna: OrganizationDnaStack | null;
  oios: OiosStack | null;
}

export interface CreateBehavioralOptions extends BehavioralDependencies {
  organizationDna?: OrganizationDnaStack;
  organizationDnaOptions?: CreateOrganizationDnaOptions;
  wireOrganizationDna?: boolean;
  oios?: OiosStack;
  oiosOptions?: CreateOiosOptions;
  wireOios?: boolean;
}

export function createBehavioralIntelligence(options: CreateBehavioralOptions = {}): BehavioralStack {
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
  const engine = new BehavioralIntelligenceEngine(options);
  const service = new BehavioralIntelligenceService({ ...options, engine });
  return { service, engine, organizationDna, oios };
}
