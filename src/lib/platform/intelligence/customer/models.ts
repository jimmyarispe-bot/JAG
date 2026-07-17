/**
 * Customer Intelligence — CustomerModels helpers (Sprint 039).
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
  CustomerBaseline,
  CustomerConfidenceLevel,
  CustomerConfidenceScore,
  CustomerHealthStatus,
  CustomerLensImpact,
  CustomerPriorityBand,
  OperationsResultLight,
  RevenueResultLight,
} from "@/lib/platform/intelligence/customer/types";
import {
  buildConfidenceAverageEmptyHalf,
  clamp01 as sharedClamp01,
  clampUnchecked,
  defaultCreateId as sharedDefaultCreateId,
  emptyGraphScope,
  levelFromValue as sharedLevelFromValue,
  periodLabelQuarter,
  priorityFromRisk as sharedPriorityFromRisk,
  priorityFromScoreLowUrgent,
  scoreNarrative as sharedScoreNarrative,
  statusFromScore as sharedStatusFromScore,
} from "@/lib/platform/intelligence/common";


export const clamp = clampUnchecked;

export const clamp01 = sharedClamp01;

export function statusFromScore(score: number): CustomerHealthStatus { return sharedStatusFromScore(score); }

export function priorityFromScore(score: number): CustomerPriorityBand { return priorityFromScoreLowUrgent(score); }

export function priorityFromRisk(risk: number): CustomerPriorityBand { return sharedPriorityFromRisk(risk); }

export function levelFromValue(value: number): CustomerConfidenceLevel { return sharedLevelFromValue(value); }

export function scoreNarrative(
  label: string,
  value: number,
  status: CustomerHealthStatus
): string {
  return sharedScoreNarrative(label, value, status);
}

export function buildConfidence(
  factors: Array<{ key: string; label: string; contribution: number }>
): CustomerConfidenceScore {
  return buildConfidenceAverageEmptyHalf(factors) as CustomerConfidenceScore;
}

export function buildLenses(
  partial: Partial<CustomerLensImpact> &
    Pick<
      CustomerLensImpact,
      | "familyExperience"
      | "studentEngagement"
      | "journeyContinuity"
      | "satisfactionSentiment"
      | "retentionRisk"
      | "communityBelonging"
    >
): CustomerLensImpact {
  return {
    familyExperience: partial.familyExperience,
    studentEngagement: partial.studentEngagement,
    journeyContinuity: partial.journeyContinuity,
    satisfactionSentiment: partial.satisfactionSentiment,
    retentionRisk: partial.retentionRisk,
    communityBelonging: partial.communityBelonging,
  };
}

export const defaultCreateId = sharedDefaultCreateId;

export const defaultPeriodLabel = periodLabelQuarter;

export const emptyCustomerScope = (): GraphScope => emptyGraphScope();

export function defaultCustomerBaseline(): CustomerBaseline {
  return {
    familyExperienceScore: 70,
    studentEngagementScore: 72,
    journeyContinuityScore: 68,
    satisfactionScore: 71,
    retentionHealthScore: 74,
    communityBelongingScore: 69,
    organizationHealthScore: 75,
    enrollmentScore: 72,
    enrollment: 420,
    studentAttendance: 0.94,
    admissions: 48,
    personaCount: 4,
    communicationQuality: 68,
    complaintBurden: 0.28,
    withdrawalRisk: 0.22,
    belongingIndex: 70,
    operationsSupportScore: 70,
    revenueRetentionProxy: 72,
    executionScore: 68,
    journeyFriction: 0.32,
  };
}

/** Derive baseline from DNA / OIOS / graph / revenue / operations soft signals. */
export function deriveCustomerBaseline(
  dna: OrganizationDNA | null | undefined,
  oios: OiosResult | null | undefined,
  analysis: GraphAnalysisResult | null | undefined,
  graphInput: GraphBuildInput | null | undefined,
  prediction: PredictionResult | null | undefined,
  revenueResult?: RevenueResultLight | null,
  operationsResult?: OperationsResultLight | null,
  overrides?: Partial<CustomerBaseline>
): CustomerBaseline {
  const base = defaultCustomerBaseline();
  const health = graphInput?.organizationHealth;
  const executive = graphInput?.executive;

  const organizationHealthScore = clamp(
    oios?.health.score ?? health?.overallScore ?? base.organizationHealthScore
  );

  const enrollmentScore = clamp(
    health?.enrollmentScore ?? base.enrollmentScore
  );

  const executionScore = clamp(
    oios?.baseline.executionScore ?? base.executionScore
  );

  const enrollment =
    executive?.enrollment && executive.enrollment > 0
      ? executive.enrollment
      : base.enrollment;

  const admissions =
    executive?.admissions != null && executive.admissions > 0
      ? executive.admissions
      : base.admissions;

  const studentAttendance = clamp01(
    operationsResult?.baseline?.studentAttendance != null &&
      operationsResult.baseline.studentAttendance > 0
      ? operationsResult.baseline.studentAttendance > 1
        ? operationsResult.baseline.studentAttendance / 100
        : operationsResult.baseline.studentAttendance
      : executive?.studentAttendance != null && executive.studentAttendance > 0
        ? executive.studentAttendance > 1
          ? executive.studentAttendance / 100
          : executive.studentAttendance
        : base.studentAttendance
  );

  const personaCount =
    dna?.profile?.personas?.length && dna.profile.personas.length > 0
      ? dna.profile.personas.length
      : dna?.businessModel?.customerSegments?.length &&
          dna.businessModel.customerSegments.length > 0
        ? dna.businessModel.customerSegments.length
        : base.personaCount;

  const operationsSupportScore = clamp(
    operationsResult?.healthScore?.value ??
      operationsResult?.baseline?.operationsScore ??
      health?.operationsScore ??
      base.operationsSupportScore
  );

  const revenueRetentionProxy = clamp(
    revenueResult?.retentionScore?.value ??
      (revenueResult?.baseline?.retentionRate != null
        ? revenueResult.baseline.retentionRate > 1
          ? revenueResult.baseline.retentionRate
          : revenueResult.baseline.retentionRate * 100
        : undefined) ??
      revenueResult?.healthScore?.value ??
      base.revenueRetentionProxy
  );

  const slaRisk = operationsResult?.baseline?.slaRisk ?? 0.3;
  const backlogPressure = operationsResult?.baseline?.backlogPressure ?? 0.32;

  const communicationQuality = clamp(
    55 +
      operationsSupportScore * 0.25 +
      (100 - slaRisk * 100) * 0.2 +
      (personaCount > 3 ? 8 : 4)
  );

  const complaintBurden = clamp01(
    0.15 +
      (1 - organizationHealthScore / 100) * 0.25 +
      slaRisk * 0.3 +
      backlogPressure * 0.2
  );

  const journeyFriction = clamp01(
    0.2 +
      (1 - enrollmentScore / 100) * 0.25 +
      backlogPressure * 0.25 +
      (analysis?.dashboard ? analysis.dashboard.overallRisk * 0.2 : 0.1) +
      (prediction?.projection?.scenarios?.length ? 0.05 : 0.08)
  );

  const withdrawalRisk = clamp01(
    0.12 +
      (1 - revenueRetentionProxy / 100) * 0.35 +
      (1 - studentAttendance) * 0.4 +
      complaintBurden * 0.25
  );

  const studentEngagementScore = clamp(
    studentAttendance * 55 +
      enrollmentScore * 0.25 +
      communicationQuality * 0.2
  );

  const journeyContinuityScore = clamp(
    enrollmentScore * 0.35 +
      (100 - journeyFriction * 100) * 0.35 +
      executionScore * 0.2 +
      (admissions > 0 ? 70 : 55) * 0.1
  );

  const satisfactionScore = clamp(
    organizationHealthScore * 0.3 +
      (100 - complaintBurden * 100) * 0.35 +
      communicationQuality * 0.25 +
      revenueRetentionProxy * 0.1
  );

  const belongingIndex = clamp(
    50 +
      personaCount * 3 +
      studentEngagementScore * 0.25 +
      satisfactionScore * 0.2 -
      withdrawalRisk * 25
  );

  const communityBelongingScore = clamp(belongingIndex);

  const retentionHealthScore = clamp(
    revenueRetentionProxy * 0.4 +
      (100 - withdrawalRisk * 100) * 0.35 +
      studentEngagementScore * 0.15 +
      communityBelongingScore * 0.1
  );

  const familyExperienceScore = clamp(
    journeyContinuityScore * 0.25 +
      satisfactionScore * 0.25 +
      studentEngagementScore * 0.2 +
      communityBelongingScore * 0.15 +
      communicationQuality * 0.15
  );

  return {
    familyExperienceScore,
    studentEngagementScore,
    journeyContinuityScore,
    satisfactionScore,
    retentionHealthScore,
    communityBelongingScore,
    organizationHealthScore,
    enrollmentScore,
    enrollment,
    studentAttendance,
    admissions,
    personaCount,
    communicationQuality,
    complaintBurden,
    withdrawalRisk,
    belongingIndex,
    operationsSupportScore,
    revenueRetentionProxy,
    executionScore,
    journeyFriction,
    ...overrides,
  };
}

/** CustomerModels façade used by DI consumers. */
export const customerModels = {
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
  emptyCustomerScope,
  defaultCustomerBaseline,
  deriveCustomerBaseline,
};

export class CustomerModels {
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
  static emptyScope = emptyCustomerScope;
  static baseline = defaultCustomerBaseline;
  static derive = deriveCustomerBaseline;
}
