export * from "@/lib/platform/intelligence/impact/types";
export type {
  ImpactDependencies,
  ImpactAreaIntelligence as ImpactAreaIntelligenceContract,
  ImpactMeasurementEngineContract,
  OutcomeEngineContract,
  RoiEngineContract,
  ImpactReasonerContract,
  ImpactRegistry as ImpactRegistryContract,
  ImpactRepository as ImpactRepositoryContract,
  ImpactEngine as ImpactEngineContract,
  ImpactIntelligenceEngine as ImpactIntelligenceEngineContract,
  ImpactIntelligenceService as ImpactIntelligenceServiceContract,
  ImpactService as ImpactServiceContract,
} from "@/lib/platform/intelligence/impact/contracts";
export * from "@/lib/platform/intelligence/impact/models";
export * from "@/lib/platform/intelligence/impact/mission-impact-intelligence";
export * from "@/lib/platform/intelligence/impact/customer-impact-intelligence";
export * from "@/lib/platform/intelligence/impact/employee-impact-intelligence";
export * from "@/lib/platform/intelligence/impact/student-impact-intelligence";
export * from "@/lib/platform/intelligence/impact/community-impact-intelligence";
export * from "@/lib/platform/intelligence/impact/financial-impact-intelligence";
export * from "@/lib/platform/intelligence/impact/grant-impact-intelligence";
export * from "@/lib/platform/intelligence/impact/program-effectiveness-intelligence";
export * from "@/lib/platform/intelligence/impact/strategic-goal-achievement-intelligence";
export * from "@/lib/platform/intelligence/impact/operational-impact-intelligence";
export * from "@/lib/platform/intelligence/impact/innovation-impact-intelligence";
export * from "@/lib/platform/intelligence/impact/long-term-organizational-impact-intelligence";
export * from "@/lib/platform/intelligence/impact/impact-measurement-engine";
export * from "@/lib/platform/intelligence/impact/outcome-engine";
export * from "@/lib/platform/intelligence/impact/roi-engine";
export * from "@/lib/platform/intelligence/impact/knowledge-contribution";
export * from "@/lib/platform/intelligence/impact/closed-learning-loop";
export * from "@/lib/platform/intelligence/impact/impact-reasoner";
export * from "@/lib/platform/intelligence/impact/impact-intelligence";
export * from "@/lib/platform/intelligence/impact/projection";
export * from "@/lib/platform/intelligence/impact/impact-registry";
export * from "@/lib/platform/intelligence/impact/repository";
export * from "@/lib/platform/intelligence/impact/impact-engine";
export * from "@/lib/platform/intelligence/impact/service";
import type { ImpactDependencies } from "@/lib/platform/intelligence/impact/contracts";
import { ImpactIntelligenceEngine } from "@/lib/platform/intelligence/impact/impact-engine";
import { ImpactIntelligenceService } from "@/lib/platform/intelligence/impact/service";
import { createOrganizationDnaIntelligence, type CreateOrganizationDnaOptions, type OrganizationDnaStack } from "@/lib/platform/intelligence/organization-dna";
import { createOiosOperatingSystem, type CreateOiosOptions, type OiosStack } from "@/lib/platform/oios";
export interface ImpactStack { service: ImpactIntelligenceService; engine: ImpactIntelligenceEngine; organizationDna: OrganizationDnaStack|null; oios: OiosStack|null; }
export interface CreateImpactOptions extends ImpactDependencies { organizationDna?:OrganizationDnaStack; organizationDnaOptions?:CreateOrganizationDnaOptions; wireOrganizationDna?:boolean; oios?:OiosStack; oiosOptions?:CreateOiosOptions; wireOios?:boolean; }
export function createImpactIntelligence(options:CreateImpactOptions={}):ImpactStack {
  const organizationDna=options.organizationDna??(options.wireOrganizationDna===false?null:createOrganizationDnaIntelligence({...options.organizationDnaOptions,wireGraphAnalyzer:false,wireDecision:false,wirePredictive:false,wireBoardGovernance:false}));
  const oios=options.oios??(options.wireOios===false?null:createOiosOperatingSystem({...options.oiosOptions,organizationDnaStack:options.oiosOptions?.organizationDnaStack??organizationDna??undefined,wireOrganizationDna:false}));
  const engine=new ImpactIntelligenceEngine(options); const service=new ImpactIntelligenceService({...options,engine}); return {service,engine,organizationDna,oios};
}
