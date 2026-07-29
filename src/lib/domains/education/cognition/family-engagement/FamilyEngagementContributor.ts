/**
 * Family Engagement Intelligence — support CognitiveContributor.
 */

import type { CognitiveContributor } from "@/lib/jag/runtime";
import {
  defineEducationCognitiveContributor,
  runEducationIntelligencePipeline,
  type EducationPipelineDefinition,
} from "../framework";
import {
  analyzeFamilyEngagement,
  validateFamilyEngagementInputs,
} from "./FamilyEngagementAnalyzer";
import { collectFamilyEngagementEvidence } from "./FamilyEngagementEvidence";
import type { FamilyEngagementInputs } from "./FamilyEngagementInputs";
import { buildFamilyEngagementRecommendations } from "./FamilyEngagementRecommendations";
import {
  FAMILY_ENGAGEMENT_CONTRIBUTOR_ID,
  FAMILY_ENGAGEMENT_INPUT_ATTR,
  type FamilyEngagementIntelligenceResult,
} from "./FamilyEngagementTypes";

export const familyEngagementPipelineDefinition: EducationPipelineDefinition<FamilyEngagementInputs> =
  {
    contributorId: FAMILY_ENGAGEMENT_CONTRIBUTOR_ID,
    evidenceSource: "education.family_engagement",
    topicId: "education.family_engagement",
    attributeKey: FAMILY_ENGAGEMENT_INPUT_ATTR,
    capabilities: ["education", "family", "family_engagement", "support"],
    priority: 25,
    subjectId: (inputs) => inputs.subjectId,
    supportsIntent: (intentId) =>
      intentId.includes("family") ||
      intentId.includes("communicate") ||
      intentId.includes("engagement") ||
      intentId.includes("support") ||
      intentId.includes("mtss") ||
      intentId.includes("student_services"),
    validate: validateFamilyEngagementInputs,
    collectEvidence: (builder, inputs) => {
      const analysis = analyzeFamilyEngagement(inputs);
      collectFamilyEngagementEvidence(builder, inputs, analysis);
    },
    recommend: (builder, ctx) => {
      const analysis = analyzeFamilyEngagement(ctx.observation);
      buildFamilyEngagementRecommendations(builder, ctx, analysis);
    },
    explainReadiness: ({ readiness, blockingIssues, warnings }) => {
      if (readiness === "ready") {
        return "Family engagement intelligence completed from upstream contributor outputs.";
      }
      if (readiness === "conditional") {
        return `Family engagement intelligence is conditional: ${warnings.join("; ")}`;
      }
      return `Family engagement intelligence blocked: ${blockingIssues.join("; ")}`;
    },
  };

export function createFamilyEngagementContributor(): CognitiveContributor {
  return defineEducationCognitiveContributor(
    familyEngagementPipelineDefinition
  );
}

export function runFamilyEngagementIntelligence(
  inputs: FamilyEngagementInputs,
  options?: { now?: string }
): FamilyEngagementIntelligenceResult {
  const analysis = analyzeFamilyEngagement(inputs);
  const result = runEducationIntelligencePipeline(
    familyEngagementPipelineDefinition,
    inputs,
    options
  );
  return {
    ...result,
    studentId: result.subjectId,
    opportunities: analysis.opportunities,
    communicationPriority: analysis.communicationPriority,
  };
}
