/**
 * Portfolio health aggregation.
 */

import type {
  CapacitySnapshot,
  CrossInitiativeDependency,
  InitiativeLight,
  PortfolioHealth,
  PortfolioHealthState,
  PriorityScorecard,
} from "@/lib/platform/intelligence/portfolio-intelligence/types";

function stateFromScore(score: number): PortfolioHealthState {
  if (score >= 85) return "excellent";
  if (score >= 70) return "healthy";
  if (score >= 55) return "watch";
  if (score >= 35) return "at_risk";
  return "critical";
}

export class PortfolioHealthEngine {
  calculate(input: {
    initiatives: InitiativeLight[];
    prioritization: PriorityScorecard[];
    capacity: CapacitySnapshot;
    dependencies: CrossInitiativeDependency[];
  }): PortfolioHealth {
    const { initiatives, prioritization, capacity, dependencies } = input;
    const completed = initiatives.filter((i) => i.state === "completed" || i.state === "archived");
    const completionRate =
      initiatives.length === 0
        ? 0
        : Math.round((completed.length / initiatives.length) * 100);

    const avgHealth =
      initiatives.length === 0
        ? 50
        : Math.round(
            initiatives.reduce((acc, i) => acc + (i.progress?.healthScore ?? 50), 0) /
              initiatives.length
          );

    const budgetPerformance = Math.max(
      0,
      Math.min(100, 100 - Math.abs(capacity.budgetUtilization - 70))
    );
    const schedulePerformance = Math.max(
      0,
      Math.min(
        100,
        100 -
          Math.round(
            prioritization.reduce((acc, p) => acc + Math.max(0, p.urgency - 60), 0) /
              Math.max(1, prioritization.length)
          )
      )
    );
    const riskIndex = Math.round(
      prioritization.reduce((acc, p) => acc + p.risk, 0) / Math.max(1, prioritization.length)
    );
    const capacityUtilization = Math.round(
      (capacity.budgetUtilization +
        capacity.staffUtilization +
        capacity.leadershipAttention +
        capacity.operationalBandwidth) /
        4
    );
    const alignmentAvg =
      prioritization.reduce((acc, p) => acc + p.alignment, 0) /
      Math.max(1, prioritization.length);
    const depPenalty = Math.min(20, dependencies.filter((d) => d.severity >= 60).length * 4);

    const value = Math.round(
      Math.max(
        0,
        Math.min(
          100,
          avgHealth * 0.25 +
            budgetPerformance * 0.15 +
            schedulePerformance * 0.15 +
            (100 - riskIndex) * 0.15 +
            (100 - Math.max(0, capacityUtilization - 85)) * 0.1 +
            completionRate * 0.1 +
            alignmentAvg * 0.1 -
            depPenalty
        )
      )
    );

    const state = stateFromScore(value);

    return {
      value,
      state,
      budgetPerformance,
      schedulePerformance,
      riskIndex,
      capacityUtilization,
      completionRate,
      strategicCoverage: Math.round(alignmentAvg),
      explainability: `Portfolio health ${state} (${value}). Completion ${completionRate}%, risk index ${riskIndex}, capacity util ${capacityUtilization}%.`,
    };
  }
}
