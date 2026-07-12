/**
 * Predictive Intelligence — ForecastQueries (Sprint 028).
 */

import type {
  ForecastQueries as ForecastQueriesContract,
  PredictionConfidence as PredictionConfidenceContract,
} from "@/lib/platform/intelligence/predictive-intelligence/contracts";
import { PredictionConfidenceEngine } from "@/lib/platform/intelligence/predictive-intelligence/confidence";
import type {
  ForecastQueryRequest,
  ForecastQueryResult,
  PredictionResult,
} from "@/lib/platform/intelligence/predictive-intelligence/types";

export interface ForecastQueriesDependencies {
  confidence?: PredictionConfidenceContract;
}

/**
 * ForecastQueries — deterministic Q&A over prediction results.
 */
export class ForecastQueriesEngine implements ForecastQueriesContract {
  private readonly confidence: PredictionConfidenceContract;

  constructor(dependencies: ForecastQueriesDependencies = {}) {
    this.confidence =
      dependencies.confidence ?? new PredictionConfidenceEngine();
  }

  ask(
    result: PredictionResult,
    request: ForecastQueryRequest
  ): ForecastQueryResult {
    const focus = request.focus ?? inferFocus(request.question);
    const max = request.maxResults ?? 3;
    const scenarios = request.scenarioId
      ? result.scenarioForecasts.filter(
          (s) => s.scenario.id === request.scenarioId
        )
      : result.scenarioForecasts;

    const primary = scenarios[0] ?? result.scenarioForecasts[0];
    const domains = primary
      ? primary.domains.filter((d) =>
          request.domain ? d.domain === request.domain : true
        )
      : [];

    let answer: string;
    switch (focus) {
      case "trend": {
        const trends = domains
          .map((d) => d.trend)
          .slice(0, max);
        answer =
          trends.length > 0
            ? `Trends: ${trends.map((t) => `${t.domain} is ${t.direction}`).join("; ")}.`
            : "No trend analysis available.";
        break;
      }
      case "risk": {
        const risks = (primary?.emergingRisks ?? result.projection.emergingRisks).slice(
          0,
          max
        );
        answer =
          risks.length > 0
            ? `Emerging risks: ${risks.map((r) => r.title).join("; ")}.`
            : "No emerging risks were flagged.";
        break;
      }
      case "threshold": {
        const crossings = (
          primary?.domains.flatMap((d) => d.thresholdCrossings) ??
          result.projection.thresholdCrossings
        ).slice(0, max);
        answer =
          crossings.length > 0
            ? `Threshold crossings: ${crossings.map((c) => c.narrative).join(" ")}`
            : "No threshold crossings predicted in the selected horizon.";
        break;
      }
      case "action": {
        const actions = (
          primary?.preventiveActions ?? result.projection.preventiveActions
        ).slice(0, max);
        answer =
          actions.length > 0
            ? `Recommended actions: ${actions.map((a) => a.action).join("; ")}.`
            : "No preventive actions recommended.";
        break;
      }
      case "horizon": {
        const horizon = request.horizonDays ?? result.horizons[0] ?? 90;
        const highlights = result.projection.domainHighlights
          .filter((h) => h.horizonDays === horizon)
          .slice(0, max);
        answer =
          highlights.length > 0
            ? `At ${horizon} days: ${highlights
                .map((h) => `${h.domain}=${h.value.toFixed(1)} (${h.direction})`)
                .join("; ")}.`
            : `No highlights for the ${horizon}-day horizon.`;
        break;
      }
      case "domain": {
        const domain = domains[0];
        answer = domain
          ? `${domain.domain}: ${domain.summary}`
          : "No domain forecast matched the query.";
        break;
      }
      default: {
        answer = result.projection.headline || result.summary;
      }
    }

    const risks = (primary?.emergingRisks ?? []).slice(0, max);
    const actions = (primary?.preventiveActions ?? []).slice(0, max);

    return {
      question: request.question,
      answer,
      confidence: this.confidence.fromValue(
        result.confidence.value * 0.7 +
          (primary?.confidence.value ?? 0.4) * 0.3
      ),
      domainIds: domains.map((d) => d.domain),
      scenarioIds: scenarios.map((s) => s.scenario.id),
      riskIds: risks.map((r) => r.id),
      actionIds: actions.map((a) => a.id),
    };
  }
}

function inferFocus(
  question: string
): NonNullable<ForecastQueryRequest["focus"]> {
  const q = question.toLowerCase();
  if (q.includes("trend") || q.includes("accelerat") || q.includes("declin")) {
    return "trend";
  }
  if (q.includes("risk") || q.includes("threat")) return "risk";
  if (q.includes("threshold") || q.includes("cross") || q.includes("breach")) {
    return "threshold";
  }
  if (q.includes("action") || q.includes("prevent") || q.includes("recommend")) {
    return "action";
  }
  if (q.includes("day") || q.includes("horizon") || q.includes("month")) {
    return "horizon";
  }
  if (
    q.includes("enrollment") ||
    q.includes("revenue") ||
    q.includes("payroll") ||
    q.includes("cash")
  ) {
    return "domain";
  }
  return "general";
}

/** Alias matching Sprint 028 naming. */
export { ForecastQueriesEngine as ForecastQueries };
