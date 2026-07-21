import type { EiEventSignal } from "@/lib/founder-intelligence/events";
import { detectRisks } from "@/lib/founder-intelligence/risks";
import { detectOpportunities } from "@/lib/founder-intelligence/opportunities";
import { generatePredictions } from "@/lib/founder-intelligence/predictions";
import { generateRecommendations } from "@/lib/founder-intelligence/recommendations";
import { scoreConfidence } from "../confidence";
import type { NormalizedEvent, PipelineResult } from "../types";

/** Stage 8 + 9 — Recommendation + Confidence Scoring */
export function stageRecommendationWithConfidence(
  signals: EiEventSignal[],
  events: NormalizedEvent[],
  now = new Date()
): PipelineResult["recommendations"] {
  const risks = detectRisks(signals, now);
  const opportunities = detectOpportunities(signals, now);
  const predictions = generatePredictions(signals, now);
  const recs = generateRecommendations(risks, opportunities, predictions, now);

  return recs.map((r) => {
    const related = events.filter((e) =>
      r.explainability.relatedEventIds.includes(e.id)
    );
    const confidence = scoreConfidence({
      events: related.length ? related : events.slice(0, 10),
      evidenceCount: r.explainability.evidence.length,
      baseConfidence: r.confidence,
      explanation: r.explainability.why,
      factorCount: r.suggestedActions.length,
      now,
    });
    return {
      id: r.id,
      title: r.title,
      summary: r.summary,
      domain: r.domain as string,
      priority: r.priority,
      impact: r.impact,
      confidence,
      suggestedActions: r.suggestedActions,
      explanation: r.explainability.why,
      relatedEventIds: r.explainability.relatedEventIds,
    };
  });
}
