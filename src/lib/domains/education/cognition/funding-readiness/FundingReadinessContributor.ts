import type { CognitiveContributor } from "@/lib/jag/runtime";
import {
  defineEducationCognitiveContributor,
  runEducationIntelligencePipeline,
  type EducationPipelineDefinition,
} from "../framework";
import {
  analyzeFundingReadiness,
  validateFundingReadinessInputs,
} from "./FundingReadinessAnalyzer";
import { collectFundingReadinessEvidence } from "./FundingReadinessEvidence";
import type { FundingReadinessInputs } from "./FundingReadinessInputs";
import { buildFundingReadinessRecommendations } from "./FundingReadinessRecommendations";
import {
  FUNDING_READINESS_CONTRIBUTOR_ID,
  FUNDING_READINESS_INPUT_ATTR,
  type FundingReadinessIntelligenceResult,
} from "./FundingReadinessTypes";

export const fundingReadinessPipelineDefinition: EducationPipelineDefinition<FundingReadinessInputs> =
  {
    contributorId: FUNDING_READINESS_CONTRIBUTOR_ID,
    evidenceSource: "education.funding_readiness",
    topicId: "education.funding_readiness",
    attributeKey: FUNDING_READINESS_INPUT_ATTR,
    capabilities: ["education", "funding", "funding_readiness", "synthesis"],
    priority: 21,
    subjectId: (inputs) => inputs.subjectId,
    supportsIntent: (intentId) =>
      intentId.includes("funding") ||
      intentId.includes("scholarship") ||
      intentId.includes("compliance") ||
      intentId.includes("eligibility") ||
      intentId.includes("audit"),
    validate: validateFundingReadinessInputs,
    collectEvidence: (builder, inputs) => {
      const analysis = analyzeFundingReadiness(inputs);
      collectFundingReadinessEvidence(builder, inputs, analysis);
    },
    recommend: (builder, ctx) => {
      const analysis = analyzeFundingReadiness(ctx.observation);
      buildFundingReadinessRecommendations(builder, ctx, analysis);
    },
    explainReadiness: ({ readiness, blockingIssues, warnings }) => {
      if (readiness === "ready") {
        return "Funding readiness synthesis completed from upstream funding/compliance outputs.";
      }
      if (readiness === "conditional") {
        return `Funding readiness is conditional: ${warnings.join("; ")}`;
      }
      return `Funding readiness blocked: ${blockingIssues.join("; ")}`;
    },
  };

export function createFundingReadinessContributor(): CognitiveContributor {
  return defineEducationCognitiveContributor(fundingReadinessPipelineDefinition);
}

export function runFundingReadinessIntelligence(
  inputs: FundingReadinessInputs,
  options?: { now?: string }
): FundingReadinessIntelligenceResult {
  const analysis = analyzeFundingReadiness(inputs);
  const result = runEducationIntelligencePipeline(
    fundingReadinessPipelineDefinition,
    inputs,
    options
  );
  return {
    ...result,
    stance: analysis.stance,
    fundingPriority: analysis.fundingPriority,
  };
}
