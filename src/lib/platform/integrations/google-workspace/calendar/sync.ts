/**
 * Calendar incremental/full sync slice — pagination, checkpoints, rate limit, retry.
 */

import type { createAuthClient } from "@/lib/supabase/server-auth";
import type { ConnectorConfiguration } from "@/lib/platform/integrations/common/types";
import type { GoogleWorkspaceCanonicalEntity } from "@/lib/platform/integrations/connectors/google-workspace/entities";
import {
  normalizeGoogleWorkspaceRecords,
  toSyncRecords,
} from "@/lib/platform/integrations/connectors/google-workspace/normalization";
import {
  createCalendarClient,
  type CalendarClient,
} from "@/lib/platform/integrations/google-workspace/calendar/client";
import { deriveCalendarCanonicalEntities } from "@/lib/platform/integrations/google-workspace/calendar/derive";
import {
  CALENDAR_OBJECT_TYPES,
  type CalendarObjectType,
} from "@/lib/platform/integrations/google-workspace/calendar/object-types";
import type {
  CalendarSyncSliceOptions,
  CalendarSyncSliceResult,
} from "@/lib/platform/integrations/google-workspace/calendar/types";
import {
  getSyncCursor,
  setSyncCursor,
} from "@/lib/platform/integrations/google-workspace/sync/cursor-store";
import {
  GOOGLE_WORKSPACE_CONNECTOR_ID,
  googleWorkspaceInstanceId,
} from "@/lib/platform/integrations/google-workspace/sync/instance-id";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

function fakeConfig(organizationId: string): ConnectorConfiguration {
  const now = new Date().toISOString();
  return {
    connectorId: GOOGLE_WORKSPACE_CONNECTOR_ID,
    instanceId: googleWorkspaceInstanceId(organizationId),
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

export async function syncCalendarSlice(
  supabase: AuthClient | null,
  options: CalendarSyncSliceOptions,
  client: CalendarClient = createCalendarClient()
): Promise<{
  slices: CalendarSyncSliceResult[];
  rawCount: number;
  canonical: GoogleWorkspaceCanonicalEntity[];
}> {
  const auth = await client.authenticate(options.accessToken);
  if (!auth.ok) {
    throw new Error(auth.error ?? "Calendar authentication failed");
  }

  const objectTypes: CalendarObjectType[] = options.objectTypes?.length
    ? [...options.objectTypes]
    : [...CALENDAR_OBJECT_TYPES];

  const slices: CalendarSyncSliceResult[] = [];
  const collected: CalendarSyncSliceResult["records"] = [];

  for (const objectType of objectTypes) {
    const checkpoint = options.forceFull
      ? null
      : await getSyncCursor(supabase, options.connectionId, objectType);

    const { records, newestUpdatedAt } = await client.listAll({
      organizationId: options.organizationId,
      objectType,
      since: checkpoint,
    });

    const remapped = records.map((row) => ({
      ...row,
      organizationId: options.organizationId,
    }));
    collected.push(...remapped);

    if (newestUpdatedAt) {
      await setSyncCursor(
        supabase,
        options.connectionId,
        objectType,
        newestUpdatedAt
      );
    }

    slices.push({
      objectType,
      fetched: remapped.length,
      normalized: 0,
      derived: 0,
      cursor: newestUpdatedAt,
      records: remapped,
    });
  }

  const syncRecords = toSyncRecords(collected);
  const normalized = normalizeGoogleWorkspaceRecords(
    syncRecords,
    fakeConfig(options.organizationId)
  );
  const primary = normalized.map(
    (n) => n.data as unknown as GoogleWorkspaceCanonicalEntity
  );
  const beforeDerived = primary.length;
  const canonical = deriveCalendarCanonicalEntities(primary);
  const derivedCount = canonical.length - beforeDerived;

  for (const slice of slices) {
    slice.normalized = primary.filter((r) => r.objectType === slice.objectType).length;
    slice.derived =
      slice.objectType === "calendar_event"
        ? Math.floor(derivedCount / Math.max(slice.normalized, 1))
        : 0;
  }

  return {
    slices,
    rawCount: collected.length,
    canonical,
  };
}

export function calendarSyncObjectTypes(): readonly CalendarObjectType[] {
  return CALENDAR_OBJECT_TYPES;
}
