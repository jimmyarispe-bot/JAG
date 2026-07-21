import type { createAuthClient } from "@/lib/supabase/server-auth";
import { runJagIntelligencePipeline } from "@/lib/jag-intelligence/pipeline";
import { buildExecutiveBrief, buildTodaysPriorities } from "./brief";
import {
  createDecisionFromRecommendation,
  listFounderDecisions,
} from "./decisions";
import { buildFounderKpis } from "./kpis";
import { listFounderMemory } from "./memory";
import { buildExecutiveTimeline } from "./timeline";
import type { FounderDashboardBundle } from "./types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/**
 * Compose the Founder Intelligence command center via the JAG Intelligence Engine.
 * Analytic heuristics run inside the engine pipeline — not directly here.
 * Organizational context comes from the Context Engine stage (`engine.context`).
 */
export async function composeFounderDashboard(
  supabase: AuthClient,
  options?: {
    organizationId?: string | null;
    schoolId?: string | null;
    seedDecisions?: boolean;
  }
): Promise<FounderDashboardBundle> {
  const engine = await runJagIntelligencePipeline(supabase, {
    organizationId: options?.organizationId,
    schoolId: options?.schoolId,
    persistInsights: true,
    persistGraph: true,
  });

  const {
    domainHealth,
    overallHealth,
    risks,
    opportunities,
    predictions,
    recommendations,
    correlations,
  } = engine.founderAnalysis;

  // Context Engine output (queryable organizational state)
  void engine.context;

  const signals = engine.events.map((e) => ({
    id: e.id,
    eventType: e.eventType,
    moduleKey: e.moduleKey,
    title: e.title,
    summary: e.summary,
    occurredAt: e.occurredAt,
    entityType: e.entityType,
    entityId: e.entityId,
    classification: e.classification,
    payload: e.payload,
  }));

  const brief = buildExecutiveBrief(signals, risks, opportunities, overallHealth);
  const priorities = buildTodaysPriorities(brief);
  const kpis = buildFounderKpis(signals, [...domainHealth, overallHealth], risks);

  let decisions = await listFounderDecisions(supabase, {
    organizationId: options?.organizationId,
  });

  if (options?.seedDecisions !== false && decisions.length === 0) {
    for (const rec of recommendations.slice(0, 5)) {
      await createDecisionFromRecommendation(supabase, {
        organizationId: options?.organizationId,
        schoolId: options?.schoolId,
        recommendation: rec,
      });
    }
    decisions = await listFounderDecisions(supabase, {
      organizationId: options?.organizationId,
    });
  }

  const memory = await listFounderMemory(supabase, {
    organizationId: options?.organizationId,
  });

  const timeline = buildExecutiveTimeline(
    signals,
    decisions,
    recommendations.slice(0, 5).map((r) => ({
      id: r.id,
      title: r.title,
      at: engine.generatedAt,
    }))
  );

  return {
    generatedAt: engine.generatedAt,
    executiveBrief: brief,
    organizationHealth: domainHealth,
    overallHealth,
    risks,
    opportunities,
    predictions,
    recommendations,
    correlations,
    kpis,
    decisions,
    priorities,
    timeline,
    memory,
  };
}
