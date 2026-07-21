/**
 * B4 Connector adapter for CRM providers — populates crmStore.
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
  ConnectorMetadata,
  ConnectorRuntimeState,
  NormalizedRecord,
  SyncRecord,
  SyncResult,
  ValidationResult,
} from "@/lib/platform/integrations/common/types";
import { validateNormalizedRecords } from "@/lib/platform/integrations/common/validation";
import type { CrmProvider } from "@/lib/platform/integrations/connectors/crm/entities";
import {
  normalizeCrmRecords,
  toSyncRecords,
} from "@/lib/platform/integrations/connectors/crm/normalization";
import { createDemoCrmClient } from "@/lib/platform/integrations/connectors/crm/services/client";
import { crmStore } from "@/lib/platform/integrations/connectors/crm/services/store";

export function createCrmB4Connector(
  metadata: ConnectorMetadata,
  provider: CrmProvider,
  deps: PlaceholderConnectorDeps
): Connector {
  const client = createDemoCrmClient(provider);

  const connector: Connector = {
    metadata,
    getMetadata() {
      return metadata;
    },

    async connect(config) {
      deps.persistence.saveConfiguration({
        ...config,
        settings: { ...config.settings, sourceSystem: provider },
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
        payload: { name: metadata.name, production: true },
      });
      return state;
    },

    async disconnect(instanceId) {
      const prev = deps.persistence.getRuntime(instanceId);
      const config = deps.persistence.getConfiguration(instanceId);
      if (config) crmStore.clear(config.scope.organizationId, provider);
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
      return state;
    },

    async authenticate(instanceId) {
      const config = deps.persistence.getConfiguration(instanceId);
      if (!config) return { ok: false, method: "oauth2", error: "Instance not configured" };
      const remote = await client.authenticate({
        accessToken: `${provider}-demo-access-token`,
      });
      if (!remote.ok || !remote.accessToken) {
        return { ok: false, method: "oauth2", error: remote.error ?? "Auth failed" };
      }
      return authenticatePlaceholder(deps.credentials, {
        instanceId,
        method: "oauth2",
        secrets: {
          accessToken: remote.accessToken,
          refreshToken: remote.refreshToken ?? "",
          expiresAt: remote.expiresAt ?? "",
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
        method: existing.authMethod,
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
      const jobId = createSyncJobId(provider);
      const config = deps.persistence.getConfiguration(request.instanceId);
      if (!config) {
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
          errors: ["Instance not configured"],
          durationMs: Date.now() - started,
        };
      }

      try {
        const mode = resolveSyncMode(request, metadata.supportsIncremental);
        const objectTypes = request.objectTypes?.length
          ? request.objectTypes
          : client.objectTypes();
        const since =
          mode === "incremental"
            ? deps.cursors.get(request.instanceId, provider)?.cursor ?? null
            : null;

        const raw = await withRetry(async () => {
          const collected = [];
          for (const objectType of objectTypes) {
            let cursor: string | null = null;
            do {
              const page = await client.list(
                config.scope.organizationId,
                objectType as Parameters<typeof client.list>[1],
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
        crmStore.replace(
          config.scope.organizationId,
          provider,
          request.instanceId,
          validation.accepted
        );

        const newest = raw.reduce<string | null>((acc, row) => {
          if (!acc || row.updatedAt > acc) return row.updatedAt;
          return acc;
        }, null);
        if (newest) deps.cursors.set(request.instanceId, provider, newest);

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
          triggeredBy: request.triggeredBy,
        });
        deps.persistence.saveRuntime({
          instanceId: request.instanceId,
          connectorId: metadata.id,
          status: status === "failed" ? "error" : "connected",
          lastSyncAt: finishedAt,
          lastError: result.errors[0] ?? null,
          connectedAt: deps.persistence.getRuntime(request.instanceId)?.connectedAt ?? null,
          lifecyclePhase: "monitoring",
        });
        await deps.events.publish({
          type: status === "failed" ? "SyncFailed" : "SyncCompleted",
          instanceId: request.instanceId,
          connectorId: metadata.id,
          scope: config.scope,
          payload: { jobId, accepted: result.recordsAccepted },
        });
        const health = await connector.healthCheck(request.instanceId);
        deps.persistence.saveHealth(health);
        return result;
      } catch (error) {
        const message = toErrorMessage(error);
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
          errors: [message],
          durationMs: Date.now() - started,
        };
      }
    },

    async normalize(records: SyncRecord[], config: ConnectorConfiguration) {
      return normalizeCrmRecords(records, config, provider);
    },

    async validate(records: NormalizedRecord[]): Promise<ValidationResult> {
      return validateNormalizedRecords(records, {
        requiredFields: {
          "crm.lead": ["id", "externalId", "organizationId"],
          "crm.contact": ["id", "externalId", "organizationId"],
          "crm.account": ["id", "externalId", "organizationId"],
          "crm.opportunity": ["id", "externalId", "organizationId"],
          "crm.pipeline": ["id", "externalId", "organizationId"],
        },
      });
    },

    async healthCheck(instanceId) {
      const runtime = deps.persistence.getRuntime(instanceId);
      const recent = deps.persistence.listSyncHistory(instanceId, 20);
      const remote = await client.health();
      return buildHealthReport({
        instanceId,
        connectorId: metadata.id,
        runtime,
        recent,
        recordsImported24h: recent.reduce((sum, r) => sum + r.recordsAccepted, 0),
        failures24h: recent.filter((r) => r.status === "failed").length,
        retries24h: deps.persistence.getMetrics(instanceId).retries,
        latencyMs: remote.latencyMs,
        credentials: deps.credentials,
        rateLimitPerMinute: 120,
      });
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
