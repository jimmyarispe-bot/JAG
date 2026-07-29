import type { CognitiveContributor } from "@/lib/jag/runtime";
import {
  defineEducationCognitiveContributor,
  runEducationIntelligencePipeline,
  type EducationPipelineDefinition,
} from "../framework";
import {
  analyzeCampusPerformance,
  validateCampusPerformanceInputs,
} from "./CampusPerformanceAnalyzer";
import { collectCampusPerformanceEvidence } from "./CampusPerformanceEvidence";
import type { CampusPerformanceInputs } from "./CampusPerformanceInputs";
import { buildCampusPerformanceRecommendations } from "./CampusPerformanceRecommendations";
import {
  CAMPUS_PERFORMANCE_CONTRIBUTOR_ID,
  CAMPUS_PERFORMANCE_INPUT_ATTR,
  type CampusPerformanceIntelligenceResult,
} from "./CampusPerformanceTypes";

export const campusPerformancePipelineDefinition: EducationPipelineDefinition<CampusPerformanceInputs> =
  {
    contributorId: CAMPUS_PERFORMANCE_CONTRIBUTOR_ID,
    evidenceSource: "education.campus_performance",
    topicId: "education.campus_performance",
    attributeKey: CAMPUS_PERFORMANCE_INPUT_ATTR,
    capabilities: [
      "education",
      "executive",
      "campus_performance",
      "synthesis",
    ],
    priority: 14,
    subjectId: (inputs) => inputs.subjectId,
    supportsIntent: (intentId) =>
      intentId.includes("executive") ||
      intentId.includes("board") ||
      intentId.includes("campus") ||
      intentId.includes("network") ||
      intentId.includes("strategic") ||
      intentId.includes("quarterly") ||
      intentId.includes("annual"),
    validate: validateCampusPerformanceInputs,
    collectEvidence: (builder, inputs) => {
      const analysis = analyzeCampusPerformance(inputs);
      collectCampusPerformanceEvidence(builder, inputs, analysis);
    },
    recommend: (builder, ctx) => {
      const analysis = analyzeCampusPerformance(ctx.observation);
      buildCampusPerformanceRecommendations(builder, ctx, analysis);
    },
    explainReadiness: ({ readiness, blockingIssues, warnings }) => {
      if (readiness === "ready") {
        return "Campus performance synthesis completed from aggregated upstream outputs.";
      }
      if (readiness === "conditional") {
        return `Campus performance is conditional: ${warnings.join("; ")}`;
      }
      return `Campus performance blocked: ${blockingIssues.join("; ")}`;
    },
  };

export function createCampusPerformanceContributor(): CognitiveContributor {
  return defineEducationCognitiveContributor(
    campusPerformancePipelineDefinition
  );
}

export function runCampusPerformanceIntelligence(
  inputs: CampusPerformanceInputs,
  options?: { now?: string }
): CampusPerformanceIntelligenceResult {
  const analysis = analyzeCampusPerformance(inputs);
  const result = runEducationIntelligencePipeline(
    campusPerformancePipelineDefinition,
    inputs,
    options
  );
  return {
    ...result,
    stance: analysis.stance,
    performanceScore: analysis.performanceScore,
  };
}
