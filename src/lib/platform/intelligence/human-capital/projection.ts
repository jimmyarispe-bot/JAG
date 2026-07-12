/**
 * Human Capital Intelligence — projection + queries (Sprint 032).
 */

import type {
  HumanCapitalProjection as HumanCapitalProjectionContract,
  HumanCapitalQueries as HumanCapitalQueriesContract,
} from "@/lib/platform/intelligence/human-capital/contracts";
import { buildConfidence } from "@/lib/platform/intelligence/human-capital/models";
import type {
  HumanCapitalProjectionResult,
  HumanCapitalQueryRequest,
  HumanCapitalQueryResult,
  HumanCapitalResult,
} from "@/lib/platform/intelligence/human-capital/types";

export class HumanCapitalProjection implements HumanCapitalProjectionContract {
  project(input: {
    request: Parameters<HumanCapitalProjectionContract["project"]>[0]["request"];
    workforceHealthScore: Parameters<HumanCapitalProjectionContract["project"]>[0]["workforceHealthScore"];
    leadershipHealthScore: Parameters<HumanCapitalProjectionContract["project"]>[0]["leadershipHealthScore"];
    employeeEngagementScore: Parameters<HumanCapitalProjectionContract["project"]>[0]["employeeEngagementScore"];
    talentRiskScore: Parameters<HumanCapitalProjectionContract["project"]>[0]["talentRiskScore"];
    hiringDashboard: Parameters<HumanCapitalProjectionContract["project"]>[0]["hiringDashboard"];
    succession: Parameters<HumanCapitalProjectionContract["project"]>[0]["succession"];
    forecast: Parameters<HumanCapitalProjectionContract["project"]>[0]["forecast"];
    coaching: Parameters<HumanCapitalProjectionContract["project"]>[0]["coaching"];
    careerPlans: Parameters<HumanCapitalProjectionContract["project"]>[0]["careerPlans"];
    brief: Parameters<HumanCapitalProjectionContract["project"]>[0]["brief"];
    candidates: Parameters<HumanCapitalProjectionContract["project"]>[0]["candidates"];
    employees: Parameters<HumanCapitalProjectionContract["project"]>[0]["employees"];
    retention: Parameters<HumanCapitalProjectionContract["project"]>[0]["retention"];
    learningPlans: Parameters<HumanCapitalProjectionContract["project"]>[0]["learningPlans"];
    confidence: Parameters<HumanCapitalProjectionContract["project"]>[0]["confidence"];
    dashboard: Parameters<HumanCapitalProjectionContract["project"]>[0]["dashboard"];
    burnoutDashboard: Parameters<HumanCapitalProjectionContract["project"]>[0]["burnoutDashboard"];
    capabilityIndex: Parameters<HumanCapitalProjectionContract["project"]>[0]["capabilityIndex"];
  }): HumanCapitalProjectionResult {
    return {
      generatedAt: input.brief.generatedAt,
      headline: input.brief.headline,
      workforceHealthScore: input.workforceHealthScore.value,
      leadershipHealthScore: input.leadershipHealthScore.value,
      employeeEngagementScore: input.employeeEngagementScore.value,
      talentRiskScore: input.talentRiskScore.value,
      hiringDashboard: input.hiringDashboard,
      successionReadiness: input.succession,
      forecast: input.forecast,
      coachingRecommendations: input.coaching,
      careerPlans: input.careerPlans,
      brief: input.brief,
      dashboard: input.dashboard,
      burnoutDashboard: input.burnoutDashboard,
      capabilityIndex: input.capabilityIndex,
      metrics: {
        headcount: input.employees.length,
        openRoles: input.hiringDashboard.openRoles,
        candidateCount: input.candidates.length,
        atRiskCount: input.retention.filter((r) => r.flightRisk >= 0.5).length,
        successionSlots: input.succession.slots.length,
        learningPlans: input.learningPlans.length,
      },
      overallConfidence: input.confidence,
    };
  }
}

export class HumanCapitalQueries implements HumanCapitalQueriesContract {
  ask(
    result: HumanCapitalResult,
    request: HumanCapitalQueryRequest
  ): HumanCapitalQueryResult {
    const focus = request.focus ?? "general";
    const max = request.maxResults ?? 5;

    let answer: string;
    let references: string[] = [];

    switch (focus) {
      case "hiring":
        answer = result.hiringDashboard.narrative;
        references = result.hiringRecommendations
          .slice(0, max)
          .map((r) => `${r.role}: ${r.rationale}`);
        break;
      case "retention":
        answer = `Talent risk ${Math.round(result.talentRiskScore.value)}; ${result.retention.filter((r) => r.flightRisk >= 0.5).length} elevated flight risks.`;
        references = result.retention
          .slice(0, max)
          .map((r) => `${r.employeeId}: ${Math.round(r.flightRisk * 100)}% flight risk`);
        break;
      case "leadership":
        answer = result.succession.narrative;
        references = result.succession.slots
          .slice(0, max)
          .map((s) => `${s.criticalRole}: ${s.readiness}`);
        break;
      case "learning":
        answer = `${result.learningPlans.length} learning plans; ${result.careerPlans.length} career development plans.`;
        references = result.careerPlans
          .slice(0, max)
          .map((p) => p.narrative);
        break;
      case "compensation":
        answer = result.compensation.narrative;
        references = result.compensation.benchmarks
          .slice(0, max)
          .map((b) => b.narrative);
        break;
      case "planning":
        answer = `Forecast ends at ${result.forecast[result.forecast.length - 1]?.headcount ?? result.baseline.headcount} headcount.`;
        references = result.scenarios.slice(0, max).map((s) => s.narrative);
        break;
      case "coaching":
        answer = `${result.coaching.length} coaching recommendations ready.`;
        references = result.coaching.slice(0, max).map((c) => c.narrative);
        break;
      case "workforce":
        answer = result.workforceHealthScore.narrative;
        references = [
          result.leadershipHealthScore.narrative,
          result.employeeEngagementScore.narrative,
          result.talentRiskScore.narrative,
        ];
        break;
      default:
        answer = result.brief.headline;
        references = result.recommendations.slice(0, max);
    }

    return {
      question: request.question,
      focus,
      answer,
      references,
      confidence: buildConfidence([
        {
          key: "result",
          label: "Result coverage",
          contribution: result.confidence.value,
        },
        {
          key: "focus",
          label: "Focus specificity",
          contribution: focus === "general" ? 0.55 : 0.8,
        },
      ]),
    };
  }
}
