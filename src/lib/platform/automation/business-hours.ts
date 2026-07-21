import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export interface BusinessHoursCheckInput {
  schoolId: string;
  campusId?: string | null;
  scheduleType?: "business" | "school" | "support";
  timezone?: string;
  at?: Date;
}

type HoursRow = {
  day_of_week: number;
  open_time: string;
  close_time: string;
  campus_id: string | null;
};

type SchoolScheduleSnapshot = {
  holidayDates: Set<string>;
  hours: HoursRow[];
};

async function loadSchoolScheduleSnapshot(
  supabase: AuthClient,
  schoolId: string,
  rangeStart: Date,
  rangeEnd: Date,
  campusId?: string | null,
  scheduleType?: BusinessHoursCheckInput["scheduleType"]
): Promise<SchoolScheduleSnapshot> {
  const startStr = rangeStart.toISOString().split("T")[0];
  const endStr = rangeEnd.toISOString().split("T")[0];

  let hoursQuery = supabase
    .from("platform_business_hours")
    .select("day_of_week, open_time, close_time, campus_id")
    .eq("school_id", schoolId)
    .eq("is_active", true);

  if (scheduleType) hoursQuery = hoursQuery.eq("schedule_type", scheduleType);
  if (campusId) hoursQuery = hoursQuery.or(`campus_id.is.null,campus_id.eq.${campusId}`);

  const [{ data: holidays }, { data: hours }] = await Promise.all([
    supabase
      .from("platform_holidays")
      .select("holiday_date")
      .gte("holiday_date", startStr)
      .lte("holiday_date", endStr)
      .or(`school_id.is.null,school_id.eq.${schoolId}`),
    hoursQuery,
  ]);

  return {
    holidayDates: new Set((holidays ?? []).map((h) => String(h.holiday_date))),
    hours: (hours ?? []) as HoursRow[],
  };
}

function isWithinSnapshot(snapshot: SchoolScheduleSnapshot, at: Date): boolean {
  const dateStr = at.toISOString().split("T")[0];
  if (snapshot.holidayDates.has(dateStr)) return false;

  if (!snapshot.hours.length) return true;

  const dayOfWeek = at.getDay();
  const dayHours = snapshot.hours.filter((h) => h.day_of_week === dayOfWeek);
  if (!dayHours.length) return false;

  const timeStr = at.toTimeString().slice(0, 8);
  return dayHours.some((h) => timeStr >= h.open_time && timeStr <= h.close_time);
}

function nextWindowFromSnapshot(snapshot: SchoolScheduleSnapshot, at: Date): Date {
  if (isWithinSnapshot(snapshot, at)) return at;

  for (let i = 0; i < 14; i++) {
    const candidate = new Date(at.getTime() + (i + 1) * 86400000);
    candidate.setHours(9, 0, 0, 0);
    if (isWithinSnapshot(snapshot, candidate)) {
      return candidate;
    }
  }
  return new Date(at.getTime() + 86400000);
}

export async function isWithinBusinessHours(
  supabase: AuthClient,
  input: BusinessHoursCheckInput
): Promise<boolean> {
  const at = input.at ?? new Date();
  const snapshot = await loadSchoolScheduleSnapshot(
    supabase,
    input.schoolId,
    at,
    at,
    input.campusId,
    input.scheduleType
  );
  return isWithinSnapshot(snapshot, at);
}

export async function nextBusinessHoursWindow(
  supabase: AuthClient,
  input: BusinessHoursCheckInput
): Promise<Date> {
  const at = input.at ?? new Date();
  const rangeEnd = new Date(at.getTime() + 14 * 86400000);
  const snapshot = await loadSchoolScheduleSnapshot(
    supabase,
    input.schoolId,
    at,
    rangeEnd,
    input.campusId,
    input.scheduleType
  );
  return nextWindowFromSnapshot(snapshot, at);
}

export async function adjustScheduledForBusinessHours(
  supabase: AuthClient,
  schoolId: string,
  scheduledFor: Date,
  campusId?: string | null
): Promise<Date> {
  const rangeEnd = new Date(scheduledFor.getTime() + 14 * 86400000);
  const snapshot = await loadSchoolScheduleSnapshot(
    supabase,
    schoolId,
    scheduledFor,
    rangeEnd,
    campusId
  );
  if (isWithinSnapshot(snapshot, scheduledFor)) return scheduledFor;
  return nextWindowFromSnapshot(snapshot, scheduledFor);
}

/**
 * P009 — adjust many schedule times with one holiday/hours load per school.
 * Preserves the same rules as adjustScheduledForBusinessHours.
 */
export async function adjustManyScheduledForBusinessHours(
  supabase: AuthClient,
  schoolId: string,
  targets: Date[],
  campusId?: string | null
): Promise<Date[]> {
  if (!targets.length) return [];

  let min = targets[0];
  let max = targets[0];
  for (const t of targets) {
    if (t < min) min = t;
    if (t > max) max = t;
  }
  const rangeEnd = new Date(max.getTime() + 14 * 86400000);
  const snapshot = await loadSchoolScheduleSnapshot(
    supabase,
    schoolId,
    min,
    rangeEnd,
    campusId
  );

  return targets.map((target) =>
    isWithinSnapshot(snapshot, target)
      ? target
      : nextWindowFromSnapshot(snapshot, target)
  );
}
