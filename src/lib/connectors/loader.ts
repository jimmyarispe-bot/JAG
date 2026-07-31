import { getConnectorRegistry } from "@/lib/connectors/registry";
import type { ConnectorDefinition } from "@/lib/connectors/types";

/**
 * Connector Loader — resolves catalog definitions.
 * Does not load production connector runtimes (none exist this sprint).
 */
export type LoadedConnector = {
  readonly definition: ConnectorDefinition;
  readonly runtimeLoaded: boolean;
};

export type ConnectorLoader = {
  load(connectorId: string): LoadedConnector | null;
  loadAll(): readonly LoadedConnector[];
};

const RUNTIME_CONNECTOR_IDS = new Set([
  "quickbooks-online",
  "google-workspace",
]);

export function createConnectorLoader(
  registry = getConnectorRegistry()
): ConnectorLoader {
  return {
    load(connectorId) {
      const definition = registry.get(connectorId);
      if (!definition) return null;
      return {
        definition,
        runtimeLoaded: RUNTIME_CONNECTOR_IDS.has(connectorId),
      };
    },
    loadAll() {
      return Object.freeze(
        registry.list().map((definition) => ({
          definition,
          runtimeLoaded: RUNTIME_CONNECTOR_IDS.has(definition.id),
        }))
      );
    },
  };
}
