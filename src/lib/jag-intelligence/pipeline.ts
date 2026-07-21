import type { createAuthClient } from "@/lib/supabase/server-auth";
import {
  scoreAllDomains,
  scoreOverallHealth,
} from "@/lib/founder-intelligence/health";
import { detectRisks } from "@/lib/founder-intelligence/risks";
import { detectOpportunities } from "@/lib/founder-intelligence/opportunities";
import { generatePredictions } from "@/lib/founder-intelligence/predictions";
import { generateRecommendations } from "@/lib/founder-intelligence/recommendations";
import { analyzeCrossDomain } from "@/lib/founder-intelligence/correlations";
import { buildKnowledgeGraph, persistKnowledgeEdges } from "./graph";
import { persistPipelineInsights } from "./insight-registry";
import { recordStageMetric, timeStage, timeStageAsync } from "./observability";
import { stageAnomalyDetection } from "./stages/anomaly";
import { stageContextEnrichment } from "./stages/context";
import { stageCrossDomainCorrelation } from "./stages/correlate";
import { stageEventIngestion } from "./stages/ingest";
import { stageNormalization } from "./stages/normalize";
import { stagePatternDetection } from "./stages/patterns";
import { stagePrediction } from "./stages/predict";
import { stageRecommendationWithConfidence } from "./stages/recommend";
import type { PipelineResult, StageMetric } from "./types";
import { PIPELINE_STAGES } from "./types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

function runId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `run-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Unified JAG Intelligence Pipeline.
 * Each stage is independently testable via its stage module.
 */
export async function runJagIntelligencePipeline(
  supabase: AuthClient,
  options?: {
    organizationId?: string | null;
    schoolId?: string | null;
    persistInsights?: boolean;
    persistGraph?: boolean;
    sinceHours?: number;
  }
): Promise<PipelineResult> {
  const pipelineRunId = runId();
  const now = new Date();
  const metrics: StageMetric[] = [];
  const orgId = options?.organizationId ?? null;

  const ingest = await timeStageAsync(() =>
    stageEventIngestion(supabase, {
      organizationId: orgId,
      schoolId: options?.schoolId,
      sinceHours: options?.sinceHours,
    })
  );
  metrics.push({
    stage: "event_ingestion",
    durationMs: ingest.durationMs,
    errorCount: 0,
    queueDepth: ingest.result.length,
  });
  const signals = ingest.result;

  const norm = timeStage(() => stageNormalization(signals));
  metrics.push({
    stage: "normalization",
    durationMs: norm.durationMs,
    errorCount: 0,
  });
  const events = norm.result;

  const ctx = timeStage(() => stageContextEnrichment(signals, now));
  metrics.push({
    stage: "context_enrichment",
    durationMs: ctx.durationMs,
    errorCount: 0,
  });

  // Persist context snapshot (best-effort)
  try {
    await supabase.from("jag_context_snapshots").insert({
      organization_id: orgId,
      school_id: options?.schoolId ?? null,
      context: ctx.result,
    });
  } catch {
    // ignore
  }

  const corr = timeStage(() => stageCrossDomainCorrelation(signals, now));
  metrics.push({
    stage: "cross_domain_correlation",
    durationMs: corr.durationMs,
    errorCount: 0,
  });

  const patterns = timeStage(() => stagePatternDetection(events));
  metrics.push({
    stage: "pattern_detection",
    durationMs: patterns.durationMs,
    errorCount: 0,
  });

  const anomalies = timeStage(() => stageAnomalyDetection(events, now));
  metrics.push({
    stage: "anomaly_detection",
    durationMs: anomalies.durationMs,
    errorCount: 0,
  });

  const predictions = timeStage(() => stagePrediction(signals, now));
  metrics.push({
    stage: "prediction",
    durationMs: predictions.durationMs,
    errorCount: 0,
  });

  const recommendations = timeStage(() =>
    stageRecommendationWithConfidence(signals, events, now)
  );
  metrics.push({
    stage: "recommendation",
    durationMs: recommendations.durationMs,
    errorCount: 0,
  });
  metrics.push({
    stage: "confidence_scoring",
    durationMs: Math.max(1, Math.round(recommendations.durationMs * 0.2)),
    errorCount: 0,
  });

  const graph = timeStage(() => buildKnowledgeGraph(events));
  if (options?.persistGraph !== false) {
    await persistKnowledgeEdges(
      supabase,
      orgId,
      options?.schoolId,
      graph.result.edges
    );
  }

  // Founder-compatible analysis (same engines, orchestrated here)
  const domainHealth = scoreAllDomains(signals, now);
  const overallHealth = scoreOverallHealth(domainHealth, signals, now);
  const risks = detectRisks(signals, now);
  const opportunities = detectOpportunities(signals, now);
  const founderPredictions = generatePredictions(signals, now);
  const founderRecommendations = generateRecommendations(
    risks,
    opportunities,
    founderPredictions,
    now
  );
  const founderCorrelations = analyzeCrossDomain(signals, now);

  const insightStart = Date.now();
  let insights: PipelineResult["insights"] = [];
  if (options?.persistInsights !== false) {
    insights = await persistPipelineInsights(supabase, {
      organizationId: orgId,
      schoolId: options?.schoolId,
      pipelineRunId,
      result: {
        anomalies: anomalies.result,
        recommendations: recommendations.result,
        correlations: corr.result,
        predictions: predictions.result,
      },
    });
  }
  metrics.push({
    stage: "insight_generation",
    durationMs: Date.now() - insightStart,
    errorCount: 0,
  });

  for (const m of metrics) {
    await recordStageMetric(supabase, {
      organizationId: orgId,
      pipelineRunId,
      metric: m,
    });
  }

  return {
    pipelineRunId,
    generatedAt: now.toISOString(),
    events,
    context: ctx.result,
    graph: graph.result,
    correlations: corr.result,
    patterns: patterns.result,
    anomalies: anomalies.result,
    predictions: predictions.result,
    recommendations: recommendations.result,
    insights,
    metrics,
    founderAnalysis: {
      domainHealth,
      overallHealth,
      risks,
      opportunities,
      predictions: founderPredictions,
      recommendations: founderRecommendations,
      correlations: founderCorrelations,
    },
  };
}

export function listPipelineStages() {
  return [...PIPELINE_STAGES];
}
