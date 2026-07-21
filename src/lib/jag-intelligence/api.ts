import type { createAuthClient } from "@/lib/supabase/server-auth";
import { resolveActorUserId } from "@/lib/platform/shared/context";
import { recordJagActivity } from "./activity";
import {
  getInsightTimeline,
  queryInsights,
  resolveInsight,
  searchInsights,
} from "./insight-registry";
import { runJagIntelligencePipeline } from "./pipeline";
import type { InsightCategory, InsightStatus, OrganizationalContext } from "./types";
import {
  outcomeFromFounderDecisionStatus,
  recordDecisionFeedback,
} from "./feedback";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/** Insight API — query / search / resolve / timeline / run */
export const insightApi = {
  async query(
    supabase: AuthClient,
    filters?: {
      organizationId?: string | null;
      category?: InsightCategory;
      status?: InsightStatus;
      limit?: number;
    }
  ) {
    return queryInsights(supabase, filters);
  },

  async search(supabase: AuthClient, query: string, organizationId?: string | null) {
    return searchInsights(supabase, query, organizationId);
  },

  async resolve(
    supabase: AuthClient,
    insightId: string,
    resolution: string,
    status?: InsightStatus
  ) {
    const result = await resolveInsight(supabase, insightId, resolution, status);
    if (result.ok) {
      await recordJagActivity(supabase, {
        eventType: "jag.insight.resolved",
        title: "Insight resolved",
        summary: resolution,
        entityId: insightId,
        organizationId: null,
        actorUserId: await resolveActorUserId(supabase),
      });
    }
    return result;
  },

  async timeline(supabase: AuthClient, organizationId?: string | null) {
    return getInsightTimeline(supabase, organizationId);
  },

  /**
   * Subscribe stub — returns current open insights.
   * Real-time subscriptions deferred (poll / future channel).
   */
  async subscribe(
    supabase: AuthClient,
    organizationId?: string | null
  ): Promise<{ mode: "poll"; insights: Awaited<ReturnType<typeof queryInsights>> }> {
    const insights = await queryInsights(supabase, {
      organizationId,
      status: "open",
      limit: 50,
    });
    return { mode: "poll", insights };
  },

  async runPipeline(
    supabase: AuthClient,
    options?: {
      organizationId?: string | null;
      schoolId?: string | null;
    }
  ) {
    const result = await runJagIntelligencePipeline(supabase, {
      ...options,
      persistInsights: true,
      persistGraph: true,
    });
    await recordJagActivity(supabase, {
      eventType: "jag.pipeline.completed",
      title: "JAG Intelligence pipeline completed",
      summary: `${result.insights.length} insights · ${result.anomalies.length} anomalies`,
      entityId: result.pipelineRunId,
      organizationId: options?.organizationId,
      schoolId: options?.schoolId,
      actorUserId: await resolveActorUserId(supabase),
      payload: {
        metrics: result.metrics,
        recommendationCount: result.recommendations.length,
      },
    });
    for (const insight of result.insights.slice(0, 5)) {
      await recordJagActivity(supabase, {
        eventType: "jag.insight.created",
        title: insight.title,
        summary: insight.summary,
        entityId: insight.id,
        organizationId: options?.organizationId,
        schoolId: options?.schoolId,
      });
    }
    if (result.anomalies.length) {
      await recordJagActivity(supabase, {
        eventType: "jag.anomaly.detected",
        title: `${result.anomalies.length} anomalies detected`,
        entityId: result.pipelineRunId,
        organizationId: options?.organizationId,
        schoolId: options?.schoolId,
      });
    }
    return result;
  },
};

/** Context Engine query API — Founder Intelligence should use this. */
export async function getOrganizationalContext(
  supabase: AuthClient,
  options?: { organizationId?: string | null; schoolId?: string | null }
): Promise<OrganizationalContext> {
  // Prefer latest snapshot
  let q = supabase
    .from("jag_context_snapshots")
    .select("context, captured_at")
    .order("captured_at", { ascending: false })
    .limit(1);
  if (options?.organizationId) q = q.eq("organization_id", options.organizationId);
  const { data } = await q.maybeSingle();
  if (data?.context) {
    return data.context as OrganizationalContext;
  }

  // Rebuild via pipeline (context stage)
  const result = await runJagIntelligencePipeline(supabase, {
    organizationId: options?.organizationId,
    schoolId: options?.schoolId,
    persistInsights: false,
    persistGraph: false,
  });
  return result.context;
}

export async function syncFounderDecisionFeedback(
  supabase: AuthClient,
  input: {
    organizationId?: string | null;
    founderDecisionId: string;
    status: string;
    insightId?: string | null;
    notes?: string;
  }
) {
  const outcome = outcomeFromFounderDecisionStatus(input.status);
  if (!outcome) return { ok: false as const, error: "No feedback mapping" };
  const result = await recordDecisionFeedback(supabase, {
    organizationId: input.organizationId,
    founderDecisionId: input.founderDecisionId,
    insightId: input.insightId,
    outcome,
    notes: input.notes,
  });
  if (result.ok) {
    await recordJagActivity(supabase, {
      eventType: "jag.feedback.recorded",
      title: `Decision feedback: ${outcome}`,
      entityId: result.feedbackId,
      organizationId: input.organizationId,
    });
  }
  return result;
}
