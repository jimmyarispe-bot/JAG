/**
 * RC-3.01 — Microsoft 365 Synchronization Engine
 * Full / incremental / manual / scheduled sync with checkpoints, retry,
 * telemetry, and SYNC_* platform events. Canonical entities only leave here.
 */

import type { createAuthClient } from "@/lib/supabase/server-auth";
import type { ConnectorConfiguration } from "@/lib/platform/integrations/common/types";
import { withRetry } from "@/lib/platform/integrations/common/sync/resilience";
import {
  MICROSOFT_365_OBJECT_TYPES,
  type Microsoft365CanonicalEntity,
  type Microsoft365ObjectType,
  type Microsoft365RawEntity,
} from "@/lib/platform/integrations/connectors/microsoft-365/entities";
import {
  createDemoMicrosoft365Client,
  type Microsoft365ListPage,
} from "@/lib/platform/integrations/connectors/microsoft-365/services/demo-client";
import {
  normalizeMicrosoft365Records,
  toSyncRecords,
} from "@/lib/platform/integrations/connectors/microsoft-365/normalization";
import { microsoft365Store } from "@/lib/platform/integrations/connectors/microsoft-365/services/store";
import { buildMicrosoft365Graph } from "@/lib/platform/integrations/connectors/microsoft-365/mapping";
import { publishMicrosoft365Events } from "@/lib/platform/integrations/connectors/microsoft-365/services/events";
import { createCalendarClient } from "@/lib/platform/integrations/microsoft-365/calendar/client";
import { deriveCalendarCanonicalEntities } from "@/lib/platform/integrations/microsoft-365/calendar/derive";
import { isCalendarObjectType } from "@/lib/platform/integrations/microsoft-365/calendar/object-types";
import { createOneDriveClient } from "@/lib/platform/integrations/microsoft-365/onedrive/client";
import { deriveOneDriveCanonicalEntities } from "@/lib/platform/integrations/microsoft-365/onedrive/derive";
import { isOneDriveObjectType } from "@/lib/platform/integrations/microsoft-365/onedrive/object-types";
import { createOutlookClient } from "@/lib/platform/integrations/microsoft-365/outlook/client";
import { deriveOutlookCanonicalEntities } from "@/lib/platform/integrations/microsoft-365/outlook/derive";
import { isOutlookObjectType } from "@/lib/platform/integrations/microsoft-365/outlook/object-types";
import { createSharePointClient } from "@/lib/platform/integrations/microsoft-365/sharepoint/client";
import { deriveSharePointCanonicalEntities } from "@/lib/platform/integrations/microsoft-365/sharepoint/derive";
import { isSharePointObjectType } from "@/lib/platform/integrations/microsoft-365/sharepoint/object-types";
import { createTeamsClient } from "@/lib/platform/integrations/microsoft-365/teams/client";
import { deriveTeamsCanonicalEntities } from "@/lib/platform/integrations/microsoft-365/teams/derive";
import { isTeamsObjectType } from "@/lib/platform/integrations/microsoft-365/teams/object-types";
import { ensureMicrosoft365AccessToken } from "@/lib/platform/integrations/microsoft-365/sync/token-bridge";
import {
  MICROSOFT_365_CONNECTOR_ID,
  MICROSOFT_365_PROVIDER_VERSION,
  microsoft365InstanceId,
} from "@/lib/platform/integrations/microsoft-365/sync/instance-id";
import {
  createSyncRun,
  finishSyncRun,
} from "@/lib/platform/integrations/microsoft-365/sync/run-repository";
import { getSyncCursor, setSyncCursor } from "@/lib/platform/integrations/microsoft-365/sync/cursor-store";
import {
  ensureSyncRegistry,
  touchSyncRegistryAfterRun,
} from "@/lib/platform/integrations/microsoft-365/sync/registry-store";
import {
  publishSyncCompleted,
  publishSyncFailed,
  publishSyncStarted,
  getMicrosoft365EventPublisher,
} from "@/lib/platform/integrations/microsoft-365/sync/publish-events";
import type {
  MicrosoftSyncOptions,
  MicrosoftSyncResult,
  MicrosoftSyncMode,
} from "@/lib/platform/integrations/microsoft-365/sync/types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

function resolveMode(options: MicrosoftSyncOptions): MicrosoftSyncMode {
  if (options.forceFull) return "full";
  if (options.mode) return options.mode;
  return "manual";
}

function resolveObjectTypes(options: MicrosoftSyncOptions): Microsoft365ObjectType[] {
  if (options.objectTypes?.length) {
    const allowed = new Set<string>(MICROSOFT_365_OBJECT_TYPES);
    const selected: Microsoft365ObjectType[] = [];
    for (const t of options.objectTypes) {
      if (allowed.has(t)) selected.push(t as Microsoft365ObjectType);
    }
    return selected.length ? selected : [...MICROSOFT_365_OBJECT_TYPES];
  }
  return [...MICROSOFT_365_OBJECT_TYPES];
}

function fakeConfig(instanceId: string, organizationId: string): ConnectorConfiguration {
  const now = new Date().toISOString();
  return {
    connectorId: MICROSOFT_365_CONNECTOR_ID,
    instanceId,
    scope: { organizationId, schoolId: null },
    enabled: true,
    authMethod: "oauth2",
    settings: {
      storeEmailBodies: false,
      storeDocumentContents: false,
      storeChatBodies: false,
      sourceSystem: "microsoft-365",
    },
    createdAt: now,
    updatedAt: now,
  };
}

export async function runMicrosoft365Sync(
  supabase: AuthClient,
  options: MicrosoftSyncOptions
): Promise<MicrosoftSyncResult> {
  const started = Date.now();
  const mode = resolveMode(options);
  const triggeredBy = options.triggeredBy ?? "manual";
  const objectTypes = resolveObjectTypes(options);
  const instanceId = microsoft365InstanceId(options.organizationId);
  const jobId = `ms-${options.organizationId}-${started.toString(36)}`;

  const tokens = await ensureMicrosoft365AccessToken(supabase, options.organizationId);
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
    providerVersion: MICROSOFT_365_PROVIDER_VERSION,
    tokenExpiresAt: tokens.expiresAt,
  });

  await publishSyncStarted({
    organizationId: options.organizationId,
    jobId,
    mode,
  });

  try {
    const microsoftClient = createDemoMicrosoft365Client();
    const outlookClient = createOutlookClient({ microsoftClient });
    const calendarClient = createCalendarClient({ microsoftClient });
    const oneDriveClient = createOneDriveClient({ microsoftClient });
    const sharePointClient = createSharePointClient({ microsoftClient });
    const teamsClient = createTeamsClient({ microsoftClient });

    const auth = await microsoftClient.authenticate({
      accessToken: tokens.accessToken,
      consentType: "admin",
    });
    if (!auth.ok) {
      throw new Error(auth.error ?? "Microsoft 365 authentication failed");
    }

    const useIncremental =
      mode === "incremental" || mode === "scheduled" || mode === "retry";
    const collected: Microsoft365RawEntity[] = [];

    for (const objectType of objectTypes) {
      const checkpoint = useIncremental
        ? await getSyncCursor(supabase, tokens.connection.id, objectType)
        : null;

      let pageCursor: string | null = null;
      let newestInType: string | null = checkpoint;

      do {
        let page: Microsoft365ListPage;
        if (isOutlookObjectType(objectType)) {
          page = await outlookClient.listPage({
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
        } else if (isOneDriveObjectType(objectType)) {
          page = await oneDriveClient.listPage({
            organizationId: options.organizationId,
            objectType,
            since: useIncremental ? checkpoint : null,
            cursor: pageCursor,
          });
        } else if (isSharePointObjectType(objectType)) {
          page = await sharePointClient.listPage({
            organizationId: options.organizationId,
            objectType,
            since: useIncremental ? checkpoint : null,
            cursor: pageCursor,
          });
        } else if (isTeamsObjectType(objectType)) {
          page = await teamsClient.listPage({
            organizationId: options.organizationId,
            objectType,
            since: useIncremental ? checkpoint : null,
            cursor: pageCursor,
          });
        } else {
          page = await withRetry(
            () =>
              microsoftClient.list(
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
    const normalized = normalizeMicrosoft365Records(syncRecords, config);
    const primary = normalized.map(
      (n) => n.data as unknown as Microsoft365CanonicalEntity
    );
    const canonical = deriveTeamsCanonicalEntities(
      deriveSharePointCanonicalEntities(
        deriveOneDriveCanonicalEntities(
          deriveCalendarCanonicalEntities(deriveOutlookCanonicalEntities(primary))
        )
      )
    );

    const storeRecords = canonical.map((entity) => ({
      canonicalType: entity.canonicalType,
      externalId: entity.externalId,
      sourceSystem: "microsoft-365" as const,
      scope: {
        organizationId: entity.organizationId,
        schoolId: null as string | null,
      },
      data: entity as unknown as Record<string, unknown>,
      lineage: {
        connectorId: MICROSOFT_365_CONNECTOR_ID,
        instanceId,
        syncedAt: entity.syncedAt,
        rawHash: entity.id,
      },
    }));

    const durationMs = Date.now() - started;
    microsoft365Store.replace(
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

    buildMicrosoft365Graph(canonical);
    await publishMicrosoft365Events(
      getMicrosoft365EventPublisher(),
      canonical,
      { connectorId: MICROSOFT_365_CONNECTOR_ID, instanceId }
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
    microsoft365Store.bumpFailure(options.organizationId);

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
