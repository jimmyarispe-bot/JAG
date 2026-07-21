import { recordActivity } from "@/lib/platform/activity";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/** Only emit Founder-originated events — never republish operational EI. */
export type FounderActivityEvent =
  | "founder.insight.created"
  | "founder.recommendation.created"
  | "founder.decision.approved"
  | "founder.decision.dismissed"
  | "founder.decision.delegated"
  | "founder.decision.scheduled"
  | "founder.decision.resolved"
  | "founder.brief.generated"
  | "founder.health.scored";

export async function recordFounderActivity(
  supabase: AuthClient,
  input: {
    eventType: FounderActivityEvent;
    title: string;
    summary?: string | null;
    entityId: string;
    entityType?: string;
    organizationId?: string | null;
    schoolId?: string | null;
    actorUserId?: string | null;
    sourceTable?: string;
    sourceId?: string;
    payload?: Record<string, unknown>;
  }
): Promise<void> {
  if (!input.organizationId && !input.schoolId) return;
  try {
    await recordActivity(supabase, {
      eventType: input.eventType,
      moduleKey: "founder",
      entityType: input.entityType ?? "founder_insight",
      entityId: input.entityId,
      title: input.title,
      summary: input.summary ?? undefined,
      organizationId: input.organizationId ?? undefined,
      schoolId: input.schoolId ?? undefined,
      actorUserId: input.actorUserId ?? undefined,
      sourceTable: input.sourceTable ?? "founder_insights",
      sourceId: input.sourceId ?? input.entityId,
      payload: input.payload,
    });
  } catch {
    // best-effort
  }
}
