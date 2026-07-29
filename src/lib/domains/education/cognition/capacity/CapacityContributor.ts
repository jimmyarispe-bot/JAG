import type { CognitiveContributor } from "@/lib/jag/runtime";
import {
  defineEducationCognitiveContributor,
  runEducationIntelligencePipeline,
  type EducationPipelineDefinition,
} from "../framework";
import { analyzeCapacity } from "./CapacityAnalyzer";
import { collectCapacityEvidence } from "./CapacityEvidence";
import {
  validateCapacityObservation,
  type CapacityObservation,
} from "./CapacityObservation";
import { buildCapacityRecommendations } from "./CapacityRecommendations";
import {
  CAPACITY_CONTRIBUTOR_ID,
  CAPACITY_OBSERVATION_ATTR,
  type CapacityIntelligenceResult,
} from "./CapacityTypes";

export const capacityPipelineDefinition: EducationPipelineDefinition<CapacityObservation> =
  {
    contributorId: CAPACITY_CONTRIBUTOR_ID,
    evidenceSource: "education.capacity",
    topicId: "education.capacity",
    attributeKey: CAPACITY_OBSERVATION_ATTR,
    capabilities: ["education", "capacity", "operations"],
    priority: 40,
    subjectId: (o) => o.subject.subjectId,
    supportsIntent: (intentId) =>
      intentId.includes("capacity") ||
      intentId.includes("operations") ||
      intentId.includes("semester"),
    validate: validateCapacityObservation,
    collectEvidence: (builder, observation) => {
      collectCapacityEvidence(builder, observation, analyzeCapacity(observation));
    },
    recommend: (builder, ctx) => {
      buildCapacityRecommendations(builder, ctx, analyzeCapacity(ctx.observation));
    },
    explainReadiness: ({ readiness, blockingIssues, warnings }) => {
      if (readiness === "ready") {
        return "Capacity intelligence completed from host capacity observations.";
      }
      if (readiness === "conditional") {
        return `Capacity is conditional: ${warnings.join("; ")}`;
      }
      return `Capacity blocked: ${blockingIssues.join("; ")}`;
    },
  };

export function createCapacityContributor(): CognitiveContributor {
  return defineEducationCognitiveContributor(capacityPipelineDefinition);
}

export function runCapacityIntelligence(
  observation: CapacityObservation,
  options?: { now?: string }
): CapacityIntelligenceResult {
  const analysis = analyzeCapacity(observation);
  const result = runEducationIntelligencePipeline(
    capacityPipelineDefinition,
    observation,
    options
  );
  return {
    ...result,
    utilization: analysis.utilization,
    overCapacityCount: analysis.overCapacitySectionIds.length,
    underUtilizedCount: analysis.underUtilizedSectionIds.length,
  };
}
