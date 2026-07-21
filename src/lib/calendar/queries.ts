import { createAuthClient } from "@/lib/supabase/server-auth";
import { expandOccurrences } from "./recurrence";
import type {
  CalendarOccurrence,
  CalendarResourceRow,
  CalendarView,
  StaffAvailabilityRow,
} from "./types";

export interface CalendarQuery {
  schoolId?: string | null;
  teacherEmployeeId?: string | null;
  studentId?: string | null;
  familyId?: string | null;
  resourceId?: string | null;
  view?: CalendarView;
  anchorDate?: string; // YYYY-MM-DD
  from?: string;
  to?: string;
  includeInstructionalSessions?: boolean;
}

function viewRange(view: CalendarView, anchor: Date): { from: Date; to: Date } {
  const start = new Date(anchor);
  start.setUTCHours(0, 0, 0, 0);
  if (view === "day") {
    const end = new Date(start);
    end.setUTCHours(23, 59, 59, 999);
    return { from: start, to: end };
  }
  if (view === "week") {
    const day = start.getUTCDay();
    const from = new Date(start);
    from.setUTCDate(from.getUTCDate() - day);
    const to = new Date(from);
    to.setUTCDate(to.getUTCDate() + 6);
    to.setUTCHours(23, 59, 59, 999);
    return { from, to };
  }
  if (view === "month") {
    const from = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
    const to = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0, 23, 59, 59, 999));
    return { from, to };
  }
  // agenda — next 30 days
  const to = new Date(start);
  to.setUTCDate(to.getUTCDate() + 30);
  to.setUTCHours(23, 59, 59, 999);
  return { from: start, to };
}

export async function listCalendarOccurrences(
  query: CalendarQuery = {}
): Promise<CalendarOccurrence[]> {
  const supabase = await createAuthClient();
  const view = query.view ?? "week";
  const anchor = query.anchorDate ? new Date(`${query.anchorDate}T00:00:00.000Z`) : new Date();
  const range = query.from && query.to
    ? { from: new Date(query.from), to: new Date(query.to) }
    : viewRange(view, anchor);

  let request = supabase
    .from("platform_calendar_events")
    .select("*")
    .neq("status", "cancelled")
    .is("recurrence_parent_id", null)
    .lte("starts_at", range.to.toISOString())
    .or(`ends_at.gte.${range.from.toISOString()},recurrence_rule.not.is.null`)
    .order("starts_at")
    .limit(500);

  if (query.schoolId) request = request.eq("school_id", query.schoolId);
  if (query.teacherEmployeeId) {
    request = request.eq("teacher_employee_id", query.teacherEmployeeId);
  }
  if (query.familyId) request = request.eq("family_id", query.familyId);
  if (query.resourceId) request = request.eq("resource_id", query.resourceId);
  if (query.studentId) {
    request = request.contains("student_ids", [query.studentId]);
  }

  const { data: events, error } = await request;
  if (error) {
    console.error("[calendar] listCalendarOccurrences:", error.message);
    return [];
  }

  const seriesIds = (events ?? []).filter((e) => e.recurrence_rule).map((e) => e.id);
  const cancelledBySeries = new Map<string, string[]>();
  if (seriesIds.length) {
    const { data: exceptions } = await supabase
      .from("platform_calendar_exceptions")
      .select("series_event_id, original_starts_at, exception_type")
      .in("series_event_id", seriesIds)
      .eq("exception_type", "cancelled");
    for (const ex of exceptions ?? []) {
      const list = cancelledBySeries.get(ex.series_event_id) ?? [];
      list.push(ex.original_starts_at);
      cancelledBySeries.set(ex.series_event_id, list);
    }
  }

  const occurrences: CalendarOccurrence[] = [];
  for (const event of events ?? []) {
    const windows = expandOccurrences({
      startsAt: event.starts_at,
      endsAt: event.ends_at,
      recurrenceRule: event.recurrence_rule,
      rangeStart: range.from,
      rangeEnd: range.to,
      cancelledOriginalStarts: cancelledBySeries.get(event.id),
    });
    for (const w of windows) {
      occurrences.push({
        ...(event as CalendarOccurrence),
        occurrenceStartsAt: w.startsAt.toISOString(),
        occurrenceEndsAt: w.endsAt.toISOString(),
        isRecurringInstance: Boolean(event.recurrence_rule),
      });
    }
  }

  // Optionally merge instructional sessions (existing SIS scheduling)
  if (query.includeInstructionalSessions !== false && query.schoolId) {
    const { data: sessions } = await supabase
      .from("instructional_sessions")
      .select(
        "id, scheduled_start, scheduled_end, instructor_employee_id, room_id, meet_link, course_sections(section_code, courses(name, school_id))"
      )
      .gte("scheduled_start", range.from.toISOString())
      .lte("scheduled_start", range.to.toISOString())
      .eq("session_status", "scheduled")
      .limit(200);

    for (const s of sessions ?? []) {
      const cs = Array.isArray(s.course_sections) ? s.course_sections[0] : s.course_sections;
      const course = cs?.courses;
      const courseObj = Array.isArray(course) ? course[0] : course;
      if (query.schoolId && courseObj?.school_id && courseObj.school_id !== query.schoolId) {
        continue;
      }
      if (
        query.teacherEmployeeId &&
        s.instructor_employee_id !== query.teacherEmployeeId
      ) {
        continue;
      }
      occurrences.push({
        id: `session:${s.id}`,
        audit_id: s.id,
        organization_id: null,
        school_id: courseObj?.school_id ?? query.schoolId ?? null,
        title: courseObj?.name ?? cs?.section_code ?? "Class session",
        description: "Instructional session",
        event_type: "class",
        status: "scheduled",
        starts_at: s.scheduled_start,
        ends_at: s.scheduled_end,
        timezone: "America/New_York",
        all_day: false,
        recurrence_rule: null,
        recurrence_parent_id: null,
        is_exception: false,
        exception_original_starts_at: null,
        color: "#0ea5e9",
        program: null,
        class_id: null,
        teacher_employee_id: s.instructor_employee_id,
        student_ids: [],
        family_id: null,
        resource_id: null,
        room_id: s.room_id,
        meet_url: s.meet_link,
        meet_provider: null,
        meet_external_id: null,
        created_by: null,
        updated_by: null,
        created_at: s.scheduled_start,
        updated_at: s.scheduled_start,
        cancelled_at: null,
        metadata: { source: "instructional_sessions" },
        occurrenceStartsAt: s.scheduled_start,
        occurrenceEndsAt: s.scheduled_end,
        isRecurringInstance: false,
      });
    }
  }

  occurrences.sort((a, b) =>
    a.occurrenceStartsAt.localeCompare(b.occurrenceStartsAt)
  );
  return occurrences;
}

export async function getStudentSchedule(
  studentId: string,
  from: string,
  to: string
) {
  return listCalendarOccurrences({
    studentId,
    from,
    to,
    view: "agenda",
    includeInstructionalSessions: true,
  });
}

export async function getFamilyCalendar(
  familyId: string,
  from: string,
  to: string
) {
  const supabase = await createAuthClient();
  const { data: students } = await supabase
    .from("students")
    .select("id, school_id")
    .eq("family_id", familyId)
    .neq("status", "archived");

  const schoolId = students?.[0]?.school_id ?? null;
  const familyEvents = await listCalendarOccurrences({
    familyId,
    schoolId,
    from,
    to,
    view: "agenda",
    includeInstructionalSessions: false,
  });

  const studentEvents: CalendarOccurrence[] = [];
  for (const s of students ?? []) {
    const rows = await listCalendarOccurrences({
      studentId: s.id,
      schoolId: s.school_id,
      from,
      to,
      view: "agenda",
      includeInstructionalSessions: true,
    });
    studentEvents.push(...rows);
  }

  const byKey = new Map<string, CalendarOccurrence>();
  for (const e of [...familyEvents, ...studentEvents]) {
    byKey.set(`${e.id}:${e.occurrenceStartsAt}`, e);
  }
  return [...byKey.values()].sort((a, b) =>
    a.occurrenceStartsAt.localeCompare(b.occurrenceStartsAt)
  );
}

export async function listResources(schoolId?: string | null): Promise<CalendarResourceRow[]> {
  const supabase = await createAuthClient();
  let q = supabase
    .from("platform_calendar_resources")
    .select("id, school_id, name, resource_type, capacity, location, is_active")
    .eq("is_active", true)
    .order("name");
  if (schoolId) q = q.eq("school_id", schoolId);
  const { data } = await q;
  return (data ?? []) as CalendarResourceRow[];
}

export async function listStaffAvailability(
  employeeId: string
): Promise<StaffAvailabilityRow[]> {
  const supabase = await createAuthClient();
  const { data } = await supabase
    .from("platform_staff_availability")
    .select("*")
    .eq("employee_id", employeeId)
    .order("day_of_week");
  return (data ?? []) as StaffAvailabilityRow[];
}
