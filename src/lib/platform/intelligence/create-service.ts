/**
 * JAG Intelligence — service factory.
 *
 * Lightweight orchestrator: composes modular registration layers, registers
 * cognitive domains, and returns the wired IntelligenceService.
 * Domain factory behavior is unchanged — see registration/*.
 */

import { IntelligenceConfidenceService } from "@/lib/platform/intelligence/confidence";
import { IntelligenceContextService } from "@/lib/platform/intelligence/context";
import {
  createSharedIntelligenceContextBuilder,
} from "@/lib/platform/intelligence/context/builder";
import {
  createDecisionIntelligenceDomain,
} from "@/lib/platform/intelligence/decision";
import {
  createExecutiveIntelligenceDomain,
} from "@/lib/platform/intelligence/domains/executive";
import {
  createStrategicIntelligenceDomain,
} from "@/lib/platform/intelligence/domains/strategic";
import {
  createSupportIntelligenceDomain,
} from "@/lib/platform/intelligence/domains/support";
import { IntelligenceEventService } from "@/lib/platform/intelligence/events";
import { IntelligenceExplainService } from "@/lib/platform/intelligence/explain";
import { IntelligenceKnowledgeService } from "@/lib/platform/intelligence/knowledge/foundation";
import { IntelligenceLearningService } from "@/lib/platform/intelligence/learning";
import { IntelligenceMemoryService } from "@/lib/platform/intelligence/memory";
import {
  IntelligenceOrchestrator,
  type IntelligenceOrchestratorDependencies,
  type IntelligenceResult,
} from "@/lib/platform/intelligence/orchestrator";
import { IntelligencePlannerService } from "@/lib/platform/intelligence/planner";
import { IntelligenceReasoningService } from "@/lib/platform/intelligence/reasoning";
import {
  createIntelligenceDomainRegistry,
} from "@/lib/platform/intelligence/registry";
import {
  createIntelligenceRouter,
} from "@/lib/platform/intelligence/router";
import {
  IntelligenceService,
  type IntelligenceServiceDependencies,
} from "@/lib/platform/intelligence/service";
import type { IntelligenceRunRequest } from "@/lib/platform/intelligence/types";
import {
  composeIntelligenceStacks,
  registerCognitiveDomains,
  type CreateIntelligenceServiceOptions,
  type IntelligenceServiceStacks,
} from "@/lib/platform/intelligence/registration";

export type { CreateIntelligenceServiceOptions } from "@/lib/platform/intelligence/registration";

/**
 * Build default orchestrator stage services (foundation stubs).
 */
function createDefaultOrchestratorDependencies(): IntelligenceOrchestratorDependencies {
  return {
    context: new IntelligenceContextService(),
    knowledge: new IntelligenceKnowledgeService(),
    memory: new IntelligenceMemoryService(),
    reasoning: new IntelligenceReasoningService(),
    confidence: new IntelligenceConfidenceService(),
    planner: new IntelligencePlannerService(),
    explain: new IntelligenceExplainService(),
    learning: new IntelligenceLearningService(),
    events: new IntelligenceEventService(),
  };
}

/**
 * Create a fully wired {@link IntelligenceService}.
 *
 * Registers Support (`success`), Executive (`executive`), Strategic (`strategic`),
 * and Decision (`decision`) domains, and composes all intelligence domain stacks
 * via modular registration layers.
 */
export function createIntelligenceService(
  options: CreateIntelligenceServiceOptions = {}
): IntelligenceService & IntelligenceServiceStacks {
  const registry = options.registry ?? createIntelligenceDomainRegistry();
  const orchestrator =
    options.orchestrator ??
    new IntelligenceOrchestrator(
      options.orchestratorDependencies ?? createDefaultOrchestratorDependencies()
    );
  const supportResolver = options.supportResolver ?? createSupportIntelligenceDomain();
  const executiveResolver =
    options.executiveResolver ?? createExecutiveIntelligenceDomain();
  const strategicResolver =
    options.strategicResolver ?? createStrategicIntelligenceDomain();
  const decisionResolver =
    options.decisionResolver ?? createDecisionIntelligenceDomain();
  const sharedContextBuilder =
    options.sharedContextBuilder ?? createSharedIntelligenceContextBuilder();

  const stacks = composeIntelligenceStacks(options);

  registerCognitiveDomains({
    registry,
    orchestrator,
    supportResolver,
    executiveResolver,
    strategicResolver,
    decisionResolver,
    sharedContextBuilder,
  });

  if (!registry.isInitialized()) {
    registry.initialize();
  }

  const router = options.router ?? createIntelligenceRouter(registry);

  const dependencies: IntelligenceServiceDependencies = {
    registry,
    router,
    orchestrator,
  };

  const service = new IntelligenceService(dependencies);
  // Preserve lazy getters from stack composition (Object.assign would force them).
  return Object.defineProperties(
    service as IntelligenceService & IntelligenceServiceStacks,
    Object.getOwnPropertyDescriptors(stacks)
  );
}

/**
 * Convenience entry point bound to the process intelligence singleton (P005).
 * @param request - Intelligence run request.
 */
export async function runIntelligence(
  request: IntelligenceRunRequest
): Promise<IntelligenceResult> {
  const { getOrCreateIntelligenceSingleton } = await import(
    "@/lib/performance/singletons"
  );
  return getOrCreateIntelligenceSingleton().service.runIntelligence(request);
}
