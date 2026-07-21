import { recordActivity } from "@/lib/platform/activity";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export type DocumentActivityEvent =
  | "document.created"
  | "document.updated"
  | "document.versioned"
  | "document.archived"
  | "document.restored"
  | "document.deleted"
  | "document.uploaded"
  | "template.used"
  | "signature.requested";

export async function recordDocumentActivity(
  supabase: AuthClient,
  input: {
    eventType: DocumentActivityEvent;
    title: string;
    summary?: string | null;
    entityId: string;
    organizationId?: string | null;
    schoolId?: string | null;
    studentId?: string | null;
    familyId?: string | null;
    actorUserId?: string | null;
    payload?: Record<string, unknown>;
  }
): Promise<void> {
  if (!input.organizationId && !input.schoolId) return;
  try {
    await recordActivity(supabase, {
      eventType: input.eventType,
      moduleKey: "platform",
      entityType: "document",
      entityId: input.entityId,
      title: input.title,
      summary: input.summary ?? undefined,
      organizationId: input.organizationId ?? undefined,
      schoolId: input.schoolId ?? undefined,
      studentId: input.studentId ?? undefined,
      familyId: input.familyId ?? undefined,
      actorUserId: input.actorUserId ?? undefined,
      sourceTable: "platform_documents",
      sourceId: input.entityId,
      payload: input.payload,
    });
  } catch {
    // best-effort
  }
}
