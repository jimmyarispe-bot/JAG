/**
 * Connector telemetry — counters and sync timing for observability.
 */

import type {
  RateLimitState,
  TelemetryCounters,
  TelemetrySnapshot,
} from "@/lib/platform/integrations/types";

type MutableTelemetry = {
  connectorId: string;
  instanceId: string;
  counters: TelemetryCounters;
  lastSuccessfulSync: string | null;
  lastFailedSync: string | null;
  lastSyncDurationMs: number | null;
  rateLimitState: RateLimitState;
  updatedAt: string;
};

function emptyCounters(): TelemetryCounters {
  return {
    syncStarted: 0,
    syncSucceeded: 0,
    syncFailed: 0,
    recordsProcessed: 0,
    errors: 0,
    retries: 0,
    rateLimitHits: 0,
  };
}

export class TelemetryCollector {
  private readonly byInstance = new Map<string, MutableTelemetry>();

  constructor(private readonly now: () => Date = () => new Date()) {}

  private ensure(connectorId: string, instanceId: string): MutableTelemetry {
    let row = this.byInstance.get(instanceId);
    if (!row) {
      row = {
        connectorId,
        instanceId,
        counters: emptyCounters(),
        lastSuccessfulSync: null,
        lastFailedSync: null,
        lastSyncDurationMs: null,
        rateLimitState: "open",
        updatedAt: this.now().toISOString(),
      };
      this.byInstance.set(instanceId, row);
    } else {
      row.connectorId = connectorId;
    }
    return row;
  }

  recordSyncStart(connectorId: string, instanceId: string): void {
    const row = this.ensure(connectorId, instanceId);
    row.counters.syncStarted += 1;
    row.updatedAt = this.now().toISOString();
  }

  recordSyncSuccess(input: {
    connectorId: string;
    instanceId: string;
    durationMs: number;
    recordsProcessed: number;
  }): void {
    const row = this.ensure(input.connectorId, input.instanceId);
    row.counters.syncSucceeded += 1;
    row.counters.recordsProcessed += input.recordsProcessed;
    row.lastSuccessfulSync = this.now().toISOString();
    row.lastSyncDurationMs = input.durationMs;
    row.updatedAt = row.lastSuccessfulSync;
  }

  recordSyncFailure(input: {
    connectorId: string;
    instanceId: string;
    durationMs?: number;
  }): void {
    const row = this.ensure(input.connectorId, input.instanceId);
    row.counters.syncFailed += 1;
    row.counters.errors += 1;
    row.lastFailedSync = this.now().toISOString();
    if (input.durationMs != null) row.lastSyncDurationMs = input.durationMs;
    row.updatedAt = row.lastFailedSync;
  }

  recordRetry(connectorId: string, instanceId: string): void {
    const row = this.ensure(connectorId, instanceId);
    row.counters.retries += 1;
    row.updatedAt = this.now().toISOString();
  }

  recordRateLimit(connectorId: string, instanceId: string, state: RateLimitState): void {
    const row = this.ensure(connectorId, instanceId);
    row.counters.rateLimitHits += 1;
    row.rateLimitState = state;
    row.updatedAt = this.now().toISOString();
  }

  snapshot(connectorId: string, instanceId: string): TelemetrySnapshot {
    const row = this.ensure(connectorId, instanceId);
    return {
      connectorId: row.connectorId,
      instanceId: row.instanceId,
      counters: { ...row.counters },
      lastSuccessfulSync: row.lastSuccessfulSync,
      lastFailedSync: row.lastFailedSync,
      lastSyncDurationMs: row.lastSyncDurationMs,
      rateLimitState: row.rateLimitState,
      updatedAt: row.updatedAt,
    };
  }

  list(): TelemetrySnapshot[] {
    return [...this.byInstance.values()].map((row) => ({
      connectorId: row.connectorId,
      instanceId: row.instanceId,
      counters: { ...row.counters },
      lastSuccessfulSync: row.lastSuccessfulSync,
      lastFailedSync: row.lastFailedSync,
      lastSyncDurationMs: row.lastSyncDurationMs,
      rateLimitState: row.rateLimitState,
      updatedAt: row.updatedAt,
    }));
  }
}
