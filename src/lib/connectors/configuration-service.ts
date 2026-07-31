import { createConnectorScheduler } from "@/lib/connectors/scheduler";
import {
  getInstallation,
  upsertInstallation,
} from "@/lib/connectors/store";
import type {
  ConnectorConfiguration,
  ScheduleFrequency,
} from "@/lib/connectors/types";
import { SCHEDULE_FREQUENCIES } from "@/lib/connectors/types";

export type ConnectorConfigurationService = {
  get(
    organizationId: string,
    installationId: string
  ): ConnectorConfiguration | null;
  validate(config: Partial<ConnectorConfiguration>): {
    ok: boolean;
    error?: string;
  };
  update(
    organizationId: string,
    installationId: string,
    patch: {
      scheduleFrequency?: ScheduleFrequency;
      enabled?: boolean;
      settings?: Record<string, string>;
    }
  ): ConnectorConfiguration | null;
};

export function createConnectorConfigurationService(
  scheduler = createConnectorScheduler()
): ConnectorConfigurationService {
  return {
    get(organizationId, installationId) {
      const row = getInstallation(organizationId, installationId);
      if (!row) return null;
      return {
        organizationId,
        installationId,
        scheduleFrequency: row.scheduleFrequency,
        enabled: row.enabled,
        settings: {},
      };
    },
    validate(config) {
      if (
        config.scheduleFrequency &&
        !SCHEDULE_FREQUENCIES.includes(config.scheduleFrequency)
      ) {
        return { ok: false, error: "Invalid schedule frequency." };
      }
      if (config.settings) {
        for (const [k, v] of Object.entries(config.settings)) {
          if (typeof k !== "string" || typeof v !== "string") {
            return { ok: false, error: "Settings must be string maps." };
          }
          if (/secret|password|token|api[_-]?key/i.test(k)) {
            return {
              ok: false,
              error: "Secrets must use the credential store, not settings.",
            };
          }
        }
      }
      return { ok: true };
    },
    update(organizationId, installationId, patch) {
      const validation = this.validate(patch);
      if (!validation.ok) return null;
      const row = getInstallation(organizationId, installationId);
      if (!row) return null;
      const scheduleFrequency =
        patch.scheduleFrequency ?? row.scheduleFrequency;
      const plan = scheduler.planNextRun({
        organizationId,
        installationId,
        frequency: scheduleFrequency,
      });
      const enabled = patch.enabled ?? row.enabled;
      const next: typeof row = {
        ...row,
        enabled,
        scheduleFrequency,
        nextScheduledSyncAt: plan.nextRunAt,
        status: enabled
          ? row.status === "Disabled"
            ? "Installed"
            : row.status
          : "Disabled",
        updatedAt: new Date().toISOString(),
      };
      upsertInstallation(next);
      return {
        organizationId,
        installationId,
        scheduleFrequency: next.scheduleFrequency,
        enabled: next.enabled,
        settings: patch.settings ?? {},
      };
    },
  };
}
