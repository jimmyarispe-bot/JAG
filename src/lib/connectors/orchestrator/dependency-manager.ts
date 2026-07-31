/**
 * ConnectorDependencyManager — honor declared dependency ordering.
 */

import { createConnectorCatalog } from "@/lib/connectors/orchestrator/catalog";
import { listInstallationsForOrganization } from "@/lib/connectors/store";

export type ConnectorDependencyManager = {
  getDependencies(connectorId: string): readonly string[];
  areDependenciesSatisfied(
    organizationId: string,
    connectorId: string
  ): { readonly ok: boolean; readonly missing: readonly string[] };
  orderForSync(
    organizationId: string,
    connectorIds: readonly string[]
  ): readonly string[];
};

export function createConnectorDependencyManager(): ConnectorDependencyManager {
  const catalog = createConnectorCatalog();

  return {
    getDependencies(connectorId) {
      return catalog.get(connectorId)?.dependsOn ?? [];
    },
    areDependenciesSatisfied(organizationId, connectorId) {
      const deps = this.getDependencies(connectorId);
      if (deps.length === 0) return { ok: true, missing: [] };
      const installed = new Set(
        listInstallationsForOrganization(organizationId)
          .filter(
            (i) =>
              i.enabled &&
              (i.status === "Connected" || i.status === "Syncing")
          )
          .map((i) => i.connectorId)
      );
      const missing = deps.filter((d) => !installed.has(d));
      return { ok: missing.length === 0, missing: Object.freeze(missing) };
    },
    orderForSync(organizationId, connectorIds) {
      const remaining = new Set(connectorIds);
      const ordered: string[] = [];
      const visiting = new Set<string>();

      const visit = (id: string) => {
        if (ordered.includes(id) || !remaining.has(id)) return;
        if (visiting.has(id)) return;
        visiting.add(id);
        for (const dep of this.getDependencies(id)) {
          if (remaining.has(dep)) visit(dep);
        }
        visiting.delete(id);
        ordered.push(id);
      };

      // Prefer connectors with satisfied deps first among equals
      const sorted = [...connectorIds].sort((a, b) => {
        const aOk = this.areDependenciesSatisfied(organizationId, a).ok;
        const bOk = this.areDependenciesSatisfied(organizationId, b).ok;
        if (aOk === bOk) return a.localeCompare(b);
        return aOk ? -1 : 1;
      });
      for (const id of sorted) visit(id);
      return Object.freeze(ordered);
    },
  };
}
