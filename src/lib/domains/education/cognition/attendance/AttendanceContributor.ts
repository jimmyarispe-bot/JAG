/**
 * Attendance Intelligence — CognitiveContributor via shared framework.
 */

import type { CognitiveContributor } from "@/lib/jag/runtime";
import {
  defineEducationCognitiveContributor,
  runEducationIntelligencePipeline,
  type EducationPipelineDefinition,
} from "../framework";
import {
  analyzeAttendanceMetrics,
  validateAttendanceObservation,
} from "./AttendanceAnalyzer";
import { collectAttendanceEvidence } from "./AttendanceEvidence";
import type { AttendanceObservation } from "./AttendanceObservation";
import { buildAttendanceRecommendations } from "./AttendanceRecommendations";
import {
  ATTENDANCE_CONTRIBUTOR_ID,
  ATTENDANCE_OBSERVATION_ATTR,
  type AttendanceIntelligenceResult,
} from "./AttendanceTypes";

export const attendancePipelineDefinition: EducationPipelineDefinition<AttendanceObservation> =
  {
    contributorId: ATTENDANCE_CONTRIBUTOR_ID,
    evidenceSource: "education.attendance",
    topicId: "education.attendance",
    attributeKey: ATTENDANCE_OBSERVATION_ATTR,
    capabilities: ["education", "attendance"],
    priority: 45,
    subjectId: (observation) => observation.student.studentId,
    supportsIntent: (intentId) =>
      intentId === "education.review" ||
      intentId.includes("attendance") ||
      intentId.endsWith(".support"),
    validate: validateAttendanceObservation,
    collectEvidence: (builder, observation) => {
      const metrics = analyzeAttendanceMetrics(observation);
      collectAttendanceEvidence(builder, observation, metrics);
    },
    recommend: (builder, ctx) => {
      const metrics = analyzeAttendanceMetrics(ctx.observation);
      buildAttendanceRecommendations(builder, ctx, metrics);
    },
    explainReadiness: ({ readiness, blockingIssues, warnings }) => {
      if (readiness === "ready") {
        return "Attendance observation satisfies readiness criteria with supporting evidence.";
      }
      if (readiness === "conditional") {
        return `Attendance is conditionally ready with warnings: ${warnings.join("; ")}`;
      }
      return `Attendance is blocked: ${blockingIssues.join("; ")}`;
    },
  };

export function createAttendanceContributor(): CognitiveContributor {
  return defineEducationCognitiveContributor(attendancePipelineDefinition);
}

/** Direct host/test API — same intelligence without a Think request. */
export function runAttendanceIntelligence(
  observation: AttendanceObservation,
  options?: { now?: string }
): AttendanceIntelligenceResult {
  const result = runEducationIntelligencePipeline(
    attendancePipelineDefinition,
    observation,
    options
  );
  return { ...result, studentId: result.subjectId };
}

export function analyzeAttendance(
  observation: AttendanceObservation,
  options?: { now?: string }
): AttendanceIntelligenceResult {
  return runAttendanceIntelligence(observation, options);
}
