/**
 * Opportunity engine — generate Innovation Candidates from patterns.
 */

import { randomUUID } from "node:crypto";
import { estimateFinancialImpact } from "../forecasting/financial";
import {
  categorizePortfolio,
  effortHintFromScores,
} from "../portfolio/categorize";
import { formatInnovationMrJagMessage } from "../recommendations/mr-jag";
import { assignRoadmapHorizon } from "../roadmaps/horizon";
import { scoreOpportunity } from "../scoring/score";
import { listPatterns, listSignals, replaceOpportunities } from "../store";
import type { InnovationCandidate } from "../types";

function effortLabel(effort: "S" | "M" | "L"): string {
  if (effort === "S") return "S (days–1 sprint)";
  if (effort === "M") return "M (1–2 sprints)";
  return "L (multi-sprint / research)";
}

export function generateOpportunities(input?: {
  organizationId?: string;
  limit?: number;
}): readonly InnovationCandidate[] {
  const patterns = listPatterns(24);
  const signals = listSignals({
    organizationId: input?.organizationId,
    limit: 200,
  });
  const hasFinancial = signals.some((s) => s.source === "financial_kpis");
  const hasPerf = signals.some((s) => s.source === "performance_metrics");

  const candidates: InnovationCandidate[] = [];
  for (const pattern of patterns) {
    const scores = scoreOpportunity({
      pattern,
      signalCount: pattern.signalIds.length,
      hasFinancialSignal: hasFinancial,
      hasPerfSignal: hasPerf,
    });
    const effort = effortHintFromScores(scores);
    const category = categorizePortfolio({ pattern, scores, effortHint: effort });
    const horizon = assignRoadmapHorizon({ scores, category, effort });
    const financial = estimateFinancialImpact({ pattern, scores });

    const draft = {
      executiveSummary: pattern.title,
      financial,
      themes: Object.freeze([pattern.theme]) as readonly string[],
      problem: pattern.summary,
    };

    const candidate: InnovationCandidate = {
      opportunityId: `inn:${randomUUID()}`,
      executiveSummary: pattern.title,
      problem: `Evidence indicates ${pattern.summary}`,
      opportunity: `Proactively invent or improve capability around "${pattern.theme}" before users file more requests.`,
      businessValue: `Score ${scores.businessValue}/100 — est. EBITDA impact $${financial.ebitdaImprovement.toLocaleString()}`,
      technicalFeasibility: `Score ${scores.technicalFeasibility}/100 (${effortLabel(effort)})`,
      strategicAlignment: `Score ${scores.strategicAlignment}/100 — aligns with ${category}`,
      dependencies: Object.freeze([
        "Studio governance review if productized",
        "Evolution proposals for overlapping user asks",
        pattern.kind === "training_gap"
          ? "Mr. JAG Academy curriculum"
          : "Platform / product owners",
      ]),
      estimatedEffort: effortLabel(effort),
      risk: `Score ${scores.risk}/100 — ${
        scores.risk >= 60 ? "elevate carefully" : "manageable with phased rollout"
      }`,
      confidence: scores.confidence,
      scores,
      financial,
      portfolioCategory: category,
      roadmapHorizon: horizon,
      patternIds: Object.freeze([pattern.id]),
      signalIds: pattern.signalIds,
      themes: Object.freeze([pattern.theme]),
      mrJagMessage: formatInnovationMrJagMessage(draft, pattern),
      createdAt: new Date().toISOString(),
      implementsChanges: false,
    };
    candidates.push(candidate);
  }

  candidates.sort((a, b) => b.scores.total - a.scores.total);
  const top = candidates.slice(0, input?.limit ?? 20);
  replaceOpportunities(top);
  return Object.freeze(top);
}
