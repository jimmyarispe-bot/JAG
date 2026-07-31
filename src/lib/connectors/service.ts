/**
 * Connector Framework™ service facade — dependency-injected & pluggable.
 */

import { CONNECTOR_CATALOG, listCatalogByCategory } from "@/lib/connectors/catalog";
import { createConnectorConfigurationService } from "@/lib/connectors/configuration-service";
import { createConnectorHealthService } from "@/lib/connectors/health-service";
import { createConnectorLoader } from "@/lib/connectors/loader";
import {
  createConnectorMappingRegistry,
  type ConnectorMappingRegistry,
} from "@/lib/connectors/mapping";
import { quickBooksMapping } from "@/lib/connectors/quickbooks/mapping";
import { googleWorkspaceMapping } from "@/lib/connectors/google-workspace/mapping";
import { getConnectorDashboardMetrics } from "@/lib/connectors/metrics";
import {
  createConnectorRegistry,
  getConnectorRegistry,
  type ConnectorRegistry,
} from "@/lib/connectors/registry";
import {
  createConnectorScheduler,
  type ConnectorSchedulerInterface,
} from "@/lib/connectors/scheduler";
import {
  listInstallationsForOrganization,
  upsertInstallation,
} from "@/lib/connectors/store";
import type {
  ConnectorDefinition,
  ConnectorInstallation,
} from "@/lib/connectors/types";
import { randomUUID } from "node:crypto";

export type ConnectorFramework = {
  readonly registry: ConnectorRegistry;
  readonly loader: ReturnType<typeof createConnectorLoader>;
  readonly health: ReturnType<typeof createConnectorHealthService>;
  readonly configuration: ReturnType<typeof createConnectorConfigurationService>;
  readonly scheduler: ConnectorSchedulerInterface;
  readonly mapping: ConnectorMappingRegistry;
  listCatalog(): readonly ConnectorDefinition[];
  listCatalogGrouped(): Readonly<
    Record<string, readonly ConnectorDefinition[]>
  >;
  listInstalled(organizationId: string): readonly ConnectorInstallation[];
  getMetrics(organizationId: string): ReturnType<
    typeof getConnectorDashboardMetrics
  >;
  /**
   * Framework demo: mark a catalog entry as "Installed" Coming Soon —
   * does not implement a production connector.
   */
  installPlaceholder(
    organizationId: string,
    connectorId: string
  ): ConnectorInstallation | null;
  setEnabled(
    organizationId: string,
    installationId: string,
    enabled: boolean
  ): ConnectorInstallation | null;
};

export function createConnectorFramework(deps?: {
  registry?: ConnectorRegistry;
  scheduler?: ConnectorSchedulerInterface;
  mapping?: ConnectorMappingRegistry;
}): ConnectorFramework {
  const registry = deps?.registry ?? getConnectorRegistry();
  const scheduler = deps?.scheduler ?? createConnectorScheduler();
  const mapping = deps?.mapping ?? createConnectorMappingRegistry();
  if (!deps?.mapping) {
    if (!mapping.get(quickBooksMapping.connectorId)) {
      mapping.register(quickBooksMapping);
    }
    if (!mapping.get(googleWorkspaceMapping.connectorId)) {
      mapping.register(googleWorkspaceMapping);
    }
  }
  const loader = createConnectorLoader(registry);
  const health = createConnectorHealthService();
  const configuration = createConnectorConfigurationService(scheduler);

  return {
    registry,
    loader,
    health,
    configuration,
    scheduler,
    mapping,
    listCatalog() {
      return CONNECTOR_CATALOG;
    },
    listCatalogGrouped() {
      return listCatalogByCategory();
    },
    listInstalled(organizationId) {
      return listInstallationsForOrganization(organizationId);
    },
    getMetrics(organizationId) {
      return getConnectorDashboardMetrics(organizationId);
    },
    installPlaceholder(organizationId, connectorId) {
      const definition = registry.get(connectorId);
      if (!definition) {
        return null;
      }
      const existing = listInstallationsForOrganization(organizationId).find(
        (i) => i.connectorId === connectorId
      );
      if (existing) return existing;
      const now = new Date().toISOString();
      const plan = scheduler.planNextRun({
        organizationId,
        installationId: "pending",
        frequency: "Manual",
      });
      const id = randomUUID();
      return upsertInstallation({
        id,
        organizationId,
        connectorId,
        status: "Installed",
        health: "Offline",
        enabled: false,
        version: definition.version,
        lastSyncAt: null,
        nextScheduledSyncAt: plan.nextRunAt,
        scheduleFrequency: "Manual",
        companyName: null,
        companyId: null,
        lastError: null,
        createdAt: now,
        updatedAt: now,
      });
    },
    setEnabled(organizationId, installationId, enabled) {
      return configuration.update(organizationId, installationId, {
        enabled,
      })
        ? listInstallationsForOrganization(organizationId).find(
            (i) => i.id === installationId
          ) ?? null
        : null;
    },
  };
}

let defaultFramework: ConnectorFramework | null = null;

export function getConnectorFramework(): ConnectorFramework {
  if (!defaultFramework) {
    defaultFramework = createConnectorFramework({
      registry: createConnectorRegistry(),
    });
  }
  return defaultFramework;
}
