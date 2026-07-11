/**
 * Strategic Intelligence — executive brief.
 *
 * Generates a narrative covering summary, situation, evidence, goals,
 * objectives, ownership, timeline, impact, risks, actions, and confidence.
 */

import type {
  StrategicBrief,
  StrategicExecutionSnapshot,
  StrategicGoal,
  StrategicImpactAssessment,
  StrategicInitiative,
  StrategicObjective,
  StrategicOwners,
  StrategicRecommendation,
  StrategicRequest,
  StrategicAnalysisResult,
} from "@/lib/platform/intelligence/domains/strategic/types";
import type { IntelligenceConfidenceScore } from "@/lib/platform/intelligence/types";

/** Options for brief generation. */
export interface StrategicBriefOptions {
  now?: () => Date;
  createId?: (requestId: string) => string;
}

/**
 * Builds the executive narrative brief.
 */
export class StrategicBriefBuilder {
  private readonly now: () => Date;
  private readonly createId: (requestId: string) => string;

  constructor(options: StrategicBriefOptions = {}) {
    this.now = options.now ?? (() => new Date());
    this.createId = options.createId ?? ((requestId) => `${requestId}:strategic-brief`);
  }

  /**
   * Generate a full executive brief from the strategic package.
   */
  generate(input: {
    request: StrategicRequest;
    analysis: StrategicAnalysisResult;
    goals: readonly StrategicGoal[];
    objectives: readonly StrategicObjective[];
    initiatives: readonly StrategicInitiative[];
    owners: StrategicOwners;
    execution: readonly StrategicExecutionSnapshot[];
    recommendations: readonly StrategicRecommendation[];
    impact: StrategicImpactAssessment;
  }): StrategicBrief {
    const primaryGoal = input.goals[0] ?? null;
    const primaryInitiative = input.initiatives[0] ?? null;
    const primaryRecommendation = input.recommendations[0] ?? null;
    const confidence = this.resolveConfidence(input);

    const evidence = this.collectEvidence(input);
    const risks = this.collectRisks(input);
    const recommendedActions =
      primaryRecommendation?.recommendedActions ??
      input.recommendations.flatMap((r) => r.recommendedActions).slice(0, 5);

    const executiveSummary = primaryGoal
      ? `${input.analysis.summary} Recommended goal: ${primaryGoal.title}. Overall impact ${input.impact.overallScore}.`
      : input.analysis.summary;

    const situation = [
      input.request.subject,
      input.request.description ?? "",
      input.analysis.primaryOpportunity
        ? `Primary opportunity (${input.analysis.primaryOpportunity.kind}): ${input.analysis.primaryOpportunity.description}`
        : "",
    ]
      .filter((part) => part.trim().length > 0)
      .join(" ");

    const timeline = primaryInitiative
      ? `${primaryInitiative.timeline.startDate.slice(0, 10)} to ${primaryInitiative.timeline.endDate.slice(0, 10)}`
      : primaryGoal
        ? `Target by ${primaryGoal.targetDate.slice(0, 10)}`
        : "Timeline not established";

    const objectives = input.objectives
      .filter((o) => !primaryGoal || o.goalId === primaryGoal.id)
      .map(
        (o) =>
          `${o.title}: ${o.currentValue} → ${o.target} (${o.frequency}; ${o.successCriteria})`
      );

    const expectedImpact = input.impact.summary;

    const narrative = [
      `Executive Summary: ${executiveSummary}`,
      `Situation: ${situation}`,
      `Evidence: ${evidence.join("; ") || "None recorded"}`,
      `Strategic Goal: ${primaryGoal?.title ?? "None"}`,
      `Objectives: ${objectives.join("; ") || "None"}`,
      `Owner: ${input.owners.primaryOwner} (sponsor: ${input.owners.executiveSponsor}; approver: ${input.owners.approver})`,
      `Timeline: ${timeline}`,
      `Expected Impact: ${expectedImpact}`,
      `Risks: ${risks.join("; ") || "None identified"}`,
      `Recommended Actions: ${recommendedActions.join("; ") || "None"}`,
      `Confidence: ${confidence.level} (${confidence.value})`,
    ].join("\n\n");

    return {
      briefId: this.createId(input.request.requestId),
      requestId: input.request.requestId,
      executiveSummary,
      situation,
      evidence,
      strategicGoal: primaryGoal?.title ?? "No strategic goal defined",
      objectives,
      owner: input.owners.primaryOwner,
      timeline,
      expectedImpact,
      risks,
      recommendedActions,
      confidence,
      narrative,
      createdAt: this.now().toISOString(),
      metadata: input.request.metadata,
    };
  }

  private resolveConfidence(input: {
    analysis: StrategicAnalysisResult;
    goals: readonly StrategicGoal[];
    recommendations: readonly StrategicRecommendation[];
  }): IntelligenceConfidenceScore {
    if (input.analysis.primaryOpportunity) {
      return input.analysis.primaryOpportunity.confidence;
    }
    if (input.goals[0]) {
      return input.goals[0].confidence;
    }
    if (input.recommendations[0]) {
      return input.recommendations[0].confidence;
    }
    return { value: 0, level: "unknown", factors: [] };
  }

  private collectEvidence(input: {
    analysis: StrategicAnalysisResult;
    execution: readonly StrategicExecutionSnapshot[];
  }): string[] {
    const evidence: string[] = [];
    for (const opportunity of input.analysis.opportunities) {
      for (const ref of opportunity.evidenceRefs) {
        evidence.push(ref.label ?? ref.evidenceId);
      }
      evidence.push(`${opportunity.kind}: ${opportunity.title}`);
    }
    for (const snapshot of input.execution) {
      evidence.push(
        `Execution ${snapshot.initiativeId}: ${snapshot.status} (health ${snapshot.healthScore})`
      );
    }
    return evidence.slice(0, 12);
  }

  private collectRisks(input: {
    analysis: StrategicAnalysisResult;
    execution: readonly StrategicExecutionSnapshot[];
  }): string[] {
    const risks: string[] = [];
    for (const opportunity of input.analysis.opportunities) {
      if (
        opportunity.kind.endsWith("_risk") ||
        opportunity.kind.endsWith("_weakness") ||
        opportunity.kind.endsWith("_issue")
      ) {
        risks.push(`${opportunity.title} (${opportunity.kind})`);
      }
    }
    for (const snapshot of input.execution) {
      risks.push(...snapshot.blockers);
      if (snapshot.healthLabel === "at_risk" || snapshot.healthLabel === "critical") {
        risks.push(`Execution health ${snapshot.healthLabel} on ${snapshot.initiativeId}`);
      }
    }
    return [...new Set(risks)].slice(0, 10);
  }
}
