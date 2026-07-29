import type { CognitiveContributor } from "@/lib/jag/runtime";
import {
  defineEducationCognitiveContributor,
  runEducationIntelligencePipeline,
  type EducationPipelineDefinition,
} from "../framework";
import {
  analyzeOperationalReadiness,
  validateOperationalReadinessInputs,
} from "./OperationalReadinessAnalyzer";
import { collectOperationalReadinessEvidence } from "./OperationalReadinessEvidence";
import type { OperationalReadinessInputs } from "./OperationalReadinessInputs";
import { buildOperationalReadinessRecommendations } from "./OperationalReadinessRecommendations";
import {
  OPERATIONAL_READINESS_CONTRIBUTOR_ID,
  OPERATIONAL_READINESS_INPUT_ATTR,
  type OperationalReadinessIntelligenceResult,
} from "./OperationalReadinessTypes";

export const operationalReadinessPipelineDefinition: EducationPipelineDefinition<OperationalReadinessInputs> =
  {
    contributorId: OPERATIONAL_READINESS_CONTRIBUTOR_ID,
    evidenceSource: "education.operational_readiness",
    topicId: "education.operational_readiness",
    attributeKey: OPERATIONAL_READINESS_INPUT_ATTR,
    capabilities: ["education", "operations", "operational_readiness", "synthesis"],
    priority: 22,
    subjectId: (inputs) => inputs.subjectId,
    supportsIntent: (intentId) =>
      intentId.includes("operations") ||
      intentId.includes("operational") ||
      intentId.includes("semester") ||
      intentId.includes("daily") ||
      intentId.includes("leadership"),
    validate: validateOperationalReadinessInputs,
    collectEvidence: (builder, inputs) => {
      const analysis = analyzeOperationalReadiness(inputs);
      collectOperationalReadinessEvidence(builder, inputs, analysis);
    },
    recommend: (builder, ctx) => {
      const analysis = analyzeOperationalReadiness(ctx.observation);
      buildOperationalReadinessRecommendations(builder, ctx, analysis);
    },
    explainReadiness: ({ readiness, blockingIssues, warnings }) => {
      if (readiness === "ready") {
        return "Operational readiness synthesis completed from upstream operations outputs.";
      }
      if (readiness === "conditional") {
        return `Operational readiness is conditional: ${warnings.join("; ")}`;
      }
      return `Operational readiness blocked: ${blockingIssues.join("; ")}`;
    },
  };

export function createOperationalReadinessContributor(): CognitiveContributor {
  return defineEducationCognitiveContributor(
    operationalReadinessPipelineDefinition
  );
}

export function runOperationalReadinessIntelligence(
  inputs: OperationalReadinessInputs,
  options?: { now?: string }
): OperationalReadinessIntelligenceResult {
  const analysis = analyzeOperationalReadiness(inputs);
  const result = runEducationIntelligencePipeline(
    operationalReadinessPipelineDefinition,
    inputs,
    options
  );
  return {
    ...result,
    stance: analysis.stance,
    readinessScore: analysis.readinessScore,
  };
}
