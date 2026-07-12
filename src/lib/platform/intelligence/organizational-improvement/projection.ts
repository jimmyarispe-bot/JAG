/** Improvement projection and query services (Sprint 036). */
import type * as C from "@/lib/platform/intelligence/organizational-improvement/contracts";
import { buildConfidence } from "@/lib/platform/intelligence/organizational-improvement/models";
import type * as T from "@/lib/platform/intelligence/organizational-improvement/types";

export class ImprovementProjection implements C.ImprovementProjection {
  project(input: Parameters<C.ImprovementProjection["project"]>[0]): T.ImprovementProjectionResult {
    const priorities = input.todaysPriorities.priorities;
    const averageRoi = priorities.length
      ? priorities.reduce((s, o) => s + o.expectedRoi, 0) / priorities.length
      : 0;
    const averageConfidence = priorities.length
      ? priorities.reduce((s, o) => s + o.confidence, 0) / priorities.length
      : input.confidence.value;
    return {
      generatedAt: input.brief.generatedAt,
      headline: input.brief.headline,
      improvementScore: input.scores.improvementScore.value,
      healthScore: input.scores.healthScore.value,
      todaysPriorities: input.todaysPriorities,
      weeklyPlan: input.weeklyPlan,
      quarterlyRoadmap: input.quarterlyRoadmap,
      brief: input.brief,
      dailyBrief: input.dailyBrief,
      dashboard: input.dashboard,
      metrics: {
        plannedValue: input.dashboard.plannedValue,
        realizedValueYtd: input.baseline.realizedImprovementValueYtd,
        quickWinCount: input.dashboard.quickWinCount,
        strategicCount: input.dashboard.strategicCount,
        averageRoi,
        averageConfidence,
      },
      overallConfidence: input.confidence,
    };
  }
}

export class ImprovementQueries implements C.ImprovementQueries {
  ask(result: T.ImprovementResult, request: T.ImprovementQueryRequest): T.ImprovementQueryResult {
    const focus = request.focus ?? "general";
    const max = request.maxResults ?? 5;
    let answer = result.brief.headline;
    let references = result.recommendations.slice(0, max);

    switch (focus) {
      case "financial":
        answer = result.financialDashboard.narrative;
        references = result.financialDashboard.improvements.slice(0, max).map((x) => x.narrative);
        break;
      case "mission":
        answer = result.missionDashboard.narrative;
        references = result.missionDashboard.improvements.slice(0, max).map((x) => x.narrative);
        break;
      case "people":
        answer = result.peopleDashboard.narrative;
        references = result.peopleDashboard.improvements.slice(0, max).map((x) => x.narrative);
        break;
      case "revenue":
        answer = `${result.sources.revenue.length} revenue-domain improvements are active.`;
        references = result.sources.revenue.slice(0, max).map((x) => x.narrative);
        break;
      case "funding":
        answer = `${result.sources.funding.length} funding-domain improvements are active.`;
        references = result.sources.funding.slice(0, max).map((x) => x.narrative);
        break;
      case "operational":
        answer = `${result.improvements.filter((i) => i.theme === "operational").length} operational improvements are active.`;
        references = result.improvements
          .filter((i) => i.theme === "operational")
          .slice(0, max)
          .map((x) => x.narrative);
        break;
      case "risk":
        answer =
          result.analysis.riskReduction.slice(0, 1).map((r) => r.narrative).join(" ") ||
          "No elevated improvement risks.";
        references = result.analysis.riskReduction.slice(0, max).map((x) => x.narrative);
        break;
      case "quick_wins":
        answer = result.planning.quickWins.narrative;
        references = result.planning.quickWins.items.slice(0, max).map((x) => x.narrative);
        break;
      case "strategic":
        answer = result.planning.strategicInitiatives.narrative;
        references = result.planning.strategicInitiatives.items.slice(0, max).map((x) => x.narrative);
        break;
      case "weekly":
        answer = result.planning.weekly.narrative;
        references = result.planning.weekly.items.slice(0, max).map((x) => x.narrative);
        break;
      case "quarterly":
        answer = result.planning.quarterly.narrative;
        references = result.planning.quarterly.items.slice(0, max).map((x) => x.narrative);
        break;
      case "loop":
        answer = result.loop.narrative;
        references = [
          ...result.loop.recommendations.slice(0, Math.max(1, Math.floor(max / 2))),
          ...result.loop.learnings.slice(0, Math.max(1, Math.ceil(max / 2))),
        ].slice(0, max);
        break;
      case "general":
      default:
        answer = result.brief.headline;
        references = result.todaysPriorities.priorities.slice(0, max).map((x) => x.narrative);
        break;
    }

    return {
      question: request.question,
      focus,
      answer,
      references,
      confidence: buildConfidence([
        { key: "result", label: "Result coverage", contribution: result.confidence.value },
        { key: "focus", label: "Focus specificity", contribution: focus === "general" ? 0.6 : 0.85 },
      ]),
    };
  }
}
