import type { createAuthClient } from "@/lib/supabase/server-auth";
import type { IntegrationConnectionRow } from "@/lib/platform/integrations/connections/types";
import { googleWorkspaceStore } from "@/lib/platform/integrations/connectors/google-workspace/services/store";
import { GOOGLE_WORKSPACE_PROVIDER_VERSION } from "@/lib/platform/integrations/google-workspace/sync/instance-id";
import { memoryGoogleSyncRegistry } from "@/lib/platform/integrations/google-workspace/sync/memory-registry";
import { getSyncRegistry } from "@/lib/platform/integrations/google-workspace/sync/registry-store";
import { listRecentSyncRuns } from "@/lib/platform/integrations/google-workspace/sync/run-repository";
import type { GoogleSyncProgressStatus } from "@/lib/platform/integrations/google-workspace/sync/types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

async function loadConnection(
  supabase: AuthClient,
  organizationId: string
): Promise<IntegrationConnectionRow | null> {
  const { data, error } = await supabase
    .from("integration_connections")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("provider", "google_workspace")
    .maybeSingle();
  if (error) return null;
  return (data as IntegrationConnectionRow | null) ?? null;
}

export async function getGoogleWorkspaceSyncProgress(
  supabase: AuthClient,
  organizationId: string
): Promise<GoogleSyncProgressStatus> {
  const connection = await loadConnection(supabase, organizationId);
  const row = connection;
  const snap = googleWorkspaceStore.get(organizationId);
  const pointer = connection
    ? memoryGoogleSyncRegistry.connectionPointers.get(connection.id)
    : null;
  const registry = connection
    ? await getSyncRegistry(supabase, connection.id)
    : null;
  const recentRuns = connection
    ? await listRecentSyncRuns(supabase, connection.id, 8)
    : [];

  const running = recentRuns.find((r) => r.status === "running");
  const last = recentRuns.find((r) => r.status !== "running") ?? null;

  const recordsImported =
    Number(
      row?.records_imported ??
        pointer?.recordsImported ??
        snap?.records.length ??
        0
    ) || 0;

  return {
    currentStatus: running?.status ?? last?.status ?? "idle",
    lastSuccessfulSyncAt:
      registry?.lastSuccessfulSyncAt ??
      (row?.last_sync_status === "succeeded" ? row.last_sync_at ?? null : null) ??
      snap?.syncedAt ??
      null,
    lastAttemptedSyncAt:
      registry?.lastAttemptedSyncAt ?? last?.startedAt ?? row?.last_sync_at ?? null,
    lastSyncDurationMs:
      row?.last_sync_duration_ms ??
      pointer?.lastSyncDurationMs ??
      snap?.monitoring.lastSyncDurationMs ??
      last?.durationMs ??
      null,
    recordsImported,
    recordsChanged: last?.recordsChanged ?? recordsImported,
    nextScheduledSyncAt: registry?.nextIncrementalAt ?? null,
    nextFullSyncAt: registry?.nextFullAt ?? null,
    consecutiveFailures: registry?.consecutiveFailures ?? 0,
    errorDetails: row?.last_sync_error ?? last?.error ?? null,
    recentRuns,
    providerVersion: GOOGLE_WORKSPACE_PROVIDER_VERSION,
    tokenExpiresAt: connection?.expires_at ?? null,
  };
}
