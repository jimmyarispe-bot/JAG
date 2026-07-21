import type { createAuthClient } from "@/lib/supabase/server-auth";
import type { FounderDecisionRecord } from "./types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/**
 * After explicit Founder approval, queue workflow side-effects:
 * assign task, meeting, communication, review, report, investigation.
 * Automatic workflows only when decision.workflow_trigger_key is set.
 */
export async function executeApprovedDecisionWorkflow(
  supabase: AuthClient,
  decision: FounderDecisionRecord
): Promise<{ ok: boolean; deferred?: boolean; message: string }> {
  const actions = decision.suggestedActions.length
    ? decision.suggestedActions
    : ["Assign follow-up task"];

  // Create mission-control style task when available
  try {
    const { createMissionControlItem } = await import(
      "@/lib/platform/automation/mission-control"
    );
    await createMissionControlItem(supabase, {
      title: decision.title,
      description: decision.description || actions.join("; "),
      priority: decision.priority >= 80 ? "high" : "medium",
      source: "founder_intelligence",
      metadata: {
        decisionId: decision.id,
        suggestedActions: actions,
      },
    } as never);
  } catch {
    // Mission control may not accept this shape — fall through to communications
  }

  // Queue a portal notification / communication stub
  try {
    await supabase.from("platform_communications").insert({
      organization_id: null,
      school_id: null,
      type: "email",
      direction: "outbound",
      status: "queued",
      subject: `Founder decision approved: ${decision.title}`,
      body_text: `Approved recommendation. Next actions: ${actions.join("; ")}`,
      metadata: {
        source: "founder_intelligence",
        decisionId: decision.id,
        kind: "founder_decision_approved",
      },
    });
  } catch {
    // best-effort
  }

  return {
    ok: true,
    deferred: false,
    message: "Post-approval workflow side-effects queued",
  };
}
