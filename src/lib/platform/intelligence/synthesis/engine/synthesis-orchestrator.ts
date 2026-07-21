/**
 * Sprint 061 — orchestrates analyzers → root cause → scoring → recommendations → brief.
 */

import type { SynthesisAnalyzerRegistry } from "@/lib/platform/intelligence/synthesis/registry";
import { analyzeRootCause } from "@/lib/platform/intelligence/synthesis/root-cause/root-cause-engine";
import { buildRecommendations } from "@/lib/platform/intelligence/synthesis/recommendations/recommendation-engine";
import { generateExecutiveBrief } from "@/lib/platform/intelligence/synthesis/briefing/briefing-generator";
import { scoreSignals } from "@/lib/platform/intelligence/synthesis/scoring/math";
import type {
  AnalyzerOutput,
  DomainSignalLight,
  ExecutiveBrief,
  SynthesisRequest,
  SynthesisResult,
  SynthesizedInsight,
} from "@/lib/platform/intelligence/synthesis/types";
import { SYNTHESIS_INTELLIGENCE_VERSION } from "@/lib/platform/intelligence/synthesis/types";
import { runPipelineStages } from "@/lib/platform/intelligence/synthesis/engine/execution-pipeline";

export interface OrchestratorDeps {
  registry: SynthesisAnalyzerRegistry;
  createId: (prefix: string) => string;
  now: () => Date;
}

interface PipelineState {
  request: SynthesisRequest;
  signals: DomainSignalLight[];
  analyzerOutput: AnalyzerOutput;
  insights: SynthesizedInsight[];
  brief?: ExecutiveBrief;
}

export class SynthesisOrchestrator {
  constructor(private readonly deps: OrchestratorDeps) {}

  synthesize(request: SynthesisRequest): SynthesisResult {
    const signals = normalizeSignals(request);
    const initial: PipelineState = {
      request,
      signals,
      analyzerOutput: {
        correlations: [],
        contradictions: [],
        trends: [],
        opportunities: [],
        risks: [],
      },
      insights: [],
    };

    const { context } = runPipelineStages(initial, [
      { stage: "ingest", run: (ctx) => ctx },
      {
        stage: "analyze",
        run: (ctx) => ({
          ...ctx,
          analyzerOutput: this.deps.registry.runAll({
            request: ctx.request,
            signals: ctx.signals,
            createId: this.deps.createId,
          }),
        }),
      },
      {
        stage: "root_cause",
        run: (ctx) => {
          const rootCause = analyzeRootCause(
            ctx.signals,
            ctx.analyzerOutput,
            this.deps.createId
          );
          const scores = scoreSignals(ctx.signals);
          const recommendations = buildRecommendations(
            rootCause,
            scores,
            ctx.analyzerOutput,
            this.deps.createId
          );

          const contributingDomains = [...new Set(ctx.signals.map((s) => s.domain))];
          const contradictoryEvidence = ctx.analyzerOutput.contradictions.flatMap(
            (c) => [
              {
                id: this.deps.createId("contra-a"),
                domain: c.domains[0] ?? "unknown",
                statement: c.statementA,
                weight: 0.6,
                supporting: false as const,
              },
              {
                id: this.deps.createId("contra-b"),
                domain: c.domains[1] ?? c.domains[0] ?? "unknown",
                statement: c.statementB,
                weight: 0.6,
                supporting: false as const,
              },
            ]
          );

          const summary =
            ctx.analyzerOutput.correlations[0]?.narrative ??
            (ctx.signals.length
              ? `Synthesized ${ctx.signals.length} domain signal(s) into an executive narrative with priority ${scores.priority}.`
              : "No domain signals available for synthesis.");

          const insight: SynthesizedInsight = {
            id: this.deps.createId("insight"),
            title:
              ctx.analyzerOutput.correlations[0]?.title ??
              (ctx.signals.length
                ? "Cross-domain executive synthesis"
                : "Empty synthesis"),
            summary,
            scores,
            rootCause,
            correlations: ctx.analyzerOutput.correlations,
            contradictions: ctx.analyzerOutput.contradictions,
            opportunities: ctx.analyzerOutput.opportunities,
            risks: ctx.analyzerOutput.risks,
            trends: ctx.analyzerOutput.trends,
            recommendations,
            explainability: {
              why: `Conclusion reached by correlating ${contributingDomains.length} domain(s), root-cause analysis ("${rootCause.likelyCause}"), and priority scoring (${scores.priority}).`,
              contributingDomains,
              confidence: scores.confidence,
              supportingEvidence: rootCause.supportingEvidence,
              contradictoryEvidence,
            },
            metadata: {
              periodLabel: request.periodLabel,
              question: request.question,
              ...(request.metadata ?? {}),
            },
          };

          return { ...ctx, insights: [insight] };
        },
      },
      { stage: "score", run: (ctx) => ctx },
      { stage: "recommend", run: (ctx) => ctx },
      {
        stage: "brief",
        run: (ctx) => ({
          ...ctx,
          brief: generateExecutiveBrief({
            request: ctx.request,
            insights: ctx.insights,
            analyzerOutput: ctx.analyzerOutput,
            recommendations: ctx.insights.flatMap((i) => i.recommendations),
            createId: this.deps.createId,
            now: this.deps.now,
          }),
        }),
      },
      { stage: "explain", run: (ctx) => ctx },
    ]);

    const insight = context.insights[0];
    const healthValue = insight
      ? Math.round(100 - insight.scores.severity * 0.6 - insight.scores.urgency * 0.2)
      : 70;

    return {
      requestId: request.requestId,
      version: SYNTHESIS_INTELLIGENCE_VERSION,
      scope: request.scope,
      generatedAt: this.deps.now().toISOString(),
      healthScore: {
        value: Math.max(0, Math.min(100, healthValue)),
        label:
          healthValue >= 70
            ? "stable"
            : healthValue >= 45
              ? "watch"
              : "elevated_risk",
      },
      insights: context.insights,
      brief: context.brief!,
      correlations: context.analyzerOutput.correlations,
      contradictions: context.analyzerOutput.contradictions,
      opportunities: context.analyzerOutput.opportunities,
      risks: context.analyzerOutput.risks,
      trends: context.analyzerOutput.trends,
      recommendations: context.insights.flatMap((i) => i.recommendations),
      explainability: insight?.explainability ?? {
        why: "No insight generated.",
        contributingDomains: [],
        confidence: 0,
        supportingEvidence: [],
        contradictoryEvidence: [],
      },
      contributingDomains: [...new Set(signals.map((s) => s.domain))],
      metadata: {
        pipeline: "synthesis-orchestrator",
        analyzerCount: this.deps.registry.list().length,
        ...(request.metadata ?? {}),
      },
    };
  }
}

function normalizeSignals(request: SynthesisRequest): DomainSignalLight[] {
  const fromRequest = [...(request.signals ?? [])];
  if (request.wisdomResult) {
    const value =
      request.wisdomResult.wisdomScore?.value ??
      request.wisdomResult.healthScore?.value;
    fromRequest.push({
      domain: "wisdom",
      score: value,
      direction:
        value == null ? "unknown" : value < 55 ? "down" : value > 70 ? "up" : "flat",
      narrative: request.wisdomResult.headline ?? request.wisdomResult.outlook,
      healthScore: request.wisdomResult.healthScore,
    });
  }
  return fromRequest;
}
