/** Improvement scores, health, dashboards, heat map, loop, and briefs (Sprint 036). */
import type * as C from "@/lib/platform/intelligence/organizational-improvement/contracts";
import {
  buildConfidence,
  buildLenses,
  clamp,
  clamp01,
  priorityFromRisk,
  priorityFromScore,
  scoreNarrative,
  statusFromScore,
} from "@/lib/platform/intelligence/organizational-improvement/models";
import {
  IMPROVEMENT_LOOP_STAGES,
  IMPROVEMENT_SOURCE_DOMAINS,
  IMPROVEMENT_THEMES,
  type ImprovementBaseline,
  type ImprovementConfidenceScore,
  type ImprovementRecord,
  type ImprovementScore,
  type ImprovementTheme,
} from "@/lib/platform/intelligence/organizational-improvement/types";
import type * as T from "@/lib/platform/intelligence/organizational-improvement/types";

type Id = (prefix: string) => string;

const lenses = buildLenses({
  whyNow: "Priorities close gaps that compound if deferred.",
  expectedRoi: "Portfolio balance favors durable economic improvement.",
  missionImpact: "Mission outcomes are co-equal with financial return.",
  financialImpact: "Cash generation and cost discipline remain explicit.",
  peopleImpact: "Workforce capacity and leadership bandwidth are protected.",
  implementationEffort: "Effort is sequenced to organizational capacity.",
  risk: "Risk reduction and residual delivery risk are visible.",
  confidence: "Confidence reflects evidence, DNA fit, and readiness.",
  dependencies: "Blocking dependencies shape order of attack.",
  timeToValue: "Quick wins fund and de-risk longer-cycle investments.",
});

function score(key: string, label: string, value: number, risk = false): ImprovementScore {
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

function pickHighest(
  records: ImprovementRecord[],
  selector: (r: ImprovementRecord) => number
): ImprovementRecord | null {
  if (!records.length) return null;
  return [...records].sort((a, b) => selector(b) - selector(a))[0] ?? null;
}

export class ImprovementIntelligence implements C.ImprovementIntelligence {
  composeScores({
    baseline,
    improvements,
    analysis,
  }: Parameters<C.ImprovementIntelligence["composeScores"]>[0]) {
    const avgScore = improvements.length
      ? improvements.reduce((s, o) => s + o.score, 0) / improvements.length
      : 50;
    const avgRoi = improvements.length
      ? improvements.reduce((s, o) => s + o.expectedRoi, 0) / improvements.length
      : 0.5;
    const avgRisk = improvements.length
      ? 100 -
        improvements.reduce((s, o) => s + o.riskReduction, 0) / improvements.length
      : 40;
    const blocked = analysis.dependencies.filter((d) => d.blocked).length;
    const healthScore = score(
      "improvement-health",
      "Improvement health",
      avgScore * 0.3 +
        baseline.executionReadiness * 0.25 +
        baseline.missionAlignment * 0.15 +
        Math.min(25, improvements.length) +
        clamp(avgRoi * 15) * 0.1 -
        blocked * 2
    );
    const improvementScore = score(
      "improvement-score",
      "Improvement score",
      clamp(
        avgScore * 0.5 +
          Math.min(25, improvements.length * 1.1) +
          clamp(baseline.plannedImprovementValue / Math.max(1, baseline.annualRevenue) * 100) * 0.15 +
          baseline.organizationalCapacity * 0.1
      )
    );
    return {
      healthScore,
      improvementScore,
      riskScore: score("improvement-risk", "Improvement risk", avgRisk, true),
    };
  }
}

export class ImprovementHealth implements C.ImprovementHealth {
  assess({
    baseline,
    scores,
    improvements,
    loop,
  }: Parameters<C.ImprovementHealth["assess"]>[0]): T.ImprovementHealthResult {
    const observation = clamp(Math.min(100, improvements.length * 4 + baseline.organizationHealthScore * 0.2));
    const prioritization = clamp(scores.improvementScore.value);
    const planning = clamp(baseline.executionReadiness * 0.5 + scores.improvementScore.value * 0.5);
    const executionReadiness = baseline.executionReadiness;
    const learning = clamp(
      40 +
        loop.learnings.length * 8 +
        loop.measures.length * 5 +
        (loop.stages.length / IMPROVEMENT_LOOP_STAGES.length) * 20
    );
    return {
      overallScore: scores.healthScore.value,
      status: scores.healthScore.status,
      dimensions: { observation, prioritization, planning, executionReadiness, learning },
      lenses,
      narrative: `Improvement health is ${scores.healthScore.status}; loop is at ${loop.currentStage} across ${improvements.length} improvements.`,
    };
  }
}

export class ImprovementDashboard implements C.ImprovementDashboard {
  compose({
    baseline,
    scores,
    improvements,
    planning,
    now,
  }: Parameters<C.ImprovementDashboard["compose"]>[0]): T.ImprovementDashboardResult {
    const plannedValue = improvements.reduce((s, o) => s + o.estimatedFinancialImpact, 0);
    return {
      generatedAt: now.toISOString(),
      improvementScore: scores.improvementScore.value,
      plannedValue,
      quickWinCount: planning.quickWins.items.length,
      strategicCount: planning.strategicInitiatives.items.length,
      status: scores.improvementScore.status,
      headline: `${scores.improvementScore.status} improvement posture with $${plannedValue.toLocaleString()} planned value`,
      narrative: `Improvement score is ${Math.round(scores.improvementScore.value)} across ${improvements.length} records; runway is ${baseline.cashRunwayMonths} months.`,
    };
  }
}

export class MissionImprovementDashboard implements C.MissionImprovementDashboard {
  build({
    improvements,
    now,
  }: Parameters<C.MissionImprovementDashboard["build"]>[0]): T.MissionImprovementDashboardResult {
    const selected = [...improvements]
      .sort((a, b) => b.estimatedMissionImpact - a.estimatedMissionImpact)
      .slice(0, 10);
    const averageMissionImpact = selected.length
      ? selected.reduce((s, o) => s + o.estimatedMissionImpact, 0) / selected.length
      : 0;
    return {
      generatedAt: now.toISOString(),
      improvements: selected,
      averageMissionImpact,
      status: statusFromScore(averageMissionImpact),
      narrative: `${selected.length} mission-focused improvements average ${Math.round(averageMissionImpact)} mission impact.`,
    };
  }
}

export class FinancialImprovementDashboard implements C.FinancialImprovementDashboard {
  build({
    improvements,
    now,
  }: Parameters<C.FinancialImprovementDashboard["build"]>[0]): T.FinancialImprovementDashboardResult {
    const selected = [...improvements]
      .sort((a, b) => b.estimatedFinancialImpact - a.estimatedFinancialImpact)
      .slice(0, 10);
    const totalFinancialImpact = selected.reduce((s, o) => s + o.estimatedFinancialImpact, 0);
    const averageRoi = selected.length
      ? selected.reduce((s, o) => s + o.expectedRoi, 0) / selected.length
      : 0;
    return {
      generatedAt: now.toISOString(),
      improvements: selected,
      totalFinancialImpact,
      averageRoi,
      status: statusFromScore(clamp(averageRoi * 40 + 40)),
      narrative: `${selected.length} financially material improvements total $${totalFinancialImpact.toLocaleString()} at ${(averageRoi * 100).toFixed(0)}% average ROI.`,
    };
  }
}

export class PeopleImprovementDashboard implements C.PeopleImprovementDashboard {
  build({
    improvements,
    now,
  }: Parameters<C.PeopleImprovementDashboard["build"]>[0]): T.PeopleImprovementDashboardResult {
    const selected = [...improvements]
      .sort((a, b) => b.estimatedPeopleImpact - a.estimatedPeopleImpact)
      .slice(0, 10);
    const averagePeopleImpact = selected.length
      ? selected.reduce((s, o) => s + o.estimatedPeopleImpact, 0) / selected.length
      : 0;
    return {
      generatedAt: now.toISOString(),
      improvements: selected,
      averagePeopleImpact,
      status: statusFromScore(averagePeopleImpact),
      narrative: `${selected.length} people-focused improvements average ${Math.round(averagePeopleImpact)} people impact.`,
    };
  }
}

export class TodaysPrioritiesComposer implements C.TodaysPrioritiesComposer {
  compose({
    improvements,
    now,
  }: Parameters<C.TodaysPrioritiesComposer["compose"]>[0]): T.TodaysPrioritiesResult {
    const priorities = [...improvements].sort((a, b) => b.score - a.score).slice(0, 5);
    return {
      generatedAt: now.toISOString(),
      priorities,
      narrative: `Today's priorities are the top ${priorities.length} improvements by composite score.`,
    };
  }
}

export class ImprovementHeatMap implements C.ImprovementHeatMap {
  compose({
    improvements,
    now,
  }: Parameters<C.ImprovementHeatMap["compose"]>[0]): T.ImprovementHeatMapResult {
    const cells: T.ImprovementHeatMapCell[] = [];
    for (const sourceDomain of IMPROVEMENT_SOURCE_DOMAINS) {
      for (const theme of IMPROVEMENT_THEMES) {
        const matches = improvements.filter((o) => o.sourceDomain === sourceDomain && o.theme === theme);
        if (!matches.length) continue;
        const averageScore = matches.reduce((s, o) => s + o.score, 0) / matches.length;
        const totalValue = matches.reduce((s, o) => s + o.estimatedFinancialImpact, 0);
        cells.push({
          sourceDomain,
          theme,
          count: matches.length,
          averageScore,
          totalValue,
          intensity: clamp01(averageScore / 100),
        });
      }
    }
    const byTheme = new Map<ImprovementTheme, number>();
    for (const cell of cells) byTheme.set(cell.theme, (byTheme.get(cell.theme) ?? 0) + cell.intensity);
    const hottestThemes = [...byTheme.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([theme]) => theme);
    return {
      generatedAt: now.toISOString(),
      cells,
      hottestThemes,
      narrative: `Heat map highlights ${hottestThemes.join(", ") || "no"} as the hottest improvement themes.`,
    };
  }
}

export class ContinuousImprovementLoop implements C.ContinuousImprovementLoop {
  run({
    improvements,
    analysis,
    planning,
    createId,
  }: Parameters<C.ContinuousImprovementLoop["run"]>[0]): T.ContinuousImprovementLoopResult {
    const stages = [...IMPROVEMENT_LOOP_STAGES];
    const top = [...improvements].sort((a, b) => b.score - a.score).slice(0, 5);
    const observations = [
      `${improvements.length} improvements observed across source domains.`,
      `Average score ${improvements.length ? Math.round(improvements.reduce((s, i) => s + i.score, 0) / improvements.length) : 0}.`,
    ];
    const recommendations = top.map((i) => `Recommend: ${i.title}`);
    const measures = [
      `Track realized value against $${planning.quarterly.totalValue.toLocaleString()} quarterly plan.`,
      `Monitor blocked dependencies (${analysis.dependencies.filter((d) => d.blocked).length}).`,
    ];
    const learnings = [
      "Quick wins should fund strategic capacity.",
      "Capacity constraints must gate sequencing.",
      analysis.narrative,
    ];
    return {
      stages,
      currentStage: "prioritize",
      observations,
      recommendations,
      measures,
      learnings,
      cycleId: createId("imp-loop"),
      narrative: `Continuous improvement loop is active across ${stages.length} stages with ${improvements.length} improvements in scope.`,
    };
  }
}

export class DailyExecutiveBriefGenerator implements C.DailyExecutiveBriefGenerator {
  constructor(private readonly createId: Id = (p) => `${p}-${Date.now()}`) {}

  generate({
    request,
    improvements,
    confidence,
    now,
    createId,
  }: Parameters<C.DailyExecutiveBriefGenerator["generate"]>[0]): T.DailyExecutiveBrief {
    const idFn = createId ?? this.createId;
    const topFive = [...improvements].sort((a, b) => b.score - a.score).slice(0, 5);
    return {
      id: idFn("imp-daily"),
      title: "Daily Executive Improvement Brief",
      generatedAt: now.toISOString(),
      periodLabel: request.periodLabel ?? now.toLocaleString("en-US", { month: "long", year: "numeric" }),
      headline: `${topFive.length} priority improvements for today across financial, mission, and people lenses`,
      topFive,
      highestFinancial: pickHighest(improvements, (r) => r.estimatedFinancialImpact),
      highestMission: pickHighest(improvements, (r) => r.estimatedMissionImpact),
      highestPeople: pickHighest(improvements, (r) => r.estimatedPeopleImpact),
      highestRevenue: pickHighest(improvements, (r) => r.estimatedRevenueImpact),
      highestFunding: pickHighest(improvements, (r) => r.estimatedFundingImpact),
      highestOperational: pickHighest(improvements, (r) => r.estimatedOperationalImpact),
      highestRiskReduction: pickHighest(improvements, (r) => r.riskReduction),
      highestConfidence: pickHighest(improvements, (r) => r.confidence),
      decisionsNeeded: [
        "Confirm today's top five owners",
        "Clear blocking dependencies on priority items",
        "Approve quick-win spend gates",
      ],
      watchItems: topFive.slice(0, 3).map((r) => `Watch ${r.title} (${r.priority})`),
      confidence,
    };
  }
}

export class ExecutiveImprovementBriefGenerator implements C.ExecutiveImprovementBriefGenerator {
  constructor(private readonly createId: Id = (p) => `${p}-${Date.now()}`) {}

  generate({
    request,
    baseline,
    scores,
    improvements,
    planning,
    analysis,
    confidence,
    now,
    createId,
  }: Parameters<C.ExecutiveImprovementBriefGenerator["generate"]>[0]): T.ExecutiveImprovementBrief {
    const idFn = createId ?? this.createId;
    const elevatedRisks = analysis.riskReduction.filter((r) => r.riskReduction < 45).length;
    return {
      id: idFn("imp-brief"),
      title: "Executive Improvement Brief",
      generatedAt: now.toISOString(),
      periodLabel: request.periodLabel ?? now.toLocaleString("en-US", { month: "long", year: "numeric" }),
      headline: `${scores.improvementScore.status} improvement posture: ${improvements.length} actions across weekly and quarterly plans`,
      improvementSummary: `${improvements.length} improvements are scored for executive action.`,
      financialSummary: `Planned improvement value is approximately $${Math.round(baseline.plannedImprovementValue).toLocaleString()} against $${baseline.annualRevenue.toLocaleString()} annual revenue.`,
      missionSummary: `Mission alignment baseline is ${Math.round(baseline.missionAlignment)}; mission impact remains co-equal with financial return.`,
      peopleSummary: `Workforce capacity baseline is ${Math.round(baseline.workforceCapacity)}; people impact improvements stay in the first tranche.`,
      weeklyPlanSummary: `${planning.weekly.items.length} items are sequenced for this week totaling $${planning.weekly.totalValue.toLocaleString()}.`,
      quarterlyRoadmapSummary: `${planning.quarterly.items.length} items compose the quarterly roadmap totaling $${planning.quarterly.totalValue.toLocaleString()}.`,
      riskSummary: `${elevatedRisks} improvements show comparatively low risk-reduction contribution.`,
      decisionsNeeded: [
        "Approve today's priority set",
        "Authorize quarterly roadmap sequencing",
        "Assign owners for capacity-constrained items",
      ],
      watchItems: analysis.capacity
        .filter((c) => c.constrained)
        .slice(0, 3)
        .map((c) => `Capacity constraint on ${c.improvementId}`),
      confidence,
    };
  }
}

export function defaultImprovementConfidence(
  baseline: ImprovementBaseline,
  hasDna: boolean,
  hasOios: boolean,
  improvementCount: number
): ImprovementConfidenceScore {
  return buildConfidence([
    { key: "baseline", label: "Organizational baseline", contribution: baseline.organizationHealthScore / 100 },
    { key: "dna", label: "Organizational DNA", contribution: hasDna ? 0.9 : 0.4 },
    { key: "oios", label: "OIOS health", contribution: hasOios ? 0.88 : 0.45 },
    { key: "coverage", label: "Improvement coverage", contribution: clamp01(improvementCount / 20) },
  ]);
}
