/**
 * Academic Progress analysis — Knowledge-aligned signals + Policy Engine results.
 * Does not embed policy evaluation logic; uses EducationPolicyEvaluationPort.
 */

import {
  EDUCATION_CAPABILITY_IDS,
  EDUCATION_CLASSIFICATION_IDS,
  EDUCATION_ENTITY_IDS,
  EDUCATION_POLICY_IDS,
  EDUCATION_RELATIONSHIP_IDS,
} from "../../knowledge";
import {
  createEducationPolicyEngine,
  type EducationPolicyEvaluationPort,
  type EducationPolicyFacts,
  type EducationPolicyResult,
} from "../../policy";
import type { AcademicProgressObservation } from "./AcademicProgressObservation";
import type { AcademicProgressEvidenceCode } from "./AcademicProgressTypes";

export type AcademicProgressTrajectory =
  | "insufficient"
  | "expected"
  | "ahead"
  | "behind"
  | "stalled"
  | "exceptional";

export interface AcademicProgressAnalysis {
  trajectory: AcademicProgressTrajectory;
  signals: AcademicProgressEvidenceCode[];
  goalMasteryDelta?: number;
  courseProgressDelta?: number;
  masteryDelta?: number;
  assessmentReady: boolean;
  interventionIndicated: boolean;
  policyResult: EducationPolicyResult;
  knowledgeRefs: {
    capabilityId: string;
    entityIds: readonly string[];
    relationshipIds: readonly string[];
    classificationIds: readonly string[];
  };
}

export function validateAcademicProgressObservation(
  observation: AcademicProgressObservation
): void {
  if (!observation.organizationId?.trim()) {
    throw new Error("Academic progress observation requires organizationId");
  }
  if (!observation.student?.studentId?.trim()) {
    throw new Error("Academic progress observation requires student.studentId");
  }
}

export function analyzeAcademicProgress(
  observation: AcademicProgressObservation,
  options?: {
    policyPort?: EducationPolicyEvaluationPort;
    now?: string;
  }
): AcademicProgressAnalysis {
  const policyPort =
    options?.policyPort ??
    (createEducationPolicyEngine() as EducationPolicyEvaluationPort);

  const facts = toPolicyFacts(observation);
  const policyResult = policyPort.evaluate({
    subjectId: observation.student.studentId,
    organizationId: observation.organizationId,
    facts,
    policyIds: [
      EDUCATION_POLICY_IDS.graduationCredits,
      ...(observation.attendanceSummary
        ? [
            EDUCATION_POLICY_IDS.attendanceMinimumRate,
            EDUCATION_POLICY_IDS.attendanceChronicAbsence,
          ]
        : []),
    ],
    now: options?.now,
  });

  const hasGoals = (observation.goals?.length ?? 0) > 0;
  const hasCourses = (observation.courses?.length ?? 0) > 0;
  const hasMastery = (observation.masteryIndicators?.length ?? 0) > 0;
  const hasAssessments = (observation.assessments?.length ?? 0) > 0;
  const hasCredits = observation.earnedCredits !== undefined;

  const insufficient =
    !hasGoals && !hasCourses && !hasMastery && !hasAssessments && !hasCredits;

  const goalMasteryDelta = averageDelta(
    (observation.goals ?? [])
      .filter(
        (g) =>
          g.currentMastery !== undefined && g.targetMastery !== undefined
      )
      .map((g) => g.currentMastery! - g.targetMastery!)
  );

  const courseProgressDelta = averageDelta(
    (observation.courses ?? [])
      .filter(
        (c) =>
          c.progressRatio !== undefined &&
          c.expectedProgressRatio !== undefined
      )
      .map((c) => c.progressRatio! - c.expectedProgressRatio!)
  );

  const masteryDelta = averageDelta(
    (observation.masteryIndicators ?? [])
      .filter((m) => m.expectedLevel !== undefined)
      .map((m) => m.level - m.expectedLevel!)
  );

  const composite = meanOfDefined([
    goalMasteryDelta,
    courseProgressDelta,
    masteryDelta,
    creditDelta(observation),
  ]);

  const stalled = detectStalled(observation);
  const exceptional =
    composite !== undefined && composite >= 0.2 && !stalled;

  let trajectory: AcademicProgressTrajectory = "expected";
  if (insufficient) trajectory = "insufficient";
  else if (stalled) trajectory = "stalled";
  else if (exceptional) trajectory = "exceptional";
  else if (composite !== undefined && composite >= 0.08) trajectory = "ahead";
  else if (composite !== undefined && composite <= -0.08) trajectory = "behind";

  const assessmentReady = isAssessmentReady(observation);
  const interventionIndicated =
    trajectory === "behind" ||
    trajectory === "stalled" ||
    (observation.interventionHistory?.some((i) => i.active) === true &&
      trajectory !== "ahead" &&
      trajectory !== "exceptional");

  const signals = buildSignals({
    insufficient,
    trajectory,
    assessmentReady,
    interventionIndicated,
    goalMasteryDelta,
    policyResult,
    hasAttendanceSummary: Boolean(observation.attendanceSummary),
  });

  return {
    trajectory,
    signals,
    goalMasteryDelta,
    courseProgressDelta,
    masteryDelta,
    assessmentReady,
    interventionIndicated,
    policyResult,
    knowledgeRefs: {
      capabilityId: EDUCATION_CAPABILITY_IDS.academicProgress,
      entityIds: [
        EDUCATION_ENTITY_IDS.student,
        EDUCATION_ENTITY_IDS.program,
        EDUCATION_ENTITY_IDS.goal,
        EDUCATION_ENTITY_IDS.assessment,
        EDUCATION_ENTITY_IDS.progressRecord,
        EDUCATION_ENTITY_IDS.intervention,
      ],
      relationshipIds: [
        EDUCATION_RELATIONSHIP_IDS.studentHasGoal,
        EDUCATION_RELATIONSHIP_IDS.assessmentMeasuresGoal,
        EDUCATION_RELATIONSHIP_IDS.progressRecordForStudent,
        EDUCATION_RELATIONSHIP_IDS.interventionTargetsStudent,
      ],
      classificationIds: [
        EDUCATION_CLASSIFICATION_IDS.assessmentType,
        EDUCATION_CLASSIFICATION_IDS.interventionType,
        EDUCATION_CLASSIFICATION_IDS.programType,
      ],
    },
  };
}

function toPolicyFacts(
  observation: AcademicProgressObservation
): EducationPolicyFacts {
  return {
    earnedCredits: observation.earnedCredits,
    attendancePresentRate: observation.attendanceSummary?.presentRate,
    attendanceAbsenceCount: observation.attendanceSummary?.absenceCount,
    assessmentComplete: observation.assessments?.every(
      (a) =>
        a.status === "complete" ||
        a.status === "waived" ||
        a.status === "not_required"
    ),
  };
}

function buildSignals(input: {
  insufficient: boolean;
  trajectory: AcademicProgressTrajectory;
  assessmentReady: boolean;
  interventionIndicated: boolean;
  goalMasteryDelta?: number;
  policyResult: EducationPolicyResult;
  hasAttendanceSummary: boolean;
}): AcademicProgressEvidenceCode[] {
  const signals: AcademicProgressEvidenceCode[] = ["knowledge_entities_bound"];

  if (input.insufficient) {
    signals.push("insufficient_evidence");
    return signals;
  }

  switch (input.trajectory) {
    case "expected":
      signals.push("expected_progress");
      break;
    case "ahead":
      signals.push("ahead_of_expectations");
      break;
    case "behind":
      signals.push("behind_expectations");
      break;
    case "stalled":
      signals.push("stalled_progress");
      break;
    case "exceptional":
      signals.push("exceptional_growth");
      break;
  }

  if (input.assessmentReady) signals.push("assessment_ready");
  else signals.push("assessment_not_ready");

  if (input.interventionIndicated) signals.push("intervention_indicated");

  if (input.goalMasteryDelta !== undefined) {
    if (input.goalMasteryDelta >= -0.05) signals.push("goal_mastery_on_track");
    else signals.push("goal_mastery_behind");
  }

  const graduation = input.policyResult.evaluations.find(
    (e) => e.policyId === EDUCATION_POLICY_IDS.graduationCredits
  );
  if (graduation?.outcome === "satisfied") {
    signals.push("policy_graduation_satisfied");
  } else if (graduation?.outcome === "violated") {
    signals.push("policy_graduation_violated");
  } else if (graduation?.outcome === "unknown") {
    signals.push("policy_graduation_unknown");
  }

  if (input.hasAttendanceSummary) {
    signals.push("policy_attendance_context");
  }

  return signals;
}

function isAssessmentReady(observation: AcademicProgressObservation): boolean {
  const assessments = observation.assessments ?? [];
  if (assessments.length === 0) return false;
  return assessments.every((a) => {
    if (
      a.status === "complete" ||
      a.status === "waived" ||
      a.status === "not_required"
    ) {
      return true;
    }
    if (a.status === "pending") return false;
    if (a.score !== undefined && a.readinessThreshold !== undefined) {
      return a.score >= a.readinessThreshold;
    }
    return false;
  });
}

function detectStalled(observation: AcademicProgressObservation): boolean {
  const courses = observation.courses ?? [];
  if (courses.length === 0) return false;
  return courses.every((c) => {
    if (
      c.progressRatio === undefined ||
      c.expectedProgressRatio === undefined
    ) {
      return false;
    }
    return c.progressRatio <= 0.05 && c.expectedProgressRatio >= 0.25;
  });
}

function creditDelta(
  observation: AcademicProgressObservation
): number | undefined {
  if (
    observation.earnedCredits === undefined ||
    observation.expectedCreditsAtCheckpoint === undefined
  ) {
    return undefined;
  }
  const expected = observation.expectedCreditsAtCheckpoint;
  if (expected <= 0) return undefined;
  return (observation.earnedCredits - expected) / Math.max(expected, 1);
}

function averageDelta(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function meanOfDefined(values: Array<number | undefined>): number | undefined {
  const defined = values.filter((v): v is number => v !== undefined);
  if (defined.length === 0) return undefined;
  return defined.reduce((a, b) => a + b, 0) / defined.length;
}
