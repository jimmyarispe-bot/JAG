/**
 * Student Success Intelligence — synthesis CognitiveContributor.
 * Reasons over Enrollment / Attendance / Progress outputs.
 */

import type { CognitiveContributor } from "@/lib/jag/runtime";
import {
  defineEducationCognitiveContributor,
  runEducationIntelligencePipeline,
  type EducationPipelineDefinition,
} from "../framework";
import {
  analyzeStudentSuccess,
  validateStudentSuccessInputs,
} from "./StudentSuccessAnalyzer";
import { collectStudentSuccessEvidence } from "./StudentSuccessEvidence";
import type { StudentSuccessInputs } from "./StudentSuccessInputs";
import { buildStudentSuccessRecommendations } from "./StudentSuccessRecommendations";
import {
  STUDENT_SUCCESS_CONTRIBUTOR_ID,
  STUDENT_SUCCESS_INPUT_ATTR,
  type StudentSuccessIntelligenceResult,
} from "./StudentSuccessTypes";

export const studentSuccessPipelineDefinition: EducationPipelineDefinition<StudentSuccessInputs> =
  {
    contributorId: STUDENT_SUCCESS_CONTRIBUTOR_ID,
    evidenceSource: "education.student_success",
    topicId: "education.student_success",
    attributeKey: STUDENT_SUCCESS_INPUT_ATTR,
    capabilities: ["education", "student_success", "synthesis"],
    priority: 30,
    subjectId: (inputs) => inputs.subjectId,
    supportsIntent: (intentId) =>
      intentId.includes("student_success") ||
      intentId.includes("quarterly") ||
      intentId.includes("advisor") ||
      intentId.includes("leadership") ||
      intentId.includes("brief") ||
      intentId.includes("success"),
    validate: validateStudentSuccessInputs,
    collectEvidence: (builder, inputs) => {
      const analysis = analyzeStudentSuccess(inputs);
      collectStudentSuccessEvidence(builder, inputs, analysis);
    },
    recommend: (builder, ctx) => {
      const analysis = analyzeStudentSuccess(ctx.observation);
      buildStudentSuccessRecommendations(builder, ctx, analysis);
    },
    explainReadiness: ({ readiness, blockingIssues, warnings }) => {
      if (readiness === "ready") {
        return "Student success synthesis completed from upstream contributor outputs.";
      }
      if (readiness === "conditional") {
        return `Student success synthesis is conditional: ${warnings.join("; ")}`;
      }
      return `Student success synthesis blocked: ${blockingIssues.join("; ")}`;
    },
  };

export function createStudentSuccessContributor(): CognitiveContributor {
  return defineEducationCognitiveContributor(studentSuccessPipelineDefinition);
}

/** Direct host/test API — synthesis over upstream results only. */
export function runStudentSuccessIntelligence(
  inputs: StudentSuccessInputs,
  options?: { now?: string }
): StudentSuccessIntelligenceResult {
  const analysis = analyzeStudentSuccess(inputs);
  const result = runEducationIntelligencePipeline(
    studentSuccessPipelineDefinition,
    inputs,
    options
  );
  return {
    ...result,
    studentId: result.subjectId,
    trajectory: analysis.trajectory,
  };
}

export function analyzeStudentSuccessIntelligence(
  inputs: StudentSuccessInputs,
  options?: { now?: string }
): StudentSuccessIntelligenceResult {
  return runStudentSuccessIntelligence(inputs, options);
}
