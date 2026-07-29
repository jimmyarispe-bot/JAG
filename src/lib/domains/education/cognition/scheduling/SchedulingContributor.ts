import type { CognitiveContributor } from "@/lib/jag/runtime";
import {
  defineEducationCognitiveContributor,
  runEducationIntelligencePipeline,
  type EducationPipelineDefinition,
} from "../framework";
import { analyzeScheduling } from "./SchedulingAnalyzer";
import { collectSchedulingEvidence } from "./SchedulingEvidence";
import {
  validateSchedulingObservation,
  type SchedulingObservation,
} from "./SchedulingObservation";
import { buildSchedulingRecommendations } from "./SchedulingRecommendations";
import {
  SCHEDULING_CONTRIBUTOR_ID,
  SCHEDULING_OBSERVATION_ATTR,
  type SchedulingIntelligenceResult,
} from "./SchedulingTypes";

export const schedulingPipelineDefinition: EducationPipelineDefinition<SchedulingObservation> =
  {
    contributorId: SCHEDULING_CONTRIBUTOR_ID,
    evidenceSource: "education.scheduling",
    topicId: "education.scheduling",
    attributeKey: SCHEDULING_OBSERVATION_ATTR,
    capabilities: ["education", "scheduling", "operations"],
    priority: 42,
    subjectId: (o) => o.subject.subjectId,
    supportsIntent: (intentId) =>
      intentId.includes("schedul") ||
      intentId.includes("operations") ||
      intentId.includes("semester") ||
      intentId.includes("daily"),
    validate: validateSchedulingObservation,
    collectEvidence: (builder, observation) => {
      collectSchedulingEvidence(
        builder,
        observation,
        analyzeScheduling(observation)
      );
    },
    recommend: (builder, ctx) => {
      buildSchedulingRecommendations(
        builder,
        ctx,
        analyzeScheduling(ctx.observation)
      );
    },
    explainReadiness: ({ readiness, blockingIssues, warnings }) => {
      if (readiness === "ready") {
        return "Scheduling intelligence completed from host schedule observations.";
      }
      if (readiness === "conditional") {
        return `Scheduling is conditional: ${warnings.join("; ")}`;
      }
      return `Scheduling blocked: ${blockingIssues.join("; ")}`;
    },
  };

export function createSchedulingContributor(): CognitiveContributor {
  return defineEducationCognitiveContributor(schedulingPipelineDefinition);
}

export function runSchedulingIntelligence(
  observation: SchedulingObservation,
  options?: { now?: string }
): SchedulingIntelligenceResult {
  const analysis = analyzeScheduling(observation);
  const result = runEducationIntelligencePipeline(
    schedulingPipelineDefinition,
    observation,
    options
  );
  return {
    ...result,
    conflictCount: analysis.conflicts.length,
    coverageGapCount: analysis.coverageGaps.length,
  };
}
