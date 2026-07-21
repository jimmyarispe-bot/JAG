import { beforeEach, describe, expect, it } from "vitest";
import { createMockSupabase, TEST_UUIDS } from "../../../helpers/mock-supabase";
import {
  memoryMicrosoftSyncRegistry,
  runMicrosoft365Sync,
  getMicrosoft365SyncProgress,
  getMicrosoft365SyncEventBus,
} from "@/lib/platform/integrations/microsoft-365/sync";
import { microsoft365Store } from "@/lib/platform/integrations/connectors/microsoft-365/services/store";
import { buildMicrosoft365EccWidgets } from "@/lib/platform/integrations/connectors/microsoft-365/services/ecc-widgets";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

const CONNECTION_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const ORG_ID = TEST_UUIDS.organization;

function buildSupabase() {
  const connection = {
    id: CONNECTION_ID,
    organization_id: ORG_ID,
    provider: "microsoft_365",
    status: "connected",
    access_token: "demo-microsoft-365-access-token",
    refresh_token: "demo-microsoft-365-refresh-token",
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
          ? {
              data: {
                connection_id: filters.connection_id,
                object_type: filters.object_type,
                cursor,
              },
              error: null,
            }
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

describe("RC-3.01 — Microsoft 365 Synchronization Engine", () => {
  beforeEach(() => {
    memoryMicrosoftSyncRegistry.clear();
    microsoft365Store.clear();
  });

  it("runs a full manual sync and stores normalized canonical records", async () => {
    const supabase = buildSupabase();
    const result = await runMicrosoft365Sync(supabase, {
      organizationId: ORG_ID,
      mode: "manual",
      triggeredBy: "manual",
      forceFull: true,
    });

    expect(result.ok).toBe(true);
    expect(result.recordsImported).toBeGreaterThan(10);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(result.nextIncrementalAt).toBeTruthy();

    const snap = microsoft365Store.get(ORG_ID);
    expect(snap?.records.length).toBe(result.recordsImported);
    expect(snap?.monitoring.health).toBe("healthy");
    // No Microsoft-specific sourceSystem leak into attributes.kind consumers
    expect(
      snap?.records.every((r) => r.sourceSystem === "microsoft-365")
    ).toBe(true);
  });

  it("publishes SYNC_STARTED and SYNC_COMPLETED events", async () => {
    const supabase = buildSupabase();
    const bus = getMicrosoft365SyncEventBus();
    bus.clear();

    await runMicrosoft365Sync(supabase, {
      organizationId: ORG_ID,
      mode: "full",
      triggeredBy: "manual",
    });

    const types = bus.list(100).map((e) => e.type);
    expect(types).toContain("SYNC_STARTED");
    expect(types).toContain("SYNC_COMPLETED");
  });

  it("tracks progress and schedules next sync after success", async () => {
    const supabase = buildSupabase();
    await runMicrosoft365Sync(supabase, {
      organizationId: ORG_ID,
      mode: "manual",
      triggeredBy: "manual",
      forceFull: true,
    });

    const progress = await getMicrosoft365SyncProgress(supabase, ORG_ID);
    expect(progress.currentStatus).toBe("succeeded");
    expect(progress.recordsImported).toBeGreaterThan(0);
    expect(progress.lastSuccessfulSyncAt).toBeTruthy();
    expect(progress.nextScheduledSyncAt).toBeTruthy();
    expect(progress.consecutiveFailures).toBe(0);
    expect(progress.errorDetails).toBeNull();
  });

  it("supports incremental sync using checkpoints", async () => {
    const supabase = buildSupabase();
    const full = await runMicrosoft365Sync(supabase, {
      organizationId: ORG_ID,
      mode: "full",
      triggeredBy: "manual",
    });
    expect(full.ok).toBe(true);

    const incremental = await runMicrosoft365Sync(supabase, {
      organizationId: ORG_ID,
      mode: "incremental",
      triggeredBy: "scheduler",
    });
    expect(incremental.ok).toBe(true);
    expect(incremental.run.mode).toBe("incremental");
  });

  it("builds Communication / Meetings / Documents ECC widgets from sync store", async () => {
    const supabase = buildSupabase();
    await runMicrosoft365Sync(supabase, {
      organizationId: ORG_ID,
      mode: "full",
      triggeredBy: "manual",
    });

    const widgets = buildMicrosoft365EccWidgets(ORG_ID);
    expect(widgets).toBeTruthy();
    expect(widgets!.communication.kind).toBe("communication_pulse");
    expect(widgets!.meetings.kind).toBe("recent_meetings");
    expect(widgets!.documents.kind).toBe("shared_documents");
    expect(widgets!.communication.messages).toBeGreaterThan(0);
    expect(widgets!.documents.documents.length).toBeGreaterThan(0);
  });
});
