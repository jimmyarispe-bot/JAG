import { publishEvent } from "@/lib/platform/events/publisher/publish";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function publishPajEvent(
  supabase: AuthClient,
  input: {
    eventType: string;
    journeyId: string;
    studentId: string;
    schoolId?: string;
    organizationId?: string;
    actorUserId?: string;
    payload?: Record<string, unknown>;
  }
): Promise<void> {
  await publishEvent(
    {
      eventType: input.eventType,
      entityType: "learning_journey",
      entityId: input.journeyId,
      organizationId: input.organizationId,
      schoolId: input.schoolId,
      actorId: input.actorUserId,
      payload: {
        studentId: input.studentId,
        journeyId: input.journeyId,
        ...input.payload,
      },
    },
    { persist: { supabase }, recordAudit: true }
  );
}
