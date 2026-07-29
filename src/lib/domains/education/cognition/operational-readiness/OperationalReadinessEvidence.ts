import type { EducationEvidenceBuilder } from "../framework";
import type { OperationalReadinessAnalysis } from "./OperationalReadinessAnalyzer";
import type { OperationalReadinessInputs } from "./OperationalReadinessInputs";

export function collectOperationalReadinessEvidence(
  builder: EducationEvidenceBuilder,
  inputs: OperationalReadinessInputs,
  analysis: OperationalReadinessAnalysis
): void {
  builder.addSupportingEvidence(
    "synthesis_inputs_bound",
    "Bound operational readiness to Scheduling, Staffing, and Capacity outputs",
    {
      capabilityId: analysis.knowledgeRefs.capabilityId,
      entityIds: analysis.knowledgeRefs.entityIds,
      upstreamCount: [
        inputs.scheduling,
        inputs.staffing,
        inputs.capacity,
      ].filter(Boolean).length,
      stance: analysis.stance,
      readinessScore: analysis.readinessScore,
    }
  );

  emitUpstream(builder, "upstream_scheduling", analysis.upstreamSummary.scheduling);
  emitUpstream(builder, "upstream_staffing", analysis.upstreamSummary.staffing);
  emitUpstream(builder, "upstream_capacity", analysis.upstreamSummary.capacity);

  builder.addFinding(
    "readiness_score",
    `Operational readiness score: ${analysis.readinessScore}`,
    { readinessScore: analysis.readinessScore, stance: analysis.stance }
  );

  for (const risk of analysis.risks) {
    builder.addWarning("ops_risks", risk, { stance: analysis.stance });
  }
  for (const strength of analysis.strengths) {
    builder.addFinding("ops_strengths", strength, { stance: analysis.stance });
  }

  for (const signal of analysis.signals) {
    if (
      signal === "synthesis_inputs_bound" ||
      signal.startsWith("upstream_") ||
      signal === "readiness_score" ||
      signal === "ops_risks" ||
      signal === "ops_strengths"
    ) {
      continue;
    }
    if (signal === "insufficient_upstream") {
      builder.addBlockingIssue(
        signal,
        "Insufficient upstream results for operational readiness synthesis",
        { stance: analysis.stance }
      );
    } else if (signal === "ops_blocked" || signal === "ops_at_risk") {
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
        blockingCount: number;
        warningCount: number;
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
