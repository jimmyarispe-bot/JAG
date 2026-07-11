/**
 * Decision Intelligence — analysis.
 *
 * Evaluates strategic decisions using organizational context, memory,
 * strategic goals, execution status, KPIs, risks, and opportunities.
 */

import type { DecisionEvidenceResult } from "@/lib/platform/intelligence/decision/types";
import type {
  DecisionAnalysisResult,
  DecisionPriority,
  DecisionRequest,
} from "@/lib/platform/intelligence/decision/types";
import type { IntelligenceConfidenceScore } from "@/lib/platform/intelligence/types";

/** Options for decision analysis. */
export interface DecisionAnalysisOptions {
  defaultPriority?: DecisionPriority;
}

/**
 * Frames the decision using available intelligence inputs.
 */
export class DecisionAnalysis {
  private readonly defaultPriority: DecisionPriority;

  constructor(options: DecisionAnalysisOptions = {}) {
    this.defaultPriority = options.defaultPriority ?? "medium";
  }

  analyze(
    request: DecisionRequest,
    evidence: DecisionEvidenceResult
  ): DecisionAnalysisResult {
    const decisionQuestion =
      request.decisionQuestion ??
      `What decision should be made regarding: ${request.subject}?`;

    const strategicGoals = request.strategicGoals ?? request.strategic?.goals ?? [];
    const opportunities =
      request.strategicOpportunities ?? request.strategic?.analysis.opportunities ?? [];

    const strategicGoalIds = strategicGoals.map((g) => g.id);
    const executionSignals = (request.executionProgress ?? []).map(
      (p) =>
        `${p.subjectKind}:${p.subjectId} ${p.completionPercent}% (${p.healthLabel})`
    );
    const opportunitySignals = [
      ...(request.opportunities ?? []),
      ...opportunities.map((o) => `${o.kind}: ${o.title}`),
    ];
    const riskSignals = [
      ...(request.risks ?? []),
      ...opportunities
        .filter(
          (o) =>
            o.kind.includes("risk") ||
            o.kind.includes("weakness") ||
            o.kind.includes("issue")
        )
        .map((o) => o.title),
    ];
    const kpiHighlights = (request.kpis ?? []).map(
      (k) => `${k.label}: ${k.value}${k.unit ? ` ${k.unit}` : ""}`
    );
    const memoryHighlights = (request.memories ?? [])
      .slice(0, 3)
      .map(
        (m) =>
          m.observations[0] ??
          m.recommendations[0] ??
          `Memory ${m.id} (${m.domain})`
      );

    const org = request.sharedContext?.scope.organizationId ?? request.organizationId;
    const school = request.sharedContext?.scope.schoolId ?? request.schoolId;
    const contextSummary = [
      org ? `Organization ${org}` : "Organization scope unspecified",
      school ? `school ${school}` : null,
      request.sharedContext ? "shared context available" : null,
      strategicGoals.length > 0 ? `${strategicGoals.length} strategic goal(s)` : null,
      (request.executionGoals?.length ?? 0) > 0
        ? `${request.executionGoals!.length} execution goal(s)`
        : null,
      `${evidence.items.length} evidence item(s)`,
    ]
      .filter((part): part is string => part !== null)
      .join("; ");

    const priority = this.inferPriority(request, riskSignals, kpiHighlights);
    const confidence = this.buildConfidence(evidence, strategicGoals.length, memoryHighlights.length);

    const summary = `${decisionQuestion} Priority ${priority}. ${contextSummary}.`;

    return {
      requestId: request.requestId,
      decisionQuestion,
      contextSummary,
      strategicGoalIds,
      executionSignals,
      opportunitySignals,
      riskSignals,
      kpiHighlights,
      memoryHighlights,
      priority,
      confidence,
      summary,
      metadata: request.metadata,
    };
  }

  private inferPriority(
    request: DecisionRequest,
    riskSignals: string[],
    kpiHighlights: string[]
  ): DecisionPriority {
    const corpus = [
      request.subject,
      request.description ?? "",
      request.decisionQuestion ?? "",
      ...(request.findings ?? []),
      ...riskSignals,
      ...kpiHighlights,
    ]
      .join(" ")
      .toLowerCase();

    if (corpus.includes("critical") || corpus.includes("urgent") || corpus.includes("crisis")) {
      return "critical";
    }

    const severeKpi = (request.kpis ?? []).some(
      (kpi) => kpi.target !== undefined && kpi.value < kpi.target * 0.7
    );
    if (severeKpi || (corpus.includes("cash") && corpus.includes("risk"))) {
      return "critical";
    }

    if (
      corpus.includes("compliance") ||
      corpus.includes("risk") ||
      riskSignals.length >= 2
    ) {
      return "high";
    }
    if (corpus.includes("watch") || corpus.includes("minor")) {
      return "low";
    }
    return this.defaultPriority;
  }

  private buildConfidence(
    evidence: DecisionEvidenceResult,
    goalCount: number,
    memoryCount: number
  ): IntelligenceConfidenceScore {
    const evidenceWeight =
      evidence.items.reduce((sum, item) => sum + item.weight, 0) /
      Math.max(1, evidence.items.length);
    const value = Math.min(
      1,
      Number((0.25 + evidenceWeight * 0.45 + goalCount * 0.08 + memoryCount * 0.05).toFixed(4))
    );
    const level =
      value >= 0.75 ? "high" : value >= 0.45 ? "medium" : value > 0 ? "low" : "unknown";

    return {
      value,
      level,
      factors: [
        {
          key: "evidence_weight",
          label: "Evidence Weight",
          contribution: evidenceWeight,
        },
        {
          key: "strategic_goals",
          label: "Strategic Goals",
          contribution: Math.min(1, goalCount * 0.08),
        },
      ],
    };
  }
}
