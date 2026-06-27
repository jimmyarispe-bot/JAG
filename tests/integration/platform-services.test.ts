import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/platform/identity/permissions", () => ({
  userHasPermission: vi.fn(),
}));

import { userHasPermission } from "@/lib/platform/identity/permissions";
import { validateRecordActivityInput } from "@/lib/platform/activity/validate";
import { recordActivity } from "@/lib/platform/activity/record";
import { createMockSupabase, TEST_UUIDS } from "../helpers/mock-supabase";

describe("Activity Engine", () => {
  it("rejects invalid activity input", () => {
    const result = validateRecordActivityInput({
      eventType: "unknown.event",
      entityType: "student",
      entityId: TEST_UUIDS.student,
      title: "Test",
      organizationId: TEST_UUIDS.organization,
    });
    expect(result.ok).toBe(false);
  });

  it("accepts valid catalog event types", () => {
    const result = validateRecordActivityInput({
      eventType: "note.created",
      entityType: "student",
      entityId: TEST_UUIDS.student,
      title: "Note created",
      organizationId: TEST_UUIDS.organization,
      schoolId: TEST_UUIDS.school,
    });
    expect(result.ok).toBe(true);
  });

  it("creates activity events and dual-writes timeline rows", async () => {
    const calls: string[] = [];
    const supabase = createMockSupabase(({ table, operation }) => {
      calls.push(`${table}:${operation}`);
      if (table === "platform_activity_events") {
        return { data: { id: TEST_UUIDS.activity }, error: null };
      }
      return { data: null, error: null };
    });

    const result = await recordActivity(supabase as never, {
      eventType: "note.created",
      entityType: "student",
      entityId: TEST_UUIDS.student,
      title: "Note created",
      organizationId: TEST_UUIDS.organization,
      schoolId: TEST_UUIDS.school,
    });

    expect(result.id).toBe(TEST_UUIDS.activity);
    expect(calls).toContain("platform_activity_events:single");
    expect(calls).toContain("platform_timeline_events:insert");
  });
});

describe("Relationship Engine", () => {
  it("creates relationships and records audit activity", async () => {
    const { createRelationship } = await import("@/lib/platform/relationships/actions");
    const calls: string[] = [];

    const supabase = createMockSupabase(({ table, operation }) => {
      calls.push(`${table}:${operation}`);
      if (table === "platform_relationships" && operation === "single") {
        return { data: { id: TEST_UUIDS.relationship }, error: null };
      }
      if (table === "platform_activity_events") {
        return { data: { id: TEST_UUIDS.activity }, error: null };
      }
      return { data: null, error: null };
    });

    const result = await createRelationship(supabase as never, {
      organizationId: TEST_UUIDS.organization,
      schoolId: TEST_UUIDS.school,
      relationshipType: "student.teacher",
      fromEntityType: "student",
      fromEntityId: TEST_UUIDS.student,
      toEntityType: "employee",
      toEntityId: TEST_UUIDS.employee,
      studentId: TEST_UUIDS.student,
    });

    expect(result.id).toBe(TEST_UUIDS.relationship);
    expect(calls.some((call) => call.startsWith("platform_activity_events"))).toBe(true);
  });

  it("prevents duplicate active relationships via upsert", async () => {
    const { upsertActiveRelationship } = await import("@/lib/platform/relationships/actions");
    let insertCount = 0;

    const supabase = createMockSupabase(({ table, operation, filters }) => {
      if (table === "platform_relationships" && operation === "maybeSingle") {
        if (filters.status === "active") {
          return {
            data: {
              id: TEST_UUIDS.relationship,
              is_primary: false,
              effective_date: null,
              end_date: null,
              source: "manual",
              notes: null,
              metadata: {},
              school_id: TEST_UUIDS.school,
            },
            error: null,
          };
        }
      }
      if (table === "platform_relationships" && operation === "single") {
        insertCount += 1;
        return { data: { id: "new-relationship" }, error: null };
      }
      if (table === "platform_activity_events") {
        return { data: { id: TEST_UUIDS.activity }, error: null };
      }
      return { data: null, error: null };
    });

    const result = await upsertActiveRelationship(supabase as never, {
      organizationId: TEST_UUIDS.organization,
      relationshipType: "student.teacher",
      fromEntityType: "student",
      fromEntityId: TEST_UUIDS.student,
      toEntityType: "employee",
      toEntityId: TEST_UUIDS.employee,
      isPrimary: true,
    });

    expect(result.created).toBe(false);
    expect(result.id).toBe(TEST_UUIDS.relationship);
    expect(insertCount).toBe(0);
  });

  it("ends inactive relationships without duplicate end events", async () => {
    const { endRelationship } = await import("@/lib/platform/relationships/actions");

    const supabase = createMockSupabase(({ table, operation, filters }) => {
      if (table === "platform_relationships" && operation === "maybeSingle") {
        if (filters.id === TEST_UUIDS.relationship) {
          return {
            data: {
              id: TEST_UUIDS.relationship,
              status: "ended",
              from_entity_type: "student",
              from_entity_id: TEST_UUIDS.student,
              to_entity_type: "employee",
              to_entity_id: TEST_UUIDS.employee,
              relationship_type: "student.teacher",
              organization_id: TEST_UUIDS.organization,
              school_id: TEST_UUIDS.school,
              notes: null,
            },
            error: null,
          };
        }
      }
      return { data: null, error: null };
    });

    const result = await endRelationship(supabase as never, TEST_UUIDS.relationship);
    expect(result.error).toBeUndefined();
  });
});

describe("Tag Engine", () => {
  beforeEach(() => {
    vi.mocked(userHasPermission).mockReset();
  });

  it("denies tag creation without permissions", async () => {
    vi.mocked(userHasPermission).mockResolvedValue(false);

    const { createTag } = await import("@/lib/platform/tags/actions");
    const supabase = createMockSupabase(() => ({ data: null, error: null }));

    const result = await createTag(supabase as never, {
      organizationId: TEST_UUIDS.organization,
      slug: "watch-list",
      label: "Watch List",
    });

    expect(result.error).toBe("Forbidden");
  });

  it("applies tags with upsert duplicate prevention", async () => {
    vi.mocked(userHasPermission).mockResolvedValue(true);

    const { applyTags } = await import("@/lib/platform/tags/actions");
    let upsertCalled = false;

    const supabase = createMockSupabase(({ table, operation }) => {
      if (table === "platform_tags") {
        return { data: [{ id: TEST_UUIDS.tag }], error: null };
      }
      if (table === "platform_entity_tags" && operation === "upsert") {
        upsertCalled = true;
        return { data: [{ id: "entity-tag-1" }], error: null };
      }
      if (table === "platform_activity_events") {
        return { data: { id: TEST_UUIDS.activity }, error: null };
      }
      return { data: null, error: null };
    });

    const result = await applyTags(supabase as never, {
      organizationId: TEST_UUIDS.organization,
      entityType: "student",
      entityId: TEST_UUIDS.student,
      tagIds: [TEST_UUIDS.tag],
      appliedBy: TEST_UUIDS.user,
    });

    expect(result.applied).toBe(1);
    expect(upsertCalled).toBe(true);
  });
});

describe("Notes Engine", () => {
  it("deduplicates mentioned user IDs", async () => {
    const { normalizeMentionedUserIds } = await import("@/lib/platform/notes/visibility");
    expect(normalizeMentionedUserIds(["a", "a", "b", ""])).toEqual(["a", "b"]);
  });

  it("creates notes and records audit activity", async () => {
    const { createNote } = await import("@/lib/platform/notes/actions");
    const calls: string[] = [];

    const supabase = createMockSupabase(({ table, operation }) => {
      calls.push(`${table}:${operation}`);
      if (table === "platform_notes" && operation === "single") {
        return { data: { id: TEST_UUIDS.note }, error: null };
      }
      if (table === "platform_activity_events") {
        return { data: { id: TEST_UUIDS.activity }, error: null };
      }
      return { data: null, error: null };
    });

    const result = await createNote(supabase as never, {
      organizationId: TEST_UUIDS.organization,
      schoolId: TEST_UUIDS.school,
      entityType: "student",
      entityId: TEST_UUIDS.student,
      body: "Student follow-up required",
      authorUserId: TEST_UUIDS.user,
      mentionedUserIds: ["user-a", "user-a"],
    });

    expect(result.id).toBe(TEST_UUIDS.note);
    expect(calls.some((call) => call.startsWith("platform_activity_events"))).toBe(true);
  });

  it("updates and soft-deletes notes", async () => {
    const { updateNote, deleteNote } = await import("@/lib/platform/notes/actions");

    const supabase = createMockSupabase(({ table, operation, filters }) => {
      if (table === "platform_notes" && operation === "maybeSingle") {
        if (filters.id === TEST_UUIDS.note) {
          return {
            data: {
              id: TEST_UUIDS.note,
              entity_type: "student",
              entity_id: TEST_UUIDS.student,
              organization_id: TEST_UUIDS.organization,
              school_id: TEST_UUIDS.school,
              student_id: TEST_UUIDS.student,
              family_id: null,
              visibility: "staff",
              mentioned_user_ids: [],
              is_pinned: false,
            },
            error: null,
          };
        }
      }
      if (table === "platform_activity_events") {
        return { data: { id: TEST_UUIDS.activity }, error: null };
      }
      return { data: null, error: null };
    });

    const updateResult = await updateNote(
      supabase as never,
      TEST_UUIDS.note,
      { body: "Updated note body" },
      TEST_UUIDS.user
    );
    const deleteResult = await deleteNote(supabase as never, TEST_UUIDS.note, TEST_UUIDS.user);

    expect(updateResult.error).toBeUndefined();
    expect(deleteResult.error).toBeUndefined();
  });
});
