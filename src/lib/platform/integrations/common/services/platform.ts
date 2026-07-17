/**
 * Enterprise Integration Platform — composition root.
 */

import { CredentialStore } from "@/lib/platform/integrations/common/auth/credential-store";
import type { Connector } from "@/lib/platform/integrations/common/contracts";
import { IntegrationEventBus } from "@/lib/platform/integrations/common/events";
import { buildConnectorMonitorRows } from "@/lib/platform/integrations/common/monitoring";
import { IntegrationPersistence } from "@/lib/platform/integrations/common/persistence";
import {
  ConnectorRegistry,
  ConnectorRegistryError,
  createConnectorRegistry,
  type ListCatalogOptions,
  type RegisterConnectorOptions,
} from "@/lib/platform/integrations/common/registry";
import { CursorStore } from "@/lib/platform/integrations/common/sync";
import type {
  ConnectorConfiguration,
  ConnectorMetadata,
  IntegrationScope,
  SyncMode,
  SyncResult,
} from "@/lib/platform/integrations/common/types";

export type CreateIntegrationPlatformOptions = {
  registry?: ConnectorRegistry;
};

export type IntegrationPlatform = {
  persistence: IntegrationPersistence;
  credentials: CredentialStore;
  events: IntegrationEventBus;
  cursors: CursorStore;
  /** Sprint 020 — canonical connector catalog registry. */
  registry: ConnectorRegistry;
  register(connector: Connector, options?: RegisterConnectorOptions): void;
  getConnector(connectorId: string): Connector | null;
  listCatalog(options?: ListCatalogOptions): ConnectorMetadata[];
  enableConnector(connectorId: string): void;
  disableConnector(connectorId: string): void;
  isConnectorEnabled(connectorId: string): boolean;
  getConnectorVersion(connectorId: string): string | null;
  ensureInstance(input: {
    connectorId: string;
    scope: IntegrationScope;
    authMethod?: ConnectorConfiguration["authMethod"];
    settings?: Record<string, unknown>;
  }): Promise<ConnectorConfiguration>;
  connect(instanceId: string): Promise<void>;
  disconnect(instanceId: string): Promise<void>;
  authenticate(instanceId: string): Promise<void>;
  syncNow(instanceId: string, mode?: SyncMode): Promise<SyncResult>;
  healthCheck(instanceId: string): Promise<void>;
  monitorRows(): ReturnType<typeof buildConnectorMonitorRows>;
};

export function createIntegrationPlatform(
  options: CreateIntegrationPlatformOptions = {}
): IntegrationPlatform {
  const persistence = new IntegrationPersistence();
  const credentials = new CredentialStore();
  const events = new IntegrationEventBus();
  const cursors = new CursorStore();
  const registry = options.registry ?? createConnectorRegistry();

  const resolveConnector = (connectorId: string): Connector => {
    try {
      return registry.requireEnabled(connectorId);
    } catch (error) {
      if (error instanceof ConnectorRegistryError) {
        throw error;
      }
      throw new Error(`Unknown connector: ${connectorId}`);
    }
  };

  const platform: IntegrationPlatform = {
    persistence,
    credentials,
    events,
    cursors,
    registry,

    register(connector, registerOptions) {
      registry.register(connector, registerOptions);
    },

    getConnector(connectorId) {
      return registry.get(connectorId);
    },

    listCatalog(listOptions) {
      return registry.list(listOptions);
    },

    enableConnector(connectorId) {
      registry.enable(connectorId);
    },

    disableConnector(connectorId) {
      registry.disable(connectorId);
    },

    isConnectorEnabled(connectorId) {
      return registry.isEnabled(connectorId);
    },

    getConnectorVersion(connectorId) {
      return registry.getVersion(connectorId);
    },

    async ensureInstance(input) {
      const connector = resolveConnector(input.connectorId);
      const existing = persistence
        .listConfigurations(input.scope.organizationId)
        .find((c) => c.connectorId === input.connectorId);
      if (existing) return existing;

      const now = new Date().toISOString();
      const config: ConnectorConfiguration = {
        connectorId: input.connectorId,
        instanceId: `${input.connectorId}-${input.scope.organizationId}`,
        scope: input.scope,
        enabled: true,
        authMethod: input.authMethod ?? connector.metadata.authMethods[0] ?? "none",
        settings: input.settings ?? {},
        scheduleCron: "0 */6 * * *",
        createdAt: now,
        updatedAt: now,
      };
      await connector.connect(config);
      return config;
    },

    async connect(instanceId) {
      const config = persistence.getConfiguration(instanceId);
      if (!config) throw new Error(`Unknown instance: ${instanceId}`);
      const connector = resolveConnector(config.connectorId);
      await connector.connect(config);
    },

    async disconnect(instanceId) {
      const config = persistence.getConfiguration(instanceId);
      if (!config) throw new Error(`Unknown instance: ${instanceId}`);
      const connector = registry.get(config.connectorId);
      if (!connector) throw new Error(`Unknown connector: ${config.connectorId}`);
      await connector.disconnect(instanceId);
      persistence.saveConfiguration({ ...config, enabled: false });
    },

    async authenticate(instanceId) {
      const config = persistence.getConfiguration(instanceId);
      if (!config) throw new Error(`Unknown instance: ${instanceId}`);
      const connector = resolveConnector(config.connectorId);
      const result = await connector.authenticate(instanceId);
      if (!result.ok) throw new Error(result.error ?? "Authentication failed");
    },

    async syncNow(instanceId, mode = "incremental") {
      const config = persistence.getConfiguration(instanceId);
      if (!config) throw new Error(`Unknown instance: ${instanceId}`);
      const connector = resolveConnector(config.connectorId);
      return connector.sync({
        instanceId,
        mode,
        triggeredBy: "manual",
      });
    },

    async healthCheck(instanceId) {
      const config = persistence.getConfiguration(instanceId);
      if (!config) throw new Error(`Unknown instance: ${instanceId}`);
      const connector = resolveConnector(config.connectorId);
      const report = await connector.healthCheck(instanceId);
      persistence.saveHealth(report);
    },

    monitorRows() {
      const catalog = new Map(platform.listCatalog().map((m) => [m.id, m]));
      return buildConnectorMonitorRows(persistence, catalog);
    },
  };

  return platform;
}
