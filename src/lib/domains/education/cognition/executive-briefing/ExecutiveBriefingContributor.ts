import type { CognitiveContributor } from "@/lib/jag/runtime";
import {
  defineEducationCognitiveContributor,
  runEducationIntelligencePipeline,
  type EducationPipelineDefinition,
} from "../framework";
import {
  analyzeExecutiveBriefing,
  validateExecutiveBriefingInputs,
} from "./ExecutiveBriefingAnalyzer";
import { collectExecutiveBriefingEvidence } from "./ExecutiveBriefingEvidence";
import type { ExecutiveBriefingInputs } from "./ExecutiveBriefingInputs";
import { buildExecutiveBriefingRecommendations } from "./ExecutiveBriefingRecommendations";
import {
  EXECUTIVE_BRIEFING_CONTRIBUTOR_ID,
  EXECUTIVE_BRIEFING_INPUT_ATTR,
  type ExecutiveBriefingIntelligenceResult,
} from "./ExecutiveBriefingTypes";

export const executiveBriefingPipelineDefinition: EducationPipelineDefinition<ExecutiveBriefingInputs> =
  {
    contributorId: EXECUTIVE_BRIEFING_CONTRIBUTOR_ID,
    evidenceSource: "education.executive_briefing",
    topicId: "education.executive_briefing",
    attributeKey: EXECUTIVE_BRIEFING_INPUT_ATTR,
    capabilities: [
      "education",
      "executive",
      "executive_briefing",
      "TOP_LEVEL_SYNTHESIS",
      "synthesis",
    ],
    priority: 10,
    subjectId: (inputs) => inputs.subjectId,
    supportsIntent: (intentId) =>
      intentId.includes("executive") ||
      intentId.includes("board") ||
      intentId.includes("quarterly") ||
      intentId.includes("annual") ||
      intentId.includes("strategic") ||
      intentId.includes("network"),
    validate: validateExecutiveBriefingInputs,
    collectEvidence: (builder, inputs) => {
      const analysis = analyzeExecutiveBriefing(inputs);
      collectExecutiveBriefingEvidence(builder, inputs, analysis);
    },
    recommend: (builder, ctx) => {
      const analysis = analyzeExecutiveBriefing(ctx.observation);
      buildExecutiveBriefingRecommendations(builder, ctx, analysis);
    },
    explainReadiness: ({ readiness, blockingIssues, warnings }) => {
      if (readiness === "ready") {
        return "Executive education briefing synthesis completed from school health, campus performance, and readiness postures.";
      }
      if (readiness === "conditional") {
        return `Executive briefing is conditional: ${warnings.join("; ")}`;
      }
      return `Executive briefing blocked: ${blockingIssues.join("; ")}`;
    },
  };

export function createExecutiveBriefingContributor(): CognitiveContributor {
  return defineEducationCognitiveContributor(
    executiveBriefingPipelineDefinition
  );
}

export function runExecutiveBriefingIntelligence(
  inputs: ExecutiveBriefingInputs,
  options?: { now?: string }
): ExecutiveBriefingIntelligenceResult {
  const analysis = analyzeExecutiveBriefing(inputs);
  const result = runEducationIntelligencePipeline(
    executiveBriefingPipelineDefinition,
    inputs,
    options
  );
  return {
    ...result,
    stance: analysis.stance,
    briefingConfidence: analysis.briefingConfidence,
  };
}
