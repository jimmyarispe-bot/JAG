/**
 * Google Workspace runtime adapter — ConnectorRuntime for Orchestrator™.
 * Core lifecycle delegates to Platform SDK PlatformConnector (behavior unchanged).
 */

import {
  ensureFreshGoogleWorkspaceTokens,
  getGoogleWorkspaceInstallation,
  GWS_CONNECTOR_ID,
  updateGoogleWorkspaceSchedule,
} from "@/lib/connectors/google-workspace";
import type {
  ConnectorRuntime,
  OrchestratorSchedule,
  RuntimeContext,
  RuntimeResult,
} from "@/lib/connectors/orchestrator/types";
import type { ScheduleFrequency } from "@/lib/connectors/types";
import {
  createGoogleWorkspacePlatformConnector,
  type PlatformConnector,
} from "@/lib/platform-sdk";

export { createGoogleWorkspacePlatformConnector };

function mapSchedule(frequency: OrchestratorSchedule): ScheduleFrequency | null {
  if (frequency === "Disabled" || frequency === "Manual") return "Manual";
  if (
    frequency === "Hourly" ||
    frequency === "Daily" ||
    frequency === "Weekly" ||
    frequency === "Monthly"
  ) {
    return frequency;
  }
  return null;
}

function toSdkCtx(ctx: RuntimeContext) {
  return {
    organizationId: ctx.organizationId,
    organizationName: ctx.organizationName,
    actorUserId: ctx.actorUserId,
    actorDisplayName: ctx.actorDisplayName,
    demo: ctx.demo,
  };
}

/** Orchestrator runtime that also exposes the SDK PlatformConnector. */
export function createGoogleWorkspaceRuntime(): ConnectorRuntime & {
  platformConnector: PlatformConnector;
} {
  const platformConnector = createGoogleWorkspacePlatformConnector();

  return {
    connectorId: GWS_CONNECTOR_ID,
    platformConnector,

    async connect(ctx: RuntimeContext): Promise<RuntimeResult> {
      try {
        await platformConnector.connect(toSdkCtx(ctx));
        const installation = getGoogleWorkspaceInstallation(ctx.organizationId);
        return {
          ok: true,
          message: "Google Workspace connected.",
          metadata: {
            installationId: installation?.id ?? "",
            status: installation?.status ?? "Connected",
          },
        };
      } catch (err) {
        return {
          ok: false,
          message: err instanceof Error ? err.message : "Connect failed.",
        };
      }
    },

    async disconnect(ctx: RuntimeContext): Promise<RuntimeResult> {
      try {
        await platformConnector.disconnect(toSdkCtx(ctx));
        const installation = getGoogleWorkspaceInstallation(ctx.organizationId);
        return {
          ok: true,
          message: "Google Workspace disconnected.",
          metadata: { status: installation?.status ?? "Disconnected" },
        };
      } catch (err) {
        return {
          ok: false,
          message: err instanceof Error ? err.message : "Disconnect failed.",
        };
      }
    },

    async validate(ctx: RuntimeContext): Promise<RuntimeResult> {
      try {
        await platformConnector.validate(toSdkCtx(ctx));
        return { ok: true, message: "Google Workspace credentials validated." };
      } catch (err) {
        return {
          ok: false,
          message: err instanceof Error ? err.message : "Validation failed.",
        };
      }
    },

    async sync(ctx: RuntimeContext): Promise<RuntimeResult> {
      try {
        const synced = await platformConnector.sync(toSdkCtx(ctx));
        return {
          ok: true,
          message: "Google Workspace sync completed.",
          recordsImported: synced.recordsImported ?? 0,
          evidenceCreated: synced.evidenceCreated ?? 0,
          twinEntitiesUpdated: synced.twinEntitiesUpdated ?? 0,
          jobId: synced.jobId ?? null,
        };
      } catch (err) {
        return {
          ok: false,
          message: err instanceof Error ? err.message : "Sync failed.",
        };
      }
    },

    async health(ctx: RuntimeContext) {
      const health = await platformConnector.health(toSdkCtx(ctx));
      return {
        ok: health !== "Offline",
        message: `Health ${health}`,
        health,
      };
    },

    async refresh(ctx: RuntimeContext): Promise<RuntimeResult> {
      const result = await ensureFreshGoogleWorkspaceTokens(ctx.organizationId, {
        forceRefresh: true,
      });
      if (!result.ok) {
        return { ok: false, message: result.error };
      }
      return { ok: true, message: "Google Workspace tokens refreshed." };
    },

    async schedule(
      ctx: RuntimeContext,
      frequency: OrchestratorSchedule
    ): Promise<RuntimeResult> {
      if (frequency === "Disabled" || frequency === "Manual") {
        const updated = updateGoogleWorkspaceSchedule(
          ctx.organizationId,
          "Manual"
        );
        return {
          ok: Boolean(updated),
          message: updated
            ? frequency === "Disabled"
              ? "Schedule disabled (Manual)."
              : "Schedule set to Manual."
            : "Unable to update schedule.",
        };
      }
      const mapped = mapSchedule(frequency);
      if (
        !mapped ||
        (mapped !== "Daily" && mapped !== "Weekly" && mapped !== "Hourly")
      ) {
        if (frequency === "Monthly") {
          const updated = updateGoogleWorkspaceSchedule(
            ctx.organizationId,
            "Weekly"
          );
          return {
            ok: Boolean(updated),
            message: updated
              ? "Schedule mapped Monthly → Weekly for Google Workspace."
              : "Unable to update schedule.",
          };
        }
        return { ok: false, message: "Unsupported schedule." };
      }
      if (frequency === "Hourly") {
        const updated = updateGoogleWorkspaceSchedule(
          ctx.organizationId,
          "Daily"
        );
        return {
          ok: Boolean(updated),
          message: updated
            ? "Schedule mapped Hourly → Daily for Google Workspace."
            : "Unable to update schedule.",
        };
      }
      const updated = updateGoogleWorkspaceSchedule(ctx.organizationId, mapped);
      return {
        ok: Boolean(updated),
        message: updated
          ? `Schedule set to ${mapped}.`
          : "Unable to update schedule.",
      };
    },

    capabilities() {
      return platformConnector.capabilities().operations;
    },
  };
}
