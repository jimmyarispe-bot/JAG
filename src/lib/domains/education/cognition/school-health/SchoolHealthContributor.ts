import type { CognitiveContributor } from "@/lib/jag/runtime";
import {
  defineEducationCognitiveContributor,
  runEducationIntelligencePipeline,
  type EducationPipelineDefinition,
} from "../framework";
import {
  analyzeSchoolHealth,
  validateSchoolHealthInputs,
} from "./SchoolHealthAnalyzer";
import { collectSchoolHealthEvidence } from "./SchoolHealthEvidence";
import type { SchoolHealthInputs } from "./SchoolHealthInputs";
import { buildSchoolHealthRecommendations } from "./SchoolHealthRecommendations";
import {
  SCHOOL_HEALTH_CONTRIBUTOR_ID,
  SCHOOL_HEALTH_INPUT_ATTR,
  type SchoolHealthIntelligenceResult,
} from "./SchoolHealthTypes";

export const schoolHealthPipelineDefinition: EducationPipelineDefinition<SchoolHealthInputs> =
  {
    contributorId: SCHOOL_HEALTH_CONTRIBUTOR_ID,
    evidenceSource: "education.school_health",
    topicId: "education.school_health",
    attributeKey: SCHOOL_HEALTH_INPUT_ATTR,
    capabilities: ["education", "executive", "school_health", "synthesis"],
    priority: 14,
    subjectId: (inputs) => inputs.subjectId,
    supportsIntent: (intentId) =>
      intentId.includes("executive") ||
      intentId.includes("board") ||
      intentId.includes("quarterly") ||
      intentId.includes("strategic") ||
      intentId.includes("network") ||
      intentId.includes("annual") ||
      intentId.includes("health"),
    validate: validateSchoolHealthInputs,
    collectEvidence: (builder, inputs) => {
      const analysis = analyzeSchoolHealth(inputs);
      collectSchoolHealthEvidence(builder, inputs, analysis);
    },
    recommend: (builder, ctx) => {
      const analysis = analyzeSchoolHealth(ctx.observation);
      buildSchoolHealthRecommendations(builder, ctx, analysis);
    },
    explainReadiness: ({ readiness, blockingIssues, warnings }) => {
      if (readiness === "ready") {
        return "School health synthesis completed from upstream organizational signals.";
      }
      if (readiness === "conditional") {
        return `School health is conditional: ${warnings.join("; ")}`;
      }
      return `School health blocked: ${blockingIssues.join("; ")}`;
    },
  };

export function createSchoolHealthContributor(): CognitiveContributor {
  return defineEducationCognitiveContributor(schoolHealthPipelineDefinition);
}

export function runSchoolHealthIntelligence(
  inputs: SchoolHealthInputs,
  options?: { now?: string }
): SchoolHealthIntelligenceResult {
  const analysis = analyzeSchoolHealth(inputs);
  const result = runEducationIntelligencePipeline(
    schoolHealthPipelineDefinition,
    inputs,
    options
  );
  return {
    ...result,
    stance: analysis.stance,
    healthScore: analysis.healthScore,
  };
}
