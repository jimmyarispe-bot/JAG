/**
 * Executive Decision Intelligence — DecisionQueries (Sprint 026).
 */

import type {
  DecisionConfidence as DecisionConfidenceContract,
  DecisionQueries as DecisionQueriesContract,
} from "@/lib/platform/intelligence/executive-decision/contracts";
import { DecisionConfidenceEngine } from "@/lib/platform/intelligence/executive-decision/confidence";
import type {
  DecisionEvidenceItem,
  DecisionQueryRequest,
  DecisionQueryResult,
  ExecutiveDecisionResult,
} from "@/lib/platform/intelligence/executive-decision/types";

export interface DecisionQueriesDependencies {
  confidence?: DecisionConfidenceContract;
}

/**
 * DecisionQueries — deterministic Q&A over decision results.
 */
export class DecisionQueriesEngine implements DecisionQueriesContract {
  private readonly confidence: DecisionConfidenceContract;

  constructor(dependencies: DecisionQueriesDependencies = {}) {
    this.confidence = dependencies.confidence ?? new DecisionConfidenceEngine();
  }

  ask(
    result: ExecutiveDecisionResult,
    request: DecisionQueryRequest
  ): DecisionQueryResult {
    const focus = request.focus ?? inferFocus(request.question);
    const max = request.maxResults ?? 3;
    const simulations = request.scenarioId
      ? result.simulations.filter((s) => s.scenario.id === request.scenarioId)
      : result.simulations;

    const recommendations = result.recommendations.slice(0, max);
    const evidence: DecisionEvidenceItem[] = recommendations.flatMap((r) =>
      r.supportingEvidence.slice(0, 2)
    );

    let answer: string;
    switch (focus) {
      case "roi": {
        const top = [...recommendations].sort((a, b) => b.expectedRoi - a.expectedRoi)[0];
        answer = top
          ? `Highest ROI recommendation is "${top.title}" (ROI ${top.expectedRoi.toFixed(2)}). ${top.executiveSummary}`
          : "No ROI-ranked recommendations available.";
        break;
      }
      case "risk": {
        const risks = recommendations.flatMap((r) => r.risks).slice(0, max);
        answer =
          risks.length > 0
            ? `Key risks: ${risks.map((r) => r.title).join("; ")}.`
            : "No material decision risks were flagged.";
        break;
      }
      case "timing": {
        const timed = recommendations[0];
        answer = timed
          ? `Preferred timing is "${timed.timing}" for "${timed.title}".`
          : "No timing recommendation available.";
        break;
      }
      case "mission": {
        const mission = recommendations[0]?.missionImpact;
        answer = mission
          ? `Mission impact: ${mission.narrative}`
          : "No mission impact available.";
        break;
      }
      default: {
        const top = result.projection.topRecommendation;
        answer = top
          ? top.executiveSummary
          : result.summary;
      }
    }

    if (simulations[0]) {
      answer = `${answer} Scenario context: ${simulations[0].summary}`;
    }

    return {
      question: request.question,
      answer,
      confidence: this.confidence.fromValue(
        result.confidence.value * 0.7 + (recommendations[0]?.confidenceScore.value ?? 0.4) * 0.3
      ),
      recommendationIds: recommendations.map((r) => r.id),
      scenarioIds: simulations.map((s) => s.scenario.id),
      evidence,
    };
  }
}

function inferFocus(
  question: string
): NonNullable<DecisionQueryRequest["focus"]> {
  const q = question.toLowerCase();
  if (q.includes("roi") || q.includes("return") || q.includes("highest")) return "roi";
  if (q.includes("risk")) return "risk";
  if (q.includes("when") || q.includes("timing") || q.includes("now") || q.includes("later")) {
    return "timing";
  }
  if (q.includes("mission") || q.includes("student")) return "mission";
  return "recommendation";
}

/** Alias matching Sprint 026 naming. */
export { DecisionQueriesEngine as DecisionQueries };
