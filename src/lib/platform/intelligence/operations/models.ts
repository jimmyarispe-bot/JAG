/**
 * Operations Intelligence — OperationsModels helpers (Sprint 038).
 */

import type { OrganizationDNA } from "@/lib/platform/intelligence/organization-dna/types";
import type { OiosResult } from "@/lib/platform/oios/types";
import type {
  GraphAnalysisResult,
  GraphBuildInput,
  GraphScope,
} from "@/lib/platform/intelligence/executive-graph/types";
import type { PredictionResult } from "@/lib/platform/intelligence/predictive-intelligence/types";
import type {
  BusinessModelResultLight,
  FinancialSignal,
  HumanCapitalResultLight,
  ImprovementResultLight,
  OperationsBaseline,
  OperationsConfidenceLevel,
  OperationsConfidenceScore,
  OperationsHealthStatus,
  OperationsLensImpact,
  OperationsPriorityBand,
} from "@/lib/platform/intelligence/operations/types";

export function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

export function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

export function statusFromScore(score: number): OperationsHealthStatus {
  if (score >= 85) return "excellent";
  if (score >= 70) return "healthy";
  if (score >= 50) return "warning";
  return "critical";
}

export function priorityFromScore(score: number): OperationsPriorityBand {
  if (score < 35) return "critical";
  if (score < 50) return "high";
  if (score < 65) return "medium";
  if (score < 80) return "low";
  return "monitor";
}

export function priorityFromRisk(risk: number): OperationsPriorityBand {
  if (risk >= 0.75) return "critical";
  if (risk >= 0.55) return "high";
  if (risk >= 0.35) return "medium";
  if (risk >= 0.2) return "low";
  return "monitor";
}

export function levelFromValue(value: number): OperationsConfidenceLevel {
  if (value >= 0.8) return "high";
  if (value >= 0.55) return "medium";
  if (value >= 0.3) return "low";
  return "unknown";
}

export function scoreNarrative(
  label: string,
  value: number,
  status: OperationsHealthStatus
): string {
  return `${label} is ${status} at ${Math.round(value)}.`;
}

export function buildConfidence(
  factors: Array<{ key: string; label: string; contribution: number }>
): OperationsConfidenceScore {
  const value =
    factors.length === 0
      ? 0.5
      : clamp01(
          factors.reduce((sum, f) => sum + f.contribution, 0) / factors.length
        );
  return { value, level: levelFromValue(value), factors };
}

export function buildLenses(
  partial: Partial<OperationsLensImpact> &
    Pick<
      OperationsLensImpact,
      | "workflowHealth"
      | "processBottlenecks"
      | "staffingAdequacy"
      | "automationPotential"
      | "capacityOutlook"
      | "resourceUtilization"
    >
): OperationsLensImpact {
  return {
    workflowHealth: partial.workflowHealth,
    processBottlenecks: partial.processBottlenecks,
    staffingAdequacy: partial.staffingAdequacy,
    automationPotential: partial.automationPotential,
    capacityOutlook: partial.capacityOutlook,
    resourceUtilization: partial.resourceUtilization,
  };
}

export function defaultCreateId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function defaultPeriodLabel(now = new Date()): string {
  return `${now.getUTCFullYear()}-Q${Math.floor(now.getUTCMonth() / 3) + 1}`;
}

export function emptyOperationsScope(): GraphScope {
  return { organizationId: null, schoolId: null };
}

export function defaultOperationsBaseline(): OperationsBaseline {
  return {
    workflowHealthScore: 68,
    processMaturity: 66,
    staffingAdequacy: 70,
    capacityHeadroom: 62,
    automationReadiness: 58,
    resourceUtilization: 72,
    operationsScore: 70,
    workforceScore: 72,
    operationalComplexity: 0.48,
    organizationHealthScore: 75,
    financialScore: 72,
    executionScore: 68,
    staffCount: 85,
    enrollment: 420,
    studentAttendance: 0.94,
    teacherAttendance: 0.96,
    openRoles: 4,
    backlogPressure: 0.38,
    slaRisk: 0.32,
  };
}

/** Derive baseline from DNA / OIOS / graph / HC / BM / improvement soft signals. */
export function deriveOperationsBaseline(
  dna: OrganizationDNA | null | undefined,
  oios: OiosResult | null | undefined,
  analysis: GraphAnalysisResult | null | undefined,
  graphInput: GraphBuildInput | null | undefined,
  prediction: PredictionResult | null | undefined,
  financialSignal: FinancialSignal | null | undefined,
  humanCapitalResult?: HumanCapitalResultLight | null,
  businessModelResult?: BusinessModelResultLight | null,
  improvementResult?: ImprovementResultLight | null,
  overrides?: Partial<OperationsBaseline>
): OperationsBaseline {
  const base = defaultOperationsBaseline();
  const health = graphInput?.organizationHealth;
  const executive = graphInput?.executive;

  const organizationHealthScore = clamp(
    oios?.health.score ?? health?.overallScore ?? base.organizationHealthScore
  );

  const operationsScore = clamp(
    health?.operationsScore ??
      oios?.baseline.executionScore ??
      base.operationsScore
  );

  const workforceScore = clamp(
    humanCapitalResult?.workforceHealthScore?.value ??
      health?.workforceScore ??
      base.workforceScore
  );

  const financialScore = clamp(
    health?.financialScore ??
      oios?.baseline.financialScore ??
      (financialSignal?.marginPct != null
        ? financialSignal.marginPct > 1
          ? financialSignal.marginPct
          : financialSignal.marginPct * 100
        : base.financialScore)
  );

  const executionScore = clamp(
    oios?.baseline.executionScore ??
      improvementResult?.improvementScore?.value ??
      base.executionScore
  );

  const staffCount =
    humanCapitalResult?.baseline?.headcount &&
    humanCapitalResult.baseline.headcount > 0
      ? humanCapitalResult.baseline.headcount
      : executive?.staff && executive.staff > 0
        ? executive.staff
        : base.staffCount;

  const openRoles =
    humanCapitalResult?.baseline?.openRoles != null
      ? humanCapitalResult.baseline.openRoles
      : base.openRoles;

  const enrollment =
    executive?.enrollment && executive.enrollment > 0
      ? executive.enrollment
      : base.enrollment;

  const studentAttendance = clamp01(
    executive?.studentAttendance != null && executive.studentAttendance > 0
      ? executive.studentAttendance > 1
        ? executive.studentAttendance / 100
        : executive.studentAttendance
      : base.studentAttendance
  );

  const teacherAttendance = clamp01(
    executive?.teacherAttendance != null && executive.teacherAttendance > 0
      ? executive.teacherAttendance > 1
        ? executive.teacherAttendance / 100
        : executive.teacherAttendance
      : base.teacherAttendance
  );

  const operationalComplexity = clamp01(
    businessModelResult?.baseline?.operationalComplexity ??
      0.35 +
        (analysis?.dashboard ? analysis.dashboard.overallRisk * 0.25 : 0.1) +
        (dna?.businessModel?.keyActivities?.length ?? 3) * 0.02
  );

  const staffingAdequacy = clamp(
    workforceScore * 0.55 +
      (100 - openRoles * 6) * 0.25 +
      teacherAttendance * 100 * 0.2
  );

  const capacityHeadroom = clamp(
    55 +
      (staffCount / Math.max(1, enrollment / 12)) * 8 -
      openRoles * 4 -
      operationalComplexity * 20
  );

  const backlogPressure = clamp01(
    0.25 +
      (1 - operationsScore / 100) * 0.35 +
      (analysis?.dashboard ? analysis.dashboard.overallRisk * 0.25 : 0.1)
  );

  const slaRisk = clamp01(
    0.2 +
      backlogPressure * 0.4 +
      (1 - studentAttendance) * 0.5 +
      (prediction?.projection?.scenarios?.length ? 0.05 : 0.1)
  );

  const workflowHealthScore = clamp(
    operationsScore * 0.45 +
      executionScore * 0.25 +
      (100 - backlogPressure * 100) * 0.2 +
      (100 - slaRisk * 100) * 0.1
  );

  const processMaturity = clamp(
    operationsScore * 0.4 +
      executionScore * 0.3 +
      (improvementResult?.healthScore?.value ?? 65) * 0.3
  );

  const automationReadiness = clamp(
    45 +
      (100 - operationalComplexity * 100) * 0.25 +
      processMaturity * 0.25 +
      (businessModelResult?.baseline?.scalabilityScore ?? 60) * 0.15
  );

  const resourceUtilization = clamp(
    55 +
      staffingAdequacy * 0.2 +
      (1 - capacityHeadroom / 100) * 25 +
      studentAttendance * 20
  );

  void dna;

  return {
    workflowHealthScore,
    processMaturity,
    staffingAdequacy,
    capacityHeadroom,
    automationReadiness,
    resourceUtilization,
    operationsScore,
    workforceScore,
    operationalComplexity,
    organizationHealthScore,
    financialScore,
    executionScore,
    staffCount,
    enrollment,
    studentAttendance,
    teacherAttendance,
    openRoles,
    backlogPressure,
    slaRisk,
    ...overrides,
  };
}

/** OperationsModels façade used by DI consumers. */
export const operationsModels = {
  clamp,
  clamp01,
  statusFromScore,
  priorityFromScore,
  priorityFromRisk,
  levelFromValue,
  scoreNarrative,
  buildConfidence,
  buildLenses,
  defaultCreateId,
  defaultPeriodLabel,
  emptyOperationsScope,
  defaultOperationsBaseline,
  deriveOperationsBaseline,
};

export class OperationsModels {
  static clamp = clamp;
  static clamp01 = clamp01;
  static statusFromScore = statusFromScore;
  static priorityFromScore = priorityFromScore;
  static priorityFromRisk = priorityFromRisk;
  static levelFromValue = levelFromValue;
  static scoreNarrative = scoreNarrative;
  static buildConfidence = buildConfidence;
  static buildLenses = buildLenses;
  static defaultCreateId = defaultCreateId;
  static defaultPeriodLabel = defaultPeriodLabel;
  static emptyScope = emptyOperationsScope;
  static baseline = defaultOperationsBaseline;
  static derive = deriveOperationsBaseline;
}
