import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabase, TEST_UUIDS } from "../../helpers/mock-supabase";
import type { IdentityContext } from "@/lib/platform/identity/context";

vi.mock("@/lib/platform/shared/context", () => ({
  resolveActorUserId: vi.fn(async () => TEST_UUIDS.user),
  resolveSchoolContext: vi.fn(async () => ({
    organizationId: TEST_UUIDS.organization,
    schoolId: TEST_UUIDS.school,
  })),
}));

vi.mock("@/lib/platform/activity", () => ({
  recordActivity: vi.fn(async () => ({ id: TEST_UUIDS.activity })),
}));

import { recordActivity } from "@/lib/platform/activity";
import {
  canEditCalendar,
  canManageAdmissionsCalendar,
  canManageSchoolCalendar,
  canViewCalendar,
} from "@/lib/calendar/access";
import { expandOccurrences, timesOverlap } from "@/lib/calendar/recurrence";
import { detectCalendarConflicts } from "@/lib/calendar/conflicts";
import { createCalendarEvent, cancelCalendarEvent } from "@/lib/calendar/service";
import { DEFAULT_REMINDER_OFFSETS_MINUTES, scheduleEventReminders } from "@/lib/calendar/reminders";
import {
  createMeetLink,
  ensureGoogleMeetExtensionRegistered,
} from "@/lib/calendar/meet";
import { getExtension } from "@/lib/workflows/extension";
import { ACTIVITY_EVENT_CATALOG } from "@/lib/platform/activity/catalog";
import { WORKFLOW_ACTION_LIBRARY } from "@/lib/workflows/actions";

const EVENT_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

/**
 * Reminder scheduling drops offsets whose remind_at has already passed, so this
 * fixture has to stay in the future. It was hard-coded to 2026-07-22 and quietly
 * stopped exercising the upsert path the day that date elapsed - the test kept
 * asserting on an empty array. Keep it relative to the run.
 */
const FUTURE_START = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
const FUTURE_END = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3_600_000).toISOString();
const TEACHER_ID = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const STUDENT_ID = "ffffffff-ffff-4fff-8fff-ffffffffffff";
const RESOURCE_ID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

function identityWithRoles(roles: string[], permissions: string[] = []): IdentityContext {
  return {
    id: TEST_UUIDS.user,
    email: "test@example.com",
    fullName: "Test User",
    roles: roles as IdentityContext["roles"],
    primaryRole: roles[0] as IdentityContext["primaryRole"],
    roleLabel: roles[0] ?? "User",
    effectiveUserId: TEST_UUIDS.user,
    permissions: permissions as IdentityContext["permissions"],
    orgAssignments: [],
    accessibleSchoolIds: [TEST_UUIDS.school],
    hasUnrestrictedSchoolAccess: roles.includes("CEO") || roles.includes("FOUNDER"),
    isFounder: roles.includes("FOUNDER"),
    isEnterpriseAdmin: false,
    impersonation: null,
    preferences: null,
  };
}

describe("calendar permissions", () => {
  it("gives CEO/Founder school calendar management", () => {
    expect(canManageSchoolCalendar(identityWithRoles(["CEO"]))).toBe(true);
    expect(canManageSchoolCalendar(identityWithRoles(["FOUNDER"]))).toBe(true);
    expect(canManageSchoolCalendar(identityWithRoles(["SCHOOL_LEADER"]))).toBe(true);
    expect(canManageSchoolCalendar(identityWithRoles(["TEACHER"]))).toBe(false);
  });

  it("allows teachers and admissions to edit; parents to view", () => {
    expect(canEditCalendar(identityWithRoles(["TEACHER"]))).toBe(true);
    expect(canEditCalendar(identityWithRoles(["ADMISSIONS"]))).toBe(true);
    expect(canEditCalendar(identityWithRoles(["PARENT"]))).toBe(false);
    expect(canViewCalendar(identityWithRoles(["PARENT"]))).toBe(true);
    expect(canViewCalendar(identityWithRoles(["STUDENT"]))).toBe(true);
    expect(canManageAdmissionsCalendar(identityWithRoles(["ADMISSIONS"]))).toBe(true);
  });
});

describe("recurrence engine", () => {
  it("expands daily recurrence within range", () => {
    const occ = expandOccurrences({
      startsAt: "2026-07-01T14:00:00.000Z",
      endsAt: "2026-07-01T15:00:00.000Z",
      recurrenceRule: "daily",
      rangeStart: "2026-07-01T00:00:00.000Z",
      rangeEnd: "2026-07-05T23:59:59.000Z",
    });
    expect(occ.length).toBe(5);
    expect(occ[0]!.startsAt.toISOString()).toBe("2026-07-01T14:00:00.000Z");
    expect(occ[4]!.startsAt.toISOString()).toBe("2026-07-05T14:00:00.000Z");
  });

  it("expands weekly RRULE and respects cancelled exceptions", () => {
    const occ = expandOccurrences({
      startsAt: "2026-07-06T14:00:00.000Z", // Monday
      endsAt: "2026-07-06T15:00:00.000Z",
      recurrenceRule: "FREQ=WEEKLY;INTERVAL=1;COUNT=4",
      rangeStart: "2026-07-01T00:00:00.000Z",
      rangeEnd: "2026-08-01T00:00:00.000Z",
      cancelledOriginalStarts: ["2026-07-13T14:00:00.000Z"],
    });
    expect(occ.length).toBe(3);
    expect(occ.map((o) => o.startsAt.toISOString())).not.toContain(
      "2026-07-13T14:00:00.000Z"
    );
  });

  it("detects overlapping times", () => {
    expect(
      timesOverlap(
        "2026-07-01T10:00:00.000Z",
        "2026-07-01T11:00:00.000Z",
        "2026-07-01T10:30:00.000Z",
        "2026-07-01T11:30:00.000Z"
      )
    ).toBe(true);
    expect(
      timesOverlap(
        "2026-07-01T10:00:00.000Z",
        "2026-07-01T11:00:00.000Z",
        "2026-07-01T11:00:00.000Z",
        "2026-07-01T12:00:00.000Z"
      )
    ).toBe(false);
  });
});

describe("conflict detection", () => {
  it("flags teacher, student, and resource conflicts", async () => {
    const supabase = createMockSupabase(({ table, operation }) => {
      if (table === "platform_calendar_events" && operation === "select") {
        return {
          data: [
            {
              id: EVENT_ID,
              title: "Existing class",
              starts_at: "2026-07-21T14:00:00.000Z",
              ends_at: "2026-07-21T15:00:00.000Z",
              recurrence_rule: null,
              teacher_employee_id: TEACHER_ID,
              student_ids: [STUDENT_ID],
              resource_id: RESOURCE_ID,
              status: "scheduled",
            },
          ],
          error: null,
        };
      }
      if (table === "platform_staff_availability") {
        return { data: [], error: null };
      }
      return { data: [], error: null };
    });

    const hits = await detectCalendarConflicts(supabase as never, {
      title: "New meeting",
      eventType: "meeting",
      startsAt: "2026-07-21T14:30:00.000Z",
      endsAt: "2026-07-21T15:30:00.000Z",
      schoolId: TEST_UUIDS.school,
      teacherEmployeeId: TEACHER_ID,
      studentIds: [STUDENT_ID],
      resourceId: RESOURCE_ID,
    });

    expect(hits.some((h) => h.kind === "teacher")).toBe(true);
    expect(hits.some((h) => h.kind === "student")).toBe(true);
    expect(hits.some((h) => h.kind === "resource")).toBe(true);
  });

  it("flags teacher availability blocks (PTO)", async () => {
    const supabase = createMockSupabase(({ table }) => {
      if (table === "platform_calendar_events") {
        return { data: [], error: null };
      }
      if (table === "platform_staff_availability") {
        return {
          data: [
            {
              id: "avail-1",
              employee_id: TEACHER_ID,
              availability_type: "pto",
              day_of_week: null,
              start_time: null,
              end_time: null,
              starts_at: "2026-07-21T00:00:00.000Z",
              ends_at: "2026-07-22T00:00:00.000Z",
            },
          ],
          error: null,
        };
      }
      return { data: [], error: null };
    });

    const hits = await detectCalendarConflicts(supabase as never, {
      title: "Interview",
      eventType: "meeting",
      startsAt: "2026-07-21T16:00:00.000Z",
      endsAt: "2026-07-21T17:00:00.000Z",
      teacherEmployeeId: TEACHER_ID,
      schoolId: TEST_UUIDS.school,
    });

    expect(hits.some((h) => h.kind === "availability")).toBe(true);
  });
});

describe("event lifecycle + EI events", () => {
  beforeEach(() => {
    vi.mocked(recordActivity).mockClear();
  });

  it("creates an event, schedules reminders, and records calendar.created", async () => {
    const upserts: unknown[] = [];
    const supabase = createMockSupabase(({ table, operation, payload }) => {
      if (table === "platform_calendar_events" && operation === "select") {
        return { data: [], error: null };
      }
      if (table === "platform_staff_availability") {
        return { data: [], error: null };
      }
      if (table === "platform_calendar_events" && (operation === "insert" || operation === "single")) {
        return {
          data: {
            id: EVENT_ID,
            audit_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
            title: "Staff meeting",
            event_type: "staff_meeting",
            school_id: TEST_UUIDS.school,
            organization_id: TEST_UUIDS.organization,
            family_id: null,
            student_ids: [],
            starts_at: FUTURE_START,
            ends_at: FUTURE_END,
          },
          error: null,
        };
      }
      if (table === "platform_calendar_reminders") {
        upserts.push(payload);
        return { data: payload as never, error: null };
      }
      return { data: null, error: null };
    });

    const result = await createCalendarEvent(supabase as never, {
      title: "Staff meeting",
      eventType: "staff_meeting",
      startsAt: FUTURE_START,
      endsAt: FUTURE_END,
      schoolId: TEST_UUIDS.school,
      skipConflictCheck: true,
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.eventId).toBe(EVENT_ID);
    expect(upserts.length).toBeGreaterThan(0);
    expect(recordActivity).toHaveBeenCalled();
    const types = vi.mocked(recordActivity).mock.calls.map((c) => c[1]?.eventType);
    expect(types).toContain("calendar.created");
    expect(types).toContain("meeting.scheduled");
  });

  it("cancels an event and records calendar.cancelled", async () => {
    const supabase = createMockSupabase(({ table }) => {
      if (table === "platform_calendar_events") {
        return {
          data: {
            id: EVENT_ID,
            audit_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
            title: "Staff meeting",
            event_type: "staff_meeting",
            school_id: TEST_UUIDS.school,
            organization_id: TEST_UUIDS.organization,
            family_id: null,
            student_ids: [],
            meet_external_id: null,
            meet_provider: null,
            status: "scheduled",
            starts_at: "2026-07-22T15:00:00.000Z",
            ends_at: "2026-07-22T16:00:00.000Z",
            recurrence_rule: null,
            teacher_employee_id: null,
            resource_id: null,
            description: "",
            timezone: "America/New_York",
          },
          error: null,
        };
      }
      if (table === "platform_staff_availability") {
        return { data: [], error: null };
      }
      return { data: null, error: null };
    });

    const result = await cancelCalendarEvent(supabase as never, EVENT_ID);
    expect(result.ok).toBe(true);
    const types = vi.mocked(recordActivity).mock.calls.map((c) => c[1]?.eventType);
    expect(types).toContain("calendar.cancelled");
  });
});

describe("reminders", () => {
  it("uses 24h / 1h / 15m defaults", () => {
    expect([...DEFAULT_REMINDER_OFFSETS_MINUTES]).toEqual([1440, 60, 15]);
  });

  it("upserts reminder rows for future offsets", async () => {
    const rows: unknown[] = [];
    const supabase = createMockSupabase(({ table, payload }) => {
      if (table === "platform_calendar_reminders") {
        rows.push(payload);
        return { data: payload as never, error: null };
      }
      return { data: null, error: null };
    });

    const future = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    await scheduleEventReminders(supabase as never, EVENT_ID, future);
    expect(rows.length).toBe(1);
    const payload = rows[0] as Array<{ offset_minutes: number }>;
    expect(payload.map((r) => r.offset_minutes).sort((a, b) => b - a)).toEqual([
      1440, 60, 15,
    ]);
  });
});

describe("Google Meet abstraction + workflow actions", () => {
  it("registers google_meet extension as deferred", async () => {
    ensureGoogleMeetExtensionRegistered();
    const ext = getExtension("google_meet");
    expect(ext).toBeTruthy();
    expect(ext!.isConfigured()).toBe(false);
    const link = await createMeetLink({
      title: "Interview",
      startsAt: "2026-07-22T15:00:00.000Z",
      endsAt: "2026-07-22T16:00:00.000Z",
    });
    expect(link.deferred).toBe(true);
    expect(link.joinUrl).toBeNull();
  });

  it("exposes calendar workflow actions and EI catalog keys", () => {
    const types = WORKFLOW_ACTION_LIBRARY.map((a) => a.type);
    expect(types).toContain("create_calendar_event");
    expect(types).toContain("cancel_calendar_event");
    expect(types).toContain("reschedule_calendar_event");

    for (const key of [
      "calendar.created",
      "calendar.updated",
      "calendar.cancelled",
      "meeting.scheduled",
      "class.scheduled",
      "room.reserved",
      "resource.conflict",
    ] as const) {
      expect(ACTIVITY_EVENT_CATALOG[key]).toBeTruthy();
    }
  });
});
