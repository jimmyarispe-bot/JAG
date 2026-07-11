/**
 * JAG Intelligence — application service layer.
 *
 * Facade over the domain registry and router. Does not implement
 * cognitive or domain logic — delegates to injected collaborators.
 */

import type { IntelligenceDomainRegistry } from "@/lib/platform/intelligence/registry";
import type {
  IntelligenceOrchestrator,
  IntelligenceResult,
} from "@/lib/platform/intelligence/orchestrator";
import type { IntelligenceRouter } from "@/lib/platform/intelligence/router";
import type { IntelligenceRunRequest } from "@/lib/platform/intelligence/types";

/** Injected collaborators for {@link IntelligenceService}. */
export interface IntelligenceServiceDependencies {
  registry: IntelligenceDomainRegistry;
  router: IntelligenceRouter;
  orchestrator: IntelligenceOrchestrator;
}

/**
 * Application entry point for Intelligence runs.
 * Routes requests through the registered domain modules.
 */
export class IntelligenceService {
  readonly registry: IntelligenceDomainRegistry;
  readonly router: IntelligenceRouter;
  readonly orchestrator: IntelligenceOrchestrator;

  /**
   * @param dependencies - Registry, router, and orchestrator instances.
   */
  constructor(dependencies: IntelligenceServiceDependencies) {
    this.registry = dependencies.registry;
    this.router = dependencies.router;
    this.orchestrator = dependencies.orchestrator;
  }

  /**
   * Run an intelligence request against the registered domain for `request.domain`.
   * @param request - Domain intent, actor, and tenant scope.
   * @returns Domain {@link IntelligenceResult}.
   */
  async runIntelligence(request: IntelligenceRunRequest): Promise<IntelligenceResult> {
    return this.router.route(request);
  }
}
