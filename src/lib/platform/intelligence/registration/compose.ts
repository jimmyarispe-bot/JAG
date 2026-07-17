/**
 * Platform infrastructure registration — aggregates all domain stacks.
 */

import {
  createIntelligencePlatform,
  type IntelligencePlatformStack,
} from "@/lib/platform/intelligence/infrastructure";
import type { CreateIntelligenceServiceOptions } from "@/lib/platform/intelligence/registration/options";
import type { FoundationStacks } from "@/lib/platform/intelligence/registration/foundation";
import type { ProductStacks } from "@/lib/platform/intelligence/registration/product";
import type { ExternalStacks } from "@/lib/platform/intelligence/registration/external";
import type { RelationshipStacks } from "@/lib/platform/intelligence/registration/relationship";
import type { SystemsStacks } from "@/lib/platform/intelligence/registration/systems";
import type { MemoryStacks } from "@/lib/platform/intelligence/registration/memory";
import type { WisdomStacks } from "@/lib/platform/intelligence/registration/wisdom";

export type DomainStacks = FoundationStacks &
  ProductStacks &
  ExternalStacks &
  RelationshipStacks &
  SystemsStacks &
  MemoryStacks &
  WisdomStacks;

export function registerPlatformStack(
  options: CreateIntelligenceServiceOptions,
  stacks: DomainStacks
): IntelligencePlatformStack {
  const {
    executiveGraphAnalyzer,
    executiveDecision,
    predictiveIntelligence,
    boardGovernance,
    organizationDna,
    oios,
    humanCapital,
    revenue,
    funding,
    opportunity,
    organizationalImprovement,
    businessModel,
    operations,
    customer,
    knowledge,
    document,
    legalComplianceRisk,
    market,
    innovation,
    impact,
    economic,
    competitive,
    political,
    environmental,
    stakeholder,
    reputation,
    behavioral,
    cultural,
    ethical,
    systems,
    resilience,
    ecosystem,
    institutionalMemory,
    collective,
    wisdom,
  } = stacks;

  return (
    options.intelligencePlatform ??
    createIntelligencePlatform({
      ...(options.intelligencePlatformOptions ?? {}),
      graphAnalyzer:
        options.intelligencePlatformOptions?.graphAnalyzer ?? executiveGraphAnalyzer,
      decision:
        options.intelligencePlatformOptions?.decision ?? executiveDecision,
      predictive:
        options.intelligencePlatformOptions?.predictive ?? predictiveIntelligence,
      boardGovernance:
        options.intelligencePlatformOptions?.boardGovernance ?? boardGovernance,
      organizationDna:
        options.intelligencePlatformOptions?.organizationDna ?? organizationDna,
      oios: options.intelligencePlatformOptions?.oios ?? oios,
      humanCapital:
        options.intelligencePlatformOptions?.humanCapital ?? humanCapital,
      revenue: options.intelligencePlatformOptions?.revenue ?? revenue,
      funding: options.intelligencePlatformOptions?.funding ?? funding,
      opportunity: options.intelligencePlatformOptions?.opportunity ?? opportunity,
      organizationalImprovement:
        options.intelligencePlatformOptions?.organizationalImprovement ??
        organizationalImprovement,
      businessModel:
        options.intelligencePlatformOptions?.businessModel ?? businessModel,
      operations:
        options.intelligencePlatformOptions?.operations ?? operations,
      customer: options.intelligencePlatformOptions?.customer ?? customer,
      knowledge: options.intelligencePlatformOptions?.knowledge ?? knowledge,
      document: options.intelligencePlatformOptions?.document ?? document,
      legalComplianceRisk:
        options.intelligencePlatformOptions?.legalComplianceRisk ?? legalComplianceRisk,
      market: options.intelligencePlatformOptions?.market ?? market,
      innovation: options.intelligencePlatformOptions?.innovation ?? innovation,
      impact: options.intelligencePlatformOptions?.impact ?? impact,
      economic: options.intelligencePlatformOptions?.economic ?? economic,
      competitive: options.intelligencePlatformOptions?.competitive ?? competitive,
      political: options.intelligencePlatformOptions?.political ?? political,
      environmental: options.intelligencePlatformOptions?.environmental ?? environmental,
      stakeholder: options.intelligencePlatformOptions?.stakeholder ?? stakeholder,
      reputation: options.intelligencePlatformOptions?.reputation ?? reputation,
      behavioral: options.intelligencePlatformOptions?.behavioral ?? behavioral,
      cultural: options.intelligencePlatformOptions?.cultural ?? cultural,
      ethical: options.intelligencePlatformOptions?.ethical ?? ethical,
      systems: options.intelligencePlatformOptions?.systems ?? systems,
      resilience: options.intelligencePlatformOptions?.resilience ?? resilience,
      ecosystem: options.intelligencePlatformOptions?.ecosystem ?? ecosystem,
      institutionalMemory:
        options.intelligencePlatformOptions?.institutionalMemory ?? institutionalMemory,
      collective:
        options.intelligencePlatformOptions?.collective ?? collective,
      wisdom: options.intelligencePlatformOptions?.wisdom ?? wisdom,
      wisdomOptions: options.intelligencePlatformOptions?.wisdomOptions,
    })
  );
}
