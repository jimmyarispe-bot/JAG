/**
 * Family Engagement evidence from upstream contributor outputs.
 */

import type { EducationEvidenceBuilder } from "../framework";
import type { FamilyEngagementAnalysis } from "./FamilyEngagementAnalyzer";
import type { FamilyEngagementInputs } from "./FamilyEngagementInputs";

export function collectFamilyEngagementEvidence(
  builder: EducationEvidenceBuilder,
  inputs: FamilyEngagementInputs,
  analysis: FamilyEngagementAnalysis
): void {
  builder.addSupportingEvidence(
    "synthesis_inputs_bound",
    "Bound family engagement intelligence to upstream contributor outputs and Knowledge entities",
    {
      capabilityId: analysis.knowledgeRefs.capabilityId,
      entityIds: analysis.knowledgeRefs.entityIds,
      relationshipIds: analysis.knowledgeRefs.relationshipIds,
      upstreamCount: [
        inputs.studentSuccess,
        inputs.attendance,
        inputs.enrollment,
      ].filter(Boolean).length,
      communicationPriority: analysis.communicationPriority,
      opportunities: analysis.opportunities,
    }
  );

  emitUpstream(
    builder,
    "upstream_student_success",
    analysis.upstreamSummary.studentSuccess
  );
  emitUpstream(
    builder,
    "upstream_attendance",
    analysis.upstreamSummary.attendance
  );
  emitUpstream(
    builder,
    "upstream_enrollment",
    analysis.upstreamSummary.enrollment
  );

  for (const opportunity of analysis.opportunities) {
    if (opportunity === "none") continue;
    builder.addFinding(
      "engagement_opportunity",
      `Family engagement opportunity: ${opportunity.replace(/_/g, " ")}`,
      {
        opportunity,
        communicationPriority: analysis.communicationPriority,
      }
    );
  }

  for (const theme of analysis.outreachThemes) {
    builder.addSupportingEvidence("engagement_opportunity", theme, {
      theme: true,
    });
  }

  for (const signal of analysis.signals) {
    if (
      signal === "synthesis_inputs_bound" ||
      signal.startsWith("upstream_") ||
      signal === "engagement_opportunity"
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
  analysis: FamilyEngagementAnalysis
): void {
  const attrs = {
    communicationPriority: analysis.communicationPriority,
    opportunities: analysis.opportunities,
  };
  switch (signal) {
    case "insufficient_upstream":
      builder.addBlockingIssue(
        signal,
        "Insufficient upstream results for family engagement intelligence",
        attrs
      );
      break;
    case "attendance_partnership":
    case "risk_outreach":
    case "communication_priority_urgent":
    case "communication_priority_high":
      builder.addWarning(signal, signal.replace(/_/g, " "), attrs);
      break;
    default:
      builder.addFinding(signal, signal.replace(/_/g, " "), attrs);
  }
}
