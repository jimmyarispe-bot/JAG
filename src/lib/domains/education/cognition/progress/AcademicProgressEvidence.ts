/**
 * Academic Progress evidence — includes Policy Engine outcomes as evidence.
 */

import type { EducationEvidenceBuilder } from "../framework";
import type { AcademicProgressAnalysis } from "./AcademicProgressAnalyzer";
import type { AcademicProgressObservation } from "./AcademicProgressObservation";

export function collectAcademicProgressEvidence(
  builder: EducationEvidenceBuilder,
  observation: AcademicProgressObservation,
  analysis: AcademicProgressAnalysis
): void {
  builder.addSupportingEvidence(
    "knowledge_entities_bound",
    "Bound observation to Education Knowledge Model entities and capability",
    {
      capabilityId: analysis.knowledgeRefs.capabilityId,
      entityIds: analysis.knowledgeRefs.entityIds,
      relationshipIds: analysis.knowledgeRefs.relationshipIds,
      classificationIds: analysis.knowledgeRefs.classificationIds,
      programTypeCode: observation.program?.typeCode,
    }
  );

  for (const signal of analysis.signals) {
    if (signal === "knowledge_entities_bound") continue;
    emitSignal(builder, signal, analysis, observation);
  }

  // Policy evaluation results → evidence (not re-implemented here)
  for (const item of analysis.policyResult.evaluations) {
    const code =
      item.outcome === "satisfied"
        ? `policy_${shortPolicy(item.policyId)}_satisfied`
        : item.outcome === "violated"
          ? `policy_${shortPolicy(item.policyId)}_violated`
          : `policy_${shortPolicy(item.policyId)}_unknown`;

    if (item.outcome === "violated") {
      builder.addWarning(code, item.trace.explanation, {
        policyId: item.policyId,
        outcome: item.outcome,
        missingEvidence: item.trace.missingEvidence,
        supportingEvidence: item.trace.supportingEvidence.map((e) => e.id),
      });
    } else if (item.outcome === "unknown") {
      builder.addWarning(code, item.trace.explanation, {
        policyId: item.policyId,
        outcome: item.outcome,
        missingEvidence: item.trace.missingEvidence,
      });
    } else {
      builder.addSupportingEvidence(code, item.trace.explanation, {
        policyId: item.policyId,
        outcome: item.outcome,
        supportingEvidence: item.trace.supportingEvidence.map((e) => e.id),
      });
    }
  }
}

function emitSignal(
  builder: EducationEvidenceBuilder,
  signal: string,
  analysis: AcademicProgressAnalysis,
  observation: AcademicProgressObservation
): void {
  const attrs = {
    trajectory: analysis.trajectory,
    goalMasteryDelta: analysis.goalMasteryDelta,
    courseProgressDelta: analysis.courseProgressDelta,
    masteryDelta: analysis.masteryDelta,
    studentId: observation.student.studentId,
  };

  switch (signal) {
    case "insufficient_evidence":
      builder.addBlockingIssue(
        signal,
        "Insufficient academic progress evidence to form a trajectory judgment",
        attrs
      );
      break;
    case "behind_expectations":
    case "stalled_progress":
    case "goal_mastery_behind":
    case "intervention_indicated":
      builder.addWarning(
        signal,
        humanize(signal),
        attrs
      );
      break;
    case "assessment_not_ready":
      builder.addWarning(signal, "Assessment readiness criteria not met", attrs);
      break;
    case "policy_graduation_violated":
      builder.addWarning(
        signal,
        "Graduation credit policy violated (via Policy Engine)",
        attrs
      );
      break;
    case "policy_graduation_unknown":
      builder.addWarning(
        signal,
        "Graduation credit policy unknown due to missing evidence (via Policy Engine)",
        attrs
      );
      break;
    default:
      builder.addFinding(signal, humanize(signal), attrs);
  }
}

function humanize(signal: string): string {
  return signal.replace(/_/g, " ");
}

function shortPolicy(policyId: string): string {
  const parts = policyId.split(".");
  return parts.slice(-2).join("_");
}
