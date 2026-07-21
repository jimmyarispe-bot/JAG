/**
 * Gmail incremental/full sync slice — pagination, checkpoints, rate limit, retry.
 */

import type { createAuthClient } from "@/lib/supabase/server-auth";
import type { ConnectorConfiguration } from "@/lib/platform/integrations/common/types";
import type { GoogleWorkspaceCanonicalEntity } from "@/lib/platform/integrations/connectors/google-workspace/entities";
import {
  normalizeGoogleWorkspaceRecords,
  toSyncRecords,
} from "@/lib/platform/integrations/connectors/google-workspace/normalization";
import {
  createGmailClient,
  type GmailClient,
} from "@/lib/platform/integrations/google-workspace/gmail/client";
import { deriveGmailCanonicalEntities } from "@/lib/platform/integrations/google-workspace/gmail/derive";
import {
  GMAIL_OBJECT_TYPES,
  type GmailObjectType,
} from "@/lib/platform/integrations/google-workspace/gmail/object-types";
import type {
  GmailSyncSliceOptions,
  GmailSyncSliceResult,
} from "@/lib/platform/integrations/google-workspace/gmail/types";
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

export async function syncGmailSlice(
  supabase: AuthClient | null,
  options: GmailSyncSliceOptions,
  client: GmailClient = createGmailClient()
): Promise<{
  slices: GmailSyncSliceResult[];
  rawCount: number;
  canonical: GoogleWorkspaceCanonicalEntity[];
}> {
  const auth = await client.authenticate(options.accessToken);
  if (!auth.ok) {
    throw new Error(auth.error ?? "Gmail authentication failed");
  }

  const objectTypes: GmailObjectType[] = options.objectTypes?.length
    ? [...options.objectTypes]
    : [...GMAIL_OBJECT_TYPES];

  const slices: GmailSyncSliceResult[] = [];
  const collected: GmailSyncSliceResult["records"] = [];

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
  const canonical = deriveGmailCanonicalEntities(primary);
  const derivedCount = canonical.length - beforeDerived;

  // Annotate per-type normalized counts from primary (pre-derive) records
  for (const slice of slices) {
    slice.normalized = primary.filter((r) => r.objectType === slice.objectType).length;
    slice.derived =
      slice.objectType === "message"
        ? Math.floor(derivedCount / Math.max(slice.normalized, 1))
        : 0;
  }

  return {
    slices,
    rawCount: collected.length,
    canonical,
  };
}

/** Convenience: Gmail-only object types for Sync Now / scheduled jobs. */
export function gmailSyncObjectTypes(): readonly GmailObjectType[] {
  return GMAIL_OBJECT_TYPES;
}
