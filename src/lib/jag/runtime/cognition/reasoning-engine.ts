import type { RuntimeEventBus } from "../events";
import {
  COGNITION_EVENT_TYPES,
  type ProviderFailedPayload,
  type ReasoningCompletedPayload,
} from "./cognition-events";
import type {
  CognitiveProvider,
  CognitiveRecommendationDraft,
} from "./cognitive-provider";
import type { CognitiveConflictResolver } from "./conflict-resolver";
import { createConflictResolver } from "./conflict-resolver";
import type { EvidenceCollector } from "./evidence-collector";
import { createEvidenceCollector } from "./evidence-collector";
import type { PriorityEngine } from "./priority-engine";
import { createPriorityEngine } from "./priority-engine";
import type { RecommendationEngine } from "./recommendation-engine";
import { createRecommendationEngine } from "./recommendation-engine";
import {
  createReasoningGraph,
  type ReasoningGraph,
} from "./reasoning-graph";
import type {
  CognitiveFinding,
  CognitiveResult,
  CognitiveThinkRequest,
  ReasoningTraceStep,
} from "./cognition-types";

export interface ReasoningEngineOptions {
  events?: RuntimeEventBus;
  evidenceCollector?: EvidenceCollector;
  recommendationEngine?: RecommendationEngine;
  conflictResolver?: CognitiveConflictResolver;
  priorityEngine?: PriorityEngine;
}

/**
 * Coordinates providers → evidence → findings → recommendations → conflicts → priorities.
 * Does not create intelligence; only merges provider outputs.
 */
export class ReasoningEngine {
  private readonly events?: RuntimeEventBus;
  private readonly evidenceCollector: EvidenceCollector;
  private readonly recommendationEngine: RecommendationEngine;
  private readonly conflictResolver: CognitiveConflictResolver;
  private readonly priorityEngine: PriorityEngine;

  constructor(options: ReasoningEngineOptions = {}) {
    this.events = options.events;
    this.evidenceCollector =
      options.evidenceCollector ?? createEvidenceCollector(options.events);
    this.recommendationEngine =
      options.recommendationEngine ??
      createRecommendationEngine(options.events);
    this.conflictResolver =
      options.conflictResolver ?? createConflictResolver(options.events);
    this.priorityEngine = options.priorityEngine ?? createPriorityEngine();
  }

  async think(
    request: CognitiveThinkRequest,
    providers: readonly CognitiveProvider[]
  ): Promise<CognitiveResult> {
    const now = request.now ?? new Date().toISOString();
    const briefId = `brief_${now}`;
    const trace: ReasoningTraceStep[] = [];
    const graph = createReasoningGraph();

    trace.push({
      id: "step_start",
      label: "cognition.started",
      at: now,
    });

    const evidenceResult = await this.evidenceCollector.collect(
      request,
      providers
    );
    const failed = [...evidenceResult.failed];
    const consulted = new Set(evidenceResult.consultedProviderIds);

    for (const ref of evidenceResult.evidence) {
      graph.addNode({
        id: `evidence_${ref.source}_${ref.id}`,
        kind: "evidence",
        label: ref.source,
        refId: ref.id,
      });
    }

    trace.push({
      id: "step_evidence",
      label: "evidence.collected",
      detail: `${evidenceResult.evidence.length} references`,
      at: new Date().toISOString(),
    });

    const findings: CognitiveFinding[] = [];
    for (const provider of providers) {
      if (request.signal?.aborted) break;
      if (provider.supports && !provider.supports(request)) continue;
      if (!provider.analyze) continue;
      consulted.add(provider.id);
      try {
        const items = await provider.analyze(
          request,
          evidenceResult.evidence
        );
        for (const finding of items) {
          findings.push(finding);
          const nodeId = `finding_${finding.id}`;
          graph.addNode({
            id: nodeId,
            kind: "finding",
            label: finding.title ?? finding.id,
            confidence: finding.confidence,
            providerId: finding.providerId,
          });
          for (const ref of finding.evidenceRefs) {
            graph.addEdge(
              `evidence_${ref.source}_${ref.id}`,
              nodeId,
              "supports",
              finding.confidence
            );
          }
        }
      } catch (error) {
        await this.failProvider(provider.id, error, failed);
      }
    }

    trace.push({
      id: "step_findings",
      label: "findings.merged",
      detail: `${findings.length} findings`,
      at: new Date().toISOString(),
    });

    const drafts: (CognitiveRecommendationDraft & {
      sourceProviderId: string;
    })[] = [];
    for (const provider of providers) {
      if (request.signal?.aborted) break;
      if (provider.supports && !provider.supports(request)) continue;
      if (!provider.recommend) continue;
      consulted.add(provider.id);
      try {
        const items = await provider.recommend(
          request,
          evidenceResult.evidence,
          findings
        );
        for (const item of items) {
          drafts.push({ ...item, sourceProviderId: provider.id });
        }
      } catch (error) {
        await this.failProvider(provider.id, error, failed);
      }
    }

    let recommendations = await this.recommendationEngine.normalize(drafts);

    recommendations = recommendations.map((rec) => {
      const nodeId = `rec_${rec.id}`;
      graph.addNode({
        id: nodeId,
        kind: "recommendation",
        label: rec.title ?? rec.id,
        confidence: rec.confidence,
        providerId: rec.sourceProviderId,
      });
      for (const ref of rec.evidenceRefs) {
        graph.addEdge(
          `evidence_${ref.source}_${ref.id}`,
          nodeId,
          "supports",
          rec.confidence
        );
      }
      if (rec.suggestedNextAction) {
        graph.addNode({
          id: `decision_${rec.id}`,
          kind: "decision_candidate",
          label: rec.suggestedNextAction,
          providerId: rec.sourceProviderId,
        });
        graph.addEdge(nodeId, `decision_${rec.id}`, "depends_on");
      }
      return { ...rec, reasoningNodeIds: [nodeId] };
    });

    const conflictResult = await this.conflictResolver.detect(
      recommendations,
      graph
    );
    recommendations = conflictResult.recommendations;

    const priorities = this.priorityEngine.rank(recommendations, request);

    const unknownGaps = buildUnknownGaps(
      evidenceResult.evidence.length,
      recommendations,
      consulted.size,
      failed
    );

    const summary = buildSummary(
      recommendations,
      unknownGaps,
      conflictResult.conflicts.length
    );

    trace.push({
      id: "step_complete",
      label: "reasoning.completed",
      detail: summary,
      at: new Date().toISOString(),
    });

    const result: CognitiveResult = {
      briefId,
      summary,
      findings,
      recommendations,
      priorities,
      unknownGaps,
      conflicts: conflictResult.conflicts,
      reasoningTrace: trace,
      consultedProviders: [...consulted],
      failedProviders: failed,
      evidenceRefs: evidenceResult.evidence,
      graphSnapshot: graph.snapshot(),
      generatedAt: new Date().toISOString(),
    };

    const completedPayload: ReasoningCompletedPayload = {
      briefId,
      recommendationCount: recommendations.length,
      unknownGapCount: unknownGaps.length,
    };
    await this.events?.publish(
      COGNITION_EVENT_TYPES.REASONING_COMPLETED,
      completedPayload
    );

    return result;
  }

  explain(
    result: CognitiveResult,
    recommendationId: string
  ): ReasoningTraceStep[] {
    const rec = result.recommendations.find((r) => r.id === recommendationId);
    if (!rec) {
      return [
        {
          id: "explain_miss",
          label: "recommendation.not_found",
          detail: recommendationId,
          at: new Date().toISOString(),
        },
      ];
    }
    return [
      ...result.reasoningTrace,
      {
        id: `explain_${rec.id}`,
        label: "recommendation.explain",
        detail: rec.rationale ?? rec.title,
        at: new Date().toISOString(),
        attributes: {
          confidence: rec.confidence,
          evidenceRefs: rec.evidenceRefs,
          conflictFlags: rec.conflictFlags,
          unsupported: rec.unsupported,
          sourceProviderId: rec.sourceProviderId,
        },
      },
    ];
  }

  private async failProvider(
    providerId: string,
    error: unknown,
    failed: { providerId: string; reason: string }[]
  ): Promise<void> {
    const reason =
      error instanceof Error ? error.message : "Provider failed";
    failed.push({ providerId, reason });
    const payload: ProviderFailedPayload = { providerId, reason };
    await this.events?.publish(COGNITION_EVENT_TYPES.PROVIDER_FAILED, payload);
  }
}

export function createReasoningEngine(
  options?: ReasoningEngineOptions
): ReasoningEngine {
  return new ReasoningEngine(options);
}

function buildUnknownGaps(
  evidenceCount: number,
  recommendations: CognitiveResult["recommendations"],
  consultedCount: number,
  failed: { providerId: string; reason: string }[]
): string[] {
  const gaps: string[] = [];
  if (consultedCount === 0) {
    gaps.push("No cognitive providers registered or applicable");
  }
  if (evidenceCount === 0) {
    gaps.push("No evidence references gathered");
  }
  const unsupported = recommendations.filter((r) => r.unsupported);
  if (unsupported.length > 0) {
    gaps.push(
      `${unsupported.length} recommendation(s) lack evidence (Law 7)`
    );
  }
  for (const f of failed) {
    gaps.push(`Provider failed: ${f.providerId}`);
  }
  return gaps;
}

function buildSummary(
  recommendations: CognitiveResult["recommendations"],
  unknownGaps: readonly string[],
  conflictCount: number
): string {
  if (recommendations.length === 0 && unknownGaps.length > 0) {
    return "I don't know enough yet — evidence or providers are missing.";
  }
  const actionable = recommendations.filter(
    (r) => !r.unsupported && r.suggestedNextAction
  ).length;
  const parts = [
    `${recommendations.length} recommendation(s)`,
    `${actionable} actionable`,
  ];
  if (conflictCount > 0) parts.push(`${conflictCount} conflict(s)`);
  if (unknownGaps.length > 0) parts.push(`${unknownGaps.length} gap(s)`);
  return parts.join(" · ");
}

export type { ReasoningGraph };
