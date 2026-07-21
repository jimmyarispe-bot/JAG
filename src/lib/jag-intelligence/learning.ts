import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/**
 * Learning Framework — persist feedback for future model evaluation.
 * Does NOT automatically retrain models.
 */
export async function recordLearningOutcome(
  supabase: AuthClient,
  input: {
    organizationId?: string | null;
    insightId?: string | null;
    recommendationId?: string | null;
    accepted?: boolean;
    ignored?: boolean;
    outcome?: string | null;
    actualImpact?: string | null;
  }
): Promise<void> {
  try {
    await supabase.from("jag_learning_records").insert({
      organization_id: input.organizationId ?? null,
      insight_id: input.insightId ?? null,
      recommendation_id: input.recommendationId ?? null,
      accepted: input.accepted ?? null,
      ignored: input.ignored ?? null,
      outcome: input.outcome ?? null,
      actual_impact: input.actualImpact ?? null,
    });
  } catch {
    // best-effort
  }
}

export async function getLearningSummary(
  supabase: AuthClient,
  organizationId?: string | null
) {
  let q = supabase.from("jag_learning_records").select("*").limit(500);
  if (organizationId) q = q.eq("organization_id", organizationId);
  const { data } = await q;
  const rows = data ?? [];
  const accepted = rows.filter((r) => r.accepted === true).length;
  const ignored = rows.filter((r) => r.ignored === true).length;
  return {
    total: rows.length,
    accepted,
    ignored,
    acceptanceRate: rows.length ? accepted / rows.length : 0,
    /** Evaluation dataset only — no auto-retrain */
    retrainEnabled: false,
  };
}
