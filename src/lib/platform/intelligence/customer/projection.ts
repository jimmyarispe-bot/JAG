/**
 * Customer Intelligence — projection + queries (Sprint 039).
 */

import type {
  CustomerProjection as CustomerProjectionContract,
  CustomerQueries as CustomerQueriesContract,
} from "@/lib/platform/intelligence/customer/contracts";
import { buildConfidence } from "@/lib/platform/intelligence/customer/models";
import type {
  CustomerProjectionResult,
  CustomerQueryRequest,
  CustomerQueryResult,
  CustomerResult,
} from "@/lib/platform/intelligence/customer/types";

export class CustomerProjection implements CustomerProjectionContract {
  project(input: {
    request: Parameters<CustomerProjectionContract["project"]>[0]["request"];
    healthScore: Parameters<CustomerProjectionContract["project"]>[0]["healthScore"];
    engagementScore: Parameters<
      CustomerProjectionContract["project"]
    >[0]["engagementScore"];
    journeyScore: Parameters<CustomerProjectionContract["project"]>[0]["journeyScore"];
    satisfactionScore: Parameters<
      CustomerProjectionContract["project"]
    >[0]["satisfactionScore"];
    retentionScore: Parameters<
      CustomerProjectionContract["project"]
    >[0]["retentionScore"];
    communityScore: Parameters<
      CustomerProjectionContract["project"]
    >[0]["communityScore"];
    journeyMap: Parameters<CustomerProjectionContract["project"]>[0]["journeyMap"];
    engagement: Parameters<CustomerProjectionContract["project"]>[0]["engagement"];
    satisfaction: Parameters<
      CustomerProjectionContract["project"]
    >[0]["satisfaction"];
    retentionWatchlist: Parameters<
      CustomerProjectionContract["project"]
    >[0]["retentionWatchlist"];
    communityHealth: Parameters<
      CustomerProjectionContract["project"]
    >[0]["communityHealth"];
    brief: Parameters<CustomerProjectionContract["project"]>[0]["brief"];
    confidence: Parameters<CustomerProjectionContract["project"]>[0]["confidence"];
    dashboard: Parameters<CustomerProjectionContract["project"]>[0]["dashboard"];
    baseline: Parameters<CustomerProjectionContract["project"]>[0]["baseline"];
  }): CustomerProjectionResult {
    return {
      generatedAt: input.brief.generatedAt,
      headline: input.brief.headline,
      healthScore: input.healthScore.value,
      engagementScore: input.engagementScore.value,
      journeyScore: input.journeyScore.value,
      satisfactionScore: input.satisfactionScore.value,
      retentionScore: input.retentionScore.value,
      communityScore: input.communityScore.value,
      journeyMap: input.journeyMap,
      engagement: input.engagement,
      satisfaction: input.satisfaction,
      retentionWatchlist: input.retentionWatchlist,
      communityHealth: input.communityHealth,
      brief: input.brief,
      dashboard: input.dashboard,
      metrics: {
        enrollment: input.baseline.enrollment,
        admissions: input.baseline.admissions,
        studentAttendance: input.baseline.studentAttendance,
        personaCount: input.baseline.personaCount,
        withdrawalRisk: input.baseline.withdrawalRisk,
        belongingIndex: input.baseline.belongingIndex,
        complaintBurden: input.baseline.complaintBurden,
      },
      overallConfidence: input.confidence,
    };
  }
}

export class CustomerQueries implements CustomerQueriesContract {
  ask(
    result: CustomerResult,
    request: CustomerQueryRequest
  ): CustomerQueryResult {
    const focus = request.focus ?? "general";
    const max = request.maxResults ?? 5;

    let answer: string;
    let references: string[] = [];

    switch (focus) {
      case "journey":
        answer = result.journeyMap.narrative;
        references = result.journeyMap.stages
          .slice(0, max)
          .map((s) => s.narrative);
        break;
      case "engagement":
        answer = result.engagement.narrative;
        references = result.engagement.dimensions
          .slice(0, max)
          .map((d) => d.narrative);
        break;
      case "satisfaction":
        answer = result.satisfaction.narrative;
        references = result.satisfaction.signals
          .slice(0, max)
          .map((s) => s.narrative);
        break;
      case "retention":
        answer = result.retentionWatchlist.narrative;
        references = result.retentionWatchlist.factors
          .slice(0, max)
          .map((f) => f.narrative);
        break;
      case "community":
        answer = result.communityHealth.narrative;
        references = result.communityHealth.pillars
          .slice(0, max)
          .map((p) => p.narrative);
        break;
      case "risk":
        answer = result.riskScore.narrative;
        references = result.risks.slice(0, max).map((r) => r.narrative);
        break;
      case "opportunity":
        answer = result.opportunities[0]?.narrative ?? result.brief.summary;
        references = result.opportunities.slice(0, max).map((o) => o.narrative);
        break;
      default:
        answer = result.brief.headline;
        references = result.recommendations.slice(0, max).map((r) => r.title);
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
