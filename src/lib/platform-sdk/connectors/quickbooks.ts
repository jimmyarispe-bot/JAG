/**
 * QuickBooks Online — PlatformConnector SDK conformance.
 * Wraps existing QBO modules; business behavior unchanged.
 */

import {
  connectQuickBooksDemo,
  disconnectQuickBooks,
  getQuickBooksInstallation,
  loadQuickBooksTokens,
  QBO_CONNECTOR_ID,
  runQuickBooksSync,
} from "@/lib/connectors/quickbooks";
import type {
  PlatformConnector,
  PlatformConnectorContext,
  SdkConnectorHealth,
  TwinEntityMapping,
} from "@/lib/platform-sdk/connectors/types";
import type { PermissionDefinition } from "@/lib/platform-sdk/permissions/types";

const ENTITY_MAPPINGS: readonly TwinEntityMapping[] = Object.freeze([
  {
    sourceEntity: "Company",
    twinEntityType: "Organization",
    description: "QBO company profile → Twin Organization",
  },
  {
    sourceEntity: "Report",
    twinEntityType: "Document",
    description: "Financial reports → Twin Document / Evidence",
  },
]);

const PERMISSIONS: readonly PermissionDefinition[] = Object.freeze([
  {
    id: "connector.quickbooks.read",
    name: "QuickBooks Read",
    description: "Read QuickBooks Online company and reports",
    scope: "Connector",
    resource: "quickbooks-online",
    actions: Object.freeze(["read", "sync"]),
  },
]);

function mapHealth(
  health: string | undefined,
  status: string | undefined
): SdkConnectorHealth {
  if (!status || status === "Not Installed" || status === "Disconnected") {
    return "Offline";
  }
  if (health === "Error" || status === "Error") return "Critical";
  if (health === "Warning" || status === "Syncing") return "Warning";
  if (health === "Healthy") return "Healthy";
  return "Offline";
}

export function createQuickBooksPlatformConnector(): PlatformConnector {
  return {
    id: QBO_CONNECTOR_ID,
    version: "1.0.0",

    async connect(ctx: PlatformConnectorContext): Promise<void> {
      connectQuickBooksDemo({ organizationId: ctx.organizationId });
    },

    async disconnect(ctx: PlatformConnectorContext): Promise<void> {
      const installation = disconnectQuickBooks(ctx.organizationId);
      if (!installation) {
        throw new Error("QuickBooks is not installed.");
      }
    },

    async validate(ctx: PlatformConnectorContext): Promise<void> {
      const tokens = loadQuickBooksTokens(ctx.organizationId);
      if (!tokens.ok) {
        throw new Error(tokens.error.message);
      }
    },

    async sync(ctx: PlatformConnectorContext) {
      const result = await runQuickBooksSync({
        organizationId: ctx.organizationId,
        organizationName: ctx.organizationName ?? ctx.organizationId,
        actorUserId: ctx.actorUserId ?? "sdk",
        actorDisplayName: ctx.actorDisplayName ?? "Platform SDK",
      });
      if (!result.ok) {
        throw new Error(result.error);
      }
      return {
        recordsImported: result.recordsImported,
        evidenceCreated: result.recordsImported,
        twinEntitiesUpdated: 0,
        jobId: result.job.id,
      };
    },

    async health(ctx: PlatformConnectorContext): Promise<SdkConnectorHealth> {
      const installation = getQuickBooksInstallation(ctx.organizationId);
      return mapHealth(installation?.health, installation?.status);
    },

    capabilities() {
      return {
        operations: ["read", "sync", "import"],
        syncModes: ["Manual", "Scheduled"],
      };
    },

    entityMappings() {
      return [...ENTITY_MAPPINGS];
    },

    permissions() {
      return [...PERMISSIONS];
    },
  };
}
