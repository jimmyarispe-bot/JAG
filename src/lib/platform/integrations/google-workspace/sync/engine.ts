/**
 * RC-2.02 — Google Workspace Synchronization Engine
 * Initial full / incremental / manual / scheduled sync with checkpoints,
 * retry, telemetry, and SYNC_* platform events.
 */

import type { createAuthClient } from "@/lib/supabase/server-auth";
import type { ConnectorConfiguration } from "@/lib/platform/integrations/common/types";
import { withRetry } from "@/lib/platform/integrations/common/sync/resilience";
import {
  GOOGLE_WORKSPACE_OBJECT_TYPES,
  type GoogleWorkspaceCanonicalEntity,
  type GoogleWorkspaceObjectType,
  type GoogleWorkspaceRawEntity,
} from "@/lib/platform/integrations/connectors/google-workspace/entities";
import type { GoogleWorkspaceListPage } from "@/lib/platform/integrations/connectors/google-workspace/services/demo-client";
import { resolveGoogleWorkspaceClient } from "@/lib/platform/integrations/connectors/google-workspace/services/client-factory";
import { encryptCredentialSecret } from "@/lib/integration-hub/vault-crypto";
import {
  normalizeGoogleWorkspaceRecords,
  toSyncRecords,
} from "@/lib/platform/integrations/connectors/google-workspace/normalization";
import { googleWorkspaceStore } from "@/lib/platform/integrations/connectors/google-workspace/services/store";
import { buildGoogleWorkspaceGraph } from "@/lib/platform/integrations/connectors/google-workspace/mapping";
import { publishGoogleWorkspaceEvents } from "@/lib/platform/integrations/connectors/google-workspace/services/events";
import { createCalendarClient } from "@/lib/platform/integrations/google-workspace/calendar/client";
import { deriveCalendarCanonicalEntities } from "@/lib/platform/integrations/google-workspace/calendar/derive";
import { isCalendarObjectType } from "@/lib/platform/integrations/google-workspace/calendar/object-types";
import { createDriveClient } from "@/lib/platform/integrations/google-workspace/drive/client";
import { deriveDriveCanonicalEntities } from "@/lib/platform/integrations/google-workspace/drive/derive";
import { isDriveObjectType } from "@/lib/platform/integrations/google-workspace/drive/object-types";
import { createGmailClient } from "@/lib/platform/integrations/google-workspace/gmail/client";
import { deriveGmailCanonicalEntities } from "@/lib/platform/integrations/google-workspace/gmail/derive";
import { isGmailObjectType } from "@/lib/platform/integrations/google-workspace/gmail/object-types";
import { ensureGoogleWorkspaceAccessToken } from "@/lib/platform/integrations/google-workspace/sync/token-bridge";
import {
  GOOGLE_WORKSPACE_CONNECTOR_ID,
  GOOGLE_WORKSPACE_PROVIDER_VERSION,
  googleWorkspaceInstanceId,
} from "@/lib/platform/integrations/google-workspace/sync/instance-id";
import {
  createSyncRun,
  finishSyncRun,
} from "@/lib/platform/integrations/google-workspace/sync/run-repository";
import { getSyncCursor, setSyncCursor } from "@/lib/platform/integrations/google-workspace/sync/cursor-store";
import {
  ensureSyncRegistry,
  touchSyncRegistryAfterRun,
} from "@/lib/platform/integrations/google-workspace/sync/registry-store";
import {
  publishSyncCompleted,
  publishSyncFailed,
  publishSyncStarted,
  getGoogleWorkspaceEventPublisher,
} from "@/lib/platform/integrations/google-workspace/sync/publish-events";
import type {
  GoogleSyncOptions,
  GoogleSyncResult,
  GoogleSyncMode,
} from "@/lib/platform/integrations/google-workspace/sync/types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

function resolveMode(options: GoogleSyncOptions): GoogleSyncMode {
  if (options.forceFull) return "full";
  if (options.mode) return options.mode;
  return "manual";
}

function resolveObjectTypes(
  options: GoogleSyncOptions
): GoogleWorkspaceObjectType[] {
  if (options.objectTypes?.length) {
    const allowed = new Set<string>(GOOGLE_WORKSPACE_OBJECT_TYPES);
    const selected: GoogleWorkspaceObjectType[] = [];
    for (const t of options.objectTypes) {
      if (allowed.has(t)) selected.push(t as GoogleWorkspaceObjectType);
    }
    return selected.length ? selected : [...GOOGLE_WORKSPACE_OBJECT_TYPES];
  }
  return [...GOOGLE_WORKSPACE_OBJECT_TYPES];
}

function fakeConfig(
  instanceId: string,
  organizationId: string
): ConnectorConfiguration {
  const now = new Date().toISOString();
  return {
    connectorId: GOOGLE_WORKSPACE_CONNECTOR_ID,
    instanceId,
    scope: { organizationId, schoolId: null },
    enabled: true,
    authMethod: "oauth2",
    settings: {
      storeEmailBodies: false,
      storeDocumentContents: false,
      sourceSystem: "google-workspace",
    },
    createdAt: now,
    updatedAt: now,
  };
}

export async function runGoogleWorkspaceSync(
  supabase: AuthClient,
  options: GoogleSyncOptions
): Promise<GoogleSyncResult> {
  const started = Date.now();
  const mode = resolveMode(options);
  const triggeredBy = options.triggeredBy ?? "manual";
  const objectTypes = resolveObjectTypes(options);
  const instanceId = googleWorkspaceInstanceId(options.organizationId);
  const jobId = `gw-${options.organizationId}-${started.toString(36)}`;

  const tokens = await ensureGoogleWorkspaceAccessToken(
    supabase,
    options.organizationId
  );
  if ("error" in tokens) {
    throw new Error(tokens.error);
  }

  const registry = await ensureSyncRegistry(
    supabase,
    tokens.connection.id,
    options.organizationId
  );

  const run = await createSyncRun(supabase, {
    connectionId: tokens.connection.id,
    organizationId: options.organizationId,
    jobId,
    mode,
    triggeredBy,
    objectTypes,
    providerVersion: GOOGLE_WORKSPACE_PROVIDER_VERSION,
    tokenExpiresAt: tokens.expiresAt,
  });

  await publishSyncStarted({
    organizationId: options.organizationId,
    jobId,
    mode,
  });

  try {
    // The one line that decided this whole integration was fake. It used to read
    // `createDemoGoogleWorkspaceClient()` unconditionally, so a real OAuth token
    // was fetched, decrypted, and then never used for anything.
    const { client: workspaceClient, mode: clientMode } = resolveGoogleWorkspaceClient({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      forceDemo: options.allowDemoClient === true,
      // A token refreshed mid-run has to be written back, or the next run starts
      // by 401-ing against a token this process already replaced in memory.
      onTokenRefreshed: async (next) => {
        await supabase
          .from("integration_connections")
          .update({
            access_token: encryptCredentialSecret(next.accessToken),
            refresh_token: next.refreshToken
              ? encryptCredentialSecret(next.refreshToken)
              : undefined,
            expires_at: next.expiresAt,
            status: "connected",
            updated_at: new Date().toISOString(),
          })
          .eq("id", tokens.connection.id);
      },
    });
    if (clientMode === "demo" && !options.allowDemoClient) {
      // Refuse rather than quietly ingest fixtures into a real knowledge graph.
      throw new Error(
        "Google Workspace credentials are not configured (GOOGLE_WORKSPACE_CLIENT_ID / GOOGLE_WORKSPACE_CLIENT_SECRET). Refusing to sync, because the only thing this could import is demo data. Pass allowDemoClient to run against fixtures on purpose."
      );
    }
    const gmailClient = createGmailClient({ workspaceClient });
    const calendarClient = createCalendarClient({ workspaceClient });
    const driveClient = createDriveClient({ workspaceClient });
    const auth = await workspaceClient.authenticate({
      accessToken: tokens.accessToken,
      consentType: "admin",
    });
    if (!auth.ok) {
      throw new Error(auth.error ?? "Google Workspace authentication failed");
    }

    const useIncremental =
      mode === "incremental" || mode === "scheduled" || mode === "retry";
    const collected: GoogleWorkspaceRawEntity[] = [];

    for (const objectType of objectTypes) {
      const checkpoint = useIncremental
        ? await getSyncCursor(supabase, tokens.connection.id, objectType)
        : null;

      let pageCursor: string | null = null;
      let newestInType: string | null = checkpoint;

      do {
        let page: GoogleWorkspaceListPage;
        if (isGmailObjectType(objectType)) {
          page = await gmailClient.listPage({
            organizationId: options.organizationId,
            objectType,
            since: useIncremental ? checkpoint : null,
            cursor: pageCursor,
          });
        } else if (isCalendarObjectType(objectType)) {
          page = await calendarClient.listPage({
            organizationId: options.organizationId,
            objectType,
            since: useIncremental ? checkpoint : null,
            cursor: pageCursor,
          });
        } else if (isDriveObjectType(objectType)) {
          page = await driveClient.listPage({
            organizationId: options.organizationId,
            objectType,
            since: useIncremental ? checkpoint : null,
            cursor: pageCursor,
          });
        } else {
          page = await withRetry(
            () =>
              workspaceClient.list(
                options.organizationId,
                objectType,
                useIncremental ? checkpoint : null,
                pageCursor
              ),
            { attempts: 3, baseDelayMs: 150 }
          );
        }
        for (const row of page.records) {
          collected.push({
            ...row,
            organizationId: options.organizationId,
          });
          if (!newestInType || row.updatedAt > newestInType) {
            newestInType = row.updatedAt;
          }
        }
        pageCursor = page.nextCursor;
      } while (pageCursor);

      if (newestInType) {
        await setSyncCursor(
          supabase,
          tokens.connection.id,
          objectType,
          newestInType
        );
      }
    }

    const syncRecords = toSyncRecords(collected);
    const config = fakeConfig(instanceId, options.organizationId);
    const normalized = normalizeGoogleWorkspaceRecords(syncRecords, config);
    const primary = normalized.map(
      (n) => n.data as unknown as GoogleWorkspaceCanonicalEntity
    );
    const canonical = deriveDriveCanonicalEntities(
      deriveCalendarCanonicalEntities(deriveGmailCanonicalEntities(primary))
    );

    // Persist primary + derived canonical entities for intelligence consumers.
    const storeRecords = canonical.map((entity) => ({
      canonicalType: entity.canonicalType,
      externalId: entity.externalId,
      sourceSystem: "google-workspace" as const,
      scope: {
        organizationId: entity.organizationId,
        schoolId: null as string | null,
      },
      data: entity as unknown as Record<string, unknown>,
      lineage: {
        connectorId: GOOGLE_WORKSPACE_CONNECTOR_ID,
        instanceId,
        syncedAt: entity.syncedAt,
        rawHash: entity.id,
      },
    }));

    const durationMs = Date.now() - started;
    googleWorkspaceStore.replace(
      options.organizationId,
      instanceId,
      storeRecords,
      {
        lastSyncAt: new Date().toISOString(),
        lastSyncDurationMs: durationMs,
        recordsImported: canonical.length,
        health: "healthy",
        failures: 0,
      }
    );

    buildGoogleWorkspaceGraph(canonical);
    await publishGoogleWorkspaceEvents(
      getGoogleWorkspaceEventPublisher(),
      canonical,
      { connectorId: GOOGLE_WORKSPACE_CONNECTOR_ID, instanceId }
    );

    const newest = collected.reduce<string | null>((acc, row) => {
      if (!acc || row.updatedAt > acc) return row.updatedAt;
      return acc;
    }, null);

    const finished = await finishSyncRun(supabase, run, {
      status: "succeeded",
      recordsFetched: syncRecords.length,
      recordsNormalized: canonical.length,
      recordsChanged: canonical.length,
      durationMs,
      cursor: newest,
      error: null,
    });

    const nextRegistry = await touchSyncRegistryAfterRun(supabase, registry, {
      succeeded: true,
      mode,
    });

    await publishSyncCompleted({
      organizationId: options.organizationId,
      jobId,
      mode,
      recordsFetched: syncRecords.length,
      recordsNormalized: canonical.length,
      durationMs,
    });

    return {
      ok: true,
      run: finished,
      recordsImported: canonical.length,
      durationMs,
      nextIncrementalAt: nextRegistry.nextIncrementalAt,
      nextFullAt: nextRegistry.nextFullAt,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const durationMs = Date.now() - started;
    googleWorkspaceStore.bumpFailure(options.organizationId);

    const finished = await finishSyncRun(supabase, run, {
      status: "failed",
      recordsFetched: 0,
      recordsNormalized: 0,
      recordsChanged: 0,
      durationMs,
      cursor: null,
      error: message,
    });

    const nextRegistry = await touchSyncRegistryAfterRun(supabase, registry, {
      succeeded: false,
      mode,
    });

    await publishSyncFailed({
      organizationId: options.organizationId,
      jobId,
      mode,
      error: message,
    });

    return {
      ok: false,
      run: finished,
      recordsImported: 0,
      durationMs,
      nextIncrementalAt: nextRegistry.nextIncrementalAt,
      nextFullAt: nextRegistry.nextFullAt,
    };
  }
}
