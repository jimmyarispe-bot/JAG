import type { EducationEvidenceBuilder } from "../framework";
import type { ExecutiveBriefingAnalysis } from "./ExecutiveBriefingAnalyzer";
import type { ExecutiveBriefingInputs } from "./ExecutiveBriefingInputs";

export function collectExecutiveBriefingEvidence(
  builder: EducationEvidenceBuilder,
  inputs: ExecutiveBriefingInputs,
  analysis: ExecutiveBriefingAnalysis
): void {
  builder.addSupportingEvidence(
    "synthesis_inputs_bound",
    "Bound executive briefing as TOP_LEVEL_SYNTHESIS of school health, campus performance, and readiness postures",
    {
      capabilityId: analysis.knowledgeRefs.capabilityId,
      entityIds: analysis.knowledgeRefs.entityIds,
      upstreamCount: [
        inputs.schoolHealth,
        inputs.campusPerformance,
        inputs.fundingReadiness,
        inputs.supportPlanning,
        inputs.operationalReadiness,
      ].filter(Boolean).length,
      stance: analysis.stance,
      briefingConfidence: analysis.briefingConfidence,
      contributorKind: "TOP_LEVEL_SYNTHESIS",
    }
  );

  emitUpstream(builder, "upstream_school_health", analysis.upstreamSummary.schoolHealth);
  emitUpstream(
    builder,
    "upstream_campus_performance",
    analysis.upstreamSummary.campusPerformance
  );
  emitUpstream(
    builder,
    "upstream_funding_readiness",
    analysis.upstreamSummary.fundingReadiness
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

  builder.addFinding("executive_summary", analysis.executiveSummary, {
    stance: analysis.stance,
    briefingConfidence: analysis.briefingConfidence,
  });

  for (const priority of analysis.strategicPriorities) {
    builder.addFinding("strategic_priorities", priority, {
      stance: analysis.stance,
    });
  }
  for (const opportunity of analysis.keyOpportunities) {
    builder.addFinding("key_opportunities", opportunity, {
      stance: analysis.stance,
    });
  }
  for (const risk of analysis.criticalRisks) {
    builder.addWarning("critical_risks", risk, { stance: analysis.stance });
  }
  builder.addSupportingEvidence(
    "evidence_index",
    `Evidence index entries: ${analysis.evidenceIndex.length}`,
    { evidenceIndex: analysis.evidenceIndex }
  );

  for (const signal of analysis.signals) {
    if (
      signal === "synthesis_inputs_bound" ||
      signal.startsWith("upstream_") ||
      signal === "executive_summary" ||
      signal === "strategic_priorities" ||
      signal === "key_opportunities" ||
      signal === "critical_risks" ||
      signal === "evidence_index"
    ) {
      continue;
    }
    if (signal === "insufficient_upstream") {
      builder.addBlockingIssue(
        signal,
        "Insufficient upstream results for executive education briefing",
        { stance: analysis.stance }
      );
    } else if (signal === "briefing_urgent" || signal === "briefing_cautionary") {
      builder.addWarning(signal, signal.replace(/_/g, " "), {
        stance: analysis.stance,
        briefingConfidence: analysis.briefingConfidence,
      });
    } else {
      builder.addFinding(signal, signal.replace(/_/g, " "), {
        stance: analysis.stance,
        briefingConfidence: analysis.briefingConfidence,
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
