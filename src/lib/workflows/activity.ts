import { recordActivity } from "@/lib/platform/activity";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

type WorkflowEventType =
  | "workflow.created"
  | "workflow.updated"
  | "workflow.enabled"
  | "workflow.disabled"
  | "workflow.archived"
  | "workflow.restored"
  | "workflow.deleted"
  | "workflow.duplicated"
  | "workflow.executed"
  | "workflow.failed"
  | "workflow.completed";

export async function recordWorkflowActivity(
  supabase: AuthClient,
  input: {
    eventType: WorkflowEventType;
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
      moduleKey: "platform",
      entityType: "workflow",
      entityId: input.entityId,
      title: input.title,
      summary: input.summary ?? undefined,
      organizationId: input.organizationId ?? undefined,
      schoolId: input.schoolId ?? undefined,
      actorUserId: input.actorUserId ?? undefined,
      sourceTable: "platform_workflows",
      sourceId: input.entityId,
      payload: input.payload,
    });
  } catch {
    // best-effort
  }
}
