/**
 * Normalized Academic Progress observation — host-supplied only.
 * References Knowledge Model concepts via ids/codes; no DB access.
 */

import type { EducationObservationBase } from "../framework";

export interface AcademicProgressStudentContract {
  studentId: string;
  displayName?: string;
}

export interface AcademicProgressProgramContract {
  programId: string;
  name?: string;
  /** education.class.program_type code */
  typeCode?: string;
}

export interface AcademicProgressGoalContract {
  goalId: string;
  label?: string;
  /** Target mastery 0..1 */
  targetMastery?: number;
  /** Current mastery 0..1 */
  currentMastery?: number;
}

export interface AcademicProgressMasteryIndicator {
  skillId: string;
  label?: string;
  level: number;
  expectedLevel?: number;
}

export interface AcademicProgressAssessmentSummary {
  assessmentId: string;
  /** education.class.assessment_type code */
  typeCode?: string;
  status: "not_required" | "pending" | "complete" | "waived";
  score?: number;
  /** Expected readiness score threshold 0..1 */
  readinessThreshold?: number;
}

export interface AcademicProgressCourseProgress {
  courseId: string;
  name?: string;
  /** Completed fraction 0..1 */
  progressRatio?: number;
  /** Expected fraction for this point in term 0..1 */
  expectedProgressRatio?: number;
}

export interface AcademicProgressInterventionHistoryItem {
  interventionId: string;
  /** education.class.intervention_type code */
  typeCode?: string;
  active?: boolean;
}

export interface AcademicProgressAttendanceSummary {
  presentRate?: number;
  absenceCount?: number;
}

export interface AcademicProgressObservation extends EducationObservationBase {
  student: AcademicProgressStudentContract;
  program?: AcademicProgressProgramContract;
  goals?: readonly AcademicProgressGoalContract[];
  masteryIndicators?: readonly AcademicProgressMasteryIndicator[];
  assessments?: readonly AcademicProgressAssessmentSummary[];
  courses?: readonly AcademicProgressCourseProgress[];
  interventionHistory?: readonly AcademicProgressInterventionHistoryItem[];
  attendanceSummary?: AcademicProgressAttendanceSummary;
  /** Credits earned (graduation policy facts). */
  earnedCredits?: number;
  /** Optional expected credits for trajectory (not a Knowledge policy param). */
  expectedCreditsAtCheckpoint?: number;
}
