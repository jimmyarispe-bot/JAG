/**
 * Decision Intelligence — risks.
 */

import {
  DECISION_RISK_CATEGORIES,
  type DecisionAnalysisResult,
  type DecisionPriority,
  type DecisionRequest,
  type DecisionRisk,
  type DecisionRiskCategory,
  type DecisionRisksResult,
} from "@/lib/platform/intelligence/decision/types";

/**
 * Identifies financial, operational, academic, compliance, and related risks.
 */
export class DecisionRisks {
  analyze(
    request: DecisionRequest,
    analysis: DecisionAnalysisResult
  ): DecisionRisksResult {
    const corpus = [
      request.subject,
      request.description ?? "",
      ...analysis.riskSignals,
      ...analysis.kpiHighlights,
      ...analysis.opportunitySignals,
    ]
      .join(" ")
      .toLowerCase();

    const risks: DecisionRisk[] = [];
    for (const category of DECISION_RISK_CATEGORIES) {
      const match = matchCategory(corpus, category, analysis);
      if (!match) continue;
      risks.push({
        riskId: `${request.requestId}:risk:${category}`,
        category,
        title: match.title,
        description: match.description,
        severity: match.severity,
        likelihood: match.likelihood,
        mitigation: match.mitigation,
      });
    }

    if (risks.length === 0) {
      risks.push({
        riskId: `${request.requestId}:risk:operational`,
        category: "operational",
        title: "Execution ambiguity",
        description: "Insufficient risk cues; default operational ambiguity remains.",
        severity: analysis.priority,
        likelihood: 0.4,
        mitigation: "Define owners, milestones, and review gates before committing",
      });
    }

    const ranked = [...risks].sort(
      (a, b) =>
        severityRank(b.severity) - severityRank(a.severity) || b.likelihood - a.likelihood
    );

    return {
      requestId: request.requestId,
      risks: ranked,
      primaryRisk: ranked[0] ?? null,
      summary: ranked[0]
        ? `Primary risk: ${ranked[0].title} (${ranked[0].category}). ${ranked.length} risk(s) identified.`
        : "No risks identified.",
      metadata: request.metadata,
    };
  }
}

function severityRank(priority: DecisionPriority): number {
  switch (priority) {
    case "critical":
      return 4;
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
      return 1;
    default: {
      const _exhaustive: never = priority;
      return _exhaustive;
    }
  }
}

function matchCategory(
  corpus: string,
  category: DecisionRiskCategory,
  analysis: DecisionAnalysisResult
): {
  title: string;
  description: string;
  severity: DecisionPriority;
  likelihood: number;
  mitigation: string;
} | null {
  const cues: Record<DecisionRiskCategory, string[]> = {
    financial: ["cash", "budget", "revenue", "cost", "financial", "deficit"],
    operational: ["operations", "process", "bottleneck", "throughput", "execution"],
    academic: ["academic", "learning", "student outcome", "curriculum"],
    compliance: ["compliance", "audit", "policy", "accreditation", "regulation"],
    staffing: ["staffing", "hiring", "retention", "vacancy", "workforce", "teacher"],
    mission: ["mission", "equity", "purpose", "impact"],
    customer: ["customer", "family", "parent", "satisfaction", "experience"],
    reputation: ["reputation", "brand", "media", "trust", "public"],
  };

  const hits = cues[category].filter((cue) => corpus.includes(cue)).length;
  if (hits === 0 && category !== "operational") {
    return null;
  }
  if (hits === 0 && category === "operational" && analysis.executionSignals.length === 0) {
    return null;
  }

  const severity: DecisionPriority =
    hits >= 3 || analysis.priority === "critical"
      ? "critical"
      : hits >= 2 || analysis.priority === "high"
        ? "high"
        : "medium";

  return {
    title: `${category.replace(/_/g, " ")} risk related to decision`,
    description: `Signals indicate ${category} exposure around "${analysis.decisionQuestion}".`,
    severity,
    likelihood: Math.min(0.95, 0.35 + hits * 0.15),
    mitigation: mitigationFor(category),
  };
}

function mitigationFor(category: DecisionRiskCategory): string {
  switch (category) {
    case "financial":
      return "Stage funding with spend caps and weekly cash review";
    case "operational":
      return "Assign operational owner and instrument leading indicators";
    case "academic":
      return "Protect instructional continuity with academic review gates";
    case "compliance":
      return "Run compliance checklist and counsel review before launch";
    case "staffing":
      return "Secure surge staffing plan and retention actions";
    case "mission":
      return "Map decision outcomes to mission KPIs and board narrative";
    case "customer":
      return "Pilot with family feedback loops before scale";
    case "reputation":
      return "Prepare communications plan and escalation protocol";
    default: {
      const _exhaustive: never = category;
      return _exhaustive;
    }
  }
}
