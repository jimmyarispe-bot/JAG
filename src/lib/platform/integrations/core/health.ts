/**
 * Connector health snapshots for operational dashboards.
 */

import type {
  CircuitState,
  ConnectorLifecycleState,
  HealthSnapshot,
  RateLimitState,
} from "@/lib/platform/integrations/types";

export type HealthInput = {
  connectorId: string;
  instanceId: string;
  connectionStatus: ConnectorLifecycleState;
  lastSuccessfulSync?: string | null;
  lastFailedSync?: string | null;
  lastSyncDurationMs?: number | null;
  recordsProcessed?: number;
  errorCount?: number;
  rateLimitState?: RateLimitState;
  circuitState?: CircuitState;
  message?: string;
};

export function buildHealthSnapshot(
  input: HealthInput,
  now: () => Date = () => new Date()
): HealthSnapshot {
  return {
    connectorId: input.connectorId,
    instanceId: input.instanceId,
    connectionStatus: input.connectionStatus,
    lastSuccessfulSync: input.lastSuccessfulSync ?? null,
    lastFailedSync: input.lastFailedSync ?? null,
    lastSyncDurationMs: input.lastSyncDurationMs ?? null,
    recordsProcessed: input.recordsProcessed ?? 0,
    errorCount: input.errorCount ?? 0,
    rateLimitState: input.rateLimitState ?? "open",
    circuitState: input.circuitState ?? "closed",
    message: input.message,
    checkedAt: now().toISOString(),
  };
}

export function deriveOperationalStatus(
  snapshot: HealthSnapshot
): "healthy" | "warning" | "error" | "offline" {
  if (
    snapshot.connectionStatus === "disconnected" ||
    snapshot.connectionStatus === "disabled"
  ) {
    return "offline";
  }
  if (
    snapshot.connectionStatus === "error" ||
    snapshot.circuitState === "open" ||
    snapshot.errorCount >= 5
  ) {
    return "error";
  }
  if (
    snapshot.connectionStatus === "warning" ||
    snapshot.rateLimitState !== "open" ||
    snapshot.errorCount > 0
  ) {
    return "warning";
  }
  return "healthy";
}
