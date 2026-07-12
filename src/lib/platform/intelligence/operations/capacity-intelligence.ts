/**
 * Operations Intelligence — staffing, capacity, resource utilization (Sprint 038).
 */

import type {
  CapacityPlanner as CapacityPlannerContract,
  ResourceUtilizationAnalyzer as ResourceUtilizationAnalyzerContract,
  StaffingAnalyticsEngine as StaffingAnalyticsEngineContract,
} from "@/lib/platform/intelligence/operations/contracts";
import {
  clamp,
  statusFromScore,
} from "@/lib/platform/intelligence/operations/models";
import type {
  CapacityHorizonRecord,
  CapacityPlanResult,
  CapacityPlanningHorizon,
  OperationsBaseline,
  ResourceUtilizationResult,
  StaffingAnalyticsResult,
} from "@/lib/platform/intelligence/operations/types";
import { CAPACITY_PLANNING_HORIZONS } from "@/lib/platform/intelligence/operations/types";

const HORIZON_LABELS: Record<CapacityPlanningHorizon, string> = {
  immediate: "Immediate",
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  annual: "Annual",
};

const HORIZON_WEIGHT: Record<CapacityPlanningHorizon, number> = {
  immediate: 1.15,
  weekly: 1.05,
  monthly: 1.0,
  quarterly: 0.92,
  annual: 0.85,
};

export class StaffingAnalyticsEngine
  implements StaffingAnalyticsEngineContract
{
  analyze(input: {
    baseline: OperationsBaseline;
    now: Date;
  }): StaffingAnalyticsResult {
    void input.now;
    const b = input.baseline;
    const coverageRatio = clamp01(
      b.staffCount / Math.max(1, b.enrollment / 12)
    );
    const attendancePressure = clamp(
      (1 - Math.min(b.studentAttendance, b.teacherAttendance)) * 100
    );
    const burnoutProxy = clamp(
      (100 - b.capacityHeadroom) * 0.45 +
        attendancePressure * 0.25 +
        b.openRoles * 4 +
        b.operationalComplexity * 20
    );
    const adequacyScore = clamp(b.staffingAdequacy);
    const gaps: string[] = [];
    if (b.openRoles > 2) gaps.push(`${b.openRoles} open roles pressuring coverage`);
    if (coverageRatio < 0.85) gaps.push("Staff-to-enrollment coverage below target");
    if (b.teacherAttendance < 0.95) gaps.push("Teacher attendance below 95%");
    if (burnoutProxy > 55) gaps.push("Burnout proxy elevated");
    if (gaps.length === 0) gaps.push("No critical staffing gaps detected");

    return {
      adequacyScore,
      coverageRatio,
      openRoles: b.openRoles,
      staffCount: b.staffCount,
      attendancePressure,
      burnoutProxy,
      status: statusFromScore(adequacyScore),
      gaps,
      narrative: `Staffing adequacy ${statusFromScore(adequacyScore)} at ${Math.round(adequacyScore)}; coverage ${(coverageRatio * 100).toFixed(0)}%.`,
    };
  }
}

export class CapacityPlanner implements CapacityPlannerContract {
  plan(input: {
    baseline: OperationsBaseline;
    staffing: StaffingAnalyticsResult;
    now: Date;
  }): CapacityPlanResult {
    void input.now;
    const b = input.baseline;

    const horizons: CapacityHorizonRecord[] = CAPACITY_PLANNING_HORIZONS.map(
      (horizon) => {
        const weight = HORIZON_WEIGHT[horizon];
        const demandIndex = clamp(
          (100 - b.capacityHeadroom) * 0.5 * weight +
            b.backlogPressure * 40 * weight +
            input.staffing.attendancePressure * 0.2
        );
        const supplyIndex = clamp(
          b.staffingAdequacy * 0.45 +
            input.staffing.coverageRatio * 40 +
            (100 - input.staffing.burnoutProxy) * 0.2
        );
        const headroom = clamp(supplyIndex - demandIndex + 50);
        const actions = capacityActions(horizon, headroom, b);
        return {
          horizon,
          label: HORIZON_LABELS[horizon],
          demandIndex,
          supplyIndex,
          headroom,
          status: statusFromScore(headroom),
          actions,
          narrative: `${HORIZON_LABELS[horizon]} headroom ${Math.round(headroom)} (supply ${Math.round(supplyIndex)} vs demand ${Math.round(demandIndex)}).`,
        };
      }
    );

    const constrained = [...horizons].sort((a, c) => a.headroom - c.headroom)[0]!;
    const overallHeadroom = clamp(
      horizons.reduce((sum, h) => sum + h.headroom, 0) / horizons.length
    );

    return {
      horizons,
      overallHeadroom,
      constrainedHorizon: constrained.horizon,
      narrative: `Capacity plan overall headroom ${Math.round(overallHeadroom)}; most constrained ${HORIZON_LABELS[constrained.horizon]}.`,
    };
  }
}

export class ResourceUtilizationAnalyzer
  implements ResourceUtilizationAnalyzerContract
{
  analyze(input: {
    baseline: OperationsBaseline;
    staffing: StaffingAnalyticsResult;
    capacity: CapacityPlanResult;
    now: Date;
  }): ResourceUtilizationResult {
    void input.now;
    const b = input.baseline;
    const staffUtilization = clamp(
      55 +
        (1 - input.capacity.overallHeadroom / 100) * 30 +
        input.staffing.coverageRatio * 20
    );
    const scheduleUtilization = clamp(
      b.resourceUtilization * 0.6 + b.studentAttendance * 40
    );
    const facilityProxy = clamp(
      50 + (b.enrollment / Math.max(1, b.staffCount)) * 4
    );
    const overallUtilization = clamp(
      staffUtilization * 0.4 +
        scheduleUtilization * 0.35 +
        facilityProxy * 0.25
    );
    const idleCapacity = clamp(100 - overallUtilization);
    const overloadRisk = clamp(
      Math.max(0, overallUtilization - 85) * 4 +
        input.staffing.burnoutProxy * 0.35
    );

    const levers: string[] = [];
    if (overloadRisk > 40) levers.push("Rebalance overloaded teams");
    if (idleCapacity > 30) levers.push("Redeploy idle capacity to backlog");
    if (scheduleUtilization < 70) levers.push("Tighten schedule utilization");
    if (levers.length === 0) levers.push("Maintain balanced utilization band");

    return {
      overallUtilization,
      staffUtilization,
      scheduleUtilization,
      facilityProxy,
      idleCapacity,
      overloadRisk,
      status: statusFromScore(100 - overloadRisk),
      levers,
      narrative: `Resource utilization ${Math.round(overallUtilization)}; overload risk ${Math.round(overloadRisk)}.`,
    };
  }
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function capacityActions(
  horizon: CapacityPlanningHorizon,
  headroom: number,
  baseline: OperationsBaseline
): string[] {
  if (headroom < 50) {
    switch (horizon) {
      case "immediate":
        return ["Surge coverage", "Defer noncritical work"];
      case "weekly":
        return ["Cross-train float staff", "Clear top backlog items"];
      case "monthly":
        return ["Fill open roles", "Adjust schedule density"];
      case "quarterly":
        return ["Workforce plan refresh", "Process simplification"];
      case "annual":
        return ["Capacity investment case", "Operating model redesign"];
    }
  }
  if (baseline.openRoles > 0 && horizon !== "immediate") {
    return [`Progress ${baseline.openRoles} open role(s)`, "Monitor headroom"];
  }
  return ["Maintain current capacity posture", "Watch demand signals"];
}
