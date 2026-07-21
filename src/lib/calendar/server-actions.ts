"use server";

import { revalidatePath } from "next/cache";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { getIdentityContext } from "@/lib/platform/identity/context";
import {
  canManageAdmissionsCalendar,
  canManageSchoolCalendar,
  requireCalendarEditAccess,
} from "./access";
import { upsertStaffAvailability } from "./availability";
import { processDueCalendarReminders } from "./reminders";
import { createResource, reserveResource } from "./resources";
import {
  cancelCalendarEvent,
  createCalendarEvent,
  duplicateCalendarEvent,
  updateCalendarEvent,
} from "./service";
import type { CalendarEventType, ResourceType } from "./types";

function revalidateCalendar() {
  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard/scheduling");
}

/** Normalize datetime-local or ISO strings to ISO UTC. */
function toIso(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}:00`).toISOString();
  }
  const dt = new Date(trimmed);
  return Number.isNaN(dt.getTime()) ? trimmed : dt.toISOString();
}

export async function createCalendarEventAction(formData: FormData) {
  const access = await requireCalendarEditAccess();
  if (!access.ok) return { error: access.error };
  const ctx = await getIdentityContext();
  const eventType = String(formData.get("event_type") ?? "meeting") as CalendarEventType;

  if (
    ctx &&
    !canManageSchoolCalendar(ctx) &&
    ctx.roles.includes("ADMISSIONS") &&
    !["meeting", "parent_conference", "reminder"].includes(eventType)
  ) {
    if (!canManageAdmissionsCalendar(ctx)) {
      return { error: "Admissions can only manage admissions calendar events." };
    }
  }

  const supabase = await createAuthClient();
  const studentIdsRaw = String(formData.get("student_ids") ?? "").trim();
  const studentIds = studentIdsRaw
    ? studentIdsRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const result = await createCalendarEvent(supabase, {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    eventType,
    startsAt: toIso(String(formData.get("starts_at") ?? "")),
    endsAt: toIso(String(formData.get("ends_at") ?? "")),
    timezone: String(formData.get("timezone") ?? "America/New_York"),
    recurrenceRule: String(formData.get("recurrence_rule") ?? "") || null,
    schoolId: String(formData.get("school_id") ?? "") || null,
    teacherEmployeeId: String(formData.get("teacher_employee_id") ?? "") || null,
    studentIds,
    familyId: String(formData.get("family_id") ?? "") || null,
    resourceId: String(formData.get("resource_id") ?? "") || null,
    program: String(formData.get("program") ?? "") || null,
    createMeetLink: formData.get("create_meet") === "true",
    color: String(formData.get("color") ?? "") || null,
  });

  if (!result.ok) return { error: result.error, conflicts: result.conflicts };
  revalidateCalendar();
  return result;
}

export async function updateCalendarEventAction(
  eventId: string,
  formData: FormData
) {
  const access = await requireCalendarEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();

  const startsRaw = String(formData.get("starts_at") ?? "");
  const endsRaw = String(formData.get("ends_at") ?? "");
  const result = await updateCalendarEvent(supabase, eventId, {
    title: String(formData.get("title") ?? "") || undefined,
    description: String(formData.get("description") ?? "") || undefined,
    startsAt: startsRaw ? toIso(startsRaw) : undefined,
    endsAt: endsRaw ? toIso(endsRaw) : undefined,
    recurrenceRule: formData.has("recurrence_rule")
      ? String(formData.get("recurrence_rule") ?? "") || null
      : undefined,
    scope: formData.get("scope") === "single" ? "single" : "series",
    occurrenceStartsAt: String(formData.get("occurrence_starts_at") ?? "") || undefined,
  });

  if (!result.ok) return { error: result.error, conflicts: result.conflicts };
  revalidateCalendar();
  return result;
}

export async function cancelCalendarEventAction(
  eventId: string,
  options?: { scope?: "single" | "series"; occurrenceStartsAt?: string }
) {
  const access = await requireCalendarEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const result = await cancelCalendarEvent(supabase, eventId, options);
  if (!result.ok) return { error: result.error };
  revalidateCalendar();
  return result;
}

export async function duplicateCalendarEventAction(eventId: string) {
  const access = await requireCalendarEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const result = await duplicateCalendarEvent(supabase, eventId);
  if (!result.ok) return { error: result.error };
  revalidateCalendar();
  return result;
}

export async function createResourceAction(formData: FormData) {
  const access = await requireCalendarEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const result = await createResource(supabase, {
    name: String(formData.get("name") ?? ""),
    resourceType: String(formData.get("resource_type") ?? "room") as ResourceType,
    schoolId: String(formData.get("school_id") ?? "") || null,
    capacity: Number(formData.get("capacity") ?? 0) || null,
    location: String(formData.get("location") ?? "") || null,
  });
  if (!result.ok) return { error: result.error };
  revalidateCalendar();
  return result;
}

export async function reserveResourceAction(formData: FormData) {
  const access = await requireCalendarEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const result = await reserveResource(supabase, {
    resourceId: String(formData.get("resource_id") ?? ""),
    title: String(formData.get("title") ?? "Reservation"),
    startsAt: toIso(String(formData.get("starts_at") ?? "")),
    endsAt: toIso(String(formData.get("ends_at") ?? "")),
    schoolId: String(formData.get("school_id") ?? "") || null,
  });
  if (!result.ok) return { error: result.error };
  revalidateCalendar();
  return result;
}

export async function saveAvailabilityAction(formData: FormData) {
  const access = await requireCalendarEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const result = await upsertStaffAvailability(supabase, {
    employeeId: String(formData.get("employee_id") ?? ""),
    schoolId: String(formData.get("school_id") ?? "") || null,
    availabilityType: String(formData.get("availability_type") ?? "working_hours") as
      | "working_hours"
      | "break"
      | "pto"
      | "holiday"
      | "blocked",
    dayOfWeek: formData.get("day_of_week")
      ? Number(formData.get("day_of_week"))
      : null,
    startTime: String(formData.get("start_time") ?? "") || null,
    endTime: String(formData.get("end_time") ?? "") || null,
    startsAt: (() => {
      const raw = String(formData.get("starts_at") ?? "");
      return raw ? toIso(raw) : null;
    })(),
    endsAt: (() => {
      const raw = String(formData.get("ends_at") ?? "");
      return raw ? toIso(raw) : null;
    })(),
    notes: String(formData.get("notes") ?? "") || null,
  });
  if (!result.ok) return { error: result.error };
  revalidateCalendar();
  return result;
}

export async function processCalendarRemindersAction() {
  const access = await requireCalendarEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  return processDueCalendarReminders(supabase);
}
