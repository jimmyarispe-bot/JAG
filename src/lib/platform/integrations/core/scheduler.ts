/**
 * Sync scheduler — plugs every connector into one schedule lifecycle.
 */

import type { ScheduleEntry, SyncScheduler } from "@/lib/platform/integrations/contracts/sync-contract";
import type { SyncMode, SyncRequest } from "@/lib/platform/integrations/types";

export class IntegrationScheduler implements SyncScheduler {
  private readonly schedules = new Map<string, ScheduleEntry & { enabled: boolean }>();
  private seq = 0;

  constructor(private readonly now: () => Date = () => new Date()) {}

  schedule(input: {
    connectorId: string;
    instanceId: string;
    cron: string;
    mode?: SyncMode;
  }): { scheduleId: string; nextRunAt: string } {
    const scheduleId = `sched-${++this.seq}`;
    const nextRunAt = computeNextRunAt(input.cron, this.now());
    this.schedules.set(scheduleId, {
      scheduleId,
      connectorId: input.connectorId,
      instanceId: input.instanceId,
      cron: input.cron,
      mode: input.mode ?? "scheduled",
      nextRunAt,
      enabled: true,
    });
    return { scheduleId, nextRunAt };
  }

  unschedule(scheduleId: string): boolean {
    return this.schedules.delete(scheduleId);
  }

  list(instanceId?: string): readonly ScheduleEntry[] {
    const rows = [...this.schedules.values()];
    return instanceId ? rows.filter((row) => row.instanceId === instanceId) : rows;
  }

  async tick(now = this.now()): Promise<readonly SyncRequest[]> {
    const due: SyncRequest[] = [];
    const iso = now.toISOString();
    for (const entry of this.schedules.values()) {
      if (!entry.enabled) continue;
      if (entry.nextRunAt > iso) continue;
      due.push({
        connectorId: entry.connectorId,
        instanceId: entry.instanceId,
        mode: entry.mode === "scheduled" ? "incremental" : entry.mode,
        triggeredBy: "scheduler",
      });
      const next = computeNextRunAt(entry.cron, now);
      this.schedules.set(entry.scheduleId, { ...entry, nextRunAt: next });
    }
    return due;
  }
}

/**
 * Minimal cron helper: supports "every N minutes" (star-slash-N form)
 * and defaults to +1 hour for unrecognized expressions.
 */
export function computeNextRunAt(cron: string, from: Date): string {
  const everyMinutes = cron.match(/^\*\/(\d+)\s+\*\s+\*\s+\*\s+\*$/);
  const ms = everyMinutes
    ? Number(everyMinutes[1]) * 60_000
    : cron.trim() === "0 * * * *"
      ? 3_600_000
      : 3_600_000;
  return new Date(from.getTime() + Math.max(ms, 60_000)).toISOString();
}

export function createScheduler(now?: () => Date): IntegrationScheduler {
  return new IntegrationScheduler(now);
}
