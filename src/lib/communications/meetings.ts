import { resolveActorUserId, resolveSchoolContext } from "@/lib/platform/shared/context";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { recordCommunicationActivity } from "./activity";
import { composeCommunication } from "./service";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export type MeetingLogResult =
  | { ok: true; meetingId: string; communicationId: string }
  | { ok: false; error: string };

export async function logMeeting(
  supabase: AuthClient,
  input: {
    title: string;
    meetingType?: "parent_conference" | "iep" | "scholarship" | "staff" | "other";
    schoolId?: string | null;
    studentId?: string | null;
    familyId?: string | null;
    participants?: Array<{ name: string; role?: string }>;
    notes?: string | null;
    decisions?: string | null;
    actionItems?: Array<{ text: string; owner?: string; dueDate?: string }>;
    occurredAt?: string | null;
  }
): Promise<MeetingLogResult> {
  const title = input.title.trim();
  if (!title) return { ok: false, error: "Meeting title is required" };

  const actorUserId = await resolveActorUserId(supabase);
  const schoolCtx = input.schoolId
    ? await resolveSchoolContext(supabase, input.schoolId)
    : null;

  const bodyParts = [
    input.notes ? `Notes:\n${input.notes}` : null,
    input.decisions ? `Decisions:\n${input.decisions}` : null,
  ].filter(Boolean);

  const comm = await composeCommunication(supabase, {
    type: "meeting",
    direction: "outbound",
    subject: title,
    bodyText: bodyParts.join("\n\n"),
    schoolId: input.schoolId,
    organizationId: schoolCtx?.organizationId,
    studentId: input.studentId,
    familyId: input.familyId,
    status: "draft",
    metadata: {
      meetingType: input.meetingType ?? "parent_conference",
      participants: input.participants ?? [],
      actionItems: input.actionItems ?? [],
    },
  });

  if (!comm.ok) return { ok: false, error: comm.error };

  await supabase
    .from("platform_communications")
    .update({
      status: "sent",
      sent_at: input.occurredAt ?? new Date().toISOString(),
    })
    .eq("id", comm.communicationId);

  const { data, error } = await supabase
    .from("platform_meeting_logs")
    .insert({
      school_id: input.schoolId ?? null,
      student_id: input.studentId ?? null,
      family_id: input.familyId ?? null,
      meeting_type: input.meetingType ?? "parent_conference",
      title,
      participants: input.participants ?? [],
      notes: input.notes ?? null,
      decisions: input.decisions ?? null,
      action_items: input.actionItems ?? [],
      occurred_at: input.occurredAt ?? new Date().toISOString(),
      logged_by: actorUserId,
      communication_id: comm.communicationId,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Unable to log meeting" };
  }

  await recordCommunicationActivity(supabase, {
    eventType: "meeting.logged",
    title: "Meeting logged",
    summary: title,
    entityId: data.id as string,
    entityType: "meeting",
    organizationId: schoolCtx?.organizationId,
    schoolId: input.schoolId,
    studentId: input.studentId,
    familyId: input.familyId,
    actorUserId,
    payload: {
      communicationId: comm.communicationId,
      meetingType: input.meetingType ?? "parent_conference",
    },
  });

  return { ok: true, meetingId: data.id as string, communicationId: comm.communicationId };
}
