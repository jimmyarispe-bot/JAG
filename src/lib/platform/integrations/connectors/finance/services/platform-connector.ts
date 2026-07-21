/**
 * Shared PlatformConnector factory for QuickBooks / Stripe / Square / Plaid.
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
import type {
  FinanceCanonicalEntity,
  FinanceProvider,
  FinanceRawEntity,
} from "@/lib/platform/integrations/connectors/finance/entities";
import { buildFinanceKnowledgeGraph } from "@/lib/platform/integrations/connectors/finance/mapping";
import { ingestConnectorGraph } from "@/lib/platform/knowledge-graph";
import {
  normalizeFinanceRecords,
  toSyncRecords,
} from "@/lib/platform/integrations/connectors/finance/normalization";
import {
  createDemoFinanceClient,
  type FinanceClient,
} from "@/lib/platform/integrations/connectors/finance/services/client";
import { financeStore } from "@/lib/platform/integrations/connectors/finance/services/store";

export type FinanceConnectorSpec = {
  provider: FinanceProvider;
  displayName: string;
  description: string;
  version?: string;
  capabilities: readonly string[];
};

const SESSIONS = new Map<string, { accessToken: string; refreshToken: string; expiresAt: string }>();

export function createFinancePlatformConnector(
  spec: FinanceConnectorSpec,
  options: {
    client?: FinanceClient;
    publisher?: EventPublisher;
    organizationIdFor?: (instanceId: string) => string;
  } = {}
): PlatformConnector {
  const client = options.client ?? createDemoFinanceClient(spec.provider);
  const orgFor =
    options.organizationIdFor ??
    ((instanceId: string) => {
      const match = instanceId.match(new RegExp(`^${spec.provider}-(.+)$`));
      const derived = match?.[1];
      if (!derived || derived.startsWith("ecc") || derived.startsWith("inc")) {
        return "org-finance-demo";
      }
      return derived.startsWith("org-") ? derived : `org-${derived}`;
    });
  const instanceConfig = new Map<string, { organizationId: string }>();

  const metadata: ConnectorMetadata = {
    id: spec.provider,
    version: spec.version ?? "1.0.0",
    displayName: spec.displayName,
    provider: spec.displayName,
    description: spec.description,
    authStrategies: ["oauth2", "api_key"],
    syncModes: ["manual", "scheduled", "incremental", "full"],
    supportsWebhooks: true,
    capabilities: [...spec.capabilities, "financial-intelligence"],
  };

  const connector: PlatformConnector = {
    id: metadata.id,
    version: metadata.version,
    displayName: metadata.displayName,
    provider: metadata.provider,

    metadata() {
      return metadata;
    },

    async authenticate(instanceId) {
      const organizationId = orgFor(instanceId);
      instanceConfig.set(instanceId, { organizationId });
      const existing = SESSIONS.get(`${spec.provider}:${instanceId}`);
      const remote = await client.authenticate({
        accessToken: existing?.accessToken || `${spec.provider}-demo-access-token`,
      });
      if (!remote.ok || !remote.accessToken) {
        return { ok: false, strategy: "oauth2", error: remote.error ?? "Auth failed" };
      }
      SESSIONS.set(`${spec.provider}:${instanceId}`, {
        accessToken: remote.accessToken,
        refreshToken: remote.refreshToken ?? "",
        expiresAt: remote.expiresAt ?? new Date(Date.now() + 3_600_000).toISOString(),
      });
      return {
        ok: true,
        strategy: "oauth2",
        accessToken: remote.accessToken,
        refreshToken: remote.refreshToken,
        expiresAt: remote.expiresAt,
      };
    },

    async refreshAuthentication(instanceId) {
      const key = `${spec.provider}:${instanceId}`;
      const existing = SESSIONS.get(key);
      if (!existing?.refreshToken) {
        return { ok: false, strategy: "oauth2", error: "Missing refresh token" };
      }
      const refreshed = await client.refreshToken(existing.refreshToken);
      if (!refreshed.ok || !refreshed.accessToken) {
        return { ok: false, strategy: "oauth2", error: refreshed.error ?? "Refresh failed" };
      }
      SESSIONS.set(key, {
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken ?? existing.refreshToken,
        expiresAt: refreshed.expiresAt ?? existing.expiresAt,
      });
      return {
        ok: true,
        strategy: "oauth2",
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        expiresAt: refreshed.expiresAt,
      };
    },

    async disconnect(instanceId) {
      const cfg = instanceConfig.get(instanceId);
      if (cfg) financeStore.clear(cfg.organizationId, spec.provider);
      SESSIONS.delete(`${spec.provider}:${instanceId}`);
    },

    async validate(instanceId) {
      const session = SESSIONS.get(`${spec.provider}:${instanceId}`);
      return session?.accessToken
        ? { ok: true, issues: [] }
        : { ok: false, issues: ["Not authenticated"] };
    },

    async sync(request: SyncRequest): Promise<SyncResult> {
      const started = Date.now();
      const startedAt = new Date(started).toISOString();
      const jobId = `${spec.provider}-${request.instanceId}-${started.toString(36)}`;
      const cfg = instanceConfig.get(request.instanceId) ?? {
        organizationId: orgFor(request.instanceId),
      };
      instanceConfig.set(request.instanceId, cfg);

      if (!SESSIONS.get(`${spec.provider}:${request.instanceId}`)?.accessToken) {
        await connector.authenticate(request.instanceId);
      }

      try {
        const objectTypes = request.objectTypes?.length
          ? [...request.objectTypes]
          : client.objectTypes();
        const since =
          request.mode === "incremental" || request.mode === "scheduled"
            ? request.since ?? request.cursor ?? null
            : null;

        const collected: FinanceRawEntity[] = [];
        for (const objectType of objectTypes) {
          let cursor: string | null = null;
          do {
            const page = await client.list(
              cfg.organizationId,
              objectType as Parameters<FinanceClient["list"]>[1],
              since,
              cursor
            );
            collected.push(...page.records);
            cursor = page.nextCursor;
          } while (cursor);
        }

        const syncRecords = toSyncRecords(collected);
        const config = fakeConfig(spec.provider, request.instanceId, cfg.organizationId);
        const normalized = normalizeFinanceRecords(syncRecords, config, spec.provider);
        const canonical = normalized.map(
          (n) => n.data as unknown as FinanceCanonicalEntity
        );

        financeStore.replace(cfg.organizationId, spec.provider, request.instanceId, normalized);
        buildFinanceKnowledgeGraph(canonical);
        ingestConnectorGraph(cfg.organizationId);

        if (options.publisher) {
          const paymentLike = canonical.filter(
            (record) =>
              record.objectType === "payment" ||
              record.objectType === "transaction" ||
              record.objectType === "refund"
          );
          const docs = canonical.filter(
            (record) => record.objectType === "invoice" || record.objectType === "bill"
          );
          const chunkSize = 25;
          for (let i = 0; i < paymentLike.length; i += chunkSize) {
            const chunk = paymentLike.slice(i, i + chunkSize);
            await Promise.all(
              chunk.map((record) =>
                options.publisher!.publish(
                  "PAYMENT_RECEIVED",
                  {
                    externalId: record.externalId,
                    canonicalType: record.canonicalType,
                    provider: spec.provider,
                    summary: record.attributes.name ?? null,
                    amount: record.attributes.totalAmt ?? null,
                  },
                  { connectorId: spec.provider, instanceId: request.instanceId }
                )
              )
            );
          }
          for (let i = 0; i < docs.length; i += chunkSize) {
            const chunk = docs.slice(i, i + chunkSize);
            await Promise.all(
              chunk.map((record) =>
                options.publisher!.publish(
                  "DOCUMENT_CREATED",
                  {
                    externalId: record.externalId,
                    canonicalType: record.canonicalType,
                    provider: spec.provider,
                    summary: record.attributes.name ?? null,
                  },
                  { connectorId: spec.provider, instanceId: request.instanceId }
                )
              )
            );
          }
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
      const session = SESSIONS.get(`${spec.provider}:${instanceId}`);
      const cfg = instanceConfig.get(instanceId);
      const snap = cfg ? financeStore.get(cfg.organizationId, spec.provider) : null;
      const remote = await client.health();
      return buildHealthSnapshot({
        connectorId: connector.id,
        instanceId,
        connectionStatus: session?.accessToken ? "healthy" : "disconnected",
        lastSuccessfulSync: snap?.syncedAt ?? null,
        lastSyncDurationMs: remote.latencyMs,
        recordsProcessed: snap?.records.length ?? 0,
        errorCount: 0,
        message: `${spec.provider} finance connector`,
      });
    },
  };

  return connector;
}

function fakeConfig(
  provider: FinanceProvider,
  instanceId: string,
  organizationId: string
): ConnectorConfiguration {
  const now = new Date().toISOString();
  return {
    connectorId: provider,
    instanceId,
    scope: { organizationId, schoolId: null },
    enabled: true,
    authMethod: "oauth2",
    settings: {},
    createdAt: now,
    updatedAt: now,
  };
}

export async function reconnectFinanceConnector(
  connector: PlatformConnector,
  instanceId: string
): Promise<AuthSession> {
  await connector.disconnect(instanceId);
  return connector.authenticate(instanceId);
}
