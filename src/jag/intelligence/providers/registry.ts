/**
 * In-memory ProviderRegistry — discovery and capability filtering only.
 * No concrete vendor providers are registered by default.
 */

import {
  capabilitiesSatisfy,
  type CapabilityRequirement,
  type ProviderCapabilities,
} from "@/jag/intelligence/providers/capabilities";
import type {
  IntelligenceProvider,
  IntelligenceProviderDescriptor,
} from "@/jag/intelligence/providers/intelligence-provider";

export type ProviderRegistry = {
  register(provider: IntelligenceProvider): void;
  unregister(providerId: string): boolean;
  get(providerId: string): IntelligenceProvider | undefined;
  list(): readonly IntelligenceProvider[];
  listDescriptors(): readonly IntelligenceProviderDescriptor[];
  findByCapabilities(
    requirement: CapabilityRequirement
  ): readonly IntelligenceProvider[];
};

export function createProviderRegistry(
  initial: readonly IntelligenceProvider[] = []
): ProviderRegistry {
  const byId = new Map<string, IntelligenceProvider>();
  for (const p of initial) {
    byId.set(p.id, p);
  }

  return {
    register(provider) {
      if (!provider.id || typeof provider.reason !== "function") {
        throw new Error("Invalid IntelligenceProvider");
      }
      byId.set(provider.id, provider);
    },
    unregister(providerId) {
      return byId.delete(providerId);
    },
    get(providerId) {
      return byId.get(providerId);
    },
    list() {
      return Object.freeze([...byId.values()]);
    },
    listDescriptors() {
      return Object.freeze(
        [...byId.values()].map((p) =>
          Object.freeze({
            id: p.id,
            displayName: p.displayName,
            kind: p.kind,
            capabilities: p.capabilities,
            vendorLabel: p.vendorLabel,
          })
        )
      );
    },
    findByCapabilities(requirement) {
      return Object.freeze(
        [...byId.values()].filter((p) =>
          capabilitiesSatisfy(p.capabilities, requirement)
        )
      );
    },
  };
}

/** Minimal capabilities used in negotiation tests / stubs. */
export function emptyProviderCapabilities(
  overrides: Partial<ProviderCapabilities> = {}
): ProviderCapabilities {
  return {
    structuredOutput: false,
    jsonMode: false,
    functionCalling: false,
    streaming: false,
    multimodal: false,
    ...overrides,
  };
}
