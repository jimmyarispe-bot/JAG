import { resolveActorUserId, resolveSchoolContext } from "@/lib/platform/shared/context";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { recordCalendarActivity } from "./activity";
import { detectCalendarConflicts } from "./conflicts";
import { createMeetLink, cancelMeetLink, updateMeetLink } from "./meet";
import { DEFAULT_REMINDER_OFFSETS_MINUTES, scheduleEventReminders } from "./reminders";
import type {
  CalendarEventRow,
  CalendarEventType,
  ConflictHit,
  CreateCalendarEventInput,
} from "./types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export type CalendarMutationResult =
  | { ok: true; eventId: string; auditId: string; conflicts?: ConflictHit[] }
  | { ok: false; error: string; conflicts?: ConflictHit[] };

function mapEventTypeToEi(eventType: CalendarEventType): "meeting.scheduled" | "class.scheduled" | null {
  if (eventType === "class") return "class.scheduled";
  if (
    eventType === "meeting" ||
    eventType === "parent_conference" ||
    eventType === "iep" ||
    eventType === "staff_meeting"
  ) {
    return "meeting.scheduled";
  }
  return null;
}

export async function createCalendarEvent(
  supabase: AuthClient,
  input: CreateCalendarEventInput
): Promise<CalendarMutationResult> {
  const title = input.title.trim();
  if (!title) return { ok: false, error: "Title is required" };
  if (new Date(input.endsAt) <= new Date(input.startsAt)) {
    return { ok: false, error: "End must be after start" };
  }

  if (!input.skipConflictCheck) {
    const conflicts = await detectCalendarConflicts(supabase, input);
    if (conflicts.length) {
      if (input.schoolId || input.organizationId) {
        await recordCalendarActivity(supabase, {
          eventType: "resource.conflict",
          title: "Calendar conflict detected",
          summary: title,
          entityId: crypto.randomUUID(),
          organizationId: input.organizationId,
          schoolId: input.schoolId,
          payload: { conflicts, proposedTitle: title },
        });
      }
      return {
        ok: false,
        error: conflicts.map((c) => c.message).join("; "),
        conflicts,
      };
    }
  }

  const actorUserId = await resolveActorUserId(supabase);
  const schoolCtx = input.schoolId
    ? await resolveSchoolContext(supabase, input.schoolId)
    : null;

  let meetUrl: string | null = null;
  let meetProvider: string | null = null;
  let meetExternalId: string | null = null;

  if (input.createMeetLink) {
    const meet = await createMeetLink({
      title,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      timezone: input.timezone,
      organizationId: input.organizationId ?? schoolCtx?.organizationId,
      schoolId: input.schoolId,
    });
    meetUrl = meet.joinUrl;
    meetProvider = meet.provider;
    meetExternalId = meet.externalId;
  }

  const { data, error } = await supabase
    .from("platform_calendar_events")
    .insert({
      organization_id: input.organizationId ?? schoolCtx?.organizationId ?? null,
      school_id: input.schoolId ?? null,
      title,
      description: input.description ?? "",
      event_type: input.eventType,
      status: input.status ?? "scheduled",
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      timezone: input.timezone ?? "America/New_York",
      all_day: input.allDay ?? false,
      recurrence_rule: input.recurrenceRule ?? null,
      color: input.color ?? null,
      program: input.program ?? null,
      class_id: input.classId ?? null,
      teacher_employee_id: input.teacherEmployeeId ?? null,
      student_ids: input.studentIds ?? [],
      family_id: input.familyId ?? null,
      resource_id: input.resourceId ?? null,
      room_id: input.roomId ?? null,
      meet_url: meetUrl,
      meet_provider: meetProvider,
      meet_external_id: meetExternalId,
      created_by: actorUserId,
      updated_by: actorUserId,
      metadata: input.metadata ?? {},
    })
    .select("id, audit_id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Unable to create event" };
  }

  const eventId = data.id as string;
  const auditId = data.audit_id as string;

  // Resource reservation
  if (input.resourceId) {
    await supabase.from("platform_calendar_reservations").insert({
      resource_id: input.resourceId,
      event_id: eventId,
      school_id: input.schoolId ?? null,
      title,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      status: "reserved",
      reserved_by: actorUserId,
    });

    await recordCalendarActivity(supabase, {
      eventType: "room.reserved",
      title: "Resource reserved",
      summary: title,
      entityId: eventId,
      organizationId: input.organizationId ?? schoolCtx?.organizationId,
      schoolId: input.schoolId,
      actorUserId,
      payload: { resourceId: input.resourceId },
    });
  }

  await scheduleEventReminders(
    supabase,
    eventId,
    input.startsAt,
    input.reminderOffsets ?? [...DEFAULT_REMINDER_OFFSETS_MINUTES]
  );

  await recordCalendarActivity(supabase, {
    eventType: "calendar.created",
    title: "Calendar event created",
    summary: title,
    entityId: eventId,
    organizationId: input.organizationId ?? schoolCtx?.organizationId,
    schoolId: input.schoolId,
    studentId: input.studentIds?.[0],
    familyId: input.familyId,
    actorUserId,
    payload: { auditId, eventType: input.eventType },
  });

  const ei = mapEventTypeToEi(input.eventType);
  if (ei) {
    await recordCalendarActivity(supabase, {
      eventType: ei,
      title: ei === "class.scheduled" ? "Class scheduled" : "Meeting scheduled",
      summary: title,
      entityId: eventId,
      organizationId: input.organizationId ?? schoolCtx?.organizationId,
      schoolId: input.schoolId,
      studentId: input.studentIds?.[0],
      familyId: input.familyId,
      actorUserId,
    });
  }

  return { ok: true, eventId, auditId };
}

export async function duplicateCalendarEvent(
  supabase: AuthClient,
  eventId: string
): Promise<CalendarMutationResult> {
  const { data: existing } = await supabase
    .from("platform_calendar_events")
    .select("*")
    .eq("id", eventId)
    .maybeSingle();
  if (!existing) return { ok: false, error: "Event not found" };

  return createCalendarEvent(supabase, {
    title: `${existing.title} (Copy)`,
    description: existing.description ?? "",
    eventType: existing.event_type as CalendarEventType,
    startsAt: existing.starts_at,
    endsAt: existing.ends_at,
    timezone: existing.timezone,
    allDay: existing.all_day,
    recurrenceRule: existing.recurrence_rule,
    schoolId: existing.school_id,
    organizationId: existing.organization_id,
    program: existing.program,
    classId: existing.class_id,
    teacherEmployeeId: existing.teacher_employee_id,
    studentIds: existing.student_ids ?? [],
    familyId: existing.family_id,
    resourceId: existing.resource_id,
    roomId: existing.room_id,
    color: existing.color,
    skipConflictCheck: true,
    metadata: { ...(existing.metadata as Record<string, unknown> | null), duplicatedFrom: eventId },
  });
}

export async function updateCalendarEvent(
  supabase: AuthClient,
  eventId: string,
  patch: Partial<CreateCalendarEventInput> & {
    status?: "draft" | "scheduled" | "cancelled" | "completed";
    scope?: "single" | "series";
    occurrenceStartsAt?: string;
  }
): Promise<CalendarMutationResult> {
  const { data: existing } = await supabase
    .from("platform_calendar_events")
    .select("*")
    .eq("id", eventId)
    .maybeSingle();
  if (!existing) return { ok: false, error: "Event not found" };

  // Single occurrence edit on a series → create exception + replacement
  if (
    patch.scope === "single" &&
    existing.recurrence_rule &&
    patch.occurrenceStartsAt &&
    !existing.is_exception
  ) {
    const replacement = await createCalendarEvent(supabase, {
      title: patch.title ?? existing.title,
      description: patch.description ?? existing.description,
      eventType: (patch.eventType ?? existing.event_type) as CalendarEventType,
      startsAt: patch.startsAt ?? patch.occurrenceStartsAt,
      endsAt:
        patch.endsAt ??
        new Date(
          new Date(patch.startsAt ?? patch.occurrenceStartsAt).getTime() +
            (new Date(existing.ends_at).getTime() - new Date(existing.starts_at).getTime())
        ).toISOString(),
      timezone: patch.timezone ?? existing.timezone,
      schoolId: existing.school_id,
      organizationId: existing.organization_id,
      teacherEmployeeId: patch.teacherEmployeeId ?? existing.teacher_employee_id,
      studentIds: patch.studentIds ?? existing.student_ids,
      familyId: patch.familyId ?? existing.family_id,
      resourceId: patch.resourceId ?? existing.resource_id,
      skipConflictCheck: patch.skipConflictCheck,
      recurrenceRule: null,
      metadata: { ...(existing.metadata as object), seriesParentId: existing.id },
    });
    if (!replacement.ok) return replacement;

    await supabase.from("platform_calendar_exceptions").upsert({
      series_event_id: existing.id,
      original_starts_at: patch.occurrenceStartsAt,
      exception_type: "modified",
      replacement_event_id: replacement.eventId,
    });

    await supabase
      .from("platform_calendar_events")
      .update({
        is_exception: true,
        recurrence_parent_id: existing.id,
        exception_original_starts_at: patch.occurrenceStartsAt,
      })
      .eq("id", replacement.eventId);

    return replacement;
  }

  const proposed: CreateCalendarEventInput = {
    title: patch.title ?? existing.title,
    description: patch.description ?? existing.description,
    eventType: (patch.eventType ?? existing.event_type) as CalendarEventType,
    startsAt: patch.startsAt ?? existing.starts_at,
    endsAt: patch.endsAt ?? existing.ends_at,
    timezone: patch.timezone ?? existing.timezone,
    recurrenceRule:
      patch.recurrenceRule !== undefined ? patch.recurrenceRule : existing.recurrence_rule,
    schoolId: existing.school_id,
    organizationId: existing.organization_id,
    teacherEmployeeId:
      patch.teacherEmployeeId !== undefined
        ? patch.teacherEmployeeId
        : existing.teacher_employee_id,
    studentIds: patch.studentIds ?? existing.student_ids,
    familyId: patch.familyId !== undefined ? patch.familyId : existing.family_id,
    resourceId: patch.resourceId !== undefined ? patch.resourceId : existing.resource_id,
  };

  if (!patch.skipConflictCheck && patch.status !== "cancelled") {
    const conflicts = await detectCalendarConflicts(supabase, proposed, {
      excludeEventId: eventId,
    });
    if (conflicts.length) {
      return { ok: false, error: conflicts.map((c) => c.message).join("; "), conflicts };
    }
  }

  const actorUserId = await resolveActorUserId(supabase);
  const update: Record<string, unknown> = {
    updated_by: actorUserId,
    updated_at: new Date().toISOString(),
  };
  if (patch.title != null) update.title = patch.title;
  if (patch.description != null) update.description = patch.description;
  if (patch.eventType != null) update.event_type = patch.eventType;
  if (patch.startsAt != null) update.starts_at = patch.startsAt;
  if (patch.endsAt != null) update.ends_at = patch.endsAt;
  if (patch.timezone != null) update.timezone = patch.timezone;
  if (patch.recurrenceRule !== undefined) update.recurrence_rule = patch.recurrenceRule;
  if (patch.teacherEmployeeId !== undefined) update.teacher_employee_id = patch.teacherEmployeeId;
  if (patch.studentIds != null) update.student_ids = patch.studentIds;
  if (patch.familyId !== undefined) update.family_id = patch.familyId;
  if (patch.resourceId !== undefined) update.resource_id = patch.resourceId;
  if (patch.color !== undefined) update.color = patch.color;
  if (patch.status != null) {
    update.status = patch.status;
    if (patch.status === "cancelled") update.cancelled_at = new Date().toISOString();
  }

  if (existing.meet_external_id && (patch.startsAt || patch.endsAt || patch.title)) {
    await updateMeetLink({
      externalId: existing.meet_external_id,
      title: patch.title,
      startsAt: patch.startsAt,
      endsAt: patch.endsAt,
      organizationId: existing.organization_id,
      schoolId: existing.school_id,
    });
  }

  const { error } = await supabase
    .from("platform_calendar_events")
    .update(update)
    .eq("id", eventId);
  if (error) return { ok: false, error: error.message };

  await recordCalendarActivity(supabase, {
    eventType: patch.status === "cancelled" ? "calendar.cancelled" : "calendar.updated",
    title: patch.status === "cancelled" ? "Calendar event cancelled" : "Calendar event updated",
    summary: String(update.title ?? existing.title),
    entityId: eventId,
    organizationId: existing.organization_id,
    schoolId: existing.school_id,
    familyId: existing.family_id,
    actorUserId,
  });

  if (patch.status === "cancelled" && existing.meet_external_id) {
    await cancelMeetLink({
      externalId: existing.meet_external_id,
      organizationId: existing.organization_id,
      schoolId: existing.school_id,
    });
  }

  return { ok: true, eventId, auditId: existing.audit_id };
}

export async function cancelCalendarEvent(
  supabase: AuthClient,
  eventId: string,
  options: { scope?: "single" | "series"; occurrenceStartsAt?: string } = {}
): Promise<CalendarMutationResult> {
  if (options.scope === "single" && options.occurrenceStartsAt) {
    const { data: existing } = await supabase
      .from("platform_calendar_events")
      .select("id, recurrence_rule, organization_id, school_id, title, audit_id")
      .eq("id", eventId)
      .maybeSingle();
    if (!existing) return { ok: false, error: "Event not found" };
    if (existing.recurrence_rule) {
      await supabase.from("platform_calendar_exceptions").upsert({
        series_event_id: eventId,
        original_starts_at: options.occurrenceStartsAt,
        exception_type: "cancelled",
      });
      await recordCalendarActivity(supabase, {
        eventType: "calendar.cancelled",
        title: "Occurrence cancelled",
        summary: existing.title,
        entityId: eventId,
        organizationId: existing.organization_id,
        schoolId: existing.school_id,
        payload: { occurrenceStartsAt: options.occurrenceStartsAt },
      });
      return { ok: true, eventId, auditId: existing.audit_id };
    }
  }
  return updateCalendarEvent(supabase, eventId, { status: "cancelled", scope: "series" });
}

export async function getCalendarEvent(
  supabase: AuthClient,
  eventId: string
): Promise<CalendarEventRow | null> {
  const { data } = await supabase
    .from("platform_calendar_events")
    .select("*")
    .eq("id", eventId)
    .maybeSingle();
  return (data as CalendarEventRow | null) ?? null;
}
