import { resolveActorUserId } from "@/lib/platform/shared/context";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { recordCalendarActivity } from "./activity";
import { timesOverlap } from "./recurrence";
import type { ResourceType } from "./types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function createResource(
  supabase: AuthClient,
  input: {
    name: string;
    resourceType: ResourceType;
    schoolId?: string | null;
    organizationId?: string | null;
    capacity?: number | null;
    location?: string | null;
  }
) {
  const name = input.name.trim();
  if (!name) return { ok: false as const, error: "Name is required" };

  const { data, error } = await supabase
    .from("platform_calendar_resources")
    .insert({
      name,
      resource_type: input.resourceType,
      school_id: input.schoolId ?? null,
      organization_id: input.organizationId ?? null,
      capacity: input.capacity ?? null,
      location: input.location ?? null,
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false as const, error: error?.message ?? "Unable to create resource" };
  return { ok: true as const, resourceId: data.id as string };
}

export async function reserveResource(
  supabase: AuthClient,
  input: {
    resourceId: string;
    title: string;
    startsAt: string;
    endsAt: string;
    schoolId?: string | null;
    eventId?: string | null;
  }
) {
  const { data: conflicts } = await supabase
    .from("platform_calendar_reservations")
    .select("id, title, starts_at, ends_at")
    .eq("resource_id", input.resourceId)
    .eq("status", "reserved");

  for (const r of conflicts ?? []) {
    if (timesOverlap(input.startsAt, input.endsAt, r.starts_at, r.ends_at)) {
      await recordCalendarActivity(supabase, {
        eventType: "resource.conflict",
        title: "Resource reservation conflict",
        summary: input.title,
        entityId: input.resourceId,
        schoolId: input.schoolId,
        payload: { conflictingReservationId: r.id },
      });
      return {
        ok: false as const,
        error: `Resource conflict with "${r.title}"`,
      };
    }
  }

  const actorUserId = await resolveActorUserId(supabase);
  const { data, error } = await supabase
    .from("platform_calendar_reservations")
    .insert({
      resource_id: input.resourceId,
      event_id: input.eventId ?? null,
      school_id: input.schoolId ?? null,
      title: input.title,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      status: "reserved",
      reserved_by: actorUserId,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false as const, error: error?.message ?? "Unable to reserve resource" };
  }

  await recordCalendarActivity(supabase, {
    eventType: "room.reserved",
    title: "Resource reserved",
    summary: input.title,
    entityId: data.id as string,
    schoolId: input.schoolId,
    actorUserId,
    payload: { resourceId: input.resourceId },
  });

  return { ok: true as const, reservationId: data.id as string };
}
