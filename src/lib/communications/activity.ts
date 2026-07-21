import { recordActivity } from "@/lib/platform/activity";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

type CommEventType =
  | "communication.created"
  | "communication.updated"
  | "communication.sent"
  | "communication.failed"
  | "communication.read"
  | "communication.archived"
  | "communication.restored"
  | "communication.deleted"
  | "communication.duplicated"
  | "template.created"
  | "template.updated"
  | "template.archived"
  | "template.restored"
  | "template.duplicated"
  | "template.used"
  | "announcement.created"
  | "announcement.updated"
  | "announcement.archived"
  | "announcement.duplicated"
  | "announcement.published"
  | "meeting.logged"
  | "phonecall.logged";

export async function recordCommunicationActivity(
  supabase: AuthClient,
  input: {
    eventType: CommEventType;
    title: string;
    summary?: string | null;
    entityId: string;
    entityType?: string;
    organizationId?: string | null;
    schoolId?: string | null;
    studentId?: string | null;
    familyId?: string | null;
    actorUserId?: string | null;
    payload?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    await recordActivity(supabase, {
      eventType: input.eventType,
      moduleKey: "platform",
      entityType: input.entityType ?? "communication",
      entityId: input.entityId,
      title: input.title,
      summary: input.summary ?? undefined,
      organizationId: input.organizationId ?? undefined,
      schoolId: input.schoolId ?? undefined,
      studentId: input.studentId ?? undefined,
      familyId: input.familyId ?? undefined,
      actorUserId: input.actorUserId ?? undefined,
      sourceTable: "platform_communications",
      sourceId: input.entityId,
      payload: input.payload,
    });
  } catch {
    // best-effort — never block communication writes
  }
}
