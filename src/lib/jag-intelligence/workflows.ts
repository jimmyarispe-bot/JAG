import type { createAuthClient } from "@/lib/supabase/server-auth";
import type { PersistedInsight } from "./types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/**
 * Approved insights may initiate workflows — require explicit approval
 * unless configured automatic.
 */
export async function initiateWorkflowFromInsight(
  supabase: AuthClient,
  input: {
    insight: PersistedInsight;
    approved: boolean;
    automatic?: boolean;
    organizationId?: string | null;
    schoolId?: string | null;
  }
): Promise<{ ok: boolean; deferred?: boolean; message: string }> {
  if (!input.approved && !input.automatic) {
    return {
      ok: false,
      message: "Explicit approval required before workflow initiation",
    };
  }

  try {
    await supabase.from("platform_communications").insert({
      organization_id: input.organizationId ?? null,
      school_id: input.schoolId ?? null,
      type: "email",
      direction: "outbound",
      status: "queued",
      subject: `JAG insight workflow: ${input.insight.title}`,
      body_text:
        input.insight.recommendation ??
        input.insight.suggestedActions.join("; ") ??
        input.insight.summary,
      metadata: {
        source: "jag_intelligence",
        insightId: input.insight.id,
        automatic: Boolean(input.automatic),
      },
    });
  } catch {
    return { ok: false, message: "Failed to queue workflow side-effect" };
  }

  return {
    ok: true,
    message: "Workflow side-effect queued from approved insight",
  };
}
