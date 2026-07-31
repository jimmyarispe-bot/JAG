/**
 * Platform SDK registry — connectors, twin entities, insight/decision/evidence providers.
 */

import type { PlatformConnector } from "@/lib/platform-sdk/connectors/types";
import type { DecisionSource } from "@/lib/platform-sdk/decisions/types";
import type { TwinEntityTypeRegistration } from "@/lib/platform-sdk/digital-twin/types";
import type { EvidenceProvider } from "@/lib/platform-sdk/evidence/types";
import type { InsightProvider } from "@/lib/platform-sdk/executive/types";
import { store } from "@/lib/platform-sdk/store";

function now(): string {
  return new Date().toISOString();
}

export type PlatformSdkRegistry = {
  registerConnector(connector: PlatformConnector): void;
  listConnectors(): readonly PlatformConnector[];
  getConnector(id: string): PlatformConnector | null;

  registerTwinEntityType(registration: Omit<TwinEntityTypeRegistration, "registeredAt">): void;
  listTwinEntityTypes(): readonly TwinEntityTypeRegistration[];

  registerEvidenceProvider(provider: EvidenceProvider): void;
  listEvidenceProviders(): readonly EvidenceProvider[];

  registerInsightProvider(provider: InsightProvider): void;
  listInsightProviders(): readonly InsightProvider[];

  registerDecisionSource(source: DecisionSource): void;
  listDecisionSources(): readonly DecisionSource[];
};

export function createPlatformSdkRegistry(): PlatformSdkRegistry {
  return {
    registerConnector(connector) {
      store().connectors.set(connector.id, {
        connector,
        registeredAt: now(),
      });
    },
    listConnectors() {
      return Object.freeze(
        [...store().connectors.values()].map((r) => r.connector)
      );
    },
    getConnector(id) {
      return store().connectors.get(id)?.connector ?? null;
    },

    registerTwinEntityType(registration) {
      store().twinEntityTypes.set(registration.entityType, {
        ...registration,
        registeredAt: now(),
      });
    },
    listTwinEntityTypes() {
      return Object.freeze([...store().twinEntityTypes.values()]);
    },

    registerEvidenceProvider(provider) {
      store().evidenceProviders.set(provider.id, {
        provider,
        registeredAt: now(),
      });
    },
    listEvidenceProviders() {
      return Object.freeze(
        [...store().evidenceProviders.values()].map((r) => r.provider)
      );
    },

    registerInsightProvider(provider) {
      store().insightProviders.set(provider.id, {
        provider,
        registeredAt: now(),
      });
    },
    listInsightProviders() {
      return Object.freeze(
        [...store().insightProviders.values()].map((r) => r.provider)
      );
    },

    registerDecisionSource(source) {
      store().decisionProviders.set(source.id, {
        source,
        registeredAt: now(),
      });
    },
    listDecisionSources() {
      return Object.freeze(
        [...store().decisionProviders.values()].map((r) => r.source)
      );
    },
  };
}
