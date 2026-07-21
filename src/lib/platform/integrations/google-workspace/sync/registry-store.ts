import type { createAuthClient } from "@/lib/supabase/server-auth";
import { computeNextSyncAt } from "@/lib/platform/integrations/management/sync-scheduler";
import { memoryGoogleSyncRegistry } from "@/lib/platform/integrations/google-workspace/sync/memory-registry";
import type { GoogleSyncRegistry } from "@/lib/platform/integrations/google-workspace/sync/types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

const DEFAULT_INCREMENTAL_CRON = "0 * * * *";
const DEFAULT_FULL_CRON = "0 2 * * *";

function mapRow(row: Record<string, unknown>): GoogleSyncRegistry {
  return {
    connectionId: String(row.connection_id),
    organizationId: String(row.organization_id),
    provider: "google_workspace",
    enabled: Boolean(row.enabled),
    incrementalCron: String(row.incremental_cron ?? DEFAULT_INCREMENTAL_CRON),
    fullCron: String(row.full_cron ?? DEFAULT_FULL_CRON),
    nextIncrementalAt: (row.next_incremental_at as string | null) ?? null,
    nextFullAt: (row.next_full_at as string | null) ?? null,
    lastSuccessfulSyncAt: (row.last_successful_sync_at as string | null) ?? null,
    lastAttemptedSyncAt: (row.last_attempted_sync_at as string | null) ?? null,
    consecutiveFailures: Number(row.consecutive_failures ?? 0),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}

export async function ensureSyncRegistry(
  supabase: AuthClient | null,
  connectionId: string,
  organizationId: string
): Promise<GoogleSyncRegistry> {
  const existing = await getSyncRegistry(supabase, connectionId);
  if (existing) return existing;

  const now = new Date();
  const registry: GoogleSyncRegistry = {
    connectionId,
    organizationId,
    provider: "google_workspace",
    enabled: true,
    incrementalCron: DEFAULT_INCREMENTAL_CRON,
    fullCron: DEFAULT_FULL_CRON,
    nextIncrementalAt: computeNextSyncAt(DEFAULT_INCREMENTAL_CRON, now)?.toISOString() ?? null,
    nextFullAt: computeNextSyncAt(DEFAULT_FULL_CRON, now)?.toISOString() ?? null,
    lastSuccessfulSyncAt: null,
    lastAttemptedSyncAt: null,
    consecutiveFailures: 0,
    updatedAt: now.toISOString(),
  };

  memoryGoogleSyncRegistry.schedules.set(connectionId, registry);

  if (supabase) {
    await supabase.from("integration_sync_registry").upsert({
      connection_id: connectionId,
      organization_id: organizationId,
      provider: "google_workspace",
      enabled: true,
      incremental_cron: registry.incrementalCron,
      full_cron: registry.fullCron,
      next_incremental_at: registry.nextIncrementalAt,
      next_full_at: registry.nextFullAt,
      updated_at: registry.updatedAt,
    });
  }

  return registry;
}

export async function getSyncRegistry(
  supabase: AuthClient | null,
  connectionId: string
): Promise<GoogleSyncRegistry | null> {
  if (supabase) {
    const { data, error } = await supabase
      .from("integration_sync_registry")
      .select("*")
      .eq("connection_id", connectionId)
      .maybeSingle();
    if (!error && data) return mapRow(data as Record<string, unknown>);
  }
  return memoryGoogleSyncRegistry.schedules.get(connectionId) ?? null;
}

export async function touchSyncRegistryAfterRun(
  supabase: AuthClient | null,
  registry: GoogleSyncRegistry,
  input: {
    succeeded: boolean;
    mode: string;
  }
): Promise<GoogleSyncRegistry> {
  const now = new Date();
  const next: GoogleSyncRegistry = {
    ...registry,
    lastAttemptedSyncAt: now.toISOString(),
    lastSuccessfulSyncAt: input.succeeded
      ? now.toISOString()
      : registry.lastSuccessfulSyncAt,
    consecutiveFailures: input.succeeded ? 0 : registry.consecutiveFailures + 1,
    nextIncrementalAt:
      computeNextSyncAt(registry.incrementalCron, now)?.toISOString() ?? null,
    nextFullAt:
      input.mode === "full" || input.mode === "manual"
        ? computeNextSyncAt(registry.fullCron, now)?.toISOString() ?? registry.nextFullAt
        : registry.nextFullAt ??
          computeNextSyncAt(registry.fullCron, now)?.toISOString() ??
          null,
    updatedAt: now.toISOString(),
  };

  // On failure, schedule a short retry window (15 min) for incremental.
  if (!input.succeeded) {
    next.nextIncrementalAt = new Date(now.getTime() + 15 * 60_000).toISOString();
  }

  memoryGoogleSyncRegistry.schedules.set(registry.connectionId, next);

  if (supabase) {
    await supabase
      .from("integration_sync_registry")
      .update({
        last_attempted_sync_at: next.lastAttemptedSyncAt,
        last_successful_sync_at: next.lastSuccessfulSyncAt,
        consecutive_failures: next.consecutiveFailures,
        next_incremental_at: next.nextIncrementalAt,
        next_full_at: next.nextFullAt,
        updated_at: next.updatedAt,
      })
      .eq("connection_id", registry.connectionId);
  }

  return next;
}

export async function listDueGoogleWorkspaceSyncs(
  supabase: AuthClient | null,
  now = new Date()
): Promise<Array<{ registry: GoogleSyncRegistry; mode: "incremental" | "full" }>> {
  const due: Array<{ registry: GoogleSyncRegistry; mode: "incremental" | "full" }> = [];
  const iso = now.toISOString();

  if (supabase) {
    const { data } = await supabase
      .from("integration_sync_registry")
      .select("*")
      .eq("enabled", true)
      .eq("provider", "google_workspace");
    for (const row of data ?? []) {
      const registry = mapRow(row as Record<string, unknown>);
      if (registry.nextFullAt && registry.nextFullAt <= iso) {
        due.push({ registry, mode: "full" });
      } else if (registry.nextIncrementalAt && registry.nextIncrementalAt <= iso) {
        due.push({ registry, mode: "incremental" });
      }
    }
    if (due.length) return due;
  }

  for (const registry of memoryGoogleSyncRegistry.schedules.values()) {
    if (!registry.enabled) continue;
    if (registry.nextFullAt && registry.nextFullAt <= iso) {
      due.push({ registry, mode: "full" });
    } else if (registry.nextIncrementalAt && registry.nextIncrementalAt <= iso) {
      due.push({ registry, mode: "incremental" });
    }
  }
  return due;
}
