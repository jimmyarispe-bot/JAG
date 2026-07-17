/**
 * Connector health helpers — expanded management health states.
 */

import type {
  ConnectorHealthReport,
  ConnectorRuntimeState,
  HealthStatus,
  SyncHistoryRecord,
} from "@/lib/platform/integrations/common/types";
import type { CredentialStore } from "@/lib/platform/integrations/common/auth/credential-store";

export function deriveHealthStatus(
  runtime: ConnectorRuntimeState | null,
  recent: SyncHistoryRecord[],
  options: {
    authRequired?: boolean;
    rateLimited?: boolean;
    paused?: boolean;
  } = {}
): HealthStatus {
  if (options.authRequired) return "auth_required";
  if (options.rateLimited) return "rate_limited";
  if (!runtime || runtime.status === "disconnected") return "unknown";
  if (runtime.status === "paused" || options.paused) return "warning";
  if (runtime.status === "offline") return "offline";
  if (runtime.status === "error") return "error";
  if (runtime.status === "degraded") return "degraded";

  const failed = recent.filter((r) => r.status === "failed").length;
  const partial = recent.filter((r) => r.status === "partial").length;
  if (failed >= 3) return "error";
  if (failed >= 1) return "degraded";
  if (partial >= 2) return "warning";
  return "healthy";
}

export function buildHealthReport(input: {
  instanceId: string;
  connectorId: string;
  runtime: ConnectorRuntimeState | null;
  recent: SyncHistoryRecord[];
  recordsImported24h: number;
  failures24h: number;
  retries24h: number;
  latencyMs: number | null;
  credentials?: CredentialStore | null;
  rateLimitPerMinute?: number | null;
  paused?: boolean;
}): ConnectorHealthReport {
  const authRequired = Boolean(
    input.credentials && !input.credentials.hasValidAccessToken(input.instanceId)
  );
  const status = deriveHealthStatus(input.runtime, input.recent, {
    authRequired: authRequired && input.runtime?.status !== "disconnected",
    paused: input.paused,
  });
  const lastSuccess = input.recent.find((r) => r.status === "succeeded" || r.status === "partial");
  const lastFailed = input.recent.find((r) => r.status === "failed");
  const availability =
    input.recent.length === 0
      ? 1
      : input.recent.filter((r) => r.status === "succeeded" || r.status === "partial").length /
        input.recent.length;

  const apiStatus =
    status === "auth_required"
      ? "auth_required"
      : status === "rate_limited"
        ? "rate_limited"
        : status === "offline" || status === "error"
          ? "unreachable"
          : status === "degraded" || status === "warning"
            ? "degraded"
            : "ok";

  return {
    instanceId: input.instanceId,
    connectorId: input.connectorId,
    status,
    connectorStatus: input.runtime?.status ?? "disconnected",
    lastSyncAt: input.runtime?.lastSyncAt ?? null,
    lastSuccessAt: lastSuccess?.finishedAt ?? null,
    lastFailedAt: lastFailed?.finishedAt ?? null,
    lastError: input.runtime?.lastError ?? null,
    availability: Math.round(availability * 1000) / 1000,
    latencyMs: input.latencyMs,
    recordsImported24h: input.recordsImported24h,
    failures24h: input.failures24h,
    retries24h: input.retries24h,
    checkedAt: new Date().toISOString(),
    apiStatus,
    rateLimitRemaining: input.rateLimitPerMinute ?? null,
    rateLimitPerMinute: input.rateLimitPerMinute ?? null,
  };
}
