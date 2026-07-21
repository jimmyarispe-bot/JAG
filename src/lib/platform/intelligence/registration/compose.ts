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
import type { SynthesisStacks } from "@/lib/platform/intelligence/registration/synthesis";
import type { BriefingStacks } from "@/lib/platform/intelligence/registration/briefing";
import type { ExecutiveMemoryStacks } from "@/lib/platform/intelligence/registration/executive-memory";
import type { DecisionIntelligenceStacks } from "@/lib/platform/intelligence/registration/decision-intelligence";
import type { ExecutivePredictiveStacks } from "@/lib/platform/intelligence/registration/executive-predictive";
import type { ExecutiveAutonomousStacks } from "@/lib/platform/intelligence/registration/executive-autonomous";
import type { ExecutiveCopilotStacks } from "@/lib/platform/intelligence/registration/executive-copilot";
import type { ExecutiveCommandCenterStacks } from "@/lib/platform/intelligence/registration/executive-command-center";
import type { InitiativeIntelligenceStacks } from "@/lib/platform/intelligence/registration/initiative-intelligence";
import type { PortfolioIntelligenceStacks } from "@/lib/platform/intelligence/registration/portfolio-intelligence";
import type { DigitalTwinStacks } from "@/lib/platform/intelligence/registration/digital-twin";
import type { EcosystemIntelligenceStacks } from "@/lib/platform/intelligence/registration/ecosystem-intelligence";

export type DomainStacks = FoundationStacks &
  ProductStacks &
  ExternalStacks &
  RelationshipStacks &
  SystemsStacks &
  MemoryStacks &
  WisdomStacks &
  SynthesisStacks &
  BriefingStacks &
  ExecutiveMemoryStacks &
  DecisionIntelligenceStacks &
  ExecutivePredictiveStacks &
  ExecutiveAutonomousStacks &
  ExecutiveCopilotStacks &
  ExecutiveCommandCenterStacks &
  InitiativeIntelligenceStacks &
  PortfolioIntelligenceStacks &
  DigitalTwinStacks &
  EcosystemIntelligenceStacks;

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
    synthesis,
    briefing,
    executiveMemory,
    decisionIntelligence,
    executivePredictive,
    executiveAutonomous,
    executiveCopilot,
    executiveCommandCenter,
    initiativeIntelligence,
    portfolioIntelligence,
    digitalTwin,
    ecosystemIntelligence,
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
      synthesis: options.intelligencePlatformOptions?.synthesis ?? synthesis,
      synthesisOptions: options.intelligencePlatformOptions?.synthesisOptions,
      briefing: options.intelligencePlatformOptions?.briefing ?? briefing,
      briefingOptions: options.intelligencePlatformOptions?.briefingOptions,
      executiveMemory:
        options.intelligencePlatformOptions?.executiveMemory ?? executiveMemory,
      executiveMemoryOptions: options.intelligencePlatformOptions?.executiveMemoryOptions,
      decisionIntelligence:
        options.intelligencePlatformOptions?.decisionIntelligence ?? decisionIntelligence,
      decisionIntelligenceOptions:
        options.intelligencePlatformOptions?.decisionIntelligenceOptions,
      executivePredictive:
        options.intelligencePlatformOptions?.executivePredictive ?? executivePredictive,
      executivePredictiveOptions:
        options.intelligencePlatformOptions?.executivePredictiveOptions,
      executiveAutonomous:
        options.intelligencePlatformOptions?.executiveAutonomous ?? executiveAutonomous,
      executiveAutonomousOptions:
        options.intelligencePlatformOptions?.executiveAutonomousOptions,
      executiveCopilot:
        options.intelligencePlatformOptions?.executiveCopilot ?? executiveCopilot,
      executiveCopilotOptions:
        options.intelligencePlatformOptions?.executiveCopilotOptions,
      executiveCommandCenter:
        options.intelligencePlatformOptions?.executiveCommandCenter ?? executiveCommandCenter,
      executiveCommandCenterOptions:
        options.intelligencePlatformOptions?.executiveCommandCenterOptions,
      initiativeIntelligence:
        options.intelligencePlatformOptions?.initiativeIntelligence ?? initiativeIntelligence,
      initiativeIntelligenceOptions:
        options.intelligencePlatformOptions?.initiativeIntelligenceOptions,
      portfolioIntelligence:
        options.intelligencePlatformOptions?.portfolioIntelligence ?? portfolioIntelligence,
      portfolioIntelligenceOptions:
        options.intelligencePlatformOptions?.portfolioIntelligenceOptions,
      digitalTwin:
        options.intelligencePlatformOptions?.digitalTwin ?? digitalTwin,
      digitalTwinOptions:
        options.intelligencePlatformOptions?.digitalTwinOptions,
      ecosystemIntelligence:
        options.intelligencePlatformOptions?.ecosystemIntelligence ??
        ecosystemIntelligence,
      ecosystemIntelligenceOptions:
        options.intelligencePlatformOptions?.ecosystemIntelligenceOptions,
    })
  );
}
