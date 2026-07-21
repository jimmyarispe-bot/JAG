/**
 * Constraint modeling — invalid scenarios explain why they fail.
 */

import { budgetHeadroom, staffingCapacity } from "@/lib/platform/intelligence/digital-twin/models/capacity-model";
import type {
  OrganizationModel,
  ScenarioDefinition,
  TwinConstraint,
} from "@/lib/platform/intelligence/digital-twin/types";

export class ConstraintEngine {
  constructor(private readonly createId: (prefix: string) => string) {}

  evaluate(model: OrganizationModel, scenario: ScenarioDefinition): TwinConstraint[] {
    const budgetCeiling = model.finance.operatingBudget * 1.05;
    const staffLimit = model.staffing.headcount * 1.25;
    const capacityThreshold = 0.92;

    const constraints: TwinConstraint[] = [
      {
        id: this.createId("c-budget"),
        kind: "budget_ceiling",
        label: "Budget ceiling",
        limit: budgetCeiling,
        current: model.finance.forecast,
        violated: model.finance.forecast > budgetCeiling,
        explanation:
          model.finance.forecast > budgetCeiling
            ? `Forecast ${model.finance.forecast} exceeds ceiling ${Math.round(budgetCeiling)}.`
            : "Forecast within budget ceiling.",
      },
      {
        id: this.createId("c-staff"),
        kind: "staffing_limit",
        label: "Staffing limit",
        limit: staffLimit,
        current: model.staffing.headcount,
        violated: model.staffing.headcount > staffLimit,
        explanation:
          model.staffing.headcount > staffLimit
            ? `Headcount ${model.staffing.headcount} exceeds staffing limit ${Math.round(staffLimit)}.`
            : "Headcount within staffing policy limits.",
      },
      {
        id: this.createId("c-cap"),
        kind: "capacity_threshold",
        label: "Operational capacity",
        limit: capacityThreshold,
        current: model.operations.utilization,
        violated: model.operations.utilization > capacityThreshold,
        explanation:
          model.operations.utilization > capacityThreshold
            ? `Utilization ${model.operations.utilization.toFixed(2)} exceeds threshold ${capacityThreshold}.`
            : "Operational utilization within threshold.",
      },
      {
        id: this.createId("c-gov"),
        kind: "governance_approval",
        label: "Human authorization required",
        limit: 1,
        current: 0,
        violated: false,
        explanation:
          "Sprint 066 governance: simulations are advisory; execution requires human authorization.",
      },
    ];

    if (scenario.kind === "close_campus") {
      constraints.push({
        id: this.createId("c-comp"),
        kind: "compliance_rule",
        label: "Campus closure compliance",
        limit: 1,
        current: 1,
        violated: false,
        explanation: "Closure requires board/compliance review before production changes.",
      });
    }

    if (scenario.kind === "reduce_budget" && budgetHeadroom(model) < 0) {
      const c = constraints.find((x) => x.kind === "budget_ceiling");
      if (c) {
        c.violated = true;
        c.explanation = "Budget reduction still leaves forecast above sustainable headroom.";
      }
    }

    if (scenario.kind === "hire_teachers" && staffingCapacity(model) < 0) {
      /* capacity helper returns available FTE — unused path kept for clarity */
    }

    return constraints;
  }
}
