/**
 * Cross-domain impact analysis for twin simulations.
 */

import type {
  DomainImpact,
  OrganizationModel,
  ScenarioDefinition,
} from "@/lib/platform/intelligence/digital-twin/types";

function impact(
  domain: DomainImpact["domain"],
  delta: number,
  narrative: string
): DomainImpact {
  return {
    domain,
    delta,
    direction: delta > 2 ? "improving" : delta < -2 ? "degrading" : "neutral",
    narrative,
  };
}

export class ImpactEngine {
  analyze(before: OrganizationModel, after: OrganizationModel, scenario: ScenarioDefinition): DomainImpact[] {
    const budgetDelta =
      ((after.finance.forecast - before.finance.forecast) /
        Math.max(1, before.finance.operatingBudget)) *
      100;
    const staffDelta = after.staffing.headcount - before.staffing.headcount;
    const utilDelta =
      (after.operations.utilization - before.operations.utilization) * 100;
    const vacancyDelta =
      (before.staffing.vacancyRate - after.staffing.vacancyRate) * 100;
    const portfolioDelta =
      (after.portfolio.health ?? 50) - (before.portfolio.health ?? 50);
    const initiativeDelta = after.initiatives.length - before.initiatives.length;

    const impacts: DomainImpact[] = [
      impact("finance", -budgetDelta, `Finance forecast change under ${scenario.label}.`),
      impact("staffing", staffDelta * 3 + vacancyDelta, `Staffing headcount/vacancy shift.`),
      impact("operations", -utilDelta, `Operational utilization delta.`),
      impact("portfolio", portfolioDelta, `Portfolio health response.`),
      impact("initiatives", initiativeDelta * 10, `Initiative count / timeline pressure.`),
      impact(
        "enrollment",
        scenario.kind === "increase_enrollment"
          ? Number(scenario.parameters.enrollmentLiftPct ?? 20)
          : scenario.kind === "close_campus"
            ? -8
            : scenario.kind === "open_location"
              ? 12
              : vacancyDelta,
        "Enrollment system response."
      ),
      impact(
        "compliance",
        scenario.kind === "close_campus" || scenario.kind === "reduce_budget" ? -10 : 2,
        "Compliance / policy exposure."
      ),
      impact(
        "executive_kpis",
        portfolioDelta + vacancyDelta * 0.5,
        "Executive KPI composite movement."
      ),
    ];

    return impacts;
  }
}
