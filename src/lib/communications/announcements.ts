import { resolveActorUserId, resolveSchoolContext } from "@/lib/platform/shared/context";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { recordCommunicationActivity } from "./activity";
import { composeAndSend } from "./service";
import type { AnnouncementAudience } from "./types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export type AnnouncementResult =
  | { ok: true; announcementId: string; communicationId?: string }
  | { ok: false; error: string };

export async function createAnnouncement(
  supabase: AuthClient,
  input: {
    title: string;
    bodyText: string;
    bodyHtml?: string | null;
    schoolId?: string | null;
    organizationId?: string | null;
    targetAudience: AnnouncementAudience;
    programId?: string | null;
    classId?: string | null;
    scheduledFor?: string | null;
    publishNow?: boolean;
  }
): Promise<AnnouncementResult> {
  const title = input.title.trim();
  if (!title) return { ok: false, error: "Title is required" };

  const actorUserId = await resolveActorUserId(supabase);
  const schoolCtx = input.schoolId
    ? await resolveSchoolContext(supabase, input.schoolId)
    : null;

  const status = input.publishNow
    ? "published"
    : input.scheduledFor
      ? "scheduled"
      : "draft";

  const { data, error } = await supabase
    .from("platform_announcements")
    .insert({
      organization_id: input.organizationId ?? schoolCtx?.organizationId ?? null,
      school_id: input.schoolId ?? null,
      title,
      body_text: input.bodyText,
      body_html: input.bodyHtml ?? null,
      target_audience: input.targetAudience,
      program_id: input.programId ?? null,
      class_id: input.classId ?? null,
      status,
      scheduled_for: input.scheduledFor ?? null,
      published_at: input.publishNow ? new Date().toISOString() : null,
      created_by: actorUserId,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Unable to create announcement" };
  }

  const announcementId = data.id as string;
  let communicationId: string | undefined;

  if (input.publishNow || input.scheduledFor) {
    const comm = await composeAndSend(supabase, {
      type: "announcement",
      subject: title,
      bodyText: input.bodyText,
      bodyHtml: input.bodyHtml,
      schoolId: input.schoolId,
      organizationId: input.organizationId ?? schoolCtx?.organizationId,
      audienceScope:
        input.targetAudience === "organization"
          ? "organization"
          : input.targetAudience === "school"
            ? "school"
            : input.targetAudience === "program"
              ? "program"
              : input.targetAudience === "class"
                ? "class"
                : "custom",
      scheduledFor: input.publishNow ? null : input.scheduledFor,
      status: input.publishNow ? "queued" : "scheduled",
      metadata: { announcementId, targetAudience: input.targetAudience },
      recipients: [
        {
          recipientType:
            input.targetAudience === "parents"
              ? "family"
              : input.targetAudience === "students"
                ? "student"
                : input.targetAudience === "staff"
                  ? "employee"
                  : "school",
          displayName: `${input.targetAudience} audience`,
        },
      ],
    });

    if (comm.ok) {
      communicationId = comm.communicationId;
      await supabase
        .from("platform_announcements")
        .update({ communication_id: communicationId })
        .eq("id", announcementId);
    }
  }

  if (status === "published") {
    await recordCommunicationActivity(supabase, {
      eventType: "announcement.published",
      title: "Announcement published",
      summary: title,
      entityId: announcementId,
      entityType: "announcement",
      organizationId: input.organizationId ?? schoolCtx?.organizationId,
      schoolId: input.schoolId,
      actorUserId,
      payload: { targetAudience: input.targetAudience, communicationId },
    });
  }

  return { ok: true, announcementId, communicationId };
}

export async function listAnnouncements(
  supabase: AuthClient,
  options: { schoolId?: string | null; limit?: number } = {}
) {
  let q = supabase
    .from("platform_announcements")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(options.limit ?? 50);

  if (options.schoolId) q = q.eq("school_id", options.schoolId);

  const { data } = await q;
  return data ?? [];
}

export async function archiveAnnouncement(
  supabase: AuthClient,
  announcementId: string
): Promise<AnnouncementResult> {
  const { data: row } = await supabase
    .from("platform_announcements")
    .select("*")
    .eq("id", announcementId)
    .maybeSingle();
  if (!row) return { ok: false, error: "Announcement not found" };

  const actorUserId = await resolveActorUserId(supabase);
  const { error } = await supabase
    .from("platform_announcements")
    .update({ status: "archived" })
    .eq("id", announcementId);
  if (error) return { ok: false, error: error.message };

  await recordCommunicationActivity(supabase, {
    eventType: "announcement.archived",
    title: "Announcement archived",
    summary: row.title,
    entityId: announcementId,
    entityType: "announcement",
    organizationId: row.organization_id,
    schoolId: row.school_id,
    actorUserId,
  });
  return { ok: true, announcementId };
}

export async function duplicateAnnouncement(
  supabase: AuthClient,
  announcementId: string
): Promise<AnnouncementResult> {
  const { data: row } = await supabase
    .from("platform_announcements")
    .select("*")
    .eq("id", announcementId)
    .maybeSingle();
  if (!row) return { ok: false, error: "Announcement not found" };

  const result = await createAnnouncement(supabase, {
    title: `${row.title} (Copy)`,
    bodyText: row.body_text ?? "",
    bodyHtml: row.body_html,
    schoolId: row.school_id,
    organizationId: row.organization_id,
    targetAudience: row.target_audience,
    programId: row.program_id,
    classId: row.class_id,
    publishNow: false,
  });

  if (result.ok) {
    await recordCommunicationActivity(supabase, {
      eventType: "announcement.duplicated",
      title: "Announcement duplicated",
      summary: row.title,
      entityId: result.announcementId,
      entityType: "announcement",
      organizationId: row.organization_id,
      schoolId: row.school_id,
      payload: { sourceId: announcementId },
    });
  }
  return result;
}
