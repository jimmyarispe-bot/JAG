import { beforeEach, describe, expect, it } from "vitest";
import { createMockSupabase, TEST_UUIDS } from "../../../helpers/mock-supabase";
import {
  memoryGoogleSyncRegistry,
  runGoogleWorkspaceSync,
  getGoogleWorkspaceSyncProgress,
  getGoogleWorkspaceSyncEventBus,
} from "@/lib/platform/integrations/google-workspace/sync";
import { googleWorkspaceStore } from "@/lib/platform/integrations/connectors/google-workspace/services/store";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

const CONNECTION_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ORG_ID = TEST_UUIDS.organization;

function buildSupabase() {
  const connection = {
    id: CONNECTION_ID,
    organization_id: ORG_ID,
    provider: "google_workspace",
    status: "connected",
    // Plaintext is accepted by decryptCredentialSecret (returns null → fallback).
    access_token: "demo-google-workspace-access-token",
    refresh_token: "demo-google-workspace-refresh-token",
    expires_at: new Date(Date.now() + 3_600_000).toISOString(),
    connected_by: TEST_UUIDS.user,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_sync_at: null,
    last_sync_status: null,
    last_sync_error: null,
    last_sync_duration_ms: null,
    last_sync_records: null,
    records_imported: 0,
  };

  const runs: Record<string, unknown>[] = [];
  const cursors = new Map<string, string>();
  let registry: Record<string, unknown> | null = null;

  const client = createMockSupabase(({ table, operation, filters, payload }) => {
    if (table === "integration_connections") {
      if (operation === "maybeSingle" || operation === "single") {
        return { data: { ...connection }, error: null };
      }
      if (operation === "update" && payload && !Array.isArray(payload)) {
        Object.assign(connection, payload);
        return { data: { ...connection }, error: null };
      }
      return { data: { ...connection }, error: null };
    }

    if (table === "integration_sync_runs") {
      if (
        (operation === "insert" || operation === "single") &&
        payload &&
        !Array.isArray(payload) &&
        "job_id" in payload
      ) {
        const existing = runs.find((r) => r.id === payload.id);
        const row = { ...(existing ?? {}), ...payload, id: payload.id ?? CONNECTION_ID };
        if (!existing) runs.unshift(row as Record<string, unknown>);
        else Object.assign(existing, row);
        return { data: row as Record<string, unknown>, error: null };
      }
      if (operation === "update" && payload && !Array.isArray(payload)) {
        const idx = runs.findIndex((r) => r.id === filters.id);
        if (idx >= 0) runs[idx] = { ...runs[idx], ...payload };
        return { data: runs[idx] ?? null, error: null };
      }
      if (operation === "select" || operation === "maybeSingle") {
        return { data: runs, error: null };
      }
      return { data: runs, error: null };
    }

    if (table === "integration_sync_cursors") {
      const key = `${filters.connection_id}::${filters.object_type}`;
      if (operation === "maybeSingle") {
        const cursor = cursors.get(key);
        return cursor
          ? { data: { connection_id: filters.connection_id, object_type: filters.object_type, cursor }, error: null }
          : { data: null, error: null };
      }
      if (operation === "upsert" && payload && !Array.isArray(payload)) {
        cursors.set(key, String(payload.cursor));
        return { data: payload as Record<string, unknown>, error: null };
      }
      return { data: null, error: null };
    }

    if (table === "integration_sync_registry") {
      if (operation === "maybeSingle") {
        return { data: registry, error: null };
      }
      if ((operation === "upsert" || operation === "insert") && payload && !Array.isArray(payload)) {
        registry = { ...(registry ?? {}), ...payload };
        return { data: registry, error: null };
      }
      if (operation === "update" && payload && !Array.isArray(payload)) {
        registry = { ...(registry ?? {}), ...payload, connection_id: CONNECTION_ID };
        return { data: registry, error: null };
      }
      if (operation === "select") {
        return { data: registry ? [registry] : [], error: null };
      }
      return { data: registry, error: null };
    }

    return { data: null, error: null };
  });

  return client as unknown as AuthClient;
}

describe("RC-2.02 — Google Workspace Synchronization Engine", () => {
  beforeEach(() => {
    memoryGoogleSyncRegistry.clear();
    googleWorkspaceStore.clear();
  });

  it("runs a full manual sync and stores normalized records", async () => {
    const supabase = buildSupabase();
    const result = await runGoogleWorkspaceSync(supabase, {
      organizationId: ORG_ID,
      mode: "manual",
      triggeredBy: "manual",
      forceFull: true,
      // Fixtures on purpose: this suite exercises the sync engine, not Google.
      allowDemoClient: true,
    });

    expect(result.ok).toBe(true);
    expect(result.recordsImported).toBeGreaterThan(10);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(result.nextIncrementalAt).toBeTruthy();

    const snap = googleWorkspaceStore.get(ORG_ID);
    expect(snap?.records.length).toBe(result.recordsImported);
    expect(snap?.monitoring.health).toBe("healthy");
  });

  it("publishes SYNC_STARTED and SYNC_COMPLETED events", async () => {
    const supabase = buildSupabase();
    const bus = getGoogleWorkspaceSyncEventBus();
    bus.clear();

    await runGoogleWorkspaceSync(supabase, {
      organizationId: ORG_ID,
      mode: "full",
      triggeredBy: "manual",
      // Fixtures on purpose: this suite exercises the sync engine, not Google.
      allowDemoClient: true,
    });

    const types = bus.list(100).map((e) => e.type);
    expect(types).toContain("SYNC_STARTED");
    expect(types).toContain("SYNC_COMPLETED");
  });

  it("tracks progress and schedules next sync after success", async () => {
    const supabase = buildSupabase();
    await runGoogleWorkspaceSync(supabase, {
      organizationId: ORG_ID,
      mode: "manual",
      triggeredBy: "manual",
      forceFull: true,
      // Fixtures on purpose: this suite exercises the sync engine, not Google.
      allowDemoClient: true,
    });

    const progress = await getGoogleWorkspaceSyncProgress(supabase, ORG_ID);
    expect(progress.currentStatus).toBe("succeeded");
    expect(progress.recordsImported).toBeGreaterThan(0);
    expect(progress.lastSuccessfulSyncAt).toBeTruthy();
    expect(progress.nextScheduledSyncAt).toBeTruthy();
    expect(progress.consecutiveFailures).toBe(0);
    expect(progress.errorDetails).toBeNull();
  });

  it("supports incremental sync using checkpoints", async () => {
    const supabase = buildSupabase();
    const full = await runGoogleWorkspaceSync(supabase, {
      organizationId: ORG_ID,
      mode: "full",
      triggeredBy: "manual",
      // Fixtures on purpose: this suite exercises the sync engine, not Google.
      allowDemoClient: true,
    });
    expect(full.ok).toBe(true);

    const incremental = await runGoogleWorkspaceSync(supabase, {
      organizationId: ORG_ID,
      mode: "incremental",
      triggeredBy: "scheduler",
      // Fixtures on purpose: this suite exercises the sync engine, not Google.
      allowDemoClient: true,
    });
    expect(incremental.ok).toBe(true);
    // Demo catalog is stable; incremental still succeeds with checkpoint filtering.
    expect(incremental.run.mode).toBe("incremental");
  });
});
