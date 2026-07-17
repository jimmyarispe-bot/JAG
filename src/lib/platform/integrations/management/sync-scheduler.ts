import type { IntegrationPlatform } from "@/lib/platform/integrations/common/services/platform";
import type { SyncScheduleState, SyncResult } from "@/lib/platform/integrations/common/types";
import type { SyncQueueService } from "@/lib/platform/integrations/management/sync-queue";

/** Simple cron helpers — supports hourly intervals and every-N-minutes patterns. */
export function computeNextSyncAt(cron: string | null | undefined, from = new Date()): Date | null {
  if (!cron) return null;
  const parts = cron.trim().split(/\s+/);
  if (parts.length < 5) return null;

  // every N minutes: "*/N * * * *"
  const minute = parts[0]!;
  if (minute.startsWith("*/")) {
    const n = Number(minute.slice(2));
    if (!Number.isFinite(n) || n <= 0) return null;
    const next = new Date(from.getTime() + n * 60_000);
    next.setSeconds(0, 0);
    return next;
  }

  // every N hours at minute 0: "0 */N * * *"
  const hour = parts[1]!;
  if (hour.startsWith("*/")) {
    const n = Number(hour.slice(2));
    if (!Number.isFinite(n) || n <= 0) return null;
    const next = new Date(from);
    next.setMinutes(0, 0, 0);
    next.setHours(next.getHours() + n);
    return next;
  }

  // Default: 6 hours from now
  return new Date(from.getTime() + 6 * 60 * 60_000);
}

export class SyncScheduler {
  constructor(private readonly platform: IntegrationPlatform) {}

  ensureSchedule(instanceId: string): SyncScheduleState {
    const existing = this.platform.persistence.getSchedule(instanceId);
    if (existing) return existing;

    const config = this.platform.persistence.getConfiguration(instanceId);
    if (!config) throw new Error(`Unknown instance: ${instanceId}`);

    const strategy = config.syncStrategy ?? (config.scheduleCron ? "scheduled" : "manual");
    const state: SyncScheduleState = {
      instanceId,
      connectorId: config.connectorId,
      enabled: config.enabled && !config.paused,
      strategy,
      cron: config.scheduleCron ?? null,
      lastSuccessfulSyncAt: null,
      lastFailedSyncAt: null,
      nextScheduledSyncAt:
        strategy === "scheduled" || strategy === "poll"
          ? computeNextSyncAt(config.scheduleCron)?.toISOString() ?? null
          : null,
      lastDurationMs: null,
      lastRecordsProcessed: null,
      lastErrors: [],
      retryCount: 0,
    };
    this.platform.persistence.saveSchedule(state);
    return state;
  }

  configure(
    instanceId: string,
    input: {
      cron?: string | null;
      strategy?: SyncScheduleState["strategy"];
      enabled?: boolean;
    }
  ): SyncScheduleState {
    const state = this.ensureSchedule(instanceId);
    const config = this.platform.persistence.getConfiguration(instanceId);
    if (!config) throw new Error(`Unknown instance: ${instanceId}`);

    const cron = input.cron === undefined ? state.cron : input.cron;
    const strategy = input.strategy ?? state.strategy;
    const enabled = input.enabled ?? state.enabled;

    this.platform.persistence.saveConfiguration({
      ...config,
      scheduleCron: cron ?? undefined,
      syncStrategy: strategy,
    });

    const next: SyncScheduleState = {
      ...state,
      cron,
      strategy,
      enabled,
      nextScheduledSyncAt:
        enabled && (strategy === "scheduled" || strategy === "poll")
          ? computeNextSyncAt(cron)?.toISOString() ?? null
          : null,
    };
    this.platform.persistence.saveSchedule(next);
    return next;
  }

  recordSyncOutcome(instanceId: string, result: SyncResult): SyncScheduleState {
    const state = this.ensureSchedule(instanceId);
    const ok = result.status === "succeeded" || result.status === "partial";
    const next: SyncScheduleState = {
      ...state,
      lastSuccessfulSyncAt: ok ? result.finishedAt : state.lastSuccessfulSyncAt,
      lastFailedSyncAt: ok ? state.lastFailedSyncAt : result.finishedAt,
      lastDurationMs: result.durationMs,
      lastRecordsProcessed: result.recordsAccepted + result.recordsRejected,
      lastErrors: result.errors,
      retryCount: ok ? 0 : state.retryCount,
      nextScheduledSyncAt:
        state.enabled && (state.strategy === "scheduled" || state.strategy === "poll")
          ? computeNextSyncAt(state.cron)?.toISOString() ?? null
          : state.nextScheduledSyncAt,
    };
    this.platform.persistence.saveSchedule(next);

    const lifecycle = this.platform.persistence.getLifecycle(instanceId);
    if (lifecycle) {
      this.platform.persistence.saveLifecycle({
        ...lifecycle,
        lastSuccessfulSyncAt: next.lastSuccessfulSyncAt,
        lastFailedSyncAt: next.lastFailedSyncAt,
        nextScheduledSyncAt: next.nextScheduledSyncAt,
        retryCount: next.retryCount,
        phase: ok
          ? result.mode === "full"
            ? "initial_sync"
            : "incremental_sync"
          : "retrying",
      });
    }
    return next;
  }

  due(now = new Date()): SyncScheduleState[] {
    return this.platform.persistence.listSchedules().filter((s) => {
      if (!s.enabled) return false;
      if (s.strategy !== "scheduled" && s.strategy !== "poll") return false;
      if (!s.nextScheduledSyncAt) return false;
      return new Date(s.nextScheduledSyncAt).getTime() <= now.getTime();
    });
  }

  async runDue(queue: SyncQueueService): Promise<SyncResult[]> {
    const due = this.due();
    const results: SyncResult[] = [];
    for (const schedule of due) {
      queue.enqueue({
        instanceId: schedule.instanceId,
        mode: "incremental",
        triggeredBy: "schedule",
        priority: 40,
      });
    }
    if (due.length) {
      results.push(...(await queue.drain(due.length)));
      for (const result of results) {
        this.recordSyncOutcome(result.instanceId, result);
      }
    }
    return results;
  }

  get(instanceId: string): SyncScheduleState | null {
    return this.platform.persistence.getSchedule(instanceId) ?? this.ensureSchedule(instanceId);
  }

  list(): SyncScheduleState[] {
    return this.platform.persistence.listSchedules();
  }
}
