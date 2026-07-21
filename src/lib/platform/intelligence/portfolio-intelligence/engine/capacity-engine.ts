/**
 * Organizational capacity planning across budget, staff, leadership, bandwidth, time.
 */

import type {
  CapacitySnapshot,
  InitiativeLight,
  PriorityScorecard,
} from "@/lib/platform/intelligence/portfolio-intelligence/types";

export class CapacityEngine {
  assess(initiatives: InitiativeLight[], prioritization: PriorityScorecard[]): CapacitySnapshot {
    const active = initiatives.filter((i) =>
      ["active", "planned", "approved", "at_risk"].includes(i.state ?? "")
    );
    const plannedBudget = active.reduce((acc, i) => acc + (i.budget?.planned ?? 0), 0);
    const actualBudget = active.reduce((acc, i) => acc + (i.budget?.actual ?? 0), 0);
    const budgetUtilization =
      plannedBudget === 0 ? 0 : Math.min(120, Math.round((actualBudget / plannedBudget) * 100) || Math.min(100, active.length * 18));

    // Soft capacity proxies — reuse counts rather than duplicating HR/Finance engines.
    const staffUtilization = Math.min(120, active.length * 22 + (prioritization[0]?.resourceDemand ?? 0) * 0.2);
    const leadershipAttention = Math.min(120, active.length * 18 + prioritization.filter((p) => p.executivePriority >= 80).length * 10);
    const operationalBandwidth = Math.min(120, Math.round(
      active.reduce((acc, i) => acc + (i.progress?.percentComplete ?? 0), 0) / Math.max(1, active.length) * 0.6 + active.length * 12
    ));
    const timePressure = Math.min(120, Math.round(
      prioritization.reduce((acc, p) => acc + p.urgency, 0) / Math.max(1, prioritization.length)
    ));

    const utilAvg =
      (budgetUtilization + staffUtilization + leadershipAttention + operationalBandwidth + timePressure) / 5;
    const overcommitted = utilAvg > 85 || staffUtilization > 95 || leadershipAttention > 95;
    const underutilized = utilAvg < 40 && active.length > 0;

    const bottlenecks: string[] = [];
    if (staffUtilization > 90) bottlenecks.push("Staff capacity");
    if (leadershipAttention > 90) bottlenecks.push("Leadership attention");
    if (budgetUtilization > 90) bottlenecks.push("Budget envelope");
    if (timePressure > 85) bottlenecks.push("Timeline pressure");
    if (operationalBandwidth > 90) bottlenecks.push("Operational bandwidth");

    const recommendations: string[] = [];
    if (overcommitted) {
      recommendations.push("Defer or consolidate lower-ranked initiatives to relieve capacity.");
      recommendations.push("Shift shared services toward top-ranked initiatives.");
    }
    if (underutilized) {
      recommendations.push("Consider accelerating high-alignment initiatives.");
    }
    if (bottlenecks.includes("Leadership attention")) {
      recommendations.push("Reduce concurrent executive-sponsor load.");
    }
    if (recommendations.length === 0) {
      recommendations.push("Capacity within band — maintain current allocation.");
    }

    return {
      budgetUtilization: Math.round(budgetUtilization),
      staffUtilization: Math.round(staffUtilization),
      leadershipAttention: Math.round(leadershipAttention),
      operationalBandwidth: Math.round(operationalBandwidth),
      timePressure: Math.round(timePressure),
      overcommitted,
      underutilized,
      bottlenecks,
      recommendations,
    };
  }
}
