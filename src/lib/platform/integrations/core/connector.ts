/**
 * Connector helpers — validate PlatformConnector shape and create stubs for tests.
 */

import type { PlatformConnector } from "@/lib/platform/integrations/contracts";
import type {
  AuthSession,
  ConnectorMetadata,
  HealthSnapshot,
  SyncRequest,
  SyncResult,
} from "@/lib/platform/integrations/types";
import { buildHealthSnapshot } from "@/lib/platform/integrations/core/health";

export function assertPlatformConnector(connector: PlatformConnector): void {
  if (!connector?.id?.trim()) throw new Error("Connector id is required");
  if (!connector.version?.trim()) throw new Error("Connector version is required");
  if (!connector.displayName?.trim()) throw new Error("Connector displayName is required");
  if (!connector.provider?.trim()) throw new Error("Connector provider is required");
  for (const method of [
    "authenticate",
    "refreshAuthentication",
    "disconnect",
    "validate",
    "sync",
    "health",
    "metadata",
  ] as const) {
    if (typeof connector[method] !== "function") {
      throw new Error(`Connector "${connector.id}" missing method ${method}`);
    }
  }
}

export type StubConnectorOptions = {
  id?: string;
  version?: string;
  displayName?: string;
  provider?: string;
  syncRecords?: number;
  failSync?: boolean;
};

/** Deterministic stub connector for platform tests — not a real vendor. */
export function createStubPlatformConnector(
  options: StubConnectorOptions = {}
): PlatformConnector {
  const id = options.id ?? "stub-connector";
  const version = options.version ?? "0.1.0";
  const displayName = options.displayName ?? "Stub Connector";
  const provider = options.provider ?? "stub";
  const sessions = new Map<string, AuthSession>();

  const meta: ConnectorMetadata = {
    id,
    version,
    displayName,
    provider,
    description: "Platform stub connector",
    authStrategies: ["api_key", "oauth2"],
    syncModes: ["manual", "scheduled", "incremental", "full"],
    supportsWebhooks: true,
    capabilities: ["sync", "health"],
  };

  return {
    id,
    version,
    displayName,
    provider,

    async authenticate(instanceId) {
      const session: AuthSession = {
        ok: true,
        strategy: "api_key",
        accessToken: `token-${instanceId}`,
      };
      sessions.set(instanceId, session);
      return session;
    },

    async refreshAuthentication(instanceId) {
      const existing = sessions.get(instanceId);
      if (!existing?.ok) {
        return { ok: false, strategy: "api_key", error: "Not authenticated" };
      }
      const session: AuthSession = {
        ...existing,
        accessToken: `refreshed-${instanceId}`,
        expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
      };
      sessions.set(instanceId, session);
      return session;
    },

    async disconnect(instanceId) {
      sessions.delete(instanceId);
    },

    async validate(instanceId) {
      return sessions.has(instanceId)
        ? { ok: true, issues: [] }
        : { ok: false, issues: ["Not authenticated"] };
    },

    async sync(request: SyncRequest): Promise<SyncResult> {
      const startedAt = new Date().toISOString();
      if (options.failSync) {
        return {
          jobId: `job-${request.instanceId}`,
          connectorId: id,
          instanceId: request.instanceId,
          mode: request.mode,
          status: "failed",
          recordsFetched: 0,
          recordsNormalized: 0,
          recordsDeduped: 0,
          durationMs: 1,
          error: "Stub sync failure",
          startedAt,
          finishedAt: new Date().toISOString(),
        };
      }
      const count = options.syncRecords ?? 3;
      return {
        jobId: `job-${request.instanceId}`,
        connectorId: id,
        instanceId: request.instanceId,
        mode: request.mode,
        status: "succeeded",
        recordsFetched: count,
        recordsNormalized: count,
        recordsDeduped: 0,
        durationMs: 5,
        cursor: `cursor-${request.mode}-${Date.now()}`,
        startedAt,
        finishedAt: new Date().toISOString(),
      };
    },

    async health(instanceId): Promise<HealthSnapshot> {
      return buildHealthSnapshot({
        connectorId: id,
        instanceId,
        connectionStatus: sessions.has(instanceId) ? "healthy" : "disconnected",
        recordsProcessed: options.syncRecords ?? 0,
      });
    },

    metadata() {
      return meta;
    },
  };
}
