import type { EducationEvidenceBuilder } from "../framework";
import type { SchoolHealthAnalysis } from "./SchoolHealthAnalyzer";
import type { SchoolHealthInputs } from "./SchoolHealthInputs";

export function collectSchoolHealthEvidence(
  builder: EducationEvidenceBuilder,
  inputs: SchoolHealthInputs,
  analysis: SchoolHealthAnalysis
): void {
  builder.addSupportingEvidence(
    "synthesis_inputs_bound",
    "Bound school health to Student Success, Support Planning, Operational Readiness, and Funding Readiness",
    {
      capabilityId: analysis.knowledgeRefs.capabilityId,
      entityIds: analysis.knowledgeRefs.entityIds,
      upstreamCount: [
        inputs.studentSuccess,
        inputs.supportPlanning,
        inputs.operationalReadiness,
        inputs.fundingReadiness,
      ].filter(Boolean).length,
      stance: analysis.stance,
      healthScore: analysis.healthScore,
      healthIndicators: analysis.healthIndicators,
    }
  );

  emitUpstream(
    builder,
    "upstream_student_success",
    analysis.upstreamSummary.studentSuccess
  );
  emitUpstream(
    builder,
    "upstream_support_planning",
    analysis.upstreamSummary.supportPlanning
  );
  emitUpstream(
    builder,
    "upstream_operational_readiness",
    analysis.upstreamSummary.operationalReadiness
  );
  emitUpstream(
    builder,
    "upstream_funding_readiness",
    analysis.upstreamSummary.fundingReadiness
  );

  for (const risk of analysis.riskProfile) {
    builder.addWarning("health_risks", risk, { stance: analysis.stance });
  }
  for (const strength of analysis.strengthProfile) {
    builder.addFinding("health_strengths", strength, {
      stance: analysis.stance,
    });
  }

  for (const signal of analysis.signals) {
    if (
      signal === "synthesis_inputs_bound" ||
      signal.startsWith("upstream_") ||
      signal === "health_risks" ||
      signal === "health_strengths"
    ) {
      continue;
    }
    if (signal === "insufficient_upstream") {
      builder.addBlockingIssue(
        signal,
        "Insufficient upstream results for school health synthesis",
        { stance: analysis.stance }
      );
    } else if (
      signal === "health_critical" ||
      signal === "health_at_risk" ||
      signal === "health_watch"
    ) {
      builder.addWarning(signal, signal.replace(/_/g, " "), {
        stance: analysis.stance,
        healthScore: analysis.healthScore,
      });
    } else {
      builder.addFinding(signal, signal.replace(/_/g, " "), {
        stance: analysis.stance,
        healthScore: analysis.healthScore,
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
