import { randomUUID } from "crypto";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { MICROSOFT_365_PROVIDER } from "@/lib/platform/integrations/microsoft-365/sync/instance-id";
import { memoryMicrosoftSyncRegistry } from "@/lib/platform/integrations/microsoft-365/sync/memory-registry";
import type {
  MicrosoftSyncMode,
  MicrosoftSyncRun,
  MicrosoftSyncRunStatus,
  MicrosoftSyncTriggeredBy,
} from "@/lib/platform/integrations/microsoft-365/sync/types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

function mapRow(row: Record<string, unknown>): MicrosoftSyncRun {
  return {
    id: String(row.id),
    connectionId: String(row.connection_id),
    organizationId: String(row.organization_id),
    provider: "microsoft_365",
    jobId: String(row.job_id),
    mode: row.mode as MicrosoftSyncMode,
    status: row.status as MicrosoftSyncRunStatus,
    triggeredBy: row.triggered_by as MicrosoftSyncTriggeredBy,
    objectTypes: (row.object_types as string[]) ?? [],
    recordsFetched: Number(row.records_fetched ?? 0),
    recordsNormalized: Number(row.records_normalized ?? 0),
    recordsChanged: Number(row.records_changed ?? 0),
    durationMs: row.duration_ms == null ? null : Number(row.duration_ms),
    cursor: (row.cursor as string | null) ?? null,
    error: (row.error as string | null) ?? null,
    providerVersion: (row.provider_version as string | null) ?? null,
    tokenExpiresAt: (row.token_expires_at as string | null) ?? null,
    startedAt: String(row.started_at),
    finishedAt: (row.finished_at as string | null) ?? null,
  };
}

export async function createSyncRun(
  supabase: AuthClient | null,
  input: {
    connectionId: string;
    organizationId: string;
    jobId: string;
    mode: MicrosoftSyncMode;
    triggeredBy: MicrosoftSyncTriggeredBy;
    objectTypes: string[];
    providerVersion: string;
    tokenExpiresAt: string | null;
  }
): Promise<MicrosoftSyncRun> {
  const startedAt = new Date().toISOString();
  const run: MicrosoftSyncRun = {
    id: randomUUID(),
    connectionId: input.connectionId,
    organizationId: input.organizationId,
    provider: "microsoft_365",
    jobId: input.jobId,
    mode: input.mode,
    status: "running",
    triggeredBy: input.triggeredBy,
    objectTypes: input.objectTypes,
    recordsFetched: 0,
    recordsNormalized: 0,
    recordsChanged: 0,
    durationMs: null,
    cursor: null,
    error: null,
    providerVersion: input.providerVersion,
    tokenExpiresAt: input.tokenExpiresAt,
    startedAt,
    finishedAt: null,
  };

  const list = memoryMicrosoftSyncRegistry.runs.get(input.connectionId) ?? [];
  list.unshift(run);
  memoryMicrosoftSyncRegistry.runs.set(input.connectionId, list.slice(0, 50));

  if (supabase) {
    const { data, error } = await supabase
      .from("integration_sync_runs")
      .insert({
        id: run.id,
        connection_id: run.connectionId,
        organization_id: run.organizationId,
        provider: MICROSOFT_365_PROVIDER,
        job_id: run.jobId,
        mode: run.mode,
        status: "running",
        triggered_by: run.triggeredBy,
        object_types: run.objectTypes,
        provider_version: run.providerVersion,
        token_expires_at: run.tokenExpiresAt,
        started_at: startedAt,
      })
      .select("*")
      .single();
    if (!error && data) return mapRow(data as Record<string, unknown>);
  }

  return run;
}

export async function finishSyncRun(
  supabase: AuthClient | null,
  run: MicrosoftSyncRun,
  patch: {
    status: MicrosoftSyncRunStatus;
    recordsFetched: number;
    recordsNormalized: number;
    recordsChanged: number;
    durationMs: number;
    cursor: string | null;
    error: string | null;
  }
): Promise<MicrosoftSyncRun> {
  const finished: MicrosoftSyncRun = {
    ...run,
    ...patch,
    finishedAt: new Date().toISOString(),
  };

  const list = memoryMicrosoftSyncRegistry.runs.get(run.connectionId) ?? [];
  const idx = list.findIndex((r) => r.id === run.id);
  if (idx >= 0) list[idx] = finished;
  else list.unshift(finished);
  memoryMicrosoftSyncRegistry.runs.set(run.connectionId, list.slice(0, 50));

  const prevPointer = memoryMicrosoftSyncRegistry.connectionPointers.get(run.connectionId);
  const recordsImported =
    finished.status === "failed"
      ? (prevPointer?.recordsImported ?? 0)
      : finished.recordsNormalized;

  memoryMicrosoftSyncRegistry.connectionPointers.set(run.connectionId, {
    lastSyncAt: finished.finishedAt,
    lastSyncStatus: finished.status,
    lastSyncError: finished.error,
    lastSyncDurationMs: finished.durationMs,
    lastSyncRecords: finished.recordsNormalized,
    recordsImported,
  });

  if (supabase) {
    await supabase
      .from("integration_sync_runs")
      .update({
        status: finished.status,
        records_fetched: finished.recordsFetched,
        records_normalized: finished.recordsNormalized,
        records_changed: finished.recordsChanged,
        duration_ms: finished.durationMs,
        cursor: finished.cursor,
        error: finished.error,
        finished_at: finished.finishedAt,
      })
      .eq("id", run.id);

    const connectionPatch: Record<string, unknown> = {
      last_sync_at: finished.finishedAt,
      last_sync_status: finished.status,
      last_sync_error: finished.error,
      last_sync_duration_ms: finished.durationMs,
      last_sync_records: finished.recordsNormalized,
      updated_at: finished.finishedAt,
    };
    if (finished.status !== "failed") {
      connectionPatch.records_imported = recordsImported;
    }

    await supabase
      .from("integration_connections")
      .update(connectionPatch)
      .eq("id", run.connectionId);
  }

  return finished;
}

export async function listRecentSyncRuns(
  supabase: AuthClient | null,
  connectionId: string,
  limit = 10
): Promise<MicrosoftSyncRun[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from("integration_sync_runs")
      .select("*")
      .eq("connection_id", connectionId)
      .order("started_at", { ascending: false })
      .limit(limit);
    if (!error && data?.length) {
      return data.map((row) => mapRow(row as Record<string, unknown>));
    }
  }
  return (memoryMicrosoftSyncRegistry.runs.get(connectionId) ?? []).slice(0, limit);
}
