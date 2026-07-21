import { resolveActorUserId } from "@/lib/platform/shared/context";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { recordLearningOutcome } from "./learning";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export type FeedbackOutcome =
  | "accepted"
  | "rejected"
  | "delegated"
  | "completed"
  | "ignored"
  | "partial";

/**
 * Decision Feedback Loop — track outcomes after Founder decisions
 * to improve future recommendations (evaluation data only; no auto-retrain).
 */
export async function recordDecisionFeedback(
  supabase: AuthClient,
  input: {
    organizationId?: string | null;
    insightId?: string | null;
    founderDecisionId?: string | null;
    outcome: FeedbackOutcome;
    actualImpact?: string;
    notes?: string;
  }
): Promise<{ ok: true; feedbackId: string } | { ok: false; error: string }> {
  const actorUserId = await resolveActorUserId(supabase);
  const { data, error } = await supabase
    .from("jag_decision_feedback")
    .insert({
      organization_id: input.organizationId ?? null,
      insight_id: input.insightId ?? null,
      founder_decision_id: input.founderDecisionId ?? null,
      outcome: input.outcome,
      actual_impact: input.actualImpact ?? null,
      notes: input.notes ?? null,
      recorded_by: actorUserId,
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Failed" };

  await recordLearningOutcome(supabase, {
    organizationId: input.organizationId,
    insightId: input.insightId,
    accepted: input.outcome === "accepted" || input.outcome === "completed",
    ignored: input.outcome === "ignored" || input.outcome === "rejected",
    outcome: input.outcome,
    actualImpact: input.actualImpact,
  });

  if (input.insightId) {
    const status =
      input.outcome === "accepted" || input.outcome === "completed"
        ? "accepted"
        : input.outcome === "rejected" || input.outcome === "ignored"
          ? "rejected"
          : input.outcome === "delegated"
            ? "delegated"
            : "acknowledged";
    await supabase
      .from("jag_insights")
      .update({
        status,
        resolution: input.notes ?? input.actualImpact ?? input.outcome,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.insightId);
  }

  return { ok: true, feedbackId: data.id };
}

export async function listDecisionFeedback(
  supabase: AuthClient,
  organizationId?: string | null
) {
  let q = supabase
    .from("jag_decision_feedback")
    .select("*")
    .order("recorded_at", { ascending: false })
    .limit(100);
  if (organizationId) q = q.eq("organization_id", organizationId);
  const { data } = await q;
  return data ?? [];
}

/** Map founder decision status → feedback outcome */
export function outcomeFromFounderDecisionStatus(
  status: string
): FeedbackOutcome | null {
  switch (status) {
    case "approved":
      return "accepted";
    case "dismissed":
      return "rejected";
    case "delegated":
      return "delegated";
    case "resolved":
    case "tracking":
      return "completed";
    default:
      return null;
  }
}
