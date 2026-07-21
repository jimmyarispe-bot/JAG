/**
 * Scenario simulation — mutates isolated state only.
 */

import { ConstraintEngine } from "@/lib/platform/intelligence/digital-twin/engine/constraint-engine";
import { ImpactEngine } from "@/lib/platform/intelligence/digital-twin/engine/impact-engine";
import { StateEngine } from "@/lib/platform/intelligence/digital-twin/engine/state-engine";
import type {
  OrganizationModel,
  ScenarioDefinition,
  SimulationState,
} from "@/lib/platform/intelligence/digital-twin/types";

export class SimulationEngine {
  private readonly state: StateEngine;
  private readonly constraints: ConstraintEngine;
  private readonly impacts: ImpactEngine;

  constructor(
    private readonly createId: (prefix: string) => string,
    private readonly now: () => Date
  ) {
    this.state = new StateEngine(createId, now);
    this.constraints = new ConstraintEngine(createId);
    this.impacts = new ImpactEngine();
  }

  simulate(baseline: OrganizationModel, scenario: ScenarioDefinition): SimulationState {
    const isolated = this.state.createIsolated(scenario, baseline);
    const model = isolated.model;
    this.apply(model, scenario);

    const constraints = this.constraints.evaluate(model, scenario);
    const impacts = this.impacts.analyze(baseline, model, scenario);
    const violated = constraints.filter((c) => c.violated);
    const valid = violated.length === 0;

    const confidence = Math.max(
      0.35,
      Math.min(0.9, 0.75 - violated.length * 0.1 + (impacts.length > 0 ? 0.05 : 0))
    );

    return {
      ...isolated,
      impacts,
      constraints,
      valid,
      invalidReasons: violated.map((v) => v.explanation),
      confidence,
      assumptions: [
        "Soft-reads from Portfolio / Initiative / Predictive — no production mutation.",
        `Scenario parameters: ${JSON.stringify(scenario.parameters)}`,
        "Governance: advisory only (Sprint 066).",
      ],
      uncertainties: [
        "Market response and conversion rates are approximate.",
        "Compliance timelines may extend beyond modeled horizon.",
      ],
      domainsConsulted: [
        "portfolio-intelligence",
        "initiative-intelligence",
        "executive-predictive",
        "digital-twin",
      ],
    };
  }

  private apply(model: OrganizationModel, scenario: ScenarioDefinition): void {
    switch (scenario.kind) {
      case "hire_teachers": {
        const hires = Number(scenario.parameters.hires ?? 10);
        const cost = Number(scenario.parameters.costPerHire ?? 65_000) * hires;
        model.staffing.headcount += hires;
        model.staffing.vacancyRate = Math.max(0.02, model.staffing.vacancyRate - hires * 0.01);
        model.finance.forecast += cost;
        model.operations.utilization = Math.min(0.98, model.operations.utilization + 0.03);
        model.portfolio.health = Math.min(100, (model.portfolio.health ?? 50) + 4);
        break;
      }
      case "reduce_budget": {
        const pct = Number(scenario.parameters.reductionPct ?? 8) / 100;
        model.finance.operatingBudget *= 1 - pct;
        model.finance.forecast *= 1 - pct * 0.7;
        model.operations.utilization = Math.min(0.99, model.operations.utilization + 0.05);
        model.portfolio.health = Math.max(0, (model.portfolio.health ?? 50) - 6);
        model.portfolio.riskIndex = Math.min(100, (model.portfolio.riskIndex ?? 40) + 8);
        break;
      }
      case "increase_enrollment": {
        const pct = Number(scenario.parameters.enrollmentLiftPct ?? 20) / 100;
        model.finance.forecast += model.finance.operatingBudget * pct * 0.4;
        model.operations.utilization = Math.min(0.99, model.operations.utilization + pct * 0.5);
        model.staffing.vacancyRate = Math.min(0.35, model.staffing.vacancyRate + pct * 0.15);
        model.portfolio.health = Math.min(100, (model.portfolio.health ?? 50) + 5);
        break;
      }
      case "close_campus": {
        const save = Number(scenario.parameters.costSavePct ?? 12) / 100;
        model.finance.forecast *= 1 - save;
        model.finance.operatingBudget *= 1 - save * 0.5;
        model.portfolio.riskIndex = Math.min(100, (model.portfolio.riskIndex ?? 40) + 15);
        model.portfolio.health = Math.max(0, (model.portfolio.health ?? 50) - 8);
        model.operations.utilization = Math.max(0.3, model.operations.utilization - 0.08);
        break;
      }
      case "open_location": {
        const startup = Number(scenario.parameters.startupCost ?? 450_000);
        model.finance.forecast += startup;
        model.staffing.headcount += 12;
        model.operations.utilization = Math.min(0.99, model.operations.utilization + 0.1);
        model.portfolio.health = Math.min(100, (model.portfolio.health ?? 50) + 3);
        break;
      }
      case "expand_virtual": {
        const invest = Number(scenario.parameters.techInvestment ?? 80_000);
        model.finance.forecast += invest;
        model.operations.bandwidth = Math.min(1, model.operations.bandwidth + 0.15);
        model.operations.utilization = Math.max(0.2, model.operations.utilization - 0.05);
        model.portfolio.health = Math.min(100, (model.portfolio.health ?? 50) + 4);
        break;
      }
      case "launch_initiative": {
        const title = String(scenario.parameters.initiativeTitle ?? "Strategic initiative");
        const budget = Number(scenario.parameters.plannedBudget ?? 100_000);
        model.initiatives.push({
          id: this.createId("init-sim"),
          title,
          state: "proposed",
          health: 55,
        });
        model.finance.forecast += budget;
        model.operations.utilization = Math.min(0.99, model.operations.utilization + 0.04);
        break;
      }
      default: {
        // custom — light stress on utilization
        model.operations.utilization = Math.min(
          0.99,
          model.operations.utilization + 0.02
        );
      }
    }
  }
}
