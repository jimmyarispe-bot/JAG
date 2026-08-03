import type { CognitiveContributor } from "@/lib/jag/runtime";
import {
  defineEducationCognitiveContributor,
  runEducationIntelligencePipeline,
  type EducationPipelineDefinition,
} from "../framework";
import { analyzeCompliance } from "./ComplianceAnalyzer";
import { collectComplianceEvidence } from "./ComplianceEvidence";
import {
  validateComplianceObservation,
  type ComplianceObservation,
} from "./ComplianceObservation";
import { buildComplianceRecommendations } from "./ComplianceRecommendations";
import {
  COMPLIANCE_CONTRIBUTOR_ID,
  COMPLIANCE_OBSERVATION_ATTR,
  type ComplianceIntelligenceResult,
} from "./ComplianceTypes";

export const compliancePipelineDefinition: EducationPipelineDefinition<ComplianceObservation> =
  {
    contributorId: COMPLIANCE_CONTRIBUTOR_ID,
    evidenceSource: "education.compliance",
    topicId: "education.compliance",
    attributeKey: COMPLIANCE_OBSERVATION_ATTR,
    capabilities: ["education", "compliance", "funding"],
    priority: 42,
    subjectId: (o) => o.student.studentId,
    supportsIntent: (intentId) =>
      intentId.includes("compliance") ||
      intentId.includes("funding") ||
      intentId.includes("audit") ||
      intentId.includes("eligibility"),
    validate: validateComplianceObservation,
    collectEvidence: (builder, observation) => {
      collectComplianceEvidence(
        builder,
        observation,
        analyzeCompliance(observation)
      );
    },
    recommend: (builder, ctx) => {
      buildComplianceRecommendations(
        builder,
        ctx,
        analyzeCompliance(ctx.observation)
      );
    },
    explainReadiness: ({ readiness, blockingIssues, warnings }) => {
      if (readiness === "ready") {
        return "Compliance intelligence completed from host obligation observations.";
      }
      if (readiness === "conditional") {
        return `Compliance is conditional: ${warnings.join("; ")}`;
      }
      return `Compliance blocked: ${blockingIssues.join("; ")}`;
    },
  };

export function createComplianceContributor(): CognitiveContributor {
  return defineEducationCognitiveContributor(compliancePipelineDefinition);
}

export function runComplianceIntelligence(
  observation: ComplianceObservation,
  options?: { now?: string }
): ComplianceIntelligenceResult {
  const analysis = analyzeCompliance(observation);
  const result = runEducationIntelligencePipeline(
    compliancePipelineDefinition,
    observation,
    options
  );
  return {
    ...result,
    subjectId: result.subjectId,
    violationCount: analysis.violatedObligationIds.length,
    outstandingCount: analysis.outstandingObligationIds.length,
  };
}
