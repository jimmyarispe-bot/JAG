/**
 * Predictive Intelligence orchestrator (Sprint 065).
 */

import { DecisionImpactEngine } from "@/lib/platform/intelligence/executive-predictive/engine/decision-impact";
import { DriftEngine } from "@/lib/platform/intelligence/executive-predictive/engine/drift";
import { ForecastEngine } from "@/lib/platform/intelligence/executive-predictive/engine/forecast-engine";
import { ScenarioEngine } from "@/lib/platform/intelligence/executive-predictive/engine/scenario-engine";
import { SignalEngine } from "@/lib/platform/intelligence/executive-predictive/engine/signal-engine";
import { buildExplainability } from "@/lib/platform/intelligence/executive-predictive/explainability/explain";
import { registerForecasts } from "@/lib/platform/intelligence/executive-predictive/registry";
import type {
  ExecutivePredictiveRequest,
  ExecutivePredictiveResult,
  HistoricalSignal,
} from "@/lib/platform/intelligence/executive-predictive/types";
import { EXECUTIVE_PREDICTIVE_VERSION } from "@/lib/platform/intelligence/executive-predictive/types";

export interface PredictiveEngineDeps {
  createId?: (prefix: string) => string;
  now?: () => Date;
  forecastEngine?: ForecastEngine;
  scenarioEngine?: ScenarioEngine;
  signalEngine?: SignalEngine;
  decisionImpactEngine?: DecisionImpactEngine;
  driftEngine?: DriftEngine;
}

function deriveHistory(request: ExecutivePredictiveRequest): HistoricalSignal[] {
  if (request.historicalSignals?.length) return request.historicalSignals;

  const out: HistoricalSignal[] = [];
  const timeline = request.memoryResult?.timeline ?? [];
  for (const [i, entry] of timeline.slice(0, 12).entries()) {
    const domains = entry.domains ?? [];
    const subject =
      domains.find((d) =>
        [
          "enrollment",
          "revenue",
          "cash",
          "staffing",
          "retention",
          "operations",
          "compliance",
        ].includes(d)
      ) ?? "operations";
    out.push({
      id: `mem-${i}`,
      subject,
      at: entry.at ?? new Date(0).toISOString(),
      value: 50 + i,
      direction: "unknown",
      domain: domains[0],
      narrative: entry.summary ?? entry.title,
    });
  }

  const decisions = request.memoryResult?.decisions ?? [];
  for (const [i, d] of decisions.slice(0, 6).entries()) {
    out.push({
      id: `dec-${i}`,
      subject: (d.domains?.[0] as HistoricalSignal["subject"]) ?? "operations",
      at: new Date(0).toISOString(),
      value: (d.confidence ?? 0.5) * 100,
      direction: "flat",
      domain: d.domains?.[0],
      narrative: d.expectedOutcome ?? d.title,
    });
  }

  return out;
}

function healthLabel(value: number): string {
  if (value >= 75) return "stable-outlook";
  if (value >= 55) return "watch";
  if (value >= 35) return "elevated-risk";
  return "critical-outlook";
}

export class PredictiveEngine {
  private readonly createId: (prefix: string) => string;
  private readonly now: () => Date;
  private readonly forecastEngine: ForecastEngine;
  private readonly scenarioEngine: ScenarioEngine;
  private readonly signalEngine: SignalEngine;
  private readonly decisionImpactEngine: DecisionImpactEngine;
  private readonly driftEngine: DriftEngine;

  constructor(deps: PredictiveEngineDeps = {}) {
    let seq = 0;
    this.createId = deps.createId ?? ((p) => `${p}-${++seq}`);
    this.now = deps.now ?? (() => new Date());
    const shared = { createId: this.createId, now: this.now };
    this.forecastEngine = deps.forecastEngine ?? new ForecastEngine(shared);
    this.scenarioEngine = deps.scenarioEngine ?? new ScenarioEngine(shared);
    this.signalEngine = deps.signalEngine ?? new SignalEngine(shared);
    this.decisionImpactEngine =
      deps.decisionImpactEngine ?? new DecisionImpactEngine(shared);
    this.driftEngine = deps.driftEngine ?? new DriftEngine(shared);
  }

  predict(request: ExecutivePredictiveRequest): ExecutivePredictiveResult {
    const signals = deriveHistory(request);
    const forecasts = this.forecastEngine.forecastAll({
      horizon: "90d",
      signals,
      briefing: request.briefingResult,
    });

    const avgConf =
      forecasts.reduce((s, f) => s + f.confidence, 0) / Math.max(forecasts.length, 1);

    const scenarios = this.scenarioEngine.buildScenarios({
      forecasts,
      periodLabel: request.periodLabel ?? "the next 90 days",
      custom: request.customScenario,
      baseConfidence: avgConf,
    });

    const emergingSignals = this.signalEngine.detect({
      signals,
      briefing: request.briefingResult,
    });

    const decisionImpacts = this.decisionImpactEngine.forecastImpacts({
      decision: request.decisionResult,
      scenarios,
      historical: signals,
    });

    const drift = this.driftEngine.evaluate({
      forecasts,
      actuals: request.actuals,
    });

    const registry = registerForecasts(forecasts, scenarios, this.createId);

    const expected = scenarios.find((s) => s.kind === "expected");
    const healthValue = Math.round(
      clampHealth(
        (expected?.overallOutlook ?? 0.5) * 100 -
          emergingSignals.length * 4 +
          (request.briefingResult?.healthScore?.value ?? 60) * 0.25
      )
    );

    const explainability = buildExplainability({
      subject: "organization",
      horizon: "90d",
      why:
        "Organizational forecasts combine historical patterns, current briefing signals, executive memory, and Decision Intelligence options to estimate plausible futures if leadership acts — or does not.",
      historical: signals.slice(0, 8),
      current: emergingSignals.slice(0, 3).flatMap((s) => s.evidence),
      assumptions: forecasts[0]?.assumptions ?? [
        {
          id: this.createId("org-assume"),
          statement: "No exogenous shock outside modeled domains",
          critical: true,
        },
      ],
      baseConfidence: avgConf,
    });

    const contributing = new Set<string>([
      "executive-predictive",
      "decision-intelligence",
      "executive-memory",
      "briefing",
    ]);
    for (const d of request.decisionResult?.contributingDomains ?? []) contributing.add(d);
    for (const d of request.memoryResult?.contributingDomains ?? []) contributing.add(d);
    for (const d of request.briefingResult?.contributingDomains ?? []) contributing.add(d);

    return {
      requestId: request.requestId,
      version: EXECUTIVE_PREDICTIVE_VERSION,
      scope: request.scope,
      generatedAt: this.now().toISOString(),
      healthScore: { value: healthValue, label: healthLabel(healthValue) },
      forecasts,
      scenarios,
      emergingSignals,
      decisionImpacts,
      drift,
      registry,
      explainability,
      contributingDomains: [...contributing],
      metadata: {
        ...(request.metadata ?? {}),
        signalCount: signals.length,
        forecastCount: forecasts.length,
        scenarioCount: scenarios.length,
        advisory: true,
      },
    };
  }
}

function clampHealth(n: number): number {
  if (!Number.isFinite(n)) return 50;
  return Math.max(0, Math.min(100, n));
}
