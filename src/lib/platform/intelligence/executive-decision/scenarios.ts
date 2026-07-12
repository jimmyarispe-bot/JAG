/**
 * Executive Decision Intelligence — ScenarioSimulator (Sprint 026).
 */

import type {
  DecisionConfidence as DecisionConfidenceContract,
  ImpactForecast as ImpactForecastContract,
  ScenarioSimulator as ScenarioSimulatorContract,
  StrategyEngine as StrategyEngineContract,
  TradeoffAnalyzer as TradeoffAnalyzerContract,
} from "@/lib/platform/intelligence/executive-decision/contracts";
import { DecisionConfidenceEngine } from "@/lib/platform/intelligence/executive-decision/confidence";
import { ImpactForecastEngine } from "@/lib/platform/intelligence/executive-decision/impact-forecast";
import { applyShocksToBaseline } from "@/lib/platform/intelligence/executive-decision/models";
import { StrategyEngine as StrategyEngineImpl } from "@/lib/platform/intelligence/executive-decision/strategy";
import { TradeoffAnalyzer as TradeoffAnalyzerImpl } from "@/lib/platform/intelligence/executive-decision/tradeoff";
import type {
  DecisionBaseline,
  DecisionScenarioDefinition,
  DecisionTimingOption,
  ImpactForecastResult,
  ScenarioSimulationResult,
} from "@/lib/platform/intelligence/executive-decision/types";
import type {
  Graph,
  GraphAnalysisResult,
} from "@/lib/platform/intelligence/executive-graph/types";

export interface ScenarioSimulatorDependencies {
  impactForecast?: ImpactForecastContract;
  tradeoff?: TradeoffAnalyzerContract;
  strategy?: StrategyEngineContract;
  confidence?: DecisionConfidenceContract;
  now?: () => Date;
  createId?: (prefix: string) => string;
}

/**
 * ScenarioSimulator — runs what-if simulations against baseline + graph context.
 */
export class ScenarioSimulatorEngine implements ScenarioSimulatorContract {
  private readonly impactForecast: ImpactForecastContract;
  private readonly tradeoff: TradeoffAnalyzerContract;
  private readonly strategy: StrategyEngineContract;
  private readonly confidence: DecisionConfidenceContract;
  private readonly now: () => Date;
  private readonly createId: (prefix: string) => string;

  constructor(dependencies: ScenarioSimulatorDependencies = {}) {
    this.confidence = dependencies.confidence ?? new DecisionConfidenceEngine();
    this.createId =
      dependencies.createId ??
      ((prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
    this.now = dependencies.now ?? (() => new Date());
    this.impactForecast =
      dependencies.impactForecast ??
      new ImpactForecastEngine({
        confidence: this.confidence,
        createId: this.createId,
      });
    this.tradeoff =
      dependencies.tradeoff ??
      new TradeoffAnalyzerImpl({
        confidence: this.confidence,
        createId: this.createId,
      });
    this.strategy =
      dependencies.strategy ??
      new StrategyEngineImpl({
        confidence: this.confidence,
      });
  }

  simulate(input: {
    scenario: DecisionScenarioDefinition;
    baseline: DecisionBaseline;
    graph: Graph | null;
    analysis: GraphAnalysisResult | null;
    horizonMonths: number;
  }): ScenarioSimulationResult {
    const { scenario, baseline, analysis, horizonMonths } = input;

    const primaryForecast = this.impactForecast.forecast({
      scenario,
      baseline,
      analysis,
      horizonMonths,
    });

    let tradeoffs = null;
    const timingOptions = scenario.compareTiming;
    if (timingOptions && timingOptions.length >= 2) {
      const forecasts = timingOptions.map((timing) =>
        this.forecastForTiming(scenario, baseline, analysis, horizonMonths, timing)
      );
      tradeoffs = this.tradeoff.analyze({
        scenario,
        forecasts,
        labels: timingOptions,
      });
    }

    const strategy =
      scenario.initiatives && scenario.initiatives.length > 0
        ? this.strategy.rank({
            scenarioId: scenario.id,
            initiatives: scenario.initiatives,
            baseline,
            analysis,
          })
        : null;

    const graphDerived = {
      rootCauseIds: analysis?.rootCauses.slice(0, 8).map((r) => r.id) ?? [],
      cascadeIds: analysis?.cascades.slice(0, 8).map((c) => c.id) ?? [],
      riskOriginIds: analysis?.risks.slice(0, 8).map((r) => r.originNodeId) ?? [],
      opportunityIds: analysis?.opportunities.slice(0, 8).map((o) => o.id) ?? [],
      graphRecommendationIds:
        analysis?.recommendations.slice(0, 8).map((r) => r.id) ?? [],
    };

    const confidence = this.confidence.score([
      {
        key: "forecast",
        label: "Forecast confidence",
        contribution: primaryForecast.confidence.value * 0.45,
      },
      {
        key: "tradeoff",
        label: "Tradeoff confidence",
        contribution: (tradeoffs?.confidence.value ?? 0.4) * 0.2,
      },
      {
        key: "strategy",
        label: "Strategy confidence",
        contribution: (strategy?.confidence.value ?? 0.4) * 0.15,
      },
      {
        key: "graph",
        label: "Graph context",
        contribution: analysis ? 0.2 : 0.08,
      },
    ]);

    return {
      scenario,
      forecast: primaryForecast,
      tradeoffs,
      strategy,
      graphDerived,
      recommendations: [],
      confidence,
      simulatedAt: this.now().toISOString(),
      summary: buildSummary(scenario, primaryForecast, tradeoffs?.preferredOption ?? null, strategy?.recommendedInitiativeId ?? null),
    };
  }

  private forecastForTiming(
    scenario: DecisionScenarioDefinition,
    baseline: DecisionBaseline,
    analysis: GraphAnalysisResult | null,
    horizonMonths: number,
    timing: DecisionTimingOption
  ): ImpactForecastResult {
    const scale =
      timing === "immediate" ? 1 : timing === "near_term" ? 0.7 : timing === "deferred" ? 0.4 : 0.55;
    const scaledShocks = scenario.shocks.map((shock) => ({
      ...shock,
      magnitude: shock.magnitude * scale,
    }));
    const timedScenario: DecisionScenarioDefinition = {
      ...scenario,
      id: `${scenario.id}-${timing}`,
      title: `${scenario.title} (${timing})`,
      timing,
      shocks: scaledShocks,
    };

    // Deferred hiring reduces near-term payroll pressure but also delays capacity
    if (scenario.kind === "hiring_timing" && timing === "deferred") {
      const deferredBaseline = applyShocksToBaseline(baseline, []);
      deferredBaseline.overallOpportunity = Math.max(
        0,
        deferredBaseline.overallOpportunity - 0.05
      );
      return this.impactForecast.forecast({
        scenario: timedScenario,
        baseline: deferredBaseline,
        analysis,
        horizonMonths,
      });
    }

    return this.impactForecast.forecast({
      scenario: timedScenario,
      baseline,
      analysis,
      horizonMonths,
    });
  }
}

function buildSummary(
  scenario: DecisionScenarioDefinition,
  forecast: ImpactForecastResult,
  preferredTiming: string | null,
  recommendedInitiativeId: string | null
): string {
  const parts = [
    scenario.question,
    `Net Δ ${forecast.financial.netDelta.toFixed(0)}.`,
  ];
  if (preferredTiming) parts.push(`Preferred timing: ${preferredTiming}.`);
  if (recommendedInitiativeId) {
    parts.push(`Top initiative: ${recommendedInitiativeId}.`);
  }
  return parts.join(" ");
}

/** Alias matching Sprint 026 naming. */
export { ScenarioSimulatorEngine as ScenarioSimulator };
