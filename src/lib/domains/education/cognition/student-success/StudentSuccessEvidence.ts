/**
 * Student Success evidence — cross-domain synthesis from upstream results.
 */

import type { EducationEvidenceBuilder } from "../framework";
import type { StudentSuccessAnalysis } from "./StudentSuccessAnalyzer";
import type { StudentSuccessInputs } from "./StudentSuccessInputs";

export function collectStudentSuccessEvidence(
  builder: EducationEvidenceBuilder,
  inputs: StudentSuccessInputs,
  analysis: StudentSuccessAnalysis
): void {
  builder.addSupportingEvidence(
    "synthesis_inputs_bound",
    "Bound synthesis to upstream contributor outputs and Knowledge entities",
    {
      capabilityId: analysis.knowledgeRefs.capabilityId,
      entityIds: analysis.knowledgeRefs.entityIds,
      upstreamCount: [
        inputs.enrollment,
        inputs.attendance,
        inputs.progress,
      ].filter(Boolean).length,
      trajectory: analysis.trajectory,
    }
  );

  emitUpstream(builder, "upstream_enrollment", analysis.upstreamSummary.enrollment);
  emitUpstream(builder, "upstream_attendance", analysis.upstreamSummary.attendance);
  emitUpstream(builder, "upstream_progress", analysis.upstreamSummary.progress);

  for (const signal of analysis.signals) {
    if (
      signal === "synthesis_inputs_bound" ||
      signal.startsWith("upstream_")
    ) {
      continue;
    }
    emitSignal(builder, signal, analysis);
  }

  for (const risk of analysis.riskIndicators) {
    builder.addWarning("cross_domain_risk_detail", risk, {
      trajectory: analysis.trajectory,
    });
  }
  for (const strength of analysis.strengthIndicators) {
    builder.addFinding("cross_domain_strength_detail", strength, {
      trajectory: analysis.trajectory,
    });
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
  const severity =
    slice.readiness === "blocked"
      ? "warning"
      : slice.readiness === "conditional"
        ? "warning"
        : "info";
  const summary = `Upstream ${slice.contributorId}: readiness=${slice.readiness}, confidence=${slice.confidence.toFixed(2)}, priority=${slice.priority}`;
  if (severity === "warning") {
    builder.addWarning(code, summary, { ...slice });
  } else {
    builder.addSupportingEvidence(code, summary, { ...slice });
  }
}

function emitSignal(
  builder: EducationEvidenceBuilder,
  signal: string,
  analysis: StudentSuccessAnalysis
): void {
  const attrs = {
    trajectory: analysis.trajectory,
    advancementReady: analysis.advancementReady,
    interventionNeeded: analysis.interventionNeeded,
    conflictDetected: analysis.conflictDetected,
  };

  switch (signal) {
    case "insufficient_upstream":
      builder.addBlockingIssue(
        signal,
        "Insufficient upstream contributor results for student success synthesis",
        attrs
      );
      break;
    case "high_academic_risk":
    case "attendance_concern":
    case "emerging_risk":
    case "conflicting_outputs":
    case "intervention_needed":
    case "cross_domain_risk":
      builder.addWarning(signal, humanize(signal), attrs);
      break;
    default:
      builder.addFinding(signal, humanize(signal), attrs);
  }
}

function humanize(signal: string): string {
  return signal.replace(/_/g, " ");
}
