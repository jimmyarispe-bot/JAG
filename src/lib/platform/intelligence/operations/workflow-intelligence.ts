/**
 * Operations Intelligence — workflow health + process monitoring (Sprint 038).
 */

import type {
  ProcessMonitoringEngine as ProcessMonitoringEngineContract,
  WorkflowHealthEngine as WorkflowHealthEngineContract,
} from "@/lib/platform/intelligence/operations/contracts";
import {
  clamp,
  statusFromScore,
} from "@/lib/platform/intelligence/operations/models";
import type {
  OperationsBaseline,
  ProcessMonitoringArea,
  ProcessMonitoringRecord,
  ProcessMonitoringSuite,
  WorkflowHealthDimension,
  WorkflowHealthDimensionRecord,
  WorkflowHealthResult,
} from "@/lib/platform/intelligence/operations/types";
import { PROCESS_MONITORING_AREAS, WORKFLOW_HEALTH_DIMENSIONS } from "@/lib/platform/intelligence/operations/types";

const WORKFLOW_LABELS: Record<WorkflowHealthDimension, string> = {
  throughput: "Throughput",
  cycle_time: "Cycle Time",
  backlog: "Backlog",
  sla_adherence: "SLA Adherence",
  error_rate: "Error Rate",
  handoff_friction: "Handoff Friction",
};

const PROCESS_LABELS: Record<ProcessMonitoringArea, string> = {
  enrollment: "Enrollment",
  admissions: "Admissions",
  attendance: "Attendance",
  scheduling: "Scheduling",
  finance_ops: "Finance Ops",
  staffing: "Staffing",
  support: "Support",
  compliance_ops: "Compliance Ops",
};

export class WorkflowHealthEngine implements WorkflowHealthEngineContract {
  assess(input: {
    baseline: OperationsBaseline;
    now: Date;
  }): WorkflowHealthResult {
    void input.now;
    const b = input.baseline;

    const scores: Record<WorkflowHealthDimension, number> = {
      throughput: clamp(
        b.workflowHealthScore * 0.55 + b.executionScore * 0.25 + b.capacityHeadroom * 0.2
      ),
      cycle_time: clamp(
        100 -
          b.backlogPressure * 40 -
          b.operationalComplexity * 25 +
          b.processMaturity * 0.2
      ),
      backlog: clamp(100 - b.backlogPressure * 100),
      sla_adherence: clamp(100 - b.slaRisk * 100),
      error_rate: clamp(
        100 - b.operationalComplexity * 35 - (100 - b.processMaturity) * 0.25
      ),
      handoff_friction: clamp(
        100 -
          b.operationalComplexity * 40 -
          b.openRoles * 3 +
          b.staffingAdequacy * 0.15
      ),
    };

    const dimensions: WorkflowHealthDimensionRecord[] =
      WORKFLOW_HEALTH_DIMENSIONS.map((dimension) => {
        const score = scores[dimension];
        return {
          dimension,
          label: WORKFLOW_LABELS[dimension],
          score,
          status: statusFromScore(score),
          signal: signalForWorkflow(dimension, score, b),
          narrative: `${WORKFLOW_LABELS[dimension]} is ${statusFromScore(score)} at ${Math.round(score)}.`,
        };
      });

    const overallScore = clamp(
      dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length
    );

    return {
      dimensions,
      overallScore,
      status: statusFromScore(overallScore),
      narrative: `Workflow health ${statusFromScore(overallScore)} at ${Math.round(overallScore)}.`,
    };
  }
}

export class ProcessMonitoringEngine
  implements ProcessMonitoringEngineContract
{
  monitor(input: {
    baseline: OperationsBaseline;
    now: Date;
  }): ProcessMonitoringSuite {
    void input.now;
    const b = input.baseline;

    const areas: ProcessMonitoringRecord[] = PROCESS_MONITORING_AREAS.map(
      (area) => {
        const { healthScore, bottleneckScore, signals } = resolveProcessArea(
          area,
          b
        );
        return {
          area,
          label: PROCESS_LABELS[area],
          healthScore,
          bottleneckScore,
          status: statusFromScore(healthScore),
          signals,
          narrative: `${PROCESS_LABELS[area]} health ${Math.round(healthScore)}; bottleneck pressure ${Math.round(bottleneckScore)}.`,
        };
      }
    );

    const overallScore = clamp(
      areas.reduce((sum, a) => sum + a.healthScore, 0) / areas.length
    );
    const hottest = [...areas].sort(
      (a, bArea) => bArea.bottleneckScore - a.bottleneckScore
    )[0]!;

    return {
      areas,
      overallScore,
      hottestBottleneck: hottest.area,
      narrative: `Process monitoring overall ${Math.round(overallScore)}; hottest bottleneck ${PROCESS_LABELS[hottest.area]}.`,
    };
  }
}

function signalForWorkflow(
  dimension: WorkflowHealthDimension,
  score: number,
  baseline: OperationsBaseline
): string {
  switch (dimension) {
    case "throughput":
      return score < 60
        ? "Throughput constrained by execution lag"
        : "Throughput within operating band";
    case "cycle_time":
      return baseline.backlogPressure > 0.45
        ? "Cycle time elongated by backlog"
        : "Cycle time acceptable";
    case "backlog":
      return baseline.backlogPressure > 0.5
        ? "Backlog pressure elevated"
        : "Backlog manageable";
    case "sla_adherence":
      return baseline.slaRisk > 0.4
        ? "SLA risk elevated"
        : "SLA adherence stable";
    case "error_rate":
      return baseline.operationalComplexity > 0.55
        ? "Error risk tied to complexity"
        : "Error rate controlled";
    case "handoff_friction":
      return baseline.openRoles > 3
        ? "Handoffs strained by open roles"
        : "Handoffs relatively smooth";
  }
}

function resolveProcessArea(
  area: ProcessMonitoringArea,
  b: OperationsBaseline
): { healthScore: number; bottleneckScore: number; signals: string[] } {
  switch (area) {
    case "enrollment":
      return {
        healthScore: clamp(
          b.operationsScore * 0.4 +
            (b.enrollment > 300 ? 75 : 60) * 0.4 +
            b.studentAttendance * 100 * 0.2
        ),
        bottleneckScore: clamp(
          (1 - b.studentAttendance) * 60 + b.backlogPressure * 40
        ),
        signals: [
          `Enrollment ${b.enrollment}`,
          `Attendance ${(b.studentAttendance * 100).toFixed(1)}%`,
        ],
      };
    case "admissions":
      return {
        healthScore: clamp(b.processMaturity * 0.5 + b.workflowHealthScore * 0.5),
        bottleneckScore: clamp(b.slaRisk * 70 + b.backlogPressure * 30),
        signals: ["Intake SLA", "Application cycle time"],
      };
    case "attendance":
      return {
        healthScore: clamp(
          b.studentAttendance * 55 + b.teacherAttendance * 45
        ),
        bottleneckScore: clamp(
          (1 - Math.min(b.studentAttendance, b.teacherAttendance)) * 100
        ),
        signals: [
          `Student ${(b.studentAttendance * 100).toFixed(1)}%`,
          `Teacher ${(b.teacherAttendance * 100).toFixed(1)}%`,
        ],
      };
    case "scheduling":
      return {
        healthScore: clamp(
          b.capacityHeadroom * 0.55 + (100 - b.operationalComplexity * 100) * 0.45
        ),
        bottleneckScore: clamp(
          b.operationalComplexity * 50 + (100 - b.capacityHeadroom) * 0.4
        ),
        signals: ["Schedule density", "Coverage gaps"],
      };
    case "finance_ops":
      return {
        healthScore: clamp(b.financialScore * 0.7 + b.processMaturity * 0.3),
        bottleneckScore: clamp(100 - b.financialScore),
        signals: ["Collections cycle", "Close cadence"],
      };
    case "staffing":
      return {
        healthScore: clamp(b.staffingAdequacy),
        bottleneckScore: clamp(b.openRoles * 12 + (100 - b.workforceScore) * 0.4),
        signals: [`Open roles ${b.openRoles}`, `Staff ${b.staffCount}`],
      };
    case "support":
      return {
        healthScore: clamp(
          b.workflowHealthScore * 0.5 + (100 - b.slaRisk * 100) * 0.5
        ),
        bottleneckScore: clamp(b.slaRisk * 80 + b.backlogPressure * 20),
        signals: ["Ticket aging", "First-response SLA"],
      };
    case "compliance_ops":
      return {
        healthScore: clamp(
          b.processMaturity * 0.55 + b.organizationHealthScore * 0.45
        ),
        bottleneckScore: clamp(
          (100 - b.processMaturity) * 0.6 + b.operationalComplexity * 30
        ),
        signals: ["Policy cadence", "Evidence readiness"],
      };
  }
}
