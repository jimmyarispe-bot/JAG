import type { createAuthClient } from "@/lib/supabase/server-auth";
import {
  EXECUTIVE_METRIC_DOMAIN_ORDER,
  type ExecutiveAggregateMetrics,
  type ExecutiveMetric,
  type ExecutiveMetricDomain,
  type ExecutiveMetricsFilters,
} from "@/lib/platform/executive-metrics/types";
import { resolveExecutiveMetricsScope } from "@/lib/platform/executive-metrics/scope";
import { loadExecutiveMetricsSources } from "@/lib/platform/executive-metrics/sources";
import { EXECUTIVE_METRIC_PROVIDERS } from "@/lib/platform/executive-metrics/providers";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export interface GetExecutiveAggregateMetricsOptions {
  /** Limit to specific domains; default all. */
  domains?: ExecutiveMetricDomain[];
}

function emptyDomainMap(): Record<ExecutiveMetricDomain, ExecutiveMetric[]> {
  return {
    enrollment: [],
    admissions: [],
    finance: [],
    staffing: [],
    attendance: [],
    compliance: [],
    operations: [],
    executive: [],
  };
}

/**
 * Canonical executive metrics aggregation.
 * Single source of truth for Morning Brief, Executive Dashboard, FI, Mission Control,
 * KPI Engine, Health Scores, and Executive Narrative — without changing those UIs yet.
 */
export async function getExecutiveAggregateMetrics(
  supabase: AuthClient,
  filters: ExecutiveMetricsFilters = {},
  options: GetExecutiveAggregateMetricsOptions = {}
): Promise<ExecutiveAggregateMetrics> {
  const scope = resolveExecutiveMetricsScope(filters);
  const sources = await loadExecutiveMetricsSources(supabase, scope);
  return assembleExecutiveAggregateMetrics(sources, options.domains);
}

/** Pure assembly from a preloaded source bundle (unit-testable). */
export function assembleExecutiveAggregateMetrics(
  sources: Awaited<ReturnType<typeof loadExecutiveMetricsSources>>,
  domains?: ExecutiveMetricDomain[]
): ExecutiveAggregateMetrics {
  const domainKeys = domains?.length
    ? EXECUTIVE_METRIC_DOMAIN_ORDER.filter((d) => domains.includes(d))
    : EXECUTIVE_METRIC_DOMAIN_ORDER;

  const domainMap = emptyDomainMap();
  const metrics: ExecutiveMetric[] = [];
  const byId: Record<string, ExecutiveMetric> = {};

  for (const domain of domainKeys) {
    const provider = EXECUTIVE_METRIC_PROVIDERS[domain];
    const domainMetrics = provider(sources);
    domainMap[domain] = domainMetrics;
    for (const metric of domainMetrics) {
      metrics.push(metric);
      byId[metric.id] = metric;
    }
  }

  return {
    scope: sources.scope,
    aggregatedAt: sources.loadedAt,
    domains: domainMap,
    metrics,
    byId,
  };
}

/** Lookup a single metric by id from an aggregate result. */
export function getMetricById(
  aggregate: ExecutiveAggregateMetrics,
  id: string
): ExecutiveMetric | null {
  return aggregate.byId[id] ?? null;
}

/** Filter aggregate metrics by domain. */
export function getMetricsByDomain(
  aggregate: ExecutiveAggregateMetrics,
  domain: ExecutiveMetricDomain
): ExecutiveMetric[] {
  return aggregate.domains[domain] ?? [];
}
