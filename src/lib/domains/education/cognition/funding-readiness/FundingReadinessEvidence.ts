import type { EducationEvidenceBuilder } from "../framework";
import type { FundingReadinessAnalysis } from "./FundingReadinessAnalyzer";
import type { FundingReadinessInputs } from "./FundingReadinessInputs";

export function collectFundingReadinessEvidence(
  builder: EducationEvidenceBuilder,
  inputs: FundingReadinessInputs,
  analysis: FundingReadinessAnalysis
): void {
  builder.addSupportingEvidence(
    "synthesis_inputs_bound",
    "Bound funding readiness to Scholarship, Compliance, and Enrollment outputs",
    {
      capabilityId: analysis.knowledgeRefs.capabilityId,
      entityIds: analysis.knowledgeRefs.entityIds,
      upstreamCount: [
        inputs.scholarship,
        inputs.compliance,
        inputs.enrollment,
      ].filter(Boolean).length,
      stance: analysis.stance,
      fundingPriority: analysis.fundingPriority,
    }
  );

  emitUpstream(builder, "upstream_scholarship", analysis.upstreamSummary.scholarship);
  emitUpstream(builder, "upstream_compliance", analysis.upstreamSummary.compliance);
  emitUpstream(builder, "upstream_enrollment", analysis.upstreamSummary.enrollment);

  for (const risk of analysis.fundingRisks) {
    builder.addWarning("funding_risks", risk, { stance: analysis.stance });
  }

  for (const signal of analysis.signals) {
    if (
      signal === "synthesis_inputs_bound" ||
      signal.startsWith("upstream_") ||
      signal === "funding_risks"
    ) {
      continue;
    }
    if (signal === "insufficient_upstream") {
      builder.addBlockingIssue(
        signal,
        "Insufficient upstream results for funding readiness synthesis",
        { stance: analysis.stance }
      );
    } else if (signal === "funding_blocked" || signal === "funding_at_risk") {
      builder.addWarning(signal, signal.replace(/_/g, " "), {
        stance: analysis.stance,
      });
    } else {
      builder.addFinding(signal, signal.replace(/_/g, " "), {
        stance: analysis.stance,
      });
    }
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
