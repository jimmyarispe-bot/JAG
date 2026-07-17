/**
 * Abstract placeholder connector — full contract, sample sync pipeline, no live vendor I/O.
 */

import {
  authenticatePlaceholder,
  refreshTokenPlaceholder,
  type CredentialStore,
} from "@/lib/platform/integrations/common/auth";
import type { Connector } from "@/lib/platform/integrations/common/contracts";
import { IntegrationEventBus } from "@/lib/platform/integrations/common/events";
import { buildHealthReport } from "@/lib/platform/integrations/common/health";
import { normalizeRecords } from "@/lib/platform/integrations/common/normalization";
import type { IntegrationPersistence } from "@/lib/platform/integrations/common/persistence";
import { createSyncJobId, CursorStore, resolveSyncMode } from "@/lib/platform/integrations/common/sync";
import { toErrorMessage, withRetry } from "@/lib/platform/integrations/common/sync/resilience";
import type {
  ConnectorConfiguration,
  ConnectorMetadata,
  ConnectorRuntimeState,
  NormalizedRecord,
  SyncRecord,
  SyncRequest,
  SyncResult,
  ValidationResult,
} from "@/lib/platform/integrations/common/types";
import { validateNormalizedRecords } from "@/lib/platform/integrations/common/validation";

export type PlaceholderConnectorDeps = {
  persistence: IntegrationPersistence;
  credentials: CredentialStore;
  events: IntegrationEventBus;
  cursors: CursorStore;
};

export function createPlaceholderConnector(
  metadata: ConnectorMetadata,
  deps: PlaceholderConnectorDeps,
  options: {
    sampleRecords?: (config: ConnectorConfiguration) => SyncRecord[];
    canonicalTypeFor?: (objectType: string) => string;
  } = {}
): Connector {
  const canonicalTypeFor =
    options.canonicalTypeFor ?? ((objectType: string) => objectType.replace(/_/g, "."));

  const sampleRecords =
    options.sampleRecords ??
    ((config: ConnectorConfiguration): SyncRecord[] =>
      metadata.objectTypes.slice(0, 2).map((objectType, index) => ({
        externalId: `${metadata.id}-sample-${index + 1}`,
        objectType,
        payload: {
          name: `${metadata.name} sample ${index + 1}`,
          organizationId: config.scope.organizationId,
          placeholder: true,
        },
        updatedAt: new Date().toISOString(),
      })));

  const connector: Connector = {
    metadata,

    getMetadata() {
      return metadata;
    },

    async connect(config) {
      deps.persistence.saveConfiguration(config);
      const state: ConnectorRuntimeState = {
        instanceId: config.instanceId,
        connectorId: metadata.id,
        status: "connected",
        lastSyncAt: null,
        lastError: null,
        connectedAt: new Date().toISOString(),
      };
      deps.persistence.saveRuntime(state);
      deps.persistence.appendAudit({
        instanceId: config.instanceId,
        connectorId: metadata.id,
        action: "connect",
        actor: "system",
        detail: { placeholder: metadata.placeholder },
      });
      await deps.events.publish({
        type: "ConnectorConnected",
        instanceId: config.instanceId,
        connectorId: metadata.id,
        scope: config.scope,
        payload: { name: metadata.name },
      });
      return state;
    },

    async disconnect(instanceId) {
      const prev = deps.persistence.getRuntime(instanceId);
      const state: ConnectorRuntimeState = {
        instanceId,
        connectorId: metadata.id,
        status: "disconnected",
        lastSyncAt: prev?.lastSyncAt ?? null,
        lastError: null,
        connectedAt: null,
      };
      deps.persistence.saveRuntime(state);
      deps.credentials.remove(instanceId);
      deps.persistence.appendAudit({
        instanceId,
        connectorId: metadata.id,
        action: "disconnect",
        actor: "system",
        detail: {},
      });
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
      if (!config) {
        return { ok: false, method: "none", error: "Instance not configured" };
      }
      const result = await authenticatePlaceholder(deps.credentials, {
        instanceId,
        method: config.authMethod,
      });
      if (result.ok) {
        deps.persistence.saveRuntime({
          instanceId,
          connectorId: metadata.id,
          status: "connected",
          lastSyncAt: deps.persistence.getRuntime(instanceId)?.lastSyncAt ?? null,
          lastError: null,
          connectedAt: new Date().toISOString(),
        });
      }
      return result;
    },

    async refreshToken(instanceId) {
      const result = await refreshTokenPlaceholder(deps.credentials, instanceId);
      if (result.ok) {
        await deps.events.publish({
          type: "TokenRefreshed",
          instanceId,
          connectorId: metadata.id,
          payload: { method: result.method },
        });
      }
      return result;
    },

    async sync(request) {
      const started = Date.now();
      const jobId = createSyncJobId(metadata.id);
      const config = deps.persistence.getConfiguration(request.instanceId);
      if (!config) {
        return failedSync(jobId, request, started, ["Instance not configured"]);
      }

      deps.persistence.saveRuntime({
        instanceId: request.instanceId,
        connectorId: metadata.id,
        status: "syncing",
        lastSyncAt: deps.persistence.getRuntime(request.instanceId)?.lastSyncAt ?? null,
        lastError: null,
        connectedAt: deps.persistence.getRuntime(request.instanceId)?.connectedAt ?? null,
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
        const records = await withRetry(async () => sampleRecords(config));
        const normalized = await connector.normalize(records, config);
        const validation = await connector.validate(normalized);

        for (const rejected of validation.rejected) {
          deps.persistence.enqueueDeadLetter({
            instanceId: request.instanceId,
            connectorId: metadata.id,
            reason: "validation_failed",
            payload: rejected,
          });
        }

        if (mode === "incremental" && records[0]) {
          deps.cursors.set(request.instanceId, records[0].objectType, records[0].updatedAt ?? jobId);
        }

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
          recordsFetched: records.length,
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
          triggeredBy: request.triggeredBy,
        });

        deps.persistence.saveRuntime({
          instanceId: request.instanceId,
          connectorId: metadata.id,
          status: status === "failed" ? "error" : "connected",
          lastSyncAt: finishedAt,
          lastError: result.errors[0] ?? null,
          connectedAt: deps.persistence.getRuntime(request.instanceId)?.connectedAt ?? null,
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
          },
        });

        // Emit sample domain events for accepted records (architecture demo).
        for (const record of validation.accepted.slice(0, 3)) {
          const eventType = mapCanonicalToEvent(record.canonicalType);
          if (eventType) {
            await deps.events.publish({
              type: eventType,
              instanceId: request.instanceId,
              connectorId: metadata.id,
              scope: config.scope,
              payload: { externalId: record.externalId, canonicalType: record.canonicalType },
            });
          }
        }

        const health = await connector.healthCheck(request.instanceId);
        deps.persistence.saveHealth(health);
        return result;
      } catch (error) {
        const message = toErrorMessage(error);
        const result = failedSync(jobId, request, started, [message]);
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
        await deps.events.publish({
          type: "DeadLetterEnqueued",
          instanceId: request.instanceId,
          connectorId: metadata.id,
          payload: { reason: message },
        });
        return result;
      }
    },

    async normalize(records, config) {
      return normalizeRecords(records, config, {
        connectorId: metadata.id,
        sourceSystem: metadata.vendor,
        canonicalTypeFor,
      });
    },

    async validate(records: NormalizedRecord[]): Promise<ValidationResult> {
      return validateNormalizedRecords(records, {
        requiredFields: {
          "person.employee": ["name"],
          "finance.transaction": ["name"],
          "crm.contact": ["name"],
          "education.student": ["name"],
        },
      });
    },

    async healthCheck(instanceId) {
      const runtime = deps.persistence.getRuntime(instanceId);
      const recent = deps.persistence.listSyncHistory(instanceId, 20);
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
        latencyMs: recent[0]?.durationMs ?? null,
        credentials: deps.credentials,
        rateLimitPerMinute: deps.persistence.getConfiguration(instanceId)?.rateLimitPerMinute ?? 60,
        paused: deps.persistence.getConfiguration(instanceId)?.paused,
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

function failedSync(
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

function mapCanonicalToEvent(
  canonicalType: string
): import("@/lib/platform/integrations/common/types").IntegrationEventType | null {
  if (canonicalType.includes("employee")) return "EmployeeUpdated";
  if (canonicalType.includes("student")) return "StudentAdded";
  if (canonicalType.includes("transaction") || canonicalType.includes("invoice")) {
    return canonicalType.includes("invoice") ? "InvoicePaid" : "TransactionImported";
  }
  if (canonicalType.includes("opportunity") || canonicalType.includes("deal")) {
    return "OpportunityCreated";
  }
  if (canonicalType.includes("document")) return "DocumentIndexed";
  if (canonicalType.includes("organization") || canonicalType.includes("account")) {
    return "OrganizationCreated";
  }
  return null;
}
