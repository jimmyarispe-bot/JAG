/**
 * Organizational Digital Twin orchestrator (Sprint 071).
 * Strategic sandbox — advisory simulations over soft-read intelligence.
 */

import { SimulationEngine } from "@/lib/platform/intelligence/digital-twin/engine/simulation-engine";
import { buildOrganizationModel } from "@/lib/platform/intelligence/digital-twin/models/organization-model";
import { launchInitiativeScenario, customScenario } from "@/lib/platform/intelligence/digital-twin/scenarios/custom";
import { increaseEnrollmentScenario } from "@/lib/platform/intelligence/digital-twin/scenarios/enrollment";
import {
  closeCampusScenario,
  openLocationScenario,
} from "@/lib/platform/intelligence/digital-twin/scenarios/facilities";
import { reduceBudgetScenario } from "@/lib/platform/intelligence/digital-twin/scenarios/finance";
import { expandVirtualScenario } from "@/lib/platform/intelligence/digital-twin/scenarios/operations";
import { hireTeachersScenario } from "@/lib/platform/intelligence/digital-twin/scenarios/staffing";
import type {
  ScenarioComparison,
  ScenarioDefinition,
  TwinRecommendation,
  TwinRequest,
  TwinResult,
} from "@/lib/platform/intelligence/digital-twin/types";
import { DIGITAL_TWIN_VERSION } from "@/lib/platform/intelligence/digital-twin/types";

export interface TwinEngineDeps {
  createId?: (prefix: string) => string;
  now?: () => Date;
}

export class TwinEngine {
  private readonly createId: (prefix: string) => string;
  private readonly now: () => Date;
  private readonly simulation: SimulationEngine;

  constructor(deps: TwinEngineDeps = {}) {
    let seq = 0;
    this.createId = deps.createId ?? ((p) => `${p}-${++seq}`);
    this.now = deps.now ?? (() => new Date());
    this.simulation = new SimulationEngine(this.createId, this.now);
  }

  build(request: TwinRequest): TwinResult {
    const nowIso = this.now().toISOString();
    const liveModel = buildOrganizationModel({
      scope: request.scope,
      portfolio: request.portfolioResult,
      initiatives: request.initiativeResult,
      briefing: request.briefingResult,
    });

    const scenarios = this.resolveScenarios(request);
    const simulations = scenarios.map((s) => this.simulation.simulate(liveModel, s));
    const comparisons = [this.compare(liveModel, simulations)];
    const recommendation = this.recommend(simulations);

    const contributing = new Set<string>(["digital-twin", "portfolio-intelligence"]);
    for (const d of request.portfolioResult?.contributingDomains ?? []) contributing.add(d);
    for (const d of request.initiativeResult?.contributingDomains ?? []) contributing.add(d);
    for (const d of request.predictiveResult?.contributingDomains ?? []) contributing.add(d);
    for (const d of request.briefingResult?.contributingDomains ?? []) contributing.add(d);

    const avgConfidence =
      simulations.length === 0
        ? 0.5
        : simulations.reduce((acc, s) => acc + s.confidence, 0) / simulations.length;

    return {
      requestId: request.requestId,
      version: DIGITAL_TWIN_VERSION,
      scope: request.scope,
      generatedAt: nowIso,
      liveModel,
      scenarios,
      simulations,
      comparisons,
      recommendation,
      explainability: {
        executiveSummary: this.summarize(simulations, recommendation),
        assumptions: simulations[0]?.assumptions ?? ["No simulations run."],
        confidence: Number(avgConfidence.toFixed(2)),
        inputsUsed: [
          "portfolio-intelligence",
          "initiative-intelligence",
          "executive-predictive",
          "briefing",
        ],
        domainsConsulted: [...contributing],
        constraintsEncountered: simulations.flatMap((s) =>
          s.constraints.filter((c) => c.violated).map((c) => c.label)
        ),
        knownUncertainties: simulations[0]?.uncertainties ?? [],
        contributingDomains: [...contributing],
      },
      contributingDomains: [...contributing],
      metadata: {
        ...(request.metadata ?? {}),
        periodLabel: request.periodLabel,
        mayAutoExecute: false,
        advisoryOnly: true,
        distinctFromOiosFoundationTwin: true,
      },
    };
  }

  private resolveScenarios(request: TwinRequest): ScenarioDefinition[] {
    if (request.scenarios?.length) {
      return request.scenarios.map((s) =>
        customScenario(this.createId, {
          kind: s.kind,
          label: s.label ?? s.kind,
          description: s.description,
          parameters: s.parameters,
        })
      );
    }
    return [
      hireTeachersScenario(this.createId, 10),
      reduceBudgetScenario(this.createId, 8),
      increaseEnrollmentScenario(this.createId, 20),
      closeCampusScenario(this.createId),
      openLocationScenario(this.createId),
      expandVirtualScenario(this.createId),
      launchInitiativeScenario(this.createId, "AI Rollout"),
    ];
  }

  private compare(
    baseline: TwinResult["liveModel"],
    simulations: TwinResult["simulations"]
  ): ScenarioComparison {
    const rows = [
      {
        metric: "forecast_budget",
        baseline: baseline.finance.forecast,
        scenarios: Object.fromEntries(
          simulations.map((s) => [s.scenarioId, s.model.finance.forecast])
        ),
      },
      {
        metric: "headcount",
        baseline: baseline.staffing.headcount,
        scenarios: Object.fromEntries(
          simulations.map((s) => [s.scenarioId, s.model.staffing.headcount])
        ),
      },
      {
        metric: "portfolio_health",
        baseline: baseline.portfolio.health ?? 50,
        scenarios: Object.fromEntries(
          simulations.map((s) => [s.scenarioId, s.model.portfolio.health ?? 50])
        ),
      },
      {
        metric: "utilization",
        baseline: baseline.operations.utilization,
        scenarios: Object.fromEntries(
          simulations.map((s) => [s.scenarioId, s.model.operations.utilization])
        ),
      },
    ];

    const best = [...simulations]
      .filter((s) => s.valid)
      .sort(
        (a, b) =>
          (b.model.portfolio.health ?? 0) + b.confidence * 10 -
          ((a.model.portfolio.health ?? 0) + a.confidence * 10)
      )[0];

    return {
      baselineId: "live",
      scenarioIds: simulations.map((s) => s.scenarioId),
      rows,
      highlight: best
        ? `Preferred sandbox scenario ${best.scenarioId} improves portfolio health with constraints satisfied.`
        : "No fully valid scenario — review constraint alerts.",
    };
  }

  private recommend(simulations: TwinResult["simulations"]): TwinRecommendation {
    const ranked = [...simulations]
      .filter((s) => s.valid)
      .sort((a, b) => {
        const score = (s: (typeof simulations)[number]) =>
          (s.model.portfolio.health ?? 50) +
          s.confidence * 20 -
          s.impacts.filter((i) => i.direction === "degrading").length * 3;
        return score(b) - score(a);
      });

    const preferred = ranked[0] ?? null;
    return {
      id: this.createId("rec"),
      preferredScenarioId: preferred?.scenarioId ?? null,
      tradeOffs: preferred
        ? preferred.impacts
            .filter((i) => i.direction !== "neutral")
            .slice(0, 4)
            .map((i) => `${i.domain}: ${i.narrative}`)
        : ["All scenarios violate constraints — no preferred path."],
      resourceImplications: preferred
        ? [
            `Forecast budget → ${Math.round(preferred.model.finance.forecast)}`,
            `Headcount → ${preferred.model.staffing.headcount}`,
          ]
        : [],
      majorRisks: preferred
        ? preferred.impacts
            .filter((i) => i.direction === "degrading")
            .map((i) => i.narrative)
        : simulations.flatMap((s) => s.invalidReasons).slice(0, 5),
      nextSteps: [
        "Review preferred scenario with Executive Command Center widgets.",
        "Route any execution through Autonomous Intelligence approvals (human-in-the-loop).",
        "Do not mutate production data from the twin sandbox.",
      ],
      advisoryOnly: true,
      humanAuthorizationRequired: true,
      mayAutoExecute: false,
    };
  }

  private summarize(
    simulations: TwinResult["simulations"],
    recommendation: TwinRecommendation
  ): string {
    const valid = simulations.filter((s) => s.valid).length;
    return `Digital Twin ran ${simulations.length} isolated scenario(s); ${valid} valid. Preferred: ${recommendation.preferredScenarioId ?? "none"} (advisory only).`;
  }
}
