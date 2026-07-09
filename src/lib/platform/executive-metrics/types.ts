/** Executive Metrics Aggregation Layer — canonical metric contract (Sprint 002 Task 1). */

export type ExecutiveMetricDomain =
  | "enrollment"
  | "admissions"
  | "finance"
  | "staffing"
  | "attendance"
  | "compliance"
  | "operations"
  | "executive";

export type ExecutiveMetricConfidence = "High" | "Medium" | "Low" | "Unknown";

export type ExecutiveMetricStatus =
  | "healthy"
  | "watch"
  | "at_risk"
  | "critical"
  | "unknown";

export type ExecutiveMetricTrendDirection = "up" | "down" | "flat" | "unknown";

export interface ExecutiveMetricTrend {
  direction: ExecutiveMetricTrendDirection;
  /** Percent change when known; null when unknown. */
  pct: number | null;
}

export interface ExecutiveMetric {
  id: string;
  name: string;
  value: number | null;
  status: ExecutiveMetricStatus;
  trend: ExecutiveMetricTrend;
  lastUpdated: string;
  source: string;
  confidence: ExecutiveMetricConfidence;
  domain: ExecutiveMetricDomain;
  unit?: string;
}

/** Scope filters supported by the aggregation layer. */
export interface ExecutiveMetricsFilters {
  networkId?: string | null;
  regionId?: string | null;
  campusId?: string | null;
  programId?: string | null;
  /** Program key/name when IDs are not used by domain services. */
  program?: string | null;
  organizationId?: string | null;
  /** Campus/school site — primary scope for most domain loaders. */
  schoolId?: string | null;
}

/** Normalized scope applied to a metrics request. */
export interface ExecutiveMetricsScope {
  networkId: string | null;
  regionId: string | null;
  campusId: string | null;
  programId: string | null;
  program: string | null;
  organizationId: string | null;
  schoolId: string | null;
}

export interface ExecutiveMetricsDomainBundle {
  domain: ExecutiveMetricDomain;
  metrics: ExecutiveMetric[];
}

export interface ExecutiveAggregateMetrics {
  scope: ExecutiveMetricsScope;
  aggregatedAt: string;
  domains: Record<ExecutiveMetricDomain, ExecutiveMetric[]>;
  /** Flat list across all domains (stable domain order). */
  metrics: ExecutiveMetric[];
  /** Metric lookup by id. */
  byId: Record<string, ExecutiveMetric>;
}

export const EXECUTIVE_METRIC_DOMAIN_ORDER: ExecutiveMetricDomain[] = [
  "enrollment",
  "admissions",
  "finance",
  "staffing",
  "attendance",
  "compliance",
  "operations",
  "executive",
];
