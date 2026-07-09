import { writePlatformAudit } from "@/lib/platform/automation/audit";
import { publishEvent } from "@/lib/platform/events/publisher/publish";
import { getLoopTransitionAudit } from "@/lib/platform/operational-loop/audit";
import { executeOperationalLoopTransition } from "@/lib/platform/operational-loop/orchestrate";
import { OPERATIONAL_LOOP_WORKFLOW_KEY } from "@/lib/platform/operational-loop/registry";
import type { LoopTransitionResult } from "@/lib/platform/operational-loop/types";
import type { OperationalLoopTransitionKey } from "@/lib/platform/operational-loop/types";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export interface RetryLoopTransitionInput {
  auditEntryId: string;
  actorUserId?: string | null;
}

/**
 * Retry side effects for a failed transition — does not re-run domain business logic.
 */
export async function retryFailedLoopTransition(
  supabase: AuthClient,
  input: RetryLoopTransitionInput
): Promise<LoopTransitionResult | { error: string }> {
  const { data: row } = await supabase
    .from("platform_audit_events")
    .select("*")
    .eq("id", input.auditEntryId)
    .maybeSingle();

  if (!row) return { error: "Audit entry not found" };

  const meta = (row.metadata ?? {}) as Record<string, unknown>;
  if (meta.operational_loop !== true || meta.status !== "failed") {
    return { error: "Entry is not a recoverable failed loop transition" };
  }

  const transitionKey = meta.transitionKey as OperationalLoopTransitionKey;
  const studentId = row.entity_id as string;
  const schoolId = row.school_id as string;

  await writePlatformAudit(supabase, {
    schoolId,
    module: "work",
    entityType: "student",
    entityId: studentId,
    actionType: "operational_loop_transition",
    summary: `Retrying ${transitionKey}`,
    workflowKey: OPERATIONAL_LOOP_WORKFLOW_KEY,
    actorUserId: input.actorUserId,
    metadata: {
      ...meta,
      status: "retrying",
      retryOf: input.auditEntryId,
    },
  });

  const result = await executeOperationalLoopTransition(supabase, {
    transitionKey,
    studentId,
    schoolId,
    actorUserId: input.actorUserId,
    metadata: {
      recovery: true,
      retryOf: input.auditEntryId,
    },
    facts: (meta.facts as Record<string, unknown>) ?? {},
  });

  if (result.success) {
    await publishEvent(
      {
        eventType: "jag.operational_loop.recovered",
        entityType: "student",
        entityId: studentId,
        schoolId,
        actorId: input.actorUserId ?? undefined,
        payload: {
          transitionKey,
          retryOf: input.auditEntryId,
          attemptId: result.attemptId,
        },
      },
      { persist: { supabase }, recordAudit: true }
    );

    await writePlatformAudit(supabase, {
      schoolId,
      module: "work",
      entityType: "student",
      entityId: studentId,
      actionType: "operational_loop_transition_recovered",
      summary: `Recovered ${transitionKey}`,
      workflowKey: OPERATIONAL_LOOP_WORKFLOW_KEY,
      actorUserId: input.actorUserId,
      metadata: {
        operational_loop: true,
        transitionKey,
        retryOf: input.auditEntryId,
        attemptId: result.attemptId,
        status: "completed",
      },
    });
  }

  return result;
}

/** Retry all recent failed transitions for a school (bounded). */
export async function retryFailedLoopTransitionsForSchool(
  supabase: AuthClient,
  schoolId: string,
  actorUserId?: string | null,
  limit = 5
): Promise<{ retried: number; succeeded: number; results: LoopTransitionResult[] }> {
  const failed = (await getLoopTransitionAudit(supabase, schoolId, 50)).filter(
    (e) => e.status === "failed"
  );

  const results: LoopTransitionResult[] = [];
  let succeeded = 0;

  for (const entry of failed.slice(0, limit)) {
    const outcome = await retryFailedLoopTransition(supabase, {
      auditEntryId: entry.id,
      actorUserId,
    });
    if ("attemptId" in outcome) {
      results.push(outcome);
      if (outcome.success) succeeded++;
    }
  }

  return { retried: results.length, succeeded, results };
}
