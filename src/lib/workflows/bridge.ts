import type { createAuthClient } from "@/lib/supabase/server-auth";
import { dispatchWorkflowTrigger } from "./engine";
import { triggersForActivityEvent } from "./triggers";
import type { WorkflowEventContext } from "./types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/**
 * Bridge platform activity events → workflow engine.
 * Called best-effort from recordActivity after a successful write.
 */
export async function onActivityEventForWorkflows(
  supabase: AuthClient,
  input: {
    eventType: string;
    activityEventId?: string | null;
    organizationId?: string | null;
    schoolId?: string | null;
    actorUserId?: string | null;
    entityType?: string | null;
    entityId?: string | null;
    studentId?: string | null;
    familyId?: string | null;
    payload?: Record<string, unknown>;
  }
): Promise<{ dispatched: number }> {
  // Avoid recursion from workflow lifecycle activity
  if (input.eventType.startsWith("workflow.")) return { dispatched: 0 };

  const triggerKeys = triggersForActivityEvent(input.eventType);
  if (!triggerKeys.length) return { dispatched: 0 };

  let dispatched = 0;
  for (const triggerKey of triggerKeys) {
    const ctx: WorkflowEventContext = {
      triggerKey,
      eventType: input.eventType,
      organizationId: input.organizationId,
      schoolId: input.schoolId,
      actorUserId: input.actorUserId,
      entityType: input.entityType,
      entityId: input.entityId,
      studentId: input.studentId,
      familyId: input.familyId,
      activityEventId: input.activityEventId,
      payload: input.payload ?? {},
      facts: {
        eventType: input.eventType,
        ...(input.payload ?? {}),
      },
      dedupeKey: input.activityEventId
        ? `${triggerKey}:${input.activityEventId}`
        : `${triggerKey}:${input.entityType}:${input.entityId}:${input.eventType}`,
    };

    const result = await dispatchWorkflowTrigger(supabase, ctx);
    dispatched += result.matched;
  }

  return { dispatched };
}
