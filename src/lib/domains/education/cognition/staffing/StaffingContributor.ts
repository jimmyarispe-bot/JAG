import type { CognitiveContributor } from "@/lib/jag/runtime";
import {
  defineEducationCognitiveContributor,
  runEducationIntelligencePipeline,
  type EducationPipelineDefinition,
} from "../framework";
import { analyzeStaffing } from "./StaffingAnalyzer";
import { collectStaffingEvidence } from "./StaffingEvidence";
import {
  validateStaffingObservation,
  type StaffingObservation,
} from "./StaffingObservation";
import { buildStaffingRecommendations } from "./StaffingRecommendations";
import {
  STAFFING_CONTRIBUTOR_ID,
  STAFFING_OBSERVATION_ATTR,
  type StaffingIntelligenceResult,
} from "./StaffingTypes";

export const staffingPipelineDefinition: EducationPipelineDefinition<StaffingObservation> =
  {
    contributorId: STAFFING_CONTRIBUTOR_ID,
    evidenceSource: "education.staffing",
    topicId: "education.staffing",
    attributeKey: STAFFING_OBSERVATION_ATTR,
    capabilities: ["education", "staffing", "operations"],
    priority: 41,
    subjectId: (o) => o.subject.subjectId,
    supportsIntent: (intentId) =>
      intentId.includes("staff") ||
      intentId.includes("operations") ||
      intentId.includes("semester"),
    validate: validateStaffingObservation,
    collectEvidence: (builder, observation) => {
      collectStaffingEvidence(builder, observation, analyzeStaffing(observation));
    },
    recommend: (builder, ctx) => {
      buildStaffingRecommendations(builder, ctx, analyzeStaffing(ctx.observation));
    },
    explainReadiness: ({ readiness, blockingIssues, warnings }) => {
      if (readiness === "ready") {
        return "Staffing intelligence completed from host staffing observations.";
      }
      if (readiness === "conditional") {
        return `Staffing is conditional: ${warnings.join("; ")}`;
      }
      return `Staffing blocked: ${blockingIssues.join("; ")}`;
    },
  };

export function createStaffingContributor(): CognitiveContributor {
  return defineEducationCognitiveContributor(staffingPipelineDefinition);
}

export function runStaffingIntelligence(
  observation: StaffingObservation,
  options?: { now?: string }
): StaffingIntelligenceResult {
  const analysis = analyzeStaffing(observation);
  const result = runEducationIntelligencePipeline(
    staffingPipelineDefinition,
    observation,
    options
  );
  return {
    ...result,
    overloadCount: analysis.overloadedTeacherIds.length,
    qualificationGapCount: analysis.qualificationGaps.length,
  };
}
