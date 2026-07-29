import type { CognitiveContributor } from "@/lib/jag/runtime";
import {
  defineEducationCognitiveContributor,
  runEducationIntelligencePipeline,
  type EducationPipelineDefinition,
} from "../framework";
import { analyzeScholarship } from "./ScholarshipAnalyzer";
import { collectScholarshipEvidence } from "./ScholarshipEvidence";
import {
  validateScholarshipObservation,
  type ScholarshipObservation,
} from "./ScholarshipObservation";
import { buildScholarshipRecommendations } from "./ScholarshipRecommendations";
import {
  SCHOLARSHIP_CONTRIBUTOR_ID,
  SCHOLARSHIP_OBSERVATION_ATTR,
  type ScholarshipIntelligenceResult,
} from "./ScholarshipTypes";

export const scholarshipPipelineDefinition: EducationPipelineDefinition<ScholarshipObservation> =
  {
    contributorId: SCHOLARSHIP_CONTRIBUTOR_ID,
    evidenceSource: "education.scholarship",
    topicId: "education.scholarship",
    attributeKey: SCHOLARSHIP_OBSERVATION_ATTR,
    capabilities: ["education", "scholarship", "funding"],
    priority: 43,
    subjectId: (o) => o.student.studentId,
    supportsIntent: (intentId) =>
      intentId.includes("scholarship") ||
      intentId.includes("funding") ||
      intentId.includes("eligibility"),
    validate: validateScholarshipObservation,
    collectEvidence: (builder, observation) => {
      collectScholarshipEvidence(
        builder,
        observation,
        analyzeScholarship(observation)
      );
    },
    recommend: (builder, ctx) => {
      buildScholarshipRecommendations(
        builder,
        ctx,
        analyzeScholarship(ctx.observation)
      );
    },
    explainReadiness: ({ readiness, blockingIssues, warnings }) => {
      if (readiness === "ready") {
        return "Scholarship intelligence completed from host award observations.";
      }
      if (readiness === "conditional") {
        return `Scholarship is conditional: ${warnings.join("; ")}`;
      }
      return `Scholarship blocked: ${blockingIssues.join("; ")}`;
    },
  };

export function createScholarshipContributor(): CognitiveContributor {
  return defineEducationCognitiveContributor(scholarshipPipelineDefinition);
}

export function runScholarshipIntelligence(
  observation: ScholarshipObservation,
  options?: { now?: string }
): ScholarshipIntelligenceResult {
  const analysis = analyzeScholarship(observation);
  const result = runEducationIntelligencePipeline(
    scholarshipPipelineDefinition,
    observation,
    options
  );
  return {
    ...result,
    studentId: result.subjectId,
    eligibleCount: analysis.eligibleIds.length,
    renewalRiskCount: analysis.renewalRiskIds.length,
  };
}
