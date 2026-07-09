import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabase, TEST_UUIDS } from "../helpers/mock-supabase";
import "@/lib/platform/events";
import {
  clearEventAuditBuffer,
  clearEventSubscribers,
  getPlatformEventRecordByEventId,
  listPlatformEventRecords,
  loadPersistedEventAuditEntries,
  publishEvent,
  replayPersistedEvents,
  subscribeToEvents,
} from "@/lib/platform/events";

function createEventRecordMockStore() {
  const records: Record<string, unknown>[] = [];

  const supabase = createMockSupabase(({ table, operation, payload, filters }) => {
    if (table !== "platform_event_records") {
      return { data: null, error: { message: `Unknown table ${table}` } };
    }

    if (operation === "insert" || operation === "single") {
      const row = {
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
        recorded_at: new Date().toISOString(),
        ...(payload as Record<string, unknown>),
      };
      records.push(row);
      return { data: row, error: null };
    }

    if (operation === "maybeSingle") {
      const row = records.find((record) => record.event_id === filters.event_id);
      return { data: row ?? null, error: null };
    }

    let rows = [...records];
    if (filters.event_id) {
      rows = rows.filter((row) => row.event_id === filters.event_id);
    }
    if (filters.event_type) {
      rows = rows.filter((row) => row.event_type === filters.event_type);
    }
    if (filters.entity_id) {
      rows = rows.filter((row) => row.entity_id === filters.entity_id);
    }

    return { data: rows, error: null };
  });

  return { supabase, records };
}

describe("Platform event persistence", () => {
  beforeEach(() => {
    clearEventSubscribers();
    clearEventAuditBuffer();
  });

  it("persists sync publish audit entries to platform_event_records", async () => {
    const { supabase, records } = createEventRecordMockStore();
    subscribeToEvents({
      subscriberKey: "persist_sync_consumer",
      eventTypes: ["platform.entity.created"],
      handler: vi.fn(),
    });

    const result = await publishEvent(
      {
        eventType: "platform.entity.created",
        entityType: "student",
        entityId: TEST_UUIDS.student,
        organizationId: TEST_UUIDS.organization,
        schoolId: TEST_UUIDS.school,
        actorId: TEST_UUIDS.user,
        payload: { action: "create" },
      },
      { persist: { supabase } }
    );

    expect(records).toHaveLength(1);
    expect(records[0]?.event_id).toBe(result.eventId);
    expect(records[0]?.event_type).toBe("platform.entity.created");
    expect(records[0]?.organization_id).toBe(TEST_UUIDS.organization);
    expect(records[0]?.school_id).toBe(TEST_UUIDS.school);

    const loaded = await getPlatformEventRecordByEventId(supabase, result.eventId);
    expect(loaded?.event_id).toBe(result.eventId);
    expect(loaded?.envelope.eventType).toBe("platform.entity.created");
  });

  it("persists async publish audit entries after queue flush", async () => {
    const { supabase, records } = createEventRecordMockStore();
    subscribeToEvents({
      subscriberKey: "persist_async_consumer",
      eventTypes: ["platform.workflow.transitioned"],
      dispatchModes: ["async"],
      handler: vi.fn(),
    });

    await publishEvent(
      {
        eventType: "platform.workflow.transitioned",
        entityType: "workflow_instance",
        entityId: "wf_instance_1",
        organizationId: TEST_UUIDS.organization,
      },
      { persist: { supabase } }
    );

    expect(records).toHaveLength(1);
    expect(records[0]?.dispatch_mode).toBe("async");
  });

  it("lists and loads persisted audit entries", async () => {
    const { supabase } = createEventRecordMockStore();
    subscribeToEvents({
      subscriberKey: "list_consumer",
      eventTypes: ["platform.entity.updated"],
      handler: vi.fn(),
    });

    await publishEvent(
      {
        eventType: "platform.entity.updated",
        entityType: "student",
        entityId: TEST_UUIDS.student,
        organizationId: TEST_UUIDS.organization,
      },
      { persist: { supabase } }
    );

    const rows = await listPlatformEventRecords(supabase, {
      eventType: "platform.entity.updated",
    });
    expect(rows).toHaveLength(1);

    const entries = await loadPersistedEventAuditEntries(supabase, {
      entityId: TEST_UUIDS.student,
    });
    expect(entries).toHaveLength(1);
    expect(entries[0]?.eventType).toBe("platform.entity.updated");
  });

  it("replays events loaded from persistence", async () => {
    const { supabase } = createEventRecordMockStore();
    const handler = vi.fn();
    subscribeToEvents({
      subscriberKey: "replay_persist_consumer",
      eventTypes: ["platform.entity.created"],
      handler,
    });

    await publishEvent(
      {
        eventType: "platform.entity.created",
        entityType: "student",
        entityId: TEST_UUIDS.student,
        organizationId: TEST_UUIDS.organization,
      },
      { persist: { supabase } }
    );

    clearEventAuditBuffer();
    handler.mockClear();

    const batch = await replayPersistedEvents(supabase, {
      filters: { eventType: "platform.entity.created" },
    });

    expect(batch.replayedCount).toBe(1);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
