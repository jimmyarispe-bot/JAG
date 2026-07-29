/**
 * Support Planning — Student Support synthesis CognitiveContributor.
 */

import type { CognitiveContributor } from "@/lib/jag/runtime";
import {
  defineEducationCognitiveContributor,
  runEducationIntelligencePipeline,
  type EducationPipelineDefinition,
} from "../framework";
import {
  analyzeSupportPlanning,
  validateSupportPlanningInputs,
} from "./SupportPlanningAnalyzer";
import { collectSupportPlanningEvidence } from "./SupportPlanningEvidence";
import type { SupportPlanningInputs } from "./SupportPlanningInputs";
import { buildSupportPlanningRecommendations } from "./SupportPlanningRecommendations";
import {
  SUPPORT_PLANNING_CONTRIBUTOR_ID,
  SUPPORT_PLANNING_INPUT_ATTR,
  type SupportPlanningIntelligenceResult,
} from "./SupportPlanningTypes";

export const supportPlanningPipelineDefinition: EducationPipelineDefinition<SupportPlanningInputs> =
  {
    contributorId: SUPPORT_PLANNING_CONTRIBUTOR_ID,
    evidenceSource: "education.support_planning",
    topicId: "education.support_planning",
    attributeKey: SUPPORT_PLANNING_INPUT_ATTR,
    capabilities: ["education", "support", "support_planning", "synthesis"],
    priority: 20,
    subjectId: (inputs) => inputs.subjectId,
    supportsIntent: (intentId) =>
      intentId.includes("support") ||
      intentId.includes("mtss") ||
      intentId.includes("student_services") ||
      intentId.includes("student-services") ||
      intentId.includes("intervention") ||
      intentId.includes("family"),
    validate: validateSupportPlanningInputs,
    collectEvidence: (builder, inputs) => {
      const analysis = analyzeSupportPlanning(inputs);
      collectSupportPlanningEvidence(builder, inputs, analysis);
    },
    recommend: (builder, ctx) => {
      const analysis = analyzeSupportPlanning(ctx.observation);
      buildSupportPlanningRecommendations(builder, ctx, analysis);
    },
    explainReadiness: ({ readiness, blockingIssues, warnings }) => {
      if (readiness === "ready") {
        return "Support planning synthesis completed from upstream support contributor outputs.";
      }
      if (readiness === "conditional") {
        return `Support planning is conditional: ${warnings.join("; ")}`;
      }
      return `Support planning blocked: ${blockingIssues.join("; ")}`;
    },
  };

export function createSupportPlanningContributor(): CognitiveContributor {
  return defineEducationCognitiveContributor(supportPlanningPipelineDefinition);
}

export function runSupportPlanningIntelligence(
  inputs: SupportPlanningInputs,
  options?: { now?: string }
): SupportPlanningIntelligenceResult {
  const analysis = analyzeSupportPlanning(inputs);
  const result = runEducationIntelligencePipeline(
    supportPlanningPipelineDefinition,
    inputs,
    options
  );
  return {
    ...result,
    studentId: result.subjectId,
    stance: analysis.stance,
    expectedOutcomes: analysis.expectedOutcomes,
  };
}
