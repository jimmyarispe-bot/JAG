/**
 * Synchronization contracts — manual, scheduled, incremental, full.
 */

import type { SyncMode, SyncRequest, SyncResult } from "@/lib/platform/integrations/types";
import type { PlatformConnector } from "@/lib/platform/integrations/contracts/connector-contract";

export interface SyncEngine {
  run(connector: PlatformConnector, request: SyncRequest): Promise<SyncResult>;
  resolveMode(requested: SyncMode | undefined, hasCursor: boolean): SyncMode;
}

export interface SyncScheduler {
  schedule(input: {
    connectorId: string;
    instanceId: string;
    cron: string;
    mode?: SyncMode;
  }): { scheduleId: string; nextRunAt: string };
  unschedule(scheduleId: string): boolean;
  list(instanceId?: string): readonly ScheduleEntry[];
  tick(now?: Date): Promise<readonly SyncRequest[]>;
}

export interface ScheduleEntry {
  readonly scheduleId: string;
  readonly connectorId: string;
  readonly instanceId: string;
  readonly cron: string;
  readonly mode: SyncMode;
  readonly nextRunAt: string;
  readonly enabled: boolean;
}
