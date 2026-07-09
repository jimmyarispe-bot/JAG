/** JAG Operational Loop™ — explicit orchestration on existing platform runtime. */
import "@/lib/platform/operational-loop/register";

export * from "@/lib/platform/operational-loop/types";
export * from "@/lib/platform/operational-loop/registry";
export * from "@/lib/platform/operational-loop/orchestrate";
export * from "@/lib/platform/operational-loop/audit";
export * from "@/lib/platform/operational-loop/diagnostics";
export * from "@/lib/platform/operational-loop/recovery";
export * from "@/lib/platform/operational-loop/queries";

import type { createAuthClient } from "@/lib/supabase/server-auth";
import type { LoopTransitionContext, LoopTransitionResult } from "@/lib/platform/operational-loop/types";
import { executeOperationalLoopTransition } from "@/lib/platform/operational-loop/orchestrate";
import { writePlatformAudit } from "@/lib/platform/automation/audit";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/**
 * Non-blocking loop transition — domain handlers call this after business logic completes.
 * Failures are audited; callers receive result when needed via executeOperationalLoopTransition directly.
 */
export async function fireOperationalLoopTransition(
  supabase: AuthClient,
  input: LoopTransitionContext
): Promise<LoopTransitionResult | undefined> {
  try {
    return await executeOperationalLoopTransition(supabase, input);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Operational loop transition failed";
    await writePlatformAudit(supabase, {
      schoolId: input.schoolId,
      module: "work",
      entityType: "student",
      entityId: input.studentId,
      actionType: "operational_loop_transition_failed",
      summary: `Unhandled loop error: ${input.transitionKey}`,
      actorUserId: input.actorUserId,
      metadata: {
        operational_loop: true,
        transitionKey: input.transitionKey,
        status: "failed",
        errors: [message],
        recoverable: true,
      },
    }).catch(() => undefined);
    return undefined;
  }
}
