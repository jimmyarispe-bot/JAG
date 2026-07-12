/** Opportunity scores, health, dashboards, heat map, pipeline, and brief (Sprint 035). */
import type * as C from "@/lib/platform/intelligence/opportunity/contracts";
import {
  buildConfidence,
  buildLenses,
  clamp,
  clamp01,
  priorityFromRisk,
  priorityFromScore,
  scoreNarrative,
  statusFromScore,
} from "@/lib/platform/intelligence/opportunity/models";
import type * as T from "@/lib/platform/intelligence/opportunity/types";
import { OPPORTUNITY_CATEGORIES, OPPORTUNITY_RANKING_LENSES, OPPORTUNITY_PIPELINE_STAGES } from "@/lib/platform/intelligence/opportunity/types";

type Id = (prefix: string) => string;

const lenses = buildLenses({
  organizationalHealth: "Priorities strengthen organizational health and operating capability.",
  financialSustainability: "Portfolio balance favors durable economic improvement.",
  missionImpact: "Mission outcomes are co-equal with financial return.",
  longTermValue: "Strategic bets are sequenced to compound enterprise value.",
  timeToValue: "Quick wins fund and de-risk longer-cycle investments.",
});

function score(key: string, label: string, value: number, risk = false): T.OpportunityScore {
  const bounded = clamp(value);
  const statusValue = risk ? 100 - bounded : bounded;
  return {
    key,
    label,
    value: bounded,
    status: statusFromScore(statusValue),
    band: risk ? priorityFromRisk(bounded / 100) : priorityFromScore(bounded),
    narrative: scoreNarrative(label, bounded, statusFromScore(statusValue)),
  };
}

export class OpportunityIntelligence implements C.OpportunityIntelligence {
  composeScores({
    baseline,
    exchange,
    analysis,
  }: Parameters<C.OpportunityIntelligence["composeScores"]>[0]) {
    const avgScore = exchange.length ? exchange.reduce((s, o) => s + o.score, 0) / exchange.length : 50;
    const avgRoi = exchange.length ? exchange.reduce((s, o) => s + o.roi, 0) / exchange.length : 0.5;
    const avgRisk = analysis.risk.length
      ? analysis.risk.reduce((s, r) => s + r.riskScore, 0) / analysis.risk.length
      : 40;
    const healthScore = score(
      "opportunity-health",
      "Opportunity health",
      avgScore * 0.35 +
        baseline.executionReadiness * 0.25 +
        baseline.missionAlignment * 0.2 +
        Math.min(30, exchange.length) +
        clamp(avgRoi * 20) * 0.1
    );
    const opportunityScore = score(
      "opportunity-score",
      "Opportunity score",
      clamp(avgScore * 0.55 + Math.min(30, exchange.length * 1.2) + clamp(baseline.pipelineValue / Math.max(1, baseline.annualRevenue) * 100) * 0.15)
    );
    return {
      healthScore,
      opportunityScore,
      riskScore: score("opportunity-risk", "Opportunity risk", avgRisk, true),
    };
  }
}

export class OpportunityHealth implements C.OpportunityHealth {
  assess({
    baseline,
    scores,
    exchange,
  }: Parameters<C.OpportunityHealth["assess"]>[0]): T.OpportunityHealthResult {
    const discovery = clamp(Math.min(100, exchange.length * 4));
    const evaluation = clamp(scores.opportunityScore.value);
    const prioritization = clamp(baseline.executionReadiness * 0.6 + scores.opportunityScore.value * 0.4);
    const executionReadiness = baseline.executionReadiness;
    const realization = clamp(baseline.realizedValueYtd / Math.max(1, baseline.pipelineValue) * 100 + 40);
    return {
      overallScore: scores.healthScore.value,
      status: scores.healthScore.status,
      dimensions: { discovery, evaluation, prioritization, executionReadiness, realization },
      lenses,
      narrative: `Opportunity health is ${scores.healthScore.status}; ${exchange.length} opportunities are active in the exchange.`,
    };
  }
}

export class OpportunityDashboard implements C.OpportunityDashboard {
  compose({
    baseline,
    scores,
    exchange,
    rankings,
    now,
  }: Parameters<C.OpportunityDashboard["compose"]>[0]): T.OpportunityDashboardResult {
    const quickWinCount = rankings.find((r) => r.lens === "quick_wins")?.opportunities.length ?? 0;
    const strategicCount = rankings.find((r) => r.lens === "strategic_investments")?.opportunities.length ?? 0;
    const missionCount = rankings.find((r) => r.lens === "mission_critical")?.opportunities.length ?? 0;
    const pipelineValue = exchange.reduce((s, o) => s + o.estimatedFinancialImpact, 0);
    return {
      generatedAt: now.toISOString(),
      opportunityScore: scores.opportunityScore.value,
      pipelineValue,
      quickWinCount,
      strategicCount,
      missionCount,
      status: scores.opportunityScore.status,
      headline: `${scores.opportunityScore.status} opportunity posture with $${pipelineValue.toLocaleString()} in pipeline value`,
      narrative: `Opportunity score is ${Math.round(scores.opportunityScore.value)} across ${exchange.length} exchange records; baseline runway is ${baseline.cashRunwayMonths} months.`,
    };
  }
}

export class TopOpportunitiesDashboard implements C.TopOpportunitiesDashboard {
  build({ opportunities, now }: Parameters<C.TopOpportunitiesDashboard["build"]>[0]): T.TopOpportunitiesDashboardResult {
    const top = [...opportunities].sort((a, b) => b.score - a.score).slice(0, 10);
    const totalValue = top.reduce((s, o) => s + o.estimatedFinancialImpact, 0);
    const avg = top.length ? top.reduce((s, o) => s + o.score, 0) / top.length : 0;
    return {
      generatedAt: now.toISOString(),
      opportunities: top,
      totalValue,
      status: statusFromScore(avg),
      narrative: `${top.length} top opportunities total $${totalValue.toLocaleString()} in estimated financial impact.`,
    };
  }
}

export class QuickWinsDashboard implements C.QuickWinsDashboard {
  build({ rankings, now }: Parameters<C.QuickWinsDashboard["build"]>[0]): T.QuickWinsDashboardResult {
    const opportunities = rankings.find((r) => r.lens === "quick_wins")?.opportunities ?? [];
    const averageDaysToValue = opportunities.length
      ? Math.round(opportunities.reduce((s, o) => s + o.expectedTimelineDays, 0) / opportunities.length)
      : 0;
    const avg = opportunities.length ? opportunities.reduce((s, o) => s + o.score, 0) / opportunities.length : 0;
    return {
      generatedAt: now.toISOString(),
      opportunities,
      averageDaysToValue,
      status: statusFromScore(avg),
      narrative: `${opportunities.length} quick wins average ${averageDaysToValue} days to value.`,
    };
  }
}

export class StrategicInvestmentDashboard implements C.StrategicInvestmentDashboard {
  build({ rankings, now }: Parameters<C.StrategicInvestmentDashboard["build"]>[0]): T.StrategicInvestmentDashboardResult {
    const opportunities = rankings.find((r) => r.lens === "strategic_investments")?.opportunities ?? [];
    const totalInvestment = opportunities.reduce((s, o) => s + o.implementationCost, 0);
    const expectedReturn = opportunities.reduce((s, o) => s + o.estimatedFinancialImpact, 0);
    const avg = opportunities.length ? opportunities.reduce((s, o) => s + o.score, 0) / opportunities.length : 0;
    return {
      generatedAt: now.toISOString(),
      opportunities,
      totalInvestment,
      expectedReturn,
      status: statusFromScore(avg),
      narrative: `${opportunities.length} strategic investments require $${totalInvestment.toLocaleString()} for $${expectedReturn.toLocaleString()} expected return.`,
    };
  }
}

export class MissionOpportunityDashboard implements C.MissionOpportunityDashboard {
  build({ rankings, now }: Parameters<C.MissionOpportunityDashboard["build"]>[0]): T.MissionOpportunityDashboardResult {
    const opportunities = rankings.find((r) => r.lens === "mission_critical")?.opportunities ?? [];
    const averageMissionImpact = opportunities.length
      ? opportunities.reduce((s, o) => s + o.estimatedMissionImpact, 0) / opportunities.length
      : 0;
    return {
      generatedAt: now.toISOString(),
      opportunities,
      averageMissionImpact,
      status: statusFromScore(averageMissionImpact),
      narrative: `${opportunities.length} mission-critical opportunities average ${Math.round(averageMissionImpact)} mission impact.`,
    };
  }
}

export class OpportunityHeatMap implements C.OpportunityHeatMap {
  compose({
    exchange,
    rankings,
    now,
  }: Parameters<C.OpportunityHeatMap["compose"]>[0]): T.OpportunityHeatMapResult {
    const cells: T.OpportunityHeatMapCell[] = [];
    for (const category of OPPORTUNITY_CATEGORIES) {
      for (const rankingLens of OPPORTUNITY_RANKING_LENSES) {
        const rankedIds = new Set((rankings.find((r) => r.lens === rankingLens)?.opportunities ?? []).map((o) => o.id));
        const matches = exchange.filter((o) => o.category === category && rankedIds.has(o.id));
        if (!matches.length) continue;
        const averageScore = matches.reduce((s, o) => s + o.score, 0) / matches.length;
        const totalValue = matches.reduce((s, o) => s + o.estimatedFinancialImpact, 0);
        cells.push({
          category,
          rankingLens,
          count: matches.length,
          averageScore,
          totalValue,
          intensity: clamp01(averageScore / 100),
        });
      }
    }
    const byCategory = new Map<T.OpportunityCategory, number>();
    for (const cell of cells) byCategory.set(cell.category, (byCategory.get(cell.category) ?? 0) + cell.intensity);
    const hottestCategories = [...byCategory.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category]) => category);
    return {
      generatedAt: now.toISOString(),
      cells,
      hottestCategories,
      narrative: `Heat map highlights ${hottestCategories.join(", ") || "no"} as the hottest opportunity categories.`,
    };
  }
}

export class OpportunityPipelineComposer implements C.OpportunityPipelineComposer {
  compose({ records }: Parameters<C.OpportunityPipelineComposer["compose"]>[0]): T.OpportunityPipelineResult {
    const stages = OPPORTUNITY_PIPELINE_STAGES.map((stage) => {
      const stageRecords = records.filter((r) => r.stage === stage);
      return {
        stage,
        count: stageRecords.length,
        value: stageRecords.reduce((s, r) => s + r.estimatedFinancialImpact, 0),
      };
    });
    const totalValue = records.reduce((s, r) => s + r.estimatedFinancialImpact, 0);
    const weightedValue = records.reduce((s, r) => s + r.estimatedFinancialImpact * r.confidence, 0);
    return {
      stages,
      records,
      totalValue,
      weightedValue,
      narrative: `Pipeline holds ${records.length} opportunities totaling $${Math.round(totalValue).toLocaleString()} ($${Math.round(weightedValue).toLocaleString()} confidence-weighted).`,
    };
  }
}

export class ExecutiveOpportunityBriefGenerator implements C.ExecutiveOpportunityBriefGenerator {
  constructor(private readonly createId: Id = (p) => `${p}-${Date.now()}`) {}

  generate({
    request,
    baseline,
    scores,
    topOpportunities,
    rankings,
    analysis,
    confidence,
    now,
  }: Parameters<C.ExecutiveOpportunityBriefGenerator["generate"]>[0]): T.ExecutiveOpportunityBrief {
    const quickWins = rankings.find((r) => r.lens === "quick_wins")?.opportunities ?? [];
    const strategic = rankings.find((r) => r.lens === "strategic_investments")?.opportunities ?? [];
    const elevatedRisks = analysis.risk.filter((r) => r.riskScore >= 55).length;
    return {
      id: this.createId("opp-brief"),
      title: "Executive Opportunity Brief",
      generatedAt: now.toISOString(),
      periodLabel: request.periodLabel ?? now.toLocaleString("en-US", { month: "long", year: "numeric" }),
      headline: `${scores.opportunityScore.status} opportunity posture: ${topOpportunities.length} priorities across quick wins and strategic bets`,
      opportunitySummary: `${topOpportunities.length} top opportunities are ranked for executive action.`,
      financialSummary: `Pipeline value is approximately $${Math.round(baseline.pipelineValue).toLocaleString()} against $${baseline.annualRevenue.toLocaleString()} annual revenue.`,
      missionSummary: `Mission alignment baseline is ${Math.round(baseline.missionAlignment)}; mission-critical opportunities remain co-equal with financial return.`,
      quickWinSummary: `${quickWins.length} quick wins can realize benefit within 90 days.`,
      strategicSummary: `${strategic.length} strategic investments shape long-term value creation.`,
      riskSummary: `${elevatedRisks} opportunities carry elevated composite risk.`,
      decisionsNeeded: [
        "Approve top quick-win pursuits",
        "Authorize strategic investment sequencing",
        "Assign owners for mission-critical opportunities",
      ],
      watchItems: analysis.risk
        .slice(0, 3)
        .map((r) => `Watch risk on ${r.opportunityId} (${Math.round(r.riskScore)})`),
      confidence,
    };
  }
}

export function defaultOpportunityConfidence(
  baseline: T.OpportunityBaseline,
  hasDna: boolean,
  hasOios: boolean,
  exchangeCount: number
): T.OpportunityConfidenceScore {
  return buildConfidence([
    { key: "baseline", label: "Organizational baseline", contribution: baseline.organizationHealthScore / 100 },
    { key: "dna", label: "Organizational DNA", contribution: hasDna ? 0.9 : 0.4 },
    { key: "oios", label: "OIOS health", contribution: hasOios ? 0.88 : 0.45 },
    { key: "exchange", label: "Exchange coverage", contribution: clamp01(exchangeCount / 20) },
  ]);
}
