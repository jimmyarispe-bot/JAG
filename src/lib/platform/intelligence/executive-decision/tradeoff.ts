/**
 * Executive Decision Intelligence — TradeoffAnalyzer (Sprint 026).
 */

import type {
  DecisionConfidence as DecisionConfidenceContract,
  TradeoffAnalyzer as TradeoffAnalyzerContract,
} from "@/lib/platform/intelligence/executive-decision/contracts";
import { DecisionConfidenceEngine } from "@/lib/platform/intelligence/executive-decision/confidence";
import type {
  DecisionScenarioDefinition,
  ImpactForecastResult,
  TradeoffAnalysisResult,
  TradeoffItem,
} from "@/lib/platform/intelligence/executive-decision/types";

export interface TradeoffAnalyzerDependencies {
  confidence?: DecisionConfidenceContract;
  createId?: (prefix: string) => string;
}

/**
 * TradeoffAnalyzer — compares options (e.g. hire now vs later).
 */
export class TradeoffAnalyzerEngine implements TradeoffAnalyzerContract {
  private readonly confidence: DecisionConfidenceContract;
  private readonly createId: (prefix: string) => string;

  constructor(dependencies: TradeoffAnalyzerDependencies = {}) {
    this.confidence = dependencies.confidence ?? new DecisionConfidenceEngine();
    this.createId =
      dependencies.createId ??
      ((prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  }

  analyze(input: {
    scenario: DecisionScenarioDefinition;
    forecasts: ImpactForecastResult[];
    labels?: string[];
  }): TradeoffAnalysisResult {
    const { scenario, forecasts, labels } = input;

    if (forecasts.length < 2) {
      const only = forecasts[0];
      const preferred = labels?.[0] ?? scenario.timing ?? scenario.title;
      return {
        scenarioId: scenario.id,
        items: [],
        preferredOption: preferred,
        summary: `Single option "${preferred}" — no pairwise tradeoff required.`,
        confidence: only?.confidence ?? this.confidence.fromValue(0.5),
      };
    }

    const items: TradeoffItem[] = [];
    const optionLabels =
      labels ??
      forecasts.map(
        (f, i) =>
          scenario.compareTiming?.[i] ??
          scenario.timing ??
          `${scenario.title} option ${i + 1}`
      );

    for (let i = 0; i < forecasts.length - 1; i++) {
      for (let j = i + 1; j < forecasts.length; j++) {
        const a = forecasts[i]!;
        const b = forecasts[j]!;
        const labelA = optionLabels[i] ?? `option-${i + 1}`;
        const labelB = optionLabels[j] ?? `option-${j + 1}`;

        const financialAdvantage = a.financial.netDelta - b.financial.netDelta;
        const operationalAdvantage =
          a.operational.serviceLevelDelta - b.operational.serviceLevelDelta;
        const missionAdvantage =
          a.mission.studentOutcomeDelta - b.mission.studentOutcomeDelta;
        const riskAdvantage =
          b.projected.overallRisk - a.projected.overallRisk;

        const netScore =
          normalize(financialAdvantage / Math.max(Math.abs(a.baseline.revenue), 1)) * 0.4 +
          operationalAdvantage * 0.2 +
          missionAdvantage * 0.2 +
          riskAdvantage * 0.2;

        const winner: TradeoffItem["winner"] =
          Math.abs(netScore) < 0.02 ? "tie" : netScore > 0 ? "a" : "b";

        items.push({
          id: this.createId("tradeoff"),
          optionA: labelA,
          optionB: labelB,
          winner,
          financialAdvantage,
          operationalAdvantage,
          missionAdvantage,
          riskAdvantage,
          netScore,
          rationale:
            winner === "tie"
              ? `"${labelA}" and "${labelB}" are nearly equivalent on net score.`
              : `"${winner === "a" ? labelA : labelB}" leads on net tradeoff (score ${netScore.toFixed(3)}).`,
        });
      }
    }

    const preferredOption = pickPreferred(items, optionLabels);
    const avgConfidence =
      forecasts.reduce((s, f) => s + f.confidence.value, 0) / forecasts.length;

    return {
      scenarioId: scenario.id,
      items,
      preferredOption,
      summary: `Preferred option: ${preferredOption}. Evaluated ${items.length} pairwise tradeoff(s).`,
      confidence: this.confidence.fromValue(avgConfidence),
    };
  }
}

function normalize(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(-1, value));
}

function pickPreferred(items: TradeoffItem[], labels: string[]): string {
  if (items.length === 0) return labels[0] ?? "option-a";
  const wins = new Map<string, number>();
  for (const label of labels) wins.set(label, 0);
  for (const item of items) {
    if (item.winner === "a") {
      wins.set(item.optionA, (wins.get(item.optionA) ?? 0) + 1);
    } else if (item.winner === "b") {
      wins.set(item.optionB, (wins.get(item.optionB) ?? 0) + 1);
    }
  }
  let best = labels[0] ?? "option-a";
  let bestScore = -1;
  for (const [label, score] of wins) {
    if (score > bestScore) {
      best = label;
      bestScore = score;
    }
  }
  return best;
}

/** Alias matching Sprint 026 naming. */
export { TradeoffAnalyzerEngine as TradeoffAnalyzer };
