/**
 * Google Workspace — PlatformConnector SDK conformance.
 * Wraps existing GWS modules; business behavior unchanged.
 */

import {
  connectGoogleWorkspaceDemo,
  disconnectGoogleWorkspace,
  getGoogleWorkspaceInstallation,
  GWS_CONNECTOR_ID,
  loadGoogleWorkspaceTokens,
  runGoogleWorkspaceSync,
} from "@/lib/connectors/google-workspace";
import type {
  PlatformConnector,
  PlatformConnectorContext,
  SdkConnectorHealth,
  TwinEntityMapping,
} from "@/lib/platform-sdk/connectors/types";
import type { PermissionDefinition } from "@/lib/platform-sdk/permissions/types";

const ENTITY_MAPPINGS: readonly TwinEntityMapping[] = Object.freeze([
  {
    sourceEntity: "DriveFile",
    twinEntityType: "Document",
    description: "Drive files → Twin Document / Evidence",
  },
  {
    sourceEntity: "CalendarEvent",
    twinEntityType: "Event",
    description: "Calendar events → Twin Event",
  },
  {
    sourceEntity: "Contact",
    twinEntityType: "Person",
    description: "Contacts → Twin Person",
  },
]);

const PERMISSIONS: readonly PermissionDefinition[] = Object.freeze([
  {
    id: "connector.google-workspace.read",
    name: "Google Workspace Read",
    description: "Read Drive, Calendar, Gmail metadata, and Contacts",
    scope: "Connector",
    resource: "google-workspace",
    actions: Object.freeze(["read", "sync", "import"]),
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

export function createGoogleWorkspacePlatformConnector(): PlatformConnector {
  return {
    id: GWS_CONNECTOR_ID,
    version: "1.0.0",

    async connect(ctx: PlatformConnectorContext): Promise<void> {
      connectGoogleWorkspaceDemo({ organizationId: ctx.organizationId });
    },

    async disconnect(ctx: PlatformConnectorContext): Promise<void> {
      const installation = disconnectGoogleWorkspace(ctx.organizationId);
      if (!installation) {
        throw new Error("Google Workspace is not installed.");
      }
    },

    async validate(ctx: PlatformConnectorContext): Promise<void> {
      const tokens = loadGoogleWorkspaceTokens(ctx.organizationId);
      if (!tokens.ok) {
        throw new Error(tokens.error);
      }
    },

    async sync(ctx: PlatformConnectorContext) {
      const result = await runGoogleWorkspaceSync({
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
        twinEntitiesUpdated:
          result.calendarEvents + result.messages + result.contacts,
        jobId: result.job.id,
      };
    },

    async health(ctx: PlatformConnectorContext): Promise<SdkConnectorHealth> {
      const installation = getGoogleWorkspaceInstallation(ctx.organizationId);
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
