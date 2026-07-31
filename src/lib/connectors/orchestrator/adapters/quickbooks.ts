/**
 * QuickBooks Online runtime adapter — ConnectorRuntime for Orchestrator™.
 * Core lifecycle delegates to Platform SDK PlatformConnector (behavior unchanged).
 */

import {
  ensureFreshQuickBooksTokens,
  getQuickBooksInstallation,
  QBO_CONNECTOR_ID,
  updateQuickBooksSchedule,
} from "@/lib/connectors/quickbooks";
import type {
  ConnectorRuntime,
  OrchestratorSchedule,
  RuntimeContext,
  RuntimeResult,
} from "@/lib/connectors/orchestrator/types";
import type { ScheduleFrequency } from "@/lib/connectors/types";
import {
  createQuickBooksPlatformConnector,
  type PlatformConnector,
} from "@/lib/platform-sdk";

export { createQuickBooksPlatformConnector };

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
export function createQuickBooksRuntime(): ConnectorRuntime & {
  platformConnector: PlatformConnector;
} {
  const platformConnector = createQuickBooksPlatformConnector();

  return {
    connectorId: QBO_CONNECTOR_ID,
    platformConnector,

    async connect(ctx: RuntimeContext): Promise<RuntimeResult> {
      try {
        await platformConnector.connect(toSdkCtx(ctx));
        const installation = getQuickBooksInstallation(ctx.organizationId);
        return {
          ok: true,
          message: "QuickBooks Online connected.",
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
        const installation = getQuickBooksInstallation(ctx.organizationId);
        return {
          ok: true,
          message: "QuickBooks Online disconnected.",
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
        return { ok: true, message: "QuickBooks credentials validated." };
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
          message: "QuickBooks sync completed.",
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
      const result = await ensureFreshQuickBooksTokens(ctx.organizationId, {
        forceRefresh: true,
      });
      if (!result.ok) {
        return { ok: false, message: result.error.message };
      }
      return { ok: true, message: "QuickBooks tokens refreshed." };
    },

    async schedule(
      ctx: RuntimeContext,
      frequency: OrchestratorSchedule
    ): Promise<RuntimeResult> {
      if (frequency === "Disabled") {
        const updated = updateQuickBooksSchedule(ctx.organizationId, "Manual");
        return {
          ok: Boolean(updated),
          message: updated
            ? "Schedule disabled (Manual)."
            : "Unable to update schedule.",
        };
      }
      const mapped = mapSchedule(frequency);
      if (
        !mapped ||
        (mapped !== "Manual" && mapped !== "Daily" && mapped !== "Weekly")
      ) {
        if (frequency === "Hourly" || frequency === "Monthly") {
          const updated = updateQuickBooksSchedule(
            ctx.organizationId,
            frequency === "Hourly" ? "Daily" : "Weekly"
          );
          return {
            ok: Boolean(updated),
            message: updated
              ? `Schedule mapped ${frequency} → ${frequency === "Hourly" ? "Daily" : "Weekly"} for QuickBooks.`
              : "Unable to update schedule.",
          };
        }
        return { ok: false, message: "Unsupported schedule." };
      }
      const updated = updateQuickBooksSchedule(ctx.organizationId, mapped);
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
