/**
 * Academic Progress Intelligence — CognitiveContributor via shared framework.
 * Consumes Knowledge Model bindings + Policy Engine evaluations.
 */

import type { CognitiveContributor } from "@/lib/jag/runtime";
import {
  defineEducationCognitiveContributor,
  runEducationIntelligencePipeline,
  type EducationPipelineDefinition,
} from "../framework";
import {
  analyzeAcademicProgress,
  validateAcademicProgressObservation,
} from "./AcademicProgressAnalyzer";
import { collectAcademicProgressEvidence } from "./AcademicProgressEvidence";
import type { AcademicProgressObservation } from "./AcademicProgressObservation";
import { buildAcademicProgressRecommendations } from "./AcademicProgressRecommendations";
import {
  PROGRESS_CONTRIBUTOR_ID,
  PROGRESS_OBSERVATION_ATTR,
  type AcademicProgressIntelligenceResult,
} from "./AcademicProgressTypes";
import type { EducationPolicyEvaluationPort } from "../../policy";

export interface AcademicProgressContributorOptions {
  /** Inject Policy Engine port (tests / hosts). */
  policyPort?: EducationPolicyEvaluationPort;
}

export function createAcademicProgressPipelineDefinition(
  options: AcademicProgressContributorOptions = {}
): EducationPipelineDefinition<AcademicProgressObservation> {
  return {
    contributorId: PROGRESS_CONTRIBUTOR_ID,
    evidenceSource: "education.progress",
    topicId: "education.progress",
    attributeKey: PROGRESS_OBSERVATION_ATTR,
    capabilities: ["education", "progress", "academic_progress"],
    priority: 40,
    subjectId: (observation) => observation.student.studentId,
    supportsIntent: (intentId) =>
      intentId.includes("progress") ||
      intentId.includes("student_success") ||
      intentId.includes("assess") ||
      intentId === "education.review" ||
      intentId.endsWith(".support"),
    validate: validateAcademicProgressObservation,
    collectEvidence: (builder, observation) => {
      const analysis = analyzeAcademicProgress(observation, {
        policyPort: options.policyPort,
      });
      collectAcademicProgressEvidence(builder, observation, analysis);
    },
    recommend: (builder, ctx) => {
      const analysis = analyzeAcademicProgress(ctx.observation, {
        policyPort: options.policyPort,
        now: ctx.now,
      });
      buildAcademicProgressRecommendations(builder, ctx, analysis);
    },
    explainReadiness: ({ readiness, blockingIssues, warnings }) => {
      if (readiness === "ready") {
        return "Academic progress observation supports a clear trajectory with Knowledge/Policy evidence.";
      }
      if (readiness === "conditional") {
        return `Academic progress is conditionally ready with warnings: ${warnings.join("; ")}`;
      }
      return `Academic progress is blocked: ${blockingIssues.join("; ")}`;
    },
  };
}

export const academicProgressPipelineDefinition =
  createAcademicProgressPipelineDefinition();

export function createAcademicProgressContributor(
  options: AcademicProgressContributorOptions = {}
): CognitiveContributor {
  return defineEducationCognitiveContributor(
    createAcademicProgressPipelineDefinition(options)
  );
}

/** Direct host/test API — same intelligence without a Think request. */
export function runAcademicProgressIntelligence(
  observation: AcademicProgressObservation,
  options?: { now?: string; policyPort?: EducationPolicyEvaluationPort }
): AcademicProgressIntelligenceResult {
  const definition = createAcademicProgressPipelineDefinition({
    policyPort: options?.policyPort,
  });
  const result = runEducationIntelligencePipeline(definition, observation, {
    now: options?.now,
  });
  return { ...result, studentId: result.subjectId };
}

export function analyzeAcademicProgressIntelligence(
  observation: AcademicProgressObservation,
  options?: { now?: string; policyPort?: EducationPolicyEvaluationPort }
): AcademicProgressIntelligenceResult {
  return runAcademicProgressIntelligence(observation, options);
}
