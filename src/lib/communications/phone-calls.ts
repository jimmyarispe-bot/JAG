import { resolveActorUserId, resolveSchoolContext } from "@/lib/platform/shared/context";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { recordCommunicationActivity } from "./activity";
import { composeCommunication } from "./service";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export type PhoneCallResult =
  | { ok: true; callId: string; communicationId: string }
  | { ok: false; error: string };

export async function logPhoneCall(
  supabase: AuthClient,
  input: {
    direction: "inbound" | "outbound";
    schoolId?: string | null;
    studentId?: string | null;
    familyId?: string | null;
    durationSeconds?: number | null;
    notes?: string | null;
    followUpRequired?: boolean;
    outcome?: string | null;
    occurredAt?: string | null;
  }
): Promise<PhoneCallResult> {
  const actorUserId = await resolveActorUserId(supabase);
  const schoolCtx = input.schoolId
    ? await resolveSchoolContext(supabase, input.schoolId)
    : null;

  const subject = `${input.direction === "inbound" ? "Incoming" : "Outgoing"} phone call`;
  const comm = await composeCommunication(supabase, {
    type: "call",
    direction: input.direction,
    subject,
    bodyText: input.notes ?? "",
    schoolId: input.schoolId,
    organizationId: schoolCtx?.organizationId,
    studentId: input.studentId,
    familyId: input.familyId,
    status: "draft",
    metadata: {
      durationSeconds: input.durationSeconds ?? null,
      outcome: input.outcome ?? null,
      followUpRequired: input.followUpRequired ?? false,
    },
  });

  if (!comm.ok) return { ok: false, error: comm.error };

  // Calls are logged (not externally "sent")
  await supabase
    .from("platform_communications")
    .update({
      status: "sent",
      sent_at: input.occurredAt ?? new Date().toISOString(),
    })
    .eq("id", comm.communicationId);

  const { data, error } = await supabase
    .from("platform_phone_call_logs")
    .insert({
      school_id: input.schoolId ?? null,
      student_id: input.studentId ?? null,
      family_id: input.familyId ?? null,
      direction: input.direction,
      duration_seconds: input.durationSeconds ?? null,
      notes: input.notes ?? null,
      follow_up_required: input.followUpRequired ?? false,
      outcome: input.outcome ?? null,
      occurred_at: input.occurredAt ?? new Date().toISOString(),
      logged_by: actorUserId,
      communication_id: comm.communicationId,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Unable to log phone call" };
  }

  await recordCommunicationActivity(supabase, {
    eventType: "phonecall.logged",
    title: subject,
    summary: input.outcome ?? input.notes,
    entityId: data.id as string,
    entityType: "phone_call",
    organizationId: schoolCtx?.organizationId,
    schoolId: input.schoolId,
    studentId: input.studentId,
    familyId: input.familyId,
    actorUserId,
    payload: { communicationId: comm.communicationId, direction: input.direction },
  });

  return { ok: true, callId: data.id as string, communicationId: comm.communicationId };
}
