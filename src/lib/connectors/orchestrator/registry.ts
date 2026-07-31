/**
 * ConnectorRegistry™ — per-organization installed connector state.
 */

import { listInstallationsForOrganization } from "@/lib/connectors/store";
import { createConnectorCatalog } from "@/lib/connectors/orchestrator/catalog";
import { createOrchestratorHealthService } from "@/lib/connectors/orchestrator/health";
import {
  getOwner,
  getPriority,
  setOwner,
} from "@/lib/connectors/orchestrator/store";
import { createConnectorTokenManager } from "@/lib/connectors/orchestrator/token-manager";
import type {
  OrchestratorSchedule,
  RegistryRecord,
} from "@/lib/connectors/orchestrator/types";

export type ConnectorOrgRegistry = {
  list(organizationId: string): readonly RegistryRecord[];
  get(
    organizationId: string,
    connectorId: string
  ): RegistryRecord | null;
  setOwner(
    organizationId: string,
    connectorId: string,
    owner: string
  ): void;
};

function toSchedule(frequency: string, enabled: boolean): OrchestratorSchedule {
  if (!enabled) return "Disabled";
  if (
    frequency === "Hourly" ||
    frequency === "Daily" ||
    frequency === "Weekly" ||
    frequency === "Monthly" ||
    frequency === "Manual"
  ) {
    return frequency;
  }
  return "Manual";
}

export function createConnectorOrgRegistry(): ConnectorOrgRegistry {
  const health = createOrchestratorHealthService();
  const tokens = createConnectorTokenManager();
  const catalog = createConnectorCatalog();

  return {
    list(organizationId) {
      return Object.freeze(
        listInstallationsForOrganization(organizationId).map((install) => {
          const evaluated = health.evaluate(
            organizationId,
            install.connectorId
          );
          const token = tokens.inspect(organizationId, install.connectorId);
          const entry = catalog.get(install.connectorId);
          return {
            organizationId,
            connectorId: install.connectorId,
            installationId: install.id,
            installed: true,
            enabled: install.enabled,
            lastSyncAt: install.lastSyncAt,
            nextSyncAt: install.nextScheduledSyncAt,
            health: evaluated.health,
            owner: getOwner(organizationId, install.connectorId),
            oauthState: token.oauthState,
            refreshTokenStatus: token.refreshTokenStatus,
            currentVersion: install.version || entry?.connectorVersion || "0.0.0",
            schedule: toSchedule(install.scheduleFrequency, install.enabled),
            priority: getPriority(organizationId, install.connectorId),
            status: install.status,
            lastError: install.lastError,
          } satisfies RegistryRecord;
        })
      );
    },
    get(organizationId, connectorId) {
      return (
        this.list(organizationId).find((r) => r.connectorId === connectorId) ??
        null
      );
    },
    setOwner,
  };
}
