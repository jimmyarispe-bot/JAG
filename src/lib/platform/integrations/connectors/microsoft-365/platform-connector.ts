/**
 * Sprint 075 — Microsoft 365 PlatformConnector (Integration Platform Core).
 */

import type { PlatformConnector } from "@/lib/platform/integrations/contracts";
import type { EventPublisher } from "@/lib/platform/integrations/events/publisher";
import { buildHealthSnapshot } from "@/lib/platform/integrations/core/health";
import type {
  AuthSession,
  ConnectorMetadata,
  HealthSnapshot,
  SyncRequest,
  SyncResult,
} from "@/lib/platform/integrations/types";
import type { ConnectorConfiguration } from "@/lib/platform/integrations/common/types";
import { Microsoft365SessionStore } from "@/lib/platform/integrations/connectors/microsoft-365/auth";
import {
  MICROSOFT_365_OBJECT_TYPES,
  type Microsoft365CanonicalEntity,
  type Microsoft365RawEntity,
} from "@/lib/platform/integrations/connectors/microsoft-365/entities";
import { buildMicrosoft365Graph } from "@/lib/platform/integrations/connectors/microsoft-365/mapping";
import {
  normalizeMicrosoft365Records,
  toSyncRecords,
} from "@/lib/platform/integrations/connectors/microsoft-365/normalization";
import {
  allMicrosoft365ObjectTypes,
  createDemoMicrosoft365Client,
  microsoft365Store,
  publishMicrosoft365Events,
  type Microsoft365Client,
} from "@/lib/platform/integrations/connectors/microsoft-365/services";

export type CreateMicrosoft365PlatformConnectorOptions = {
  client?: Microsoft365Client;
  sessions?: Microsoft365SessionStore;
  publisher?: EventPublisher;
  organizationIdFor?: (instanceId: string) => string;
};

const PLATFORM_METADATA: ConnectorMetadata = {
  id: "microsoft",
  version: "1.0.0",
  displayName: "Microsoft 365",
  provider: "Microsoft",
  description:
    "Production Microsoft 365 connector — Outlook, Calendar, OneDrive, SharePoint, Teams, People, Groups.",
  authStrategies: ["oauth2"],
  syncModes: ["manual", "scheduled", "incremental", "full"],
  supportsWebhooks: true,
  capabilities: [
    "outlook",
    "calendar",
    "onedrive",
    "sharepoint",
    "teams",
    "people",
    "groups",
    "knowledge-graph",
    "unified-communication",
  ],
};

export function createMicrosoft365PlatformConnector(
  options: CreateMicrosoft365PlatformConnectorOptions = {}
): PlatformConnector {
  const client = options.client ?? createDemoMicrosoft365Client();
  const sessions = options.sessions ?? new Microsoft365SessionStore();
  const orgFor =
    options.organizationIdFor ??
    ((instanceId: string) => {
      const match = instanceId.match(/^microsoft-(.+)$/);
      const derived = match?.[1];
      if (!derived || derived.startsWith("ecc") || derived.startsWith("inc") || derived === "org-demo") {
        return "org-microsoft-demo";
      }
      return derived.startsWith("org-") ? derived : `org-${derived}`;
    });
  const instanceConfig = new Map<string, { organizationId: string; tenantDomain?: string }>();

  const connector: PlatformConnector = {
    id: PLATFORM_METADATA.id,
    version: PLATFORM_METADATA.version,
    displayName: PLATFORM_METADATA.displayName,
    provider: PLATFORM_METADATA.provider,

    metadata() {
      return PLATFORM_METADATA;
    },

    async authenticate(instanceId) {
      const organizationId = orgFor(instanceId);
      instanceConfig.set(instanceId, { organizationId });
      const existing = sessions.get(instanceId);
      const accessToken = existing?.accessToken || "microsoft-demo-access-token";
      const remote = await client.authenticate({
        accessToken,
        tenantDomain: existing?.tenantDomain,
        consentType: existing?.consentType ?? "admin",
      });
      if (!remote.ok || !remote.session) {
        return { ok: false, strategy: "oauth2", error: remote.error ?? "Microsoft auth failed" };
      }
      sessions.install(instanceId, remote.session);
      instanceConfig.set(instanceId, {
        organizationId,
        tenantDomain: remote.session.tenantDomain,
      });
      return sessions.toAuthSession(sessions.get(instanceId)!);
    },

    async refreshAuthentication(instanceId) {
      const existing = sessions.get(instanceId);
      if (!existing?.refreshToken) {
        return { ok: false, strategy: "oauth2", error: "Missing refresh token" };
      }
      const refreshed = await client.refreshToken(existing.refreshToken);
      if (!refreshed.ok || !refreshed.accessToken) {
        return { ok: false, strategy: "oauth2", error: refreshed.error ?? "Refresh failed" };
      }
      const stored = sessions.refresh(instanceId, {
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        expiresAt: refreshed.expiresAt,
      });
      return stored
        ? sessions.toAuthSession(stored)
        : { ok: false, strategy: "oauth2", error: "Refresh failed" };
    },

    async disconnect(instanceId) {
      const cfg = instanceConfig.get(instanceId);
      if (cfg) microsoft365Store.clear(cfg.organizationId);
      sessions.disconnect(instanceId);
    },

    async validate(instanceId) {
      const session = sessions.get(instanceId);
      if (!session || session.disconnectedAt || !session.accessToken) {
        return { ok: false, issues: ["Not authenticated"] };
      }
      return { ok: true, issues: [] };
    },

    async sync(request: SyncRequest): Promise<SyncResult> {
      const started = Date.now();
      const startedAt = new Date(started).toISOString();
      const jobId = `microsoft-${request.instanceId}-${started.toString(36)}`;
      const cfg = instanceConfig.get(request.instanceId) ?? {
        organizationId: orgFor(request.instanceId),
      };
      instanceConfig.set(request.instanceId, cfg);

      const auth = sessions.get(request.instanceId);
      if (!auth?.accessToken || auth.disconnectedAt) {
        await connector.authenticate(request.instanceId);
      }

      try {
        const objectTypes = request.objectTypes?.length
          ? [...request.objectTypes]
          : allMicrosoft365ObjectTypes();
        const since =
          request.mode === "incremental" || request.mode === "scheduled"
            ? request.since ?? request.cursor ?? null
            : null;

        const collected: Microsoft365RawEntity[] = [];
        for (const objectType of objectTypes) {
          if (!(MICROSOFT_365_OBJECT_TYPES as readonly string[]).includes(objectType)) continue;
          let cursor: string | null = null;
          do {
            const page = await client.list(
              cfg.organizationId,
              objectType as (typeof MICROSOFT_365_OBJECT_TYPES)[number],
              since,
              cursor
            );
            collected.push(...page.records);
            cursor = page.nextCursor;
          } while (cursor);
        }

        const syncRecords = toSyncRecords(collected);
        const config = fakeConfig(request.instanceId, cfg.organizationId, cfg.tenantDomain);
        const normalized = normalizeMicrosoft365Records(syncRecords, config);
        const canonical = normalized.map(
          (n) => n.data as unknown as Microsoft365CanonicalEntity
        );

        microsoft365Store.replace(cfg.organizationId, request.instanceId, normalized, {
          lastSyncAt: new Date().toISOString(),
          lastSyncDurationMs: Date.now() - started,
          recordsImported: normalized.length,
          health: "healthy",
        });

        buildMicrosoft365Graph(canonical);

        if (options.publisher) {
          await publishMicrosoft365Events(options.publisher, canonical, {
            connectorId: connector.id,
            instanceId: request.instanceId,
          });
        }

        const newest = collected.reduce<string | null>((acc, row) => {
          if (!acc || row.updatedAt > acc) return row.updatedAt;
          return acc;
        }, null);

        return {
          jobId,
          connectorId: connector.id,
          instanceId: request.instanceId,
          mode: request.mode,
          status: "succeeded",
          recordsFetched: syncRecords.length,
          recordsNormalized: normalized.length,
          recordsDeduped: 0,
          durationMs: Date.now() - started,
          cursor: newest,
          startedAt,
          finishedAt: new Date().toISOString(),
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          jobId,
          connectorId: connector.id,
          instanceId: request.instanceId,
          mode: request.mode,
          status: "failed",
          recordsFetched: 0,
          recordsNormalized: 0,
          recordsDeduped: 0,
          durationMs: Date.now() - started,
          error: message,
          startedAt,
          finishedAt: new Date().toISOString(),
        };
      }
    },

    async health(instanceId): Promise<HealthSnapshot> {
      const session = sessions.get(instanceId);
      const cfg = instanceConfig.get(instanceId);
      const snap = cfg ? microsoft365Store.get(cfg.organizationId) : null;
      const remote = await client.health();
      return buildHealthSnapshot({
        connectorId: connector.id,
        instanceId,
        connectionStatus:
          session && !session.disconnectedAt && session.accessToken
            ? snap?.monitoring.health === "degraded"
              ? "warning"
              : "healthy"
            : "disconnected",
        lastSuccessfulSync: snap?.monitoring.lastSyncAt ?? null,
        lastFailedSync: null,
        lastSyncDurationMs: snap?.monitoring.lastSyncDurationMs ?? remote.latencyMs,
        recordsProcessed: snap?.monitoring.recordsImported ?? 0,
        errorCount: snap?.monitoring.failures ?? 0,
        rateLimitState: remote.rateLimitRemaining < 50 ? "throttled" : "open",
        message: session?.tenantDomain ? `tenant ${session.tenantDomain}` : undefined,
      });
    },
  };

  return connector;
}

function fakeConfig(
  instanceId: string,
  organizationId: string,
  tenantDomain?: string
): ConnectorConfiguration {
  const now = new Date().toISOString();
  return {
    connectorId: "microsoft",
    instanceId,
    scope: { organizationId, schoolId: null },
    enabled: true,
    authMethod: "oauth2",
    settings: {
      tenantDomain: tenantDomain ?? "jag-demo.onmicrosoft.com",
      storeEmailBodies: false,
      storeDocumentContents: false,
      storeChatBodies: false,
    },
    createdAt: now,
    updatedAt: now,
  };
}

export async function reconnectMicrosoft365(
  connector: PlatformConnector,
  instanceId: string
): Promise<AuthSession> {
  await connector.disconnect(instanceId);
  return connector.authenticate(instanceId);
}
