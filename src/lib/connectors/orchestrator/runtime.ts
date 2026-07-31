/**
 * ConnectorRuntime™ — common lifecycle contract. Vendor-agnostic registry.
 */

import type { ConnectorRuntime } from "@/lib/connectors/orchestrator/types";

export type ConnectorRuntimeRegistry = {
  register(runtime: ConnectorRuntime): void;
  get(connectorId: string): ConnectorRuntime | null;
  list(): readonly ConnectorRuntime[];
  has(connectorId: string): boolean;
};

export function createConnectorRuntimeRegistry(
  initial: readonly ConnectorRuntime[] = []
): ConnectorRuntimeRegistry {
  const byId = new Map<string, ConnectorRuntime>();
  for (const runtime of initial) {
    byId.set(runtime.connectorId, runtime);
  }
  return {
    register(runtime) {
      byId.set(runtime.connectorId, runtime);
    },
    get(connectorId) {
      return byId.get(connectorId) ?? null;
    },
    list() {
      return Object.freeze([...byId.values()]);
    },
    has(connectorId) {
      return byId.has(connectorId);
    },
  };
}

export type { ConnectorRuntime };
