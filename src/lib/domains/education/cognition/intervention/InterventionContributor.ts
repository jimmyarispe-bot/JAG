/**
 * Intervention Intelligence — support CognitiveContributor.
 * Reasons over Student Success / Progress / Attendance outputs.
 */

import type { CognitiveContributor } from "@/lib/jag/runtime";
import {
  defineEducationCognitiveContributor,
  runEducationIntelligencePipeline,
  type EducationPipelineDefinition,
} from "../framework";
import {
  analyzeIntervention,
  validateInterventionInputs,
} from "./InterventionAnalyzer";
import { collectInterventionEvidence } from "./InterventionEvidence";
import type { InterventionInputs } from "./InterventionInputs";
import { buildInterventionRecommendations } from "./InterventionRecommendations";
import {
  INTERVENTION_CONTRIBUTOR_ID,
  INTERVENTION_INPUT_ATTR,
  type InterventionIntelligenceResult,
} from "./InterventionTypes";

export const interventionPipelineDefinition: EducationPipelineDefinition<InterventionInputs> =
  {
    contributorId: INTERVENTION_CONTRIBUTOR_ID,
    evidenceSource: "education.intervention",
    topicId: "education.intervention",
    attributeKey: INTERVENTION_INPUT_ATTR,
    capabilities: ["education", "intervention", "support"],
    priority: 25,
    subjectId: (inputs) => inputs.subjectId,
    supportsIntent: (intentId) =>
      intentId.includes("intervention") ||
      intentId.includes("support") ||
      intentId.includes("mtss") ||
      intentId.includes("student_services") ||
      intentId.includes("student-services"),
    validate: validateInterventionInputs,
    collectEvidence: (builder, inputs) => {
      const analysis = analyzeIntervention(inputs);
      collectInterventionEvidence(builder, inputs, analysis);
    },
    recommend: (builder, ctx) => {
      const analysis = analyzeIntervention(ctx.observation);
      buildInterventionRecommendations(builder, ctx, analysis);
    },
    explainReadiness: ({ readiness, blockingIssues, warnings }) => {
      if (readiness === "ready") {
        return "Intervention intelligence completed from upstream contributor outputs.";
      }
      if (readiness === "conditional") {
        return `Intervention intelligence is conditional: ${warnings.join("; ")}`;
      }
      return `Intervention intelligence blocked: ${blockingIssues.join("; ")}`;
    },
  };

export function createInterventionContributor(): CognitiveContributor {
  return defineEducationCognitiveContributor(interventionPipelineDefinition);
}

export function runInterventionIntelligence(
  inputs: InterventionInputs,
  options?: { now?: string }
): InterventionIntelligenceResult {
  const analysis = analyzeIntervention(inputs);
  const result = runEducationIntelligencePipeline(
    interventionPipelineDefinition,
    inputs,
    options
  );
  return {
    ...result,
    studentId: result.subjectId,
    candidates: analysis.candidates,
  };
}
