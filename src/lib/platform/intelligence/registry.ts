/**
 * JAG Intelligence — domain registry (infrastructure).
 *
 * Registers validated domain modules for discovery and routing.
 */

import {
  assertIntelligenceDomain,
  type IntelligenceDomainModule,
} from "@/lib/platform/intelligence/contracts";
import type { IntelligenceDomain } from "@/lib/platform/intelligence/types";

/** Typed error when duplicate domain registration is attempted. */
export class IntelligenceDomainRegistryError extends Error {
  readonly code: "DUPLICATE_DOMAIN" | "INVALID_DOMAIN";
  readonly domainKey: string | null;

  constructor(options: {
    code: "DUPLICATE_DOMAIN" | "INVALID_DOMAIN";
    message: string;
    domainKey?: string | null;
  }) {
    super(options.message);
    this.name = "IntelligenceDomainRegistryError";
    this.code = options.code;
    this.domainKey = options.domainKey ?? null;
  }
}

/**
 * In-memory registry of Intelligence domain modules.
 * Instance-scoped for dependency injection and test isolation.
 */
export class IntelligenceDomainRegistry {
  private readonly domains = new Map<IntelligenceDomain, IntelligenceDomainModule>();
  private initialized = false;

  /**
   * Mark the registry as initialized (ready for routing).
   * Idempotent.
   */
  initialize(): void {
    this.initialized = true;
  }

  /** Whether {@link initialize} has been called. */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Register a validated domain module.
   * @throws {IntelligenceDomainRegistryError} On invalid contract or duplicate key.
   */
  register(module: IntelligenceDomainModule): void {
    try {
      assertIntelligenceDomain(module);
    } catch (cause) {
      throw new IntelligenceDomainRegistryError({
        code: "INVALID_DOMAIN",
        message:
          cause instanceof Error
            ? cause.message
            : "Invalid Intelligence domain module",
        domainKey:
          module && typeof module === "object" && "domainKey" in module
            ? String((module as IntelligenceDomainModule).domainKey)
            : null,
      });
    }

    if (this.domains.has(module.domainKey)) {
      throw new IntelligenceDomainRegistryError({
        code: "DUPLICATE_DOMAIN",
        message: `Intelligence domain "${module.domainKey}" is already registered`,
        domainKey: module.domainKey,
      });
    }

    this.domains.set(module.domainKey, module);
  }

  /**
   * Retrieve a registered domain by key.
   * @returns The module, or `undefined` when unknown.
   */
  get(domainKey: IntelligenceDomain | string): IntelligenceDomainModule | undefined {
    return this.domains.get(domainKey as IntelligenceDomain);
  }

  /** List all registered domain modules (stable key order). */
  list(): IntelligenceDomainModule[] {
    return [...this.domains.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, module]) => module);
  }

  /** Registered domain keys only. */
  keys(): IntelligenceDomain[] {
    return this.list().map((module) => module.domainKey);
  }

  /** Remove all registrations and reset initialization (test helper). */
  clear(): void {
    this.domains.clear();
    this.initialized = false;
  }
}

/** Create a fresh, uninitialized registry instance. */
export function createIntelligenceDomainRegistry(): IntelligenceDomainRegistry {
  return new IntelligenceDomainRegistry();
}
