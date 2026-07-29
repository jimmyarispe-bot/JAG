/**
 * Support Planning evidence — unified plan from support contributors.
 */

import type { EducationEvidenceBuilder } from "../framework";
import type { SupportPlanningAnalysis } from "./SupportPlanningAnalyzer";
import type { SupportPlanningInputs } from "./SupportPlanningInputs";

export function collectSupportPlanningEvidence(
  builder: EducationEvidenceBuilder,
  inputs: SupportPlanningInputs,
  analysis: SupportPlanningAnalysis
): void {
  builder.addSupportingEvidence(
    "synthesis_inputs_bound",
    "Bound support planning synthesis to Intervention, Family Engagement, and Student Success outputs",
    {
      capabilityId: analysis.knowledgeRefs.capabilityId,
      entityIds: analysis.knowledgeRefs.entityIds,
      upstreamCount: [
        inputs.intervention,
        inputs.familyEngagement,
        inputs.studentSuccess,
      ].filter(Boolean).length,
      stance: analysis.stance,
    }
  );

  emitUpstream(
    builder,
    "upstream_intervention",
    analysis.upstreamSummary.intervention
  );
  emitUpstream(
    builder,
    "upstream_family_engagement",
    analysis.upstreamSummary.familyEngagement
  );
  emitUpstream(
    builder,
    "upstream_student_success",
    analysis.upstreamSummary.studentSuccess
  );

  builder.addFinding(
    "unified_support_plan",
    `Unified student support plan stance: ${analysis.stance.replace(/_/g, " ")}`,
    { stance: analysis.stance }
  );

  for (const action of analysis.prioritizedActions) {
    builder.addFinding("prioritized_actions", action, {
      stance: analysis.stance,
    });
  }

  for (const outcome of analysis.expectedOutcomes) {
    builder.addSupportingEvidence("expected_outcomes", outcome, {
      stance: analysis.stance,
    });
  }

  for (const signal of analysis.signals) {
    if (
      signal === "synthesis_inputs_bound" ||
      signal.startsWith("upstream_") ||
      signal === "unified_support_plan" ||
      signal === "prioritized_actions" ||
      signal === "expected_outcomes"
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
  analysis: SupportPlanningAnalysis
): void {
  const attrs = {
    stance: analysis.stance,
    prioritizedActions: analysis.prioritizedActions,
    expectedOutcomes: analysis.expectedOutcomes,
  };
  switch (signal) {
    case "insufficient_upstream":
      builder.addBlockingIssue(
        signal,
        "Insufficient upstream results for support planning synthesis",
        attrs
      );
      break;
    case "intensive_support":
    case "targeted_support":
      builder.addWarning(signal, signal.replace(/_/g, " "), attrs);
      break;
    default:
      builder.addFinding(signal, signal.replace(/_/g, " "), attrs);
  }
}
