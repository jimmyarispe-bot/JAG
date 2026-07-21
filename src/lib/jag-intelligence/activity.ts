import { recordActivity } from "@/lib/platform/activity";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export type JagActivityEvent =
  | "jag.pipeline.completed"
  | "jag.insight.created"
  | "jag.insight.resolved"
  | "jag.anomaly.detected"
  | "jag.feedback.recorded"
  | "jag.context.updated";

export async function recordJagActivity(
  supabase: AuthClient,
  input: {
    eventType: JagActivityEvent;
    title: string;
    summary?: string | null;
    entityId: string;
    organizationId?: string | null;
    schoolId?: string | null;
    actorUserId?: string | null;
    payload?: Record<string, unknown>;
  }
): Promise<void> {
  if (!input.organizationId && !input.schoolId) return;
  try {
    await recordActivity(supabase, {
      eventType: input.eventType,
      moduleKey: "jag",
      entityType: "jag_insight",
      entityId: input.entityId,
      title: input.title,
      summary: input.summary ?? undefined,
      organizationId: input.organizationId ?? undefined,
      schoolId: input.schoolId ?? undefined,
      actorUserId: input.actorUserId ?? undefined,
      sourceTable: "jag_insights",
      sourceId: input.entityId,
      payload: input.payload,
    });
  } catch {
    // best-effort
  }
}
