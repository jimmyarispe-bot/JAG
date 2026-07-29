/**
 * Intervention evidence — derived from upstream contributor outputs.
 */

import type { EducationEvidenceBuilder } from "../framework";
import type { InterventionAnalysis } from "./InterventionAnalyzer";
import type { InterventionInputs } from "./InterventionInputs";

export function collectInterventionEvidence(
  builder: EducationEvidenceBuilder,
  inputs: InterventionInputs,
  analysis: InterventionAnalysis
): void {
  builder.addSupportingEvidence(
    "synthesis_inputs_bound",
    "Bound intervention intelligence to upstream contributor outputs and Knowledge entities",
    {
      capabilityId: analysis.knowledgeRefs.capabilityId,
      entityIds: analysis.knowledgeRefs.entityIds,
      classificationId: analysis.knowledgeRefs.classificationId,
      upstreamCount: [
        inputs.studentSuccess,
        inputs.progress,
        inputs.attendance,
      ].filter(Boolean).length,
      candidateCount: analysis.candidates.length,
      overallPriority: analysis.overallPriority,
    }
  );

  emitUpstream(
    builder,
    "upstream_student_success",
    analysis.upstreamSummary.studentSuccess
  );
  emitUpstream(builder, "upstream_progress", analysis.upstreamSummary.progress);
  emitUpstream(
    builder,
    "upstream_attendance",
    analysis.upstreamSummary.attendance
  );

  for (const candidate of analysis.candidates) {
    builder.addFinding(
      "intervention_candidate",
      `${candidate.type}: ${candidate.rationale}`,
      {
        type: candidate.type,
        priority: candidate.priority,
        expectedImpact: candidate.expectedImpact,
      }
    );
  }

  for (const impact of analysis.expectedImpacts) {
    builder.addSupportingEvidence(
      "expected_impact_bound",
      `Expected impact: ${impact.replace(/_/g, " ")}`,
      { expectedImpact: impact }
    );
  }

  for (const signal of analysis.signals) {
    if (
      signal === "synthesis_inputs_bound" ||
      signal.startsWith("upstream_") ||
      signal === "intervention_candidate" ||
      signal === "expected_impact_bound"
    ) {
      continue;
    }
    emitSignal(builder, signal, analysis);
  }
}

function emitUpstream(
  builder: EducationEvidenceBuilder,
  code: string,
  slice:
    | {
        contributorId: string;
        readiness: string;
        confidence: number;
        priority: number;
        blockingCount: number;
        warningCount: number;
        recommendationKinds: readonly string[];
        evidenceCodes: readonly string[];
      }
    | undefined
): void {
  if (!slice) return;
  const summary = `Upstream ${slice.contributorId}: readiness=${slice.readiness}, confidence=${slice.confidence.toFixed(2)}`;
  if (slice.readiness === "blocked" || slice.readiness === "conditional") {
    builder.addWarning(code, summary, { ...slice });
  } else {
    builder.addSupportingEvidence(code, summary, { ...slice });
  }
}

function emitSignal(
  builder: EducationEvidenceBuilder,
  signal: string,
  analysis: InterventionAnalysis
): void {
  const attrs = {
    overallPriority: analysis.overallPriority,
    candidateTypes: analysis.candidates.map((c) => c.type),
  };
  switch (signal) {
    case "insufficient_upstream":
      builder.addBlockingIssue(
        signal,
        "Insufficient upstream results for intervention intelligence",
        attrs
      );
      break;
    case "multi_domain_intervention":
    case "academic_intervention_indicated":
    case "attendance_intervention_indicated":
    case "mtss_escalation":
    case "high_priority_support":
      builder.addWarning(signal, signal.replace(/_/g, " "), attrs);
      break;
    default:
      builder.addFinding(signal, signal.replace(/_/g, " "), attrs);
  }
}
