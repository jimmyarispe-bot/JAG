/**
 * Intelligence DI registration — modular composition entry.
 */

export type { CreateIntelligenceServiceOptions, DnaOiosWiring } from "./options";
export { registerCognitiveDomains } from "./cognitive";
export { registerFoundationStacks, type FoundationStacks } from "./foundation";
export { registerProductStacks, type ProductStacks } from "./product";
export { registerExternalStacks, type ExternalStacks } from "./external";
export { registerRelationshipStacks, type RelationshipStacks } from "./relationship";
export { registerSystemsStacks, type SystemsStacks } from "./systems";
export { registerMemoryStacks, type MemoryStacks } from "./memory";
export { registerWisdomStacks, type WisdomStacks } from "./wisdom";
export { registerSynthesisStacks, type SynthesisStacks } from "./synthesis";
export { registerBriefingStacks, type BriefingStacks } from "./briefing";
export {
  registerExecutiveMemoryStacks,
  type ExecutiveMemoryStacks,
} from "./executive-memory";
export {
  registerDecisionIntelligenceStacks,
  type DecisionIntelligenceStacks,
} from "./decision-intelligence";
export {
  registerExecutivePredictiveStacks,
  type ExecutivePredictiveStacks,
} from "./executive-predictive";
export {
  registerExecutiveAutonomousStacks,
  type ExecutiveAutonomousStacks,
} from "./executive-autonomous";
export {
  registerExecutiveCopilotStacks,
  type ExecutiveCopilotStacks,
} from "./executive-copilot";
export {
  registerExecutiveCommandCenterStacks,
  type ExecutiveCommandCenterStacks,
} from "./executive-command-center";
export {
  registerInitiativeIntelligenceStacks,
  type InitiativeIntelligenceStacks,
} from "./initiative-intelligence";
export {
  registerPortfolioIntelligenceStacks,
  type PortfolioIntelligenceStacks,
} from "./portfolio-intelligence";
export {
  registerDigitalTwinStacks,
  type DigitalTwinStacks,
} from "./digital-twin";
export {
  registerEcosystemIntelligenceStacks,
  type EcosystemIntelligenceStacks,
} from "./ecosystem-intelligence";
export {
  registerPlatformStack,
  type DomainStacks,
} from "./compose";

import type { IntelligencePlatformStack } from "@/lib/platform/intelligence/infrastructure";
import type { CreateIntelligenceServiceOptions } from "./options";
import { registerFoundationStacks } from "./foundation";
import { registerProductStacks } from "./product";
import { registerExternalStacks } from "./external";
import { registerRelationshipStacks } from "./relationship";
import { registerSystemsStacks } from "./systems";
import { registerMemoryStacks } from "./memory";
import { registerWisdomStacks } from "./wisdom";
import { registerSynthesisStacks } from "./synthesis";
import { registerBriefingStacks } from "./briefing";
import { registerExecutiveMemoryStacks } from "./executive-memory";
import { registerDecisionIntelligenceStacks } from "./decision-intelligence";
import { registerExecutivePredictiveStacks } from "./executive-predictive";
import { registerExecutiveAutonomousStacks } from "./executive-autonomous";
import { registerExecutiveCopilotStacks } from "./executive-copilot";
import { registerExecutiveCommandCenterStacks } from "./executive-command-center";
import { registerInitiativeIntelligenceStacks } from "./initiative-intelligence";
import { registerPortfolioIntelligenceStacks } from "./portfolio-intelligence";
import { registerDigitalTwinStacks } from "./digital-twin";
import { registerEcosystemIntelligenceStacks } from "./ecosystem-intelligence";
import { registerPlatformStack, type DomainStacks } from "./compose";
import { composeIntelligenceStacksLazy } from "./lazy-compose";

export type IntelligenceServiceStacks = DomainStacks & {
  intelligencePlatform: IntelligencePlatformStack;
};

/**
 * Compose all intelligence stacks in dependency order.
 *
 * P005 default: lazy per-layer materialisation (unused domains deferred).
 * Pass `eagerStacks: true` for full graph construction (tests / cold benchmarks).
 */
export function composeIntelligenceStacks(
  options: CreateIntelligenceServiceOptions = {}
): IntelligenceServiceStacks {
  if (options.eagerStacks === true) {
    return composeIntelligenceStacksEager(options);
  }
  return composeIntelligenceStacksLazy(options);
}

/** Eager composition — identical wiring to pre-P005 factory. */
export function composeIntelligenceStacksEager(
  options: CreateIntelligenceServiceOptions = {}
): IntelligenceServiceStacks {
  const foundation = registerFoundationStacks(options);
  const wiring = {
    organizationDna: foundation.organizationDna,
    oios: foundation.oios,
  };
  const product = registerProductStacks(options, wiring);
  const external = registerExternalStacks(options, wiring);
  const relationship = registerRelationshipStacks(options, wiring);
  const systems = registerSystemsStacks(options, wiring);
  const memory = registerMemoryStacks(options, wiring);
  const wisdom = registerWisdomStacks(options, wiring);
  const synthesis = registerSynthesisStacks(options, wiring);
  const briefing = registerBriefingStacks(options, wiring);
  const executiveMemory = registerExecutiveMemoryStacks(options, wiring);
  const decisionIntelligence = registerDecisionIntelligenceStacks(options, wiring);
  const executivePredictive = registerExecutivePredictiveStacks(options, wiring);
  const executiveAutonomous = registerExecutiveAutonomousStacks(options, wiring);
  const executiveCopilot = registerExecutiveCopilotStacks(options, wiring);
  const executiveCommandCenter = registerExecutiveCommandCenterStacks(options, wiring);
  const initiativeIntelligence = registerInitiativeIntelligenceStacks(options, wiring);
  const portfolioIntelligence = registerPortfolioIntelligenceStacks(options, wiring);
  const digitalTwin = registerDigitalTwinStacks(options, wiring);
  const ecosystemIntelligence = registerEcosystemIntelligenceStacks(options, wiring);

  const domains: DomainStacks = {
    ...foundation,
    ...product,
    ...external,
    ...relationship,
    ...systems,
    ...memory,
    ...wisdom,
    ...synthesis,
    ...briefing,
    ...executiveMemory,
    ...decisionIntelligence,
    ...executivePredictive,
    ...executiveAutonomous,
    ...executiveCopilot,
    ...executiveCommandCenter,
    ...initiativeIntelligence,
    ...portfolioIntelligence,
    ...digitalTwin,
    ...ecosystemIntelligence,
  };

  return {
    ...domains,
    intelligencePlatform: registerPlatformStack(options, domains),
  };
}
