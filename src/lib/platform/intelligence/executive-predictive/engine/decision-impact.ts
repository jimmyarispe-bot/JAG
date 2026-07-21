/**
 * Decision impact forecasting (Sprint 065).
 */

import { clamp01 } from "@/lib/platform/intelligence/executive-predictive/confidence/confidence";
import { buildExplainability } from "@/lib/platform/intelligence/executive-predictive/explainability/explain";
import type {
  DecisionImpactForecast,
  DecisionIntelligenceResultLight,
  ForecastHorizon,
  HistoricalSignal,
  ScenarioProjection,
} from "@/lib/platform/intelligence/executive-predictive/types";

export interface DecisionImpactEngineDeps {
  createId?: (prefix: string) => string;
}

function effortToHorizon(effort?: string): ForecastHorizon {
  switch ((effort ?? "").toLowerCase()) {
    case "low":
    case "xs":
    case "s":
      return "30d";
    case "medium":
    case "m":
      return "90d";
    case "high":
    case "l":
      return "180d";
    case "xl":
      return "365d";
    default:
      return "90d";
  }
}

export class DecisionImpactEngine {
  private readonly createId: (prefix: string) => string;

  constructor(deps: DecisionImpactEngineDeps = {}) {
    let seq = 0;
    this.createId = deps.createId ?? ((p) => `${p}-${++seq}`);
  }

  forecastImpacts(input: {
    decision?: DecisionIntelligenceResultLight;
    scenarios: ScenarioProjection[];
    historical?: HistoricalSignal[];
  }): DecisionImpactForecast[] {
    const options = input.decision?.recommendation?.rankedOptions ?? [];
    if (options.length === 0) return [];

    return options.map((opt) => {
      const score = opt.scorecard;
      const organizationalImpact = clamp01((score?.expectedImpact ?? score?.overall ?? 50) / 100);
      const financialImpact = clamp01((score?.financialImpact ?? score?.overall ?? 45) / 100);
      const operationalImpact = clamp01((score?.operationalImpact ?? 50) / 100);
      const confidence = clamp01(
        (opt.confidence ?? input.decision?.recommendation?.confidence ?? 0.55) *
          (input.historical && input.historical.length > 0 ? 1 : 0.85)
      );
      const horizon = effortToHorizon(opt.estimatedEffort);

      const explainability = buildExplainability({
        subject: opt.title ?? opt.id ?? "option",
        horizon,
        why: `Estimating organizational, financial, and operational impact if leadership selects "${opt.title ?? opt.id}".`,
        historical: input.historical ?? [],
        current: [
          {
            id: this.createId("di-ev"),
            statement:
              opt.summary ??
              input.decision?.recommendation?.executiveSummary ??
              "Decision Intelligence recommendation context",
            source: "decision",
            supporting: true,
            weight: 0.75,
          },
        ],
        assumptions: [
          {
            id: this.createId("di-assume"),
            statement: "Implementation quality matches the estimated effort band",
            critical: true,
          },
        ],
        baseConfidence: confidence,
      });

      return {
        id: this.createId("impact"),
        optionId: opt.id ?? this.createId("opt"),
        optionTitle: opt.title ?? "Option",
        organizationalImpact,
        financialImpact,
        operationalImpact,
        implementationHorizon: horizon,
        confidence,
        narrative:
          opt.summary ??
          `Selecting this option shifts expected outlook toward ${organizationalImpact >= 0.55 ? "improvement" : "stabilization"} over ${horizon}.`,
        scenarios: input.scenarios,
        explainability,
      };
    });
  }
}
