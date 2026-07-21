/**
 * P005 — Lazy intelligence stack composition.
 *
 * Domain stacks are materialised on first property access. Foundation (DNA/OIOS)
 * is created once and shared. The platform infrastructure stack (51-module
 * provider graph) is deferred until `.intelligencePlatform` is read.
 *
 * Behavior for each stack factory is unchanged — only construction order/timing.
 */

import type { IntelligencePlatformStack } from "@/lib/platform/intelligence/infrastructure";
import type { CreateIntelligenceServiceOptions } from "./options";
import { registerFoundationStacks, type FoundationStacks } from "./foundation";
import { registerProductStacks, type ProductStacks } from "./product";
import { registerExternalStacks, type ExternalStacks } from "./external";
import { registerRelationshipStacks, type RelationshipStacks } from "./relationship";
import { registerSystemsStacks, type SystemsStacks } from "./systems";
import { registerMemoryStacks, type MemoryStacks } from "./memory";
import { registerWisdomStacks, type WisdomStacks } from "./wisdom";
import { registerSynthesisStacks, type SynthesisStacks } from "./synthesis";
import { registerBriefingStacks, type BriefingStacks } from "./briefing";
import {
  registerExecutiveMemoryStacks,
  type ExecutiveMemoryStacks,
} from "./executive-memory";
import {
  registerDecisionIntelligenceStacks,
  type DecisionIntelligenceStacks,
} from "./decision-intelligence";
import {
  registerExecutivePredictiveStacks,
  type ExecutivePredictiveStacks,
} from "./executive-predictive";
import {
  registerExecutiveAutonomousStacks,
  type ExecutiveAutonomousStacks,
} from "./executive-autonomous";
import {
  registerExecutiveCopilotStacks,
  type ExecutiveCopilotStacks,
} from "./executive-copilot";
import {
  registerExecutiveCommandCenterStacks,
  type ExecutiveCommandCenterStacks,
} from "./executive-command-center";
import {
  registerInitiativeIntelligenceStacks,
  type InitiativeIntelligenceStacks,
} from "./initiative-intelligence";
import {
  registerPortfolioIntelligenceStacks,
  type PortfolioIntelligenceStacks,
} from "./portfolio-intelligence";
import {
  registerDigitalTwinStacks,
  type DigitalTwinStacks,
} from "./digital-twin";
import {
  registerEcosystemIntelligenceStacks,
  type EcosystemIntelligenceStacks,
} from "./ecosystem-intelligence";
import { registerPlatformStack, type DomainStacks } from "./compose";

type LazyIntelligenceServiceStacks = DomainStacks & {
  intelligencePlatform: IntelligencePlatformStack;
};

const FOUNDATION_KEYS: (keyof FoundationStacks)[] = [
  "executiveGraphAnalyzer",
  "executiveDecision",
  "predictiveIntelligence",
  "boardGovernance",
  "organizationDna",
  "oios",
];

const PRODUCT_KEYS: (keyof ProductStacks)[] = [
  "humanCapital",
  "revenue",
  "funding",
  "opportunity",
  "organizationalImprovement",
  "businessModel",
  "operations",
  "customer",
  "knowledge",
  "document",
  "legalComplianceRisk",
];

const EXTERNAL_KEYS: (keyof ExternalStacks)[] = [
  "market",
  "innovation",
  "impact",
  "economic",
  "competitive",
  "political",
  "environmental",
];

const RELATIONSHIP_KEYS: (keyof RelationshipStacks)[] = [
  "stakeholder",
  "reputation",
  "behavioral",
  "cultural",
  "ethical",
];

const SYSTEMS_KEYS: (keyof SystemsStacks)[] = ["systems", "resilience", "ecosystem"];

const MEMORY_KEYS: (keyof MemoryStacks)[] = ["institutionalMemory", "collective"];

function defineLayerGetters<T extends object>(
  target: LazyIntelligenceServiceStacks,
  keys: (keyof T)[],
  ensure: () => T
): void {
  for (const key of keys) {
    Object.defineProperty(target, key, {
      enumerable: true,
      configurable: true,
      get() {
        return ensure()[key];
      },
    });
  }
}

/**
 * Compose intelligence stacks with per-layer lazy materialisation.
 */
export function composeIntelligenceStacksLazy(
  options: CreateIntelligenceServiceOptions = {}
): LazyIntelligenceServiceStacks {
  let foundation: FoundationStacks | undefined;
  let product: ProductStacks | undefined;
  let external: ExternalStacks | undefined;
  let relationship: RelationshipStacks | undefined;
  let systems: SystemsStacks | undefined;
  let memory: MemoryStacks | undefined;
  let wisdom: WisdomStacks | undefined;
  let synthesis: SynthesisStacks | undefined;
  let briefing: BriefingStacks | undefined;
  let executiveMemory: ExecutiveMemoryStacks | undefined;
  let decisionIntelligence: DecisionIntelligenceStacks | undefined;
  let executivePredictive: ExecutivePredictiveStacks | undefined;
  let executiveAutonomous: ExecutiveAutonomousStacks | undefined;
  let executiveCopilot: ExecutiveCopilotStacks | undefined;
  let executiveCommandCenter: ExecutiveCommandCenterStacks | undefined;
  let initiativeIntelligence: InitiativeIntelligenceStacks | undefined;
  let portfolioIntelligence: PortfolioIntelligenceStacks | undefined;
  let digitalTwin: DigitalTwinStacks | undefined;
  let ecosystemIntelligence: EcosystemIntelligenceStacks | undefined;
  let platform: IntelligencePlatformStack | undefined;

  const ensureFoundation = (): FoundationStacks => {
    if (!foundation) foundation = registerFoundationStacks(options);
    return foundation;
  };

  const wiring = () => {
    const f = ensureFoundation();
    return { organizationDna: f.organizationDna, oios: f.oios };
  };

  const ensureProduct = (): ProductStacks => {
    if (!product) product = registerProductStacks(options, wiring());
    return product;
  };

  const ensureExternal = (): ExternalStacks => {
    if (!external) external = registerExternalStacks(options, wiring());
    return external;
  };

  const ensureRelationship = (): RelationshipStacks => {
    if (!relationship) relationship = registerRelationshipStacks(options, wiring());
    return relationship;
  };

  const ensureSystems = (): SystemsStacks => {
    if (!systems) systems = registerSystemsStacks(options, wiring());
    return systems;
  };

  const ensureMemory = (): MemoryStacks => {
    if (!memory) memory = registerMemoryStacks(options, wiring());
    return memory;
  };

  const ensureWisdom = (): WisdomStacks => {
    if (!wisdom) wisdom = registerWisdomStacks(options, wiring());
    return wisdom;
  };

  const ensureSynthesis = (): SynthesisStacks => {
    if (!synthesis) synthesis = registerSynthesisStacks(options, wiring());
    return synthesis;
  };

  const ensureBriefing = (): BriefingStacks => {
    if (!briefing) briefing = registerBriefingStacks(options, wiring());
    return briefing;
  };

  const ensureExecutiveMemory = (): ExecutiveMemoryStacks => {
    if (!executiveMemory) executiveMemory = registerExecutiveMemoryStacks(options, wiring());
    return executiveMemory;
  };

  const ensureDecisionIntelligence = (): DecisionIntelligenceStacks => {
    if (!decisionIntelligence) {
      decisionIntelligence = registerDecisionIntelligenceStacks(options, wiring());
    }
    return decisionIntelligence;
  };

  const ensureExecutivePredictive = (): ExecutivePredictiveStacks => {
    if (!executivePredictive) {
      executivePredictive = registerExecutivePredictiveStacks(options, wiring());
    }
    return executivePredictive;
  };

  const ensureExecutiveAutonomous = (): ExecutiveAutonomousStacks => {
    if (!executiveAutonomous) {
      executiveAutonomous = registerExecutiveAutonomousStacks(options, wiring());
    }
    return executiveAutonomous;
  };

  const ensureExecutiveCopilot = (): ExecutiveCopilotStacks => {
    if (!executiveCopilot) {
      executiveCopilot = registerExecutiveCopilotStacks(options, wiring());
    }
    return executiveCopilot;
  };

  const ensureExecutiveCommandCenter = (): ExecutiveCommandCenterStacks => {
    if (!executiveCommandCenter) {
      executiveCommandCenter = registerExecutiveCommandCenterStacks(options, wiring());
    }
    return executiveCommandCenter;
  };

  const ensureInitiativeIntelligence = (): InitiativeIntelligenceStacks => {
    if (!initiativeIntelligence) {
      initiativeIntelligence = registerInitiativeIntelligenceStacks(options, wiring());
    }
    return initiativeIntelligence;
  };

  const ensurePortfolioIntelligence = (): PortfolioIntelligenceStacks => {
    if (!portfolioIntelligence) {
      portfolioIntelligence = registerPortfolioIntelligenceStacks(options, wiring());
    }
    return portfolioIntelligence;
  };

  const ensureDigitalTwin = (): DigitalTwinStacks => {
    if (!digitalTwin) {
      digitalTwin = registerDigitalTwinStacks(options, wiring());
    }
    return digitalTwin;
  };

  const ensureEcosystemIntelligence = (): EcosystemIntelligenceStacks => {
    if (!ecosystemIntelligence) {
      ecosystemIntelligence = registerEcosystemIntelligenceStacks(options, wiring());
    }
    return ecosystemIntelligence;
  };

  const ensureAllDomains = (): DomainStacks => ({
    ...ensureFoundation(),
    ...ensureProduct(),
    ...ensureExternal(),
    ...ensureRelationship(),
    ...ensureSystems(),
    ...ensureMemory(),
    ...ensureWisdom(),
    ...ensureSynthesis(),
    ...ensureBriefing(),
    ...ensureExecutiveMemory(),
    ...ensureDecisionIntelligence(),
    ...ensureExecutivePredictive(),
    ...ensureExecutiveAutonomous(),
    ...ensureExecutiveCopilot(),
    ...ensureExecutiveCommandCenter(),
    ...ensureInitiativeIntelligence(),
    ...ensurePortfolioIntelligence(),
    ...ensureDigitalTwin(),
    ...ensureEcosystemIntelligence(),
  });

  const ensurePlatform = (): IntelligencePlatformStack => {
    if (!platform) platform = registerPlatformStack(options, ensureAllDomains());
    return platform;
  };

  const stacks = {} as LazyIntelligenceServiceStacks;

  defineLayerGetters(stacks, FOUNDATION_KEYS, ensureFoundation);
  defineLayerGetters(stacks, PRODUCT_KEYS, ensureProduct);
  defineLayerGetters(stacks, EXTERNAL_KEYS, ensureExternal);
  defineLayerGetters(stacks, RELATIONSHIP_KEYS, ensureRelationship);
  defineLayerGetters(stacks, SYSTEMS_KEYS, ensureSystems);
  defineLayerGetters(stacks, MEMORY_KEYS, ensureMemory);
  defineLayerGetters(stacks, ["wisdom"], ensureWisdom);
  defineLayerGetters(stacks, ["synthesis"], ensureSynthesis);
  defineLayerGetters(stacks, ["briefing"], ensureBriefing);
  defineLayerGetters(stacks, ["executiveMemory"], ensureExecutiveMemory);
  defineLayerGetters(stacks, ["decisionIntelligence"], ensureDecisionIntelligence);
  defineLayerGetters(stacks, ["executivePredictive"], ensureExecutivePredictive);
  defineLayerGetters(stacks, ["executiveAutonomous"], ensureExecutiveAutonomous);
  defineLayerGetters(stacks, ["executiveCopilot"], ensureExecutiveCopilot);
  defineLayerGetters(stacks, ["executiveCommandCenter"], ensureExecutiveCommandCenter);
  defineLayerGetters(stacks, ["initiativeIntelligence"], ensureInitiativeIntelligence);
  defineLayerGetters(stacks, ["portfolioIntelligence"], ensurePortfolioIntelligence);
  defineLayerGetters(stacks, ["digitalTwin"], ensureDigitalTwin);
  defineLayerGetters(stacks, ["ecosystemIntelligence"], ensureEcosystemIntelligence);

  Object.defineProperty(stacks, "intelligencePlatform", {
    enumerable: true,
    configurable: true,
    get: ensurePlatform,
  });

  return stacks;
}
