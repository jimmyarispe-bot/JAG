/**
 * Production AcademyOS connector — implements shared Connector contract.
 * AcademyOS remains SoR; JAG syncs/normalizes/validates/caches for reasoning.
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
import {
  allAcademyOsObjectTypes,
  createDemoAcademyOsClient,
  type AcademyOsClient,
} from "./client";
import { academyOsMetadata } from "./metadata";
import { academyOsCanonicalType, normalizeAcademyOsRecords, toSyncRecords } from "./normalize";
import { academyOsStore } from "./store";

export type CreateAcademyOsConnectorOptions = {
  client?: AcademyOsClient;
};

export function createAcademyOsConnector(
  deps: PlaceholderConnectorDeps,
  options: CreateAcademyOsConnectorOptions = {}
): Connector {
  const metadata = academyOsMetadata;
  const client = options.client ?? createDemoAcademyOsClient();

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
          sourceSystem: "academyos",
          organizationAlias: config.scope.organizationId,
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
      deps.persistence.appendAudit({
        instanceId: config.instanceId,
        connectorId: metadata.id,
        action: "connect",
        actor: "system",
        detail: { production: true },
      });
      await deps.events.publish({
        type: "ConnectorConnected",
        instanceId: config.instanceId,
        connectorId: metadata.id,
        scope: config.scope,
        payload: { name: metadata.name, production: true },
      });
      return state;
    },

    async disconnect(instanceId) {
      const prev = deps.persistence.getRuntime(instanceId);
      const config = deps.persistence.getConfiguration(instanceId);
      if (config) academyOsStore.clear(config.scope.organizationId);
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
      if (!config) return { ok: false, method: "api_key", error: "Instance not configured" };

      const existing = deps.credentials.get(instanceId);
      const apiKey =
        existing?.secrets.apiKey ??
        (config.settings.apiKey as string | undefined) ??
        "academyos-demo-key";

      const remote = await client.authenticate(apiKey);
      if (!remote.ok) {
        return { ok: false, method: config.authMethod, error: remote.error };
      }

      return authenticatePlaceholder(deps.credentials, {
        instanceId,
        method: config.authMethod === "none" ? "api_key" : config.authMethod,
        secrets: { apiKey, placeholder: "false" },
      });
    },

    async refreshToken(instanceId) {
      return refreshTokenPlaceholder(deps.credentials, instanceId);
    },

    async sync(request) {
      const started = Date.now();
      const jobId = createSyncJobId("academyos");
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
          : allAcademyOsObjectTypes();
        const since =
          mode === "incremental"
            ? deps.cursors.get(request.instanceId, "academyos")?.cursor ?? null
            : null;

        const raw = await withRetry(async () => {
          const batches = await Promise.all(
            objectTypes.map((objectType) =>
              client.list(
                config.scope.organizationId,
                objectType as Parameters<AcademyOsClient["list"]>[1],
                since
              )
            )
          );
          return batches.flat();
        });

        const syncRecords = toSyncRecords(raw);
        const normalized = await connector.normalize(syncRecords, config);
        const validation = await connector.validate(normalized);

        academyOsStore.replace(
          config.scope.organizationId,
          config.instanceId,
          validation.accepted
        );

        for (const rejected of validation.rejected) {
          deps.persistence.enqueueDeadLetter({
            instanceId: request.instanceId,
            connectorId: metadata.id,
            reason: "validation_failed",
            payload: rejected,
          });
        }

        const newest = raw.reduce<string | null>((acc, row) => {
          if (!acc || row.updatedAt > acc) return row.updatedAt;
          return acc;
        }, null);
        if (newest) deps.cursors.set(request.instanceId, "academyos", newest);

        const finishedAt = new Date().toISOString();
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
          durationMs: Date.now() - started,
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
          warnings: validation.issues
            .filter((i) => i.severity === "warning")
            .map((i) => i.message),
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
          payload: {
            jobId,
            accepted: result.recordsAccepted,
            rejected: result.recordsRejected,
            objectTypes,
          },
        });

        // Domain-oriented integration events (not intelligence package changes)
        if (validation.accepted.some((r) => r.canonicalType === "education.student")) {
          await deps.events.publish({
            type: "StudentAdded",
            instanceId: request.instanceId,
            connectorId: metadata.id,
            scope: config.scope,
            payload: {
              count: validation.accepted.filter((r) => r.canonicalType === "education.student")
                .length,
            },
          });
        }
        if (validation.accepted.some((r) => r.canonicalType === "person.employee")) {
          await deps.events.publish({
            type: "EmployeeUpdated",
            instanceId: request.instanceId,
            connectorId: metadata.id,
            scope: config.scope,
            payload: {
              count: validation.accepted.filter((r) => r.canonicalType === "person.employee")
                .length,
            },
          });
        }
        if (validation.accepted.some((r) => r.canonicalType.startsWith("finance."))) {
          await deps.events.publish({
            type: "TransactionImported",
            instanceId: request.instanceId,
            connectorId: metadata.id,
            scope: config.scope,
            payload: {
              count: validation.accepted.filter((r) => r.canonicalType.startsWith("finance."))
                .length,
            },
          });
        }
        if (validation.accepted.some((r) => r.canonicalType === "document.file")) {
          await deps.events.publish({
            type: "DocumentIndexed",
            instanceId: request.instanceId,
            connectorId: metadata.id,
            scope: config.scope,
            payload: {
              count: validation.accepted.filter((r) => r.canonicalType === "document.file").length,
            },
          });
        }

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
        deps.persistence.saveRuntime({
          instanceId: request.instanceId,
          connectorId: metadata.id,
          status: "error",
          lastSyncAt: deps.persistence.getRuntime(request.instanceId)?.lastSyncAt ?? null,
          lastError: message,
          connectedAt: deps.persistence.getRuntime(request.instanceId)?.connectedAt ?? null,
        });
        deps.persistence.enqueueDeadLetter({
          instanceId: request.instanceId,
          connectorId: metadata.id,
          reason: message,
          payload: request,
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
      return normalizeAcademyOsRecords(records, config);
    },

    async validate(records: NormalizedRecord[]): Promise<ValidationResult> {
      return validateNormalizedRecords(records, {
        requiredFields: {
          "education.student": ["id", "externalId", "organizationId"],
          "person.employee": ["id", "externalId", "organizationId"],
          "person.teacher": ["id", "externalId", "organizationId"],
          "education.enrollment": ["id", "externalId", "organizationId"],
        },
      });
    },

    async healthCheck(instanceId): Promise<ConnectorHealthReport> {
      const runtime = deps.persistence.getRuntime(instanceId);
      const recent = deps.persistence.listSyncHistory(instanceId, 20);
      const config = deps.persistence.getConfiguration(instanceId);
      const remote = await client.health();
      const since = Date.now() - 24 * 60 * 60 * 1000;
      const last24h = recent.filter((r) => new Date(r.finishedAt).getTime() >= since);
      const report = buildHealthReport({
        instanceId,
        connectorId: metadata.id,
        runtime,
        recent,
        recordsImported24h: last24h.reduce((sum, r) => sum + r.recordsAccepted, 0),
        failures24h: last24h.filter((r) => r.status === "failed").length,
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

/** Re-export helpers for tests / ECC. */
export { academyOsCanonicalType };
