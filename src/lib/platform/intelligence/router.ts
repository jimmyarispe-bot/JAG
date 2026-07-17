/**
 * JAG Intelligence — domain router (infrastructure).
 *
 * Routes run requests to the registered domain module for `request.domain`.
 */

import type { IntelligenceDomainRegistry } from "@/lib/platform/intelligence/registry";
import type { IntelligenceResult } from "@/lib/platform/intelligence/orchestrator";
import type { IntelligenceRunRequest } from "@/lib/platform/intelligence/types";

/** Typed router errors. */
export class IntelligenceRouterError extends Error {
  readonly code: "UNKNOWN_DOMAIN" | "REGISTRY_NOT_INITIALIZED" | "ROUTE_FAILED";
  readonly domainKey: string | null;
  override readonly cause: unknown;

  constructor(options: {
    code: "UNKNOWN_DOMAIN" | "REGISTRY_NOT_INITIALIZED" | "ROUTE_FAILED";
    message: string;
    domainKey?: string | null;
    cause?: unknown;
  }) {
    super(options.message);
    this.name = "IntelligenceRouterError";
    this.code = options.code;
    this.domainKey = options.domainKey ?? null;
    this.cause = options.cause;
  }
}

/** Injected dependencies for the router. */
export interface IntelligenceRouterDependencies {
  registry: IntelligenceDomainRegistry;
}

/**
 * Routes intelligence run requests to registered domain modules.
 */
export class IntelligenceRouter {
  private readonly registry: IntelligenceDomainRegistry;

  /**
   * @param dependencies - Registry used to resolve domain handlers.
   */
  constructor(dependencies: IntelligenceRouterDependencies) {
    this.registry = dependencies.registry;
  }

  /**
   * Route a request to the domain module matching `request.domain`.
   * @returns Domain {@link IntelligenceResult}.
   * @throws {IntelligenceRouterError} When the registry is not ready or the domain is unknown.
   */
  async route(request: IntelligenceRunRequest): Promise<IntelligenceResult> {
    if (!this.registry.isInitialized()) {
      throw new IntelligenceRouterError({
        code: "REGISTRY_NOT_INITIALIZED",
        message: "Intelligence domain registry has not been initialized",
        domainKey: request.domain,
      });
    }

    const domainModule = this.registry.get(request.domain);
    if (!domainModule) {
      throw new IntelligenceRouterError({
        code: "UNKNOWN_DOMAIN",
        message: `No Intelligence domain registered for "${request.domain}"`,
        domainKey: request.domain,
      });
    }

    try {
      return await domainModule.handle(request);
    } catch (cause) {
      if (cause instanceof IntelligenceRouterError) {
        throw cause;
      }
      throw new IntelligenceRouterError({
        code: "ROUTE_FAILED",
        message: `Intelligence domain "${request.domain}" failed while handling request`,
        domainKey: request.domain,
        cause,
      });
    }
  }
}

/** Create a router bound to the given registry. */
export function createIntelligenceRouter(
  registry: IntelligenceDomainRegistry
): IntelligenceRouter {
  return new IntelligenceRouter({ registry });
}
