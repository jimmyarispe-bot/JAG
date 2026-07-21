import type { createAuthClient } from "@/lib/supabase/server-auth";
import type { AvailabilityType } from "./types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function upsertStaffAvailability(
  supabase: AuthClient,
  input: {
    employeeId: string;
    schoolId?: string | null;
    availabilityType: AvailabilityType;
    dayOfWeek?: number | null;
    startTime?: string | null;
    endTime?: string | null;
    startsAt?: string | null;
    endsAt?: string | null;
    notes?: string | null;
  }
) {
  const { data, error } = await supabase
    .from("platform_staff_availability")
    .insert({
      employee_id: input.employeeId,
      school_id: input.schoolId ?? null,
      availability_type: input.availabilityType,
      day_of_week: input.dayOfWeek ?? null,
      start_time: input.startTime ?? null,
      end_time: input.endTime ?? null,
      starts_at: input.startsAt ?? null,
      ends_at: input.endsAt ?? null,
      notes: input.notes ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false as const, error: error?.message ?? "Unable to save availability" };
  }
  return { ok: true as const, id: data.id as string };
}

/** Find open slots for a teacher on a given day (simple hourly scan). */
export async function findTeacherAvailabilitySlots(
  supabase: AuthClient,
  input: {
    employeeId: string;
    date: string; // YYYY-MM-DD
    durationMinutes: number;
    schoolId?: string | null;
  }
): Promise<Array<{ startsAt: string; endsAt: string }>> {
  const dayStart = new Date(`${input.date}T08:00:00.000Z`);
  const dayEnd = new Date(`${input.date}T18:00:00.000Z`);
  const durationMs = input.durationMinutes * 60_000;

  const { data: events } = await supabase
    .from("platform_calendar_events")
    .select("starts_at, ends_at")
    .eq("teacher_employee_id", input.employeeId)
    .neq("status", "cancelled")
    .gte("starts_at", dayStart.toISOString())
    .lte("starts_at", dayEnd.toISOString());

  const busy = (events ?? [])
    .map((e) => ({
      start: new Date(e.starts_at).getTime(),
      end: new Date(e.ends_at).getTime(),
    }))
    .sort((a, b) => a.start - b.start);

  const slots: Array<{ startsAt: string; endsAt: string }> = [];
  let cursor = dayStart.getTime();
  while (cursor + durationMs <= dayEnd.getTime()) {
    const slotEnd = cursor + durationMs;
    const overlaps = busy.some((b) => cursor < b.end && b.start < slotEnd);
    if (!overlaps) {
      slots.push({
        startsAt: new Date(cursor).toISOString(),
        endsAt: new Date(slotEnd).toISOString(),
      });
    }
    cursor += 30 * 60_000; // 30-min steps
  }
  return slots;
}
