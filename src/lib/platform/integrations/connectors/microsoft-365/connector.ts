/**
 * B4 Microsoft 365 connector — shared Connector contract (catalog id: microsoft).
 */

import {
  authenticatePlaceholder,
  refreshTokenPlaceholder,
} from "@/lib/platform/integrations/common/auth";
import type { Connector } from "@/lib/platform/integrations/common/contracts";
import { buildHealthReport } from "@/lib/platform/integrations/common/health";
import type { PlaceholderConnectorDeps } from "@/lib/platform/integrations/common/services/placeholder-connector";
import { createSyncJobId, resolveSyncMode } from "@/lib/platform/integrations/common/sync";
import { toErrorMessage, withRetry } from "@/lib/platform/integrations/common/sync/resilience";
import type {
  ConnectorConfiguration,
  ConnectorHealthReport,
  ConnectorRuntimeState,
  NormalizedRecord,
  SyncRecord,
  SyncRequest,
  SyncResult,
  ValidationResult,
} from "@/lib/platform/integrations/common/types";
import { validateNormalizedRecords } from "@/lib/platform/integrations/common/validation";
import type { Microsoft365RawEntity } from "@/lib/platform/integrations/connectors/microsoft-365/entities";
import {
  allMicrosoft365ObjectTypes,
  createDemoMicrosoft365Client,
  microsoft365Store,
  type Microsoft365Client,
} from "@/lib/platform/integrations/connectors/microsoft-365/services";
import { microsoft365Metadata } from "@/lib/platform/integrations/connectors/microsoft-365/metadata";
import { microsoft365CanonicalType } from "@/lib/platform/integrations/connectors/microsoft-365/mapping";
import {
  normalizeMicrosoft365Records,
  toSyncRecords,
} from "@/lib/platform/integrations/connectors/microsoft-365/normalization";

export type CreateMicrosoft365ConnectorOptions = {
  client?: Microsoft365Client;
};

export function createMicrosoft365Connector(
  deps: PlaceholderConnectorDeps,
  options: CreateMicrosoft365ConnectorOptions = {}
): Connector {
  const metadata = microsoft365Metadata;
  const client = options.client ?? createDemoMicrosoft365Client();

  const connector: Connector = {
    metadata,
    getMetadata() {
      return metadata;
    },

    async connect(config) {
      deps.persistence.saveConfiguration({
        ...config,
        settings: {
          ...config.settings,
          sourceSystem: "microsoft-365",
          storeEmailBodies: config.settings.storeEmailBodies === true,
          storeDocumentContents: config.settings.storeDocumentContents === true,
          storeChatBodies: config.settings.storeChatBodies === true,
        },
      });
      const state: ConnectorRuntimeState = {
        instanceId: config.instanceId,
        connectorId: metadata.id,
        status: "connected",
        lastSyncAt: null,
        lastError: null,
        connectedAt: new Date().toISOString(),
        lifecyclePhase: "connected",
      };
      deps.persistence.saveRuntime(state);
      await deps.events.publish({
        type: "ConnectorConnected",
        instanceId: config.instanceId,
        connectorId: metadata.id,
        scope: config.scope,
        payload: { name: metadata.name, production: true, metadataOnly: true },
      });
      return state;
    },

    async disconnect(instanceId) {
      const prev = deps.persistence.getRuntime(instanceId);
      const config = deps.persistence.getConfiguration(instanceId);
      if (config) microsoft365Store.clear(config.scope.organizationId);
      const state: ConnectorRuntimeState = {
        instanceId,
        connectorId: metadata.id,
        status: "disconnected",
        lastSyncAt: prev?.lastSyncAt ?? null,
        lastError: null,
        connectedAt: null,
        lifecyclePhase: "disconnected",
      };
      deps.persistence.saveRuntime(state);
      deps.credentials.remove(instanceId);
      await deps.events.publish({
        type: "ConnectorDisconnected",
        instanceId,
        connectorId: metadata.id,
        payload: {},
      });
      return state;
    },

    async authenticate(instanceId) {
      const config = deps.persistence.getConfiguration(instanceId);
      if (!config) return { ok: false, method: "oauth2", error: "Instance not configured" };
      const existing = deps.credentials.get(instanceId);
      const accessToken =
        existing?.accessToken ??
        (config.settings.accessToken as string | undefined) ??
        "microsoft-demo-access-token";
      const remote = await client.authenticate({
        accessToken,
        tenantDomain: (config.settings.tenantDomain as string | undefined) ?? undefined,
        consentType: (config.settings.consentType as "admin" | "user" | undefined) ?? "admin",
      });
      if (!remote.ok || !remote.session) {
        return { ok: false, method: "oauth2", error: remote.error ?? "Microsoft auth failed" };
      }
      deps.persistence.saveConfiguration({
        ...config,
        settings: {
          ...config.settings,
          tenantDomain: remote.session.tenantDomain,
          tenantId: remote.session.tenantId,
        },
      });
      return authenticatePlaceholder(deps.credentials, {
        instanceId,
        method: "oauth2",
        secrets: {
          accessToken: remote.session.accessToken,
          refreshToken: remote.session.refreshToken,
          tenantDomain: remote.session.tenantDomain,
          expiresAt: remote.session.expiresAt,
          placeholder: "false",
        },
      });
    },

    async refreshToken(instanceId) {
      const existing = deps.credentials.get(instanceId);
      if (!existing?.refreshToken) {
        return refreshTokenPlaceholder(deps.credentials, instanceId);
      }
      const refreshed = await client.refreshToken(existing.refreshToken);
      if (!refreshed.ok || !refreshed.accessToken) {
        return { ok: false, method: "oauth2", error: refreshed.error ?? "Refresh failed" };
      }
      return authenticatePlaceholder(deps.credentials, {
        instanceId,
        method: "oauth2",
        secrets: {
          ...existing.secrets,
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken ?? existing.refreshToken,
          expiresAt: refreshed.expiresAt ?? existing.secrets.expiresAt,
        },
      });
    },

    async sync(request) {
      const started = Date.now();
      const jobId = createSyncJobId("microsoft");
      const config = deps.persistence.getConfiguration(request.instanceId);
      if (!config) {
        return fail(jobId, request, started, ["Instance not configured"]);
      }

      deps.persistence.saveRuntime({
        instanceId: request.instanceId,
        connectorId: metadata.id,
        status: "syncing",
        lastSyncAt: deps.persistence.getRuntime(request.instanceId)?.lastSyncAt ?? null,
        lastError: null,
        connectedAt: deps.persistence.getRuntime(request.instanceId)?.connectedAt ?? null,
        lifecyclePhase: request.mode === "full" ? "initial_sync" : "incremental_sync",
      });

      await deps.events.publish({
        type: "SyncStarted",
        instanceId: request.instanceId,
        connectorId: metadata.id,
        scope: config.scope,
        payload: { jobId, mode: request.mode },
      });

      try {
        const mode = resolveSyncMode(request, metadata.supportsIncremental);
        const objectTypes = request.objectTypes?.length
          ? request.objectTypes
          : allMicrosoft365ObjectTypes();
        const since =
          mode === "incremental"
            ? deps.cursors.get(request.instanceId, "microsoft")?.cursor ?? null
            : null;

        const raw = await withRetry(async () => {
          const collected: Microsoft365RawEntity[] = [];
          for (const objectType of objectTypes) {
            let cursor: string | null = null;
            do {
              const page = await client.list(
                config.scope.organizationId,
                objectType as Parameters<Microsoft365Client["list"]>[1],
                since,
                cursor
              );
              collected.push(...page.records);
              cursor = page.nextCursor;
            } while (cursor);
          }
          return collected;
        });

        const syncRecords = toSyncRecords(raw);
        const normalized = await connector.normalize(syncRecords, config);
        const validation = await connector.validate(normalized);
        const remoteHealth = await client.health();
        const finishedAt = new Date().toISOString();
        const durationMs = Date.now() - started;

        microsoft365Store.replace(
          config.scope.organizationId,
          config.instanceId,
          validation.accepted,
          {
            lastSyncAt: finishedAt,
            lastSyncDurationMs: durationMs,
            apiLatencyMs: remoteHealth.latencyMs,
            recordsImported: validation.accepted.length,
            failures: validation.rejected.length,
            health: validation.rejected.length === 0 ? "healthy" : "degraded",
          }
        );

        const newest = raw.reduce<string | null>((acc, row) => {
          if (!acc || row.updatedAt > acc) return row.updatedAt;
          return acc;
        }, null);
        if (newest) deps.cursors.set(request.instanceId, "microsoft", newest);

        const status =
          validation.rejected.length === 0
            ? "succeeded"
            : validation.accepted.length === 0
              ? "failed"
              : "partial";

        const result: SyncResult = {
          jobId,
          instanceId: request.instanceId,
          mode,
          status,
          startedAt: new Date(started).toISOString(),
          finishedAt,
          recordsFetched: syncRecords.length,
          recordsNormalized: normalized.length,
          recordsAccepted: validation.accepted.length,
          recordsRejected: validation.rejected.length,
          errors: validation.issues.filter((i) => i.severity === "error").map((i) => i.message),
          durationMs,
        };

        deps.persistence.appendSyncHistory({
          jobId,
          instanceId: request.instanceId,
          connectorId: metadata.id,
          mode,
          status,
          startedAt: result.startedAt,
          finishedAt,
          recordsFetched: result.recordsFetched,
          recordsAccepted: result.recordsAccepted,
          recordsRejected: result.recordsRejected,
          durationMs: result.durationMs,
          errors: result.errors,
          triggeredBy: request.triggeredBy,
        });

        deps.persistence.saveRuntime({
          instanceId: request.instanceId,
          connectorId: metadata.id,
          status: status === "failed" ? "error" : "connected",
          lastSyncAt: finishedAt,
          lastError: result.errors[0] ?? null,
          connectedAt: deps.persistence.getRuntime(request.instanceId)?.connectedAt ?? null,
          lifecyclePhase: status === "failed" ? "retrying" : "monitoring",
        });

        await deps.events.publish({
          type: status === "failed" ? "SyncFailed" : "SyncCompleted",
          instanceId: request.instanceId,
          connectorId: metadata.id,
          scope: config.scope,
          payload: { jobId, accepted: result.recordsAccepted, rejected: result.recordsRejected },
        });

        const health = await connector.healthCheck(request.instanceId);
        deps.persistence.saveHealth(health);
        return result;
      } catch (error) {
        const message = toErrorMessage(error);
        const result = fail(jobId, request, started, [message]);
        deps.persistence.appendSyncHistory({
          jobId,
          instanceId: request.instanceId,
          connectorId: metadata.id,
          mode: request.mode,
          status: "failed",
          startedAt: result.startedAt,
          finishedAt: result.finishedAt,
          recordsFetched: 0,
          recordsAccepted: 0,
          recordsRejected: 0,
          durationMs: result.durationMs,
          errors: [message],
          triggeredBy: request.triggeredBy,
        });
        await deps.events.publish({
          type: "SyncFailed",
          instanceId: request.instanceId,
          connectorId: metadata.id,
          payload: { jobId, error: message },
        });
        return result;
      }
    },

    async normalize(records: SyncRecord[], config: ConnectorConfiguration) {
      return normalizeMicrosoft365Records(records, config);
    },

    async validate(records: NormalizedRecord[]): Promise<ValidationResult> {
      return validateNormalizedRecords(records, {
        requiredFields: {
          "comms.message": ["id", "externalId", "organizationId"],
          "comms.event": ["id", "externalId", "organizationId"],
          "comms.meeting": ["id", "externalId", "organizationId"],
          "document.file": ["id", "externalId", "organizationId"],
          "person.user": ["id", "externalId", "organizationId"],
          "person.contact": ["id", "externalId", "organizationId"],
        },
      });
    },

    async healthCheck(instanceId): Promise<ConnectorHealthReport> {
      const runtime = deps.persistence.getRuntime(instanceId);
      const recent = deps.persistence.listSyncHistory(instanceId, 20);
      const config = deps.persistence.getConfiguration(instanceId);
      const remote = await client.health();
      const report = buildHealthReport({
        instanceId,
        connectorId: metadata.id,
        runtime,
        recent,
        recordsImported24h: recent.reduce((sum, r) => sum + r.recordsAccepted, 0),
        failures24h: recent.filter((r) => r.status === "failed").length,
        retries24h: deps.persistence.getMetrics(instanceId).retries,
        latencyMs: remote.latencyMs,
        credentials: deps.credentials,
        rateLimitPerMinute: config?.rateLimitPerMinute ?? 120,
        paused: config?.paused,
      });
      deps.persistence.saveHealth(report);
      return report;
    },

    async lastSync(instanceId) {
      return deps.persistence.getRuntime(instanceId)?.lastSyncAt ?? null;
    },

    async status(instanceId) {
      return (
        deps.persistence.getRuntime(instanceId) ?? {
          instanceId,
          connectorId: metadata.id,
          status: "disconnected",
          lastSyncAt: null,
          lastError: null,
          connectedAt: null,
        }
      );
    },

    async configuration(instanceId) {
      return deps.persistence.getConfiguration(instanceId);
    },
  };

  return connector;
}

function fail(
  jobId: string,
  request: SyncRequest,
  started: number,
  errors: string[]
): SyncResult {
  return {
    jobId,
    instanceId: request.instanceId,
    mode: request.mode,
    status: "failed",
    startedAt: new Date(started).toISOString(),
    finishedAt: new Date().toISOString(),
    recordsFetched: 0,
    recordsNormalized: 0,
    recordsAccepted: 0,
    recordsRejected: 0,
    errors,
    durationMs: Date.now() - started,
  };
}

export { microsoft365CanonicalType };
export { createMicrosoft365Connector as createMicrosoftConnector };
