/**
 * Production Google Workspace connector — shared Connector contract.
 * Google Workspace remains SoR; JAG syncs metadata only by default.
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
import type { GoogleWorkspaceRawEntity } from "./entities";
import {
  allGoogleWorkspaceObjectTypes,
  createDemoGoogleWorkspaceClient,
  type GoogleWorkspaceClient,
} from "./client";
import { googleWorkspaceMetadata } from "./metadata";
import {
  googleWorkspaceCanonicalType,
  normalizeGoogleWorkspaceRecords,
  toSyncRecords,
} from "./normalize";
import { googleWorkspaceStore } from "./store";

export type CreateGoogleWorkspaceConnectorOptions = {
  client?: GoogleWorkspaceClient;
};

export function createGoogleWorkspaceConnector(
  deps: PlaceholderConnectorDeps,
  options: CreateGoogleWorkspaceConnectorOptions = {}
): Connector {
  const metadata = googleWorkspaceMetadata;
  const client = options.client ?? createDemoGoogleWorkspaceClient();

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
          sourceSystem: "google-workspace",
          storeEmailBodies: config.settings.storeEmailBodies === true,
          storeDocumentContents: config.settings.storeDocumentContents === true,
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
        detail: { production: true, metadataOnly: true },
      });
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
      if (config) googleWorkspaceStore.clear(config.scope.organizationId);
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
        "google-demo-access-token";
      const domain =
        (config.settings.domain as string | undefined) ??
        existing?.secrets.domain ??
        undefined;
      const consentType =
        (config.settings.consentType as "admin" | "user" | undefined) ?? "admin";

      const remote = await client.authenticate({ accessToken, domain, consentType });
      if (!remote.ok || !remote.session) {
        return { ok: false, method: "oauth2", error: remote.error ?? "Google auth failed" };
      }

      const domains = await client.listDomains(accessToken);
      deps.persistence.saveConfiguration({
        ...config,
        settings: {
          ...config.settings,
          domain: remote.session.domain,
          consentType: remote.session.consentType,
          domains: domains.map((d) => ({
            domain: d.domain,
            displayName: d.displayName,
          })),
        },
      });

      return authenticatePlaceholder(deps.credentials, {
        instanceId,
        method: "oauth2",
        secrets: {
          accessToken: remote.session.accessToken,
          refreshToken: remote.session.refreshToken,
          domain: remote.session.domain,
          consentType: remote.session.consentType,
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
      const jobId = createSyncJobId("google");
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

      let retryCount = 0;
      try {
        const mode = resolveSyncMode(request, metadata.supportsIncremental);
        const objectTypes = request.objectTypes?.length
          ? request.objectTypes
          : allGoogleWorkspaceObjectTypes();
        const since =
          mode === "incremental"
            ? deps.cursors.get(request.instanceId, "google")?.cursor ?? null
            : null;

        const raw = await withRetry(async () => {
          retryCount += 1;
          const collected: GoogleWorkspaceRawEntity[] = [];
          for (const objectType of objectTypes) {
            let cursor: string | null = null;
            do {
              const page = await client.list(
                config.scope.organizationId,
                objectType as Parameters<GoogleWorkspaceClient["list"]>[1],
                since,
                cursor
              );
              collected.push(...page.records);
              cursor = page.nextCursor;
            } while (cursor);
          }
          return collected;
        });

        retryCount = Math.max(0, retryCount - 1);

        const syncRecords = toSyncRecords(raw);
        const normalized = await connector.normalize(syncRecords, config);
        const validation = await connector.validate(normalized);

        const remoteHealth = await client.health();
        const creds = deps.credentials.get(request.instanceId);
        const finishedAt = new Date().toISOString();
        const durationMs = Date.now() - started;

        googleWorkspaceStore.replace(
          config.scope.organizationId,
          config.instanceId,
          validation.accepted,
          {
            lastSyncAt: finishedAt,
            lastSyncDurationMs: durationMs,
            apiLatencyMs: remoteHealth.latencyMs,
            recordsImported: validation.accepted.length,
            failures: validation.rejected.length,
            retryCount,
            tokenExpiresAt: creds?.expiresAt ?? creds?.secrets.expiresAt ?? null,
            rateLimitRemaining: remoteHealth.rateLimitRemaining,
            health: validation.rejected.length === 0 ? "healthy" : "degraded",
          }
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
        if (newest) deps.cursors.set(request.instanceId, "google", newest);

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
            retryCount,
          },
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
        deps.persistence.saveRuntime({
          instanceId: request.instanceId,
          connectorId: metadata.id,
          status: "error",
          lastSyncAt: deps.persistence.getRuntime(request.instanceId)?.lastSyncAt ?? null,
          lastError: message,
          connectedAt: deps.persistence.getRuntime(request.instanceId)?.connectedAt ?? null,
        });
        googleWorkspaceStore.bumpFailure(config.scope.organizationId);
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
      return normalizeGoogleWorkspaceRecords(records, config);
    },

    async validate(records: NormalizedRecord[]): Promise<ValidationResult> {
      return validateNormalizedRecords(records, {
        requiredFields: {
          "comms.email": ["id", "externalId", "organizationId"],
          "comms.conversation": ["id", "externalId", "organizationId"],
          "comms.calendar_event": ["id", "externalId", "organizationId"],
          "comms.meeting": ["id", "externalId", "organizationId"],
          "comms.attachment": ["id", "externalId", "organizationId"],
          "comms.room": ["id", "externalId", "organizationId"],
          "comms.resource": ["id", "externalId", "organizationId"],
          "document.file": ["id", "externalId", "organizationId"],
          "document.folder": ["id", "externalId", "organizationId"],
          "document.permission": ["id", "externalId", "organizationId"],
          "document.revision": ["id", "externalId", "organizationId"],
          "document.ownership": ["id", "externalId", "organizationId"],
          "document.doc": ["id", "externalId", "organizationId"],
          "document.sheet": ["id", "externalId", "organizationId"],
          "document.slide": ["id", "externalId", "organizationId"],
          "person.user": ["id", "externalId", "organizationId"],
          "person.contact": ["id", "externalId", "organizationId"],
          "person.attendee": ["id", "externalId", "organizationId"],
          "person.owner": ["id", "externalId", "organizationId"],
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
      const snap = config ? googleWorkspaceStore.get(config.scope.organizationId) : null;
      const report = buildHealthReport({
        instanceId,
        connectorId: metadata.id,
        runtime,
        recent,
        recordsImported24h: last24h.reduce((sum, r) => sum + r.recordsAccepted, 0),
        failures24h:
          last24h.filter((r) => r.status === "failed").length +
          (snap?.monitoring.failures ?? 0),
        retries24h:
          deps.persistence.getMetrics(instanceId).retries + (snap?.monitoring.retryCount ?? 0),
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

export { googleWorkspaceCanonicalType };
export { createGoogleWorkspaceConnector as createGoogleConnector };
