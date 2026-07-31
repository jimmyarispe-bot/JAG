import { CONNECTOR_CATALOG } from "@/lib/connectors/catalog";
import type { ConnectorDefinition } from "@/lib/connectors/types";

/**
 * Connector Registry — canonical definitions for The JAG™.
 * Production connector modules are not registered this sprint.
 */
export type ConnectorRegistry = {
  get(connectorId: string): ConnectorDefinition | undefined;
  list(): readonly ConnectorDefinition[];
  listByCategory(category: string): readonly ConnectorDefinition[];
  has(connectorId: string): boolean;
};

export function createConnectorRegistry(
  definitions: readonly ConnectorDefinition[] = CONNECTOR_CATALOG
): ConnectorRegistry {
  const byId = new Map(definitions.map((d) => [d.id, d]));
  return {
    get(connectorId) {
      return byId.get(connectorId);
    },
    list() {
      return Object.freeze([...byId.values()]);
    },
    listByCategory(category) {
      return Object.freeze(
        [...byId.values()].filter((d) => d.category === category)
      );
    },
    has(connectorId) {
      return byId.has(connectorId);
    },
  };
}

let defaultRegistry: ConnectorRegistry | null = null;

export function getConnectorRegistry(): ConnectorRegistry {
  if (!defaultRegistry) {
    defaultRegistry = createConnectorRegistry();
  }
  return defaultRegistry;
}

/** Test helper — inject alternate registry. */
export function setConnectorRegistryForTests(
  registry: ConnectorRegistry | null
): void {
  defaultRegistry = registry;
}
