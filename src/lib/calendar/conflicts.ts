import type { createAuthClient } from "@/lib/supabase/server-auth";
import { expandOccurrences, timesOverlap } from "./recurrence";
import type { ConflictHit, CreateCalendarEventInput } from "./types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

function timeToMinutes(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/**
 * Detect teacher, student, resource, and availability conflicts for a proposed event.
 */
export async function detectCalendarConflicts(
  supabase: AuthClient,
  input: CreateCalendarEventInput,
  options: { excludeEventId?: string | null } = {}
): Promise<ConflictHit[]> {
  const hits: ConflictHit[] = [];
  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(input.endsAt);
  if (!(endsAt > startsAt)) {
    return [{ kind: "teacher", message: "End time must be after start time" }];
  }

  // Expand proposed occurrence(s) in a ±90 day window for series conflict checks
  const rangeStart = new Date(startsAt);
  rangeStart.setUTCDate(rangeStart.getUTCDate() - 1);
  const rangeEnd = new Date(startsAt);
  rangeEnd.setUTCDate(rangeEnd.getUTCDate() + 90);

  const proposed = expandOccurrences({
    startsAt,
    endsAt,
    recurrenceRule: input.recurrenceRule,
    rangeStart,
    rangeEnd,
    maxOccurrences: 60,
  });

  // Load overlapping candidate events
  let query = supabase
    .from("platform_calendar_events")
    .select(
      "id, title, starts_at, ends_at, recurrence_rule, teacher_employee_id, student_ids, resource_id, status"
    )
    .neq("status", "cancelled")
    .lte("starts_at", rangeEnd.toISOString())
    .gte("ends_at", rangeStart.toISOString())
    .limit(300);

  if (input.schoolId) query = query.eq("school_id", input.schoolId);
  if (options.excludeEventId) query = query.neq("id", options.excludeEventId);

  const { data: existing } = await query;

  for (const event of existing ?? []) {
    const existingOcc = expandOccurrences({
      startsAt: event.starts_at,
      endsAt: event.ends_at,
      recurrenceRule: event.recurrence_rule,
      rangeStart,
      rangeEnd,
      maxOccurrences: 60,
    });

    for (const p of proposed) {
      for (const e of existingOcc) {
        if (!timesOverlap(p.startsAt, p.endsAt, e.startsAt, e.endsAt)) continue;

        if (
          input.teacherEmployeeId &&
          event.teacher_employee_id &&
          input.teacherEmployeeId === event.teacher_employee_id
        ) {
          hits.push({
            kind: "teacher",
            message: `Teacher conflict with "${event.title}"`,
            entityId: input.teacherEmployeeId,
            conflictingEventId: event.id,
          });
        }

        if (input.resourceId && event.resource_id && input.resourceId === event.resource_id) {
          hits.push({
            kind: "resource",
            message: `Resource conflict with "${event.title}"`,
            entityId: input.resourceId,
            conflictingEventId: event.id,
          });
        }

        const existingStudents = (event.student_ids ?? []) as string[];
        const proposedStudents = input.studentIds ?? [];
        const overlapStudents = proposedStudents.filter((id) => existingStudents.includes(id));
        for (const studentId of overlapStudents) {
          hits.push({
            kind: "student",
            message: `Student double-booked against "${event.title}"`,
            entityId: studentId,
            conflictingEventId: event.id,
          });
        }
      }
    }
  }

  // Resource reservations table
  if (input.resourceId) {
    const { data: reservations } = await supabase
      .from("platform_calendar_reservations")
      .select("id, title, starts_at, ends_at")
      .eq("resource_id", input.resourceId)
      .eq("status", "reserved")
      .lt("starts_at", endsAt.toISOString())
      .gt("ends_at", startsAt.toISOString());

    for (const r of reservations ?? []) {
      hits.push({
        kind: "resource",
        message: `Resource already reserved: ${r.title}`,
        entityId: input.resourceId,
      });
    }
  }

  // Teacher availability (blocked / PTO / outside working hours)
  if (input.teacherEmployeeId) {
    const { data: avail } = await supabase
      .from("platform_staff_availability")
      .select("*")
      .eq("employee_id", input.teacherEmployeeId);

    const day = startsAt.getUTCDay();
    const startMin = startsAt.getUTCHours() * 60 + startsAt.getUTCMinutes();
    const endMin = endsAt.getUTCHours() * 60 + endsAt.getUTCMinutes();

    for (const row of avail ?? []) {
      if (row.availability_type === "blocked" || row.availability_type === "pto" || row.availability_type === "holiday") {
        if (row.starts_at && row.ends_at) {
          if (timesOverlap(startsAt, endsAt, row.starts_at, row.ends_at)) {
            hits.push({
              kind: "availability",
              message: `Teacher unavailable (${row.availability_type})`,
              entityId: input.teacherEmployeeId,
            });
          }
        }
      }

      if (row.availability_type === "break" && row.day_of_week === day && row.start_time && row.end_time) {
        const bStart = timeToMinutes(String(row.start_time).slice(0, 5));
        const bEnd = timeToMinutes(String(row.end_time).slice(0, 5));
        if (startMin < bEnd && bStart < endMin) {
          hits.push({
            kind: "availability",
            message: "Teacher has a break during this time",
            entityId: input.teacherEmployeeId,
          });
        }
      }
    }

    const working = (avail ?? []).filter((a) => a.availability_type === "working_hours");
    if (working.length) {
      const dayWindows = working.filter(
        (w) => w.day_of_week == null || w.day_of_week === day
      );
      if (dayWindows.length) {
        const inside = dayWindows.some((w) => {
          if (!w.start_time || !w.end_time) return true;
          const wStart = timeToMinutes(String(w.start_time).slice(0, 5));
          const wEnd = timeToMinutes(String(w.end_time).slice(0, 5));
          return startMin >= wStart && endMin <= wEnd;
        });
        if (!inside) {
          hits.push({
            kind: "availability",
            message: "Outside teacher working hours",
            entityId: input.teacherEmployeeId,
          });
        }
      }
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  return hits.filter((h) => {
    const key = `${h.kind}:${h.entityId}:${h.conflictingEventId}:${h.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
