import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export interface LogCommunicationInput {
  studentId: string;
  schoolId?: string | null;
  channel: string;
  direction?: "inbound" | "outbound" | "internal";
  subject: string;
  body?: string;
  actorUserId?: string | null;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  metadata?: Record<string, unknown>;
  occurredAt?: string;
}

export async function logStudentCommunicationEvent(
  supabase: AuthClient,
  input: LogCommunicationInput
) {
  await supabase.from("ssis_communication_events").insert({
    student_id: input.studentId,
    school_id: input.schoolId ?? null,
    channel: input.channel,
    direction: input.direction ?? "outbound",
    subject: input.subject,
    body: input.body ?? "",
    actor_user_id: input.actorUserId ?? null,
    related_entity_type: input.relatedEntityType ?? null,
    related_entity_id: input.relatedEntityId ?? null,
    metadata: input.metadata ?? {},
    occurred_at: input.occurredAt ?? new Date().toISOString(),
  });
}

export async function getStudentCommunicationTimeline(
  supabase: AuthClient,
  studentId: string,
  options?: { query?: string; limit?: number }
) {
  const q = supabase
    .from("ssis_communication_events")
    .select("*")
    .eq("student_id", studentId)
    .order("occurred_at", { ascending: false })
    .limit(options?.limit ?? 100);

  const { data } = await q;
  let events = data ?? [];

  if (options?.query) {
    const needle = options.query.toLowerCase();
    events = events.filter(
      (e) =>
        e.subject.toLowerCase().includes(needle) ||
        (e.body as string).toLowerCase().includes(needle)
    );
  }

  return events;
}
