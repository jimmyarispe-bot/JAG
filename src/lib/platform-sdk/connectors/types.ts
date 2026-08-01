/**
 * Connector SDK — canonical interfaces for all future connectors.
 * Does not replace Connector Orchestrator™ runtimes; adapters may implement both.
 */

import type { PermissionDefinition } from "@/lib/platform-sdk/permissions/types";

export const SDK_CONNECTOR_HEALTH = [
  "Healthy",
  "Warning",
  "Critical",
  "Offline",
] as const;

export type SdkConnectorHealth = (typeof SDK_CONNECTOR_HEALTH)[number];

export type ConnectorCapabilityFlag =
  | "read"
  | "write"
  | "sync"
  | "webhook"
  | "import";

export type ConnectorCapabilities = {
  readonly operations: readonly ConnectorCapabilityFlag[];
  readonly syncModes: readonly ("Manual" | "Scheduled" | "Webhook" | "Real-time")[];
};

export type TwinEntityMapping = {
  readonly sourceEntity: string;
  readonly twinEntityType: string;
  readonly description: string;
};

export type PlatformConnectorContext = {
  readonly organizationId: string;
  readonly organizationName?: string;
  readonly actorUserId?: string;
  readonly actorDisplayName?: string;
  readonly demo?: boolean;
};

export type PlatformConnectorSyncResult = {
  readonly recordsImported?: number;
  readonly evidenceCreated?: number;
  readonly twinEntitiesUpdated?: number;
  readonly jobId?: string | null;
};

/**
 * Official connector contract for The JAG™ Platform SDK.
 * Context is required for organization-scoped operations.
 */
export interface PlatformConnector {
  readonly id: string;
  readonly version: string;

  connect(ctx: PlatformConnectorContext): Promise<void>;
  disconnect(ctx: PlatformConnectorContext): Promise<void>;
  validate(ctx: PlatformConnectorContext): Promise<void>;
  sync(ctx: PlatformConnectorContext): Promise<PlatformConnectorSyncResult>;
  health(ctx: PlatformConnectorContext): Promise<SdkConnectorHealth>;
  capabilities(): ConnectorCapabilities;
  /** Read-only twin mapping descriptors — callers must not mutate the returned array. */
  entityMappings(): readonly TwinEntityMapping[];
  permissions(): PermissionDefinition[];
}

export type PlatformConnectorRegistration = {
  readonly connector: PlatformConnector;
  readonly registeredAt: string;
};
