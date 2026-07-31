import { getInsightEngine } from "@/lib/executive-intelligence/insights/engine";
import type {
  ExecutiveInsight,
  InsightDashboardSection,
  InsightFilter,
  InsightSeverityCounts,
} from "@/lib/executive-intelligence/insights/types";
import { listInsightsForOrganization } from "@/lib/executive-intelligence/insights/store";

function severityCounts(
  insights: readonly ExecutiveInsight[]
): InsightSeverityCounts {
  const counts = {
    Info: 0,
    Warning: 0,
    Critical: 0,
  };
  for (const i of insights) {
    counts[i.severity] += 1;
  }
  return counts satisfies InsightSeverityCounts;
}

export function filterInsights(
  insights: readonly ExecutiveInsight[],
  filter: InsightFilter = {}
): readonly ExecutiveInsight[] {
  return Object.freeze(
    insights.filter((i) => {
      if (filter.severity && i.severity !== filter.severity) return false;
      if (filter.domain && i.domain !== filter.domain) return false;
      if (filter.status && i.status !== filter.status) return false;
      return true;
    })
  );
}

export type InsightEvaluationService = {
  evaluate(organizationId: string, actor?: string): InsightDashboardSection;
  listActive(
    organizationId: string,
    filter?: InsightFilter
  ): readonly ExecutiveInsight[];
  listAll(
    organizationId: string,
    filter?: InsightFilter
  ): readonly ExecutiveInsight[];
  getInsight(
    organizationId: string,
    insightId: string
  ): ExecutiveInsight | null;
  resolve(
    organizationId: string,
    insightId: string,
    actor?: string
  ): ExecutiveInsight | null;
};

export function createInsightEvaluationService(): InsightEvaluationService {
  const engine = getInsightEngine();
  return {
    evaluate(organizationId, actor) {
      const result = engine.evaluateOrganization({ organizationId, actor });
      const all = listInsightsForOrganization(organizationId);
      const active = all.filter((i) => i.status === "Active");
      const recentlyResolved = all
        .filter((i) => i.status === "Resolved")
        .slice(0, 20);
      return {
        active: Object.freeze(active),
        recentlyResolved: Object.freeze(recentlyResolved),
        countsBySeverity: severityCounts(active),
        evaluatedAt: result.evaluatedAt,
      };
    },
    listActive(organizationId, filter) {
      const active = listInsightsForOrganization(organizationId).filter(
        (i) => i.status === "Active"
      );
      return filterInsights(active, filter);
    },
    listAll(organizationId, filter) {
      return filterInsights(listInsightsForOrganization(organizationId), filter);
    },
    getInsight(organizationId, insightId) {
      return (
        listInsightsForOrganization(organizationId).find(
          (i) => i.id === insightId
        ) ?? null
      );
    },
    resolve(organizationId, insightId, actor) {
      return engine.resolveInsight({ organizationId, insightId, actor });
    },
  };
}

export function evaluateExecutiveInsights(
  organizationId: string,
  actor?: string
): InsightDashboardSection {
  return createInsightEvaluationService().evaluate(organizationId, actor);
}
