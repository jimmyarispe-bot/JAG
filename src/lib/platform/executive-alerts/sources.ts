/**
 * Load existing platform signals for the Executive Alert Orchestrator.
 * Reuses executive-metrics source fan-out — no duplicate domain queries.
 */
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { getActivityFeed } from "@/lib/platform/activity/query";
import { getFinancialAlerts } from "@/lib/financial-intelligence/executive";
import { getExecutiveInsights } from "@/lib/executive/command-center";
import {
  assembleExecutiveAggregateMetrics,
  loadExecutiveMetricsSources,
  resolveExecutiveMetricsScope,
  resolveSchoolScopeId,
  type ExecutiveAggregateMetrics,
  type ExecutiveMetricsSourceBundle,
} from "@/lib/platform/executive-metrics";
import type { KpiSnapshotRecord } from "@/lib/platform/kpi-snapshots";
import type {
  ExecutiveMetricConfidence,
  ExecutiveMetricStatus,
  ExecutiveMetricTrendDirection,
} from "@/lib/platform/executive-metrics";
import type {
  ExecutiveAlertsFilters,
  ExecutiveAlertsScope,
} from "@/lib/platform/executive-alerts/types";
import type {
  ActivityAlertLike,
  AdmissionsMetricsLike,
  ComplianceStatsLike,
  ExecutiveInsightLike,
  FinancialAlertLike,
  MissionControlItemLike,
  OperationalLoopSummaryLike,
  WorkforceAnalyticsLike,
} from "@/lib/platform/executive-alerts/adapters";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export interface ExecutiveAlertSourceBundle {
  loadedAt: string;
  scope: ExecutiveAlertsScope;
  schoolId: string | undefined;
  /** Raw metrics fan-out — Founder cards / adapters reuse without re-query. */
  metricsSources: ExecutiveMetricsSourceBundle | null;
  aggregate: ExecutiveAggregateMetrics | null;
  kpiSnapshots: KpiSnapshotRecord[];
  activity: ActivityAlertLike[];
  financialAlerts: FinancialAlertLike[];
  missionControl: MissionControlItemLike[];
  compliance: ComplianceStatsLike | null;
  workforce: WorkforceAnalyticsLike | null;
  admissions: AdmissionsMetricsLike | null;
  operationalLoop: OperationalLoopSummaryLike | null;
  insights: ExecutiveInsightLike[];
}

async function settled<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch {
    return null;
  }
}

function mapSnapshotRow(row: {
  organization_id: string | null;
  region_id: string | null;
  school_id: string | null;
  campus_id: string | null;
  program: string | null;
  kpi_key: string;
  metric_name: string | null;
  actual_value: number | null;
  status: string | null;
  trend_direction: string | null;
  trend_pct: number | null;
  confidence: string | null;
  source: string | null;
  captured_at: string;
  snapshot_date: string;
  capture_mode: string;
  metadata: unknown;
}): KpiSnapshotRecord {
  const meta =
    row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
      ? (row.metadata as Record<string, unknown>)
      : {};

  return {
    organizationId: row.organization_id,
    regionId: row.region_id,
    schoolId: row.school_id,
    campusId: row.campus_id,
    program: row.program,
    metricId: row.kpi_key,
    metricName: row.metric_name ?? row.kpi_key,
    metricValue: row.actual_value,
    status: (row.status as ExecutiveMetricStatus) ?? "unknown",
    trendDirection: (row.trend_direction as ExecutiveMetricTrendDirection) ?? "unknown",
    trendPct: row.trend_pct,
    confidence: (row.confidence as ExecutiveMetricConfidence) ?? "Unknown",
    source: row.source ?? "kpi-snapshots",
    capturedAt: row.captured_at,
    snapshotDate: row.snapshot_date,
    captureMode: (row.capture_mode as KpiSnapshotRecord["captureMode"]) ?? "daily",
    domain: typeof meta.domain === "string" ? meta.domain : undefined,
    unit: typeof meta.unit === "string" ? meta.unit : undefined,
  };
}

/** Latest snapshot_date rows for the scope (breach evaluation). */
export async function loadLatestKpiSnapshots(
  supabase: AuthClient,
  scope: ExecutiveAlertsScope
): Promise<KpiSnapshotRecord[]> {
  let latestQuery = supabase
    .from("executive_kpi_snapshots")
    .select("snapshot_date")
    .order("snapshot_date", { ascending: false })
    .limit(1);

  if (scope.organizationId) latestQuery = latestQuery.eq("organization_id", scope.organizationId);
  if (scope.schoolId) latestQuery = latestQuery.eq("school_id", scope.schoolId);
  else if (scope.campusId) latestQuery = latestQuery.eq("campus_id", scope.campusId);

  const { data: latestRows } = await latestQuery;
  const snapshotDate = latestRows?.[0]?.snapshot_date;
  if (!snapshotDate) return [];

  let query = supabase
    .from("executive_kpi_snapshots")
    .select(
      "organization_id, region_id, school_id, campus_id, program, kpi_key, metric_name, actual_value, status, trend_direction, trend_pct, confidence, source, captured_at, snapshot_date, capture_mode, metadata"
    )
    .eq("snapshot_date", snapshotDate)
    .in("status", ["critical", "at_risk", "watch"]);

  if (scope.organizationId) query = query.eq("organization_id", scope.organizationId);
  if (scope.regionId) query = query.eq("region_id", scope.regionId);
  if (scope.schoolId) query = query.eq("school_id", scope.schoolId);
  if (scope.campusId) query = query.eq("campus_id", scope.campusId);
  if (scope.program) query = query.eq("program", scope.program);

  const { data } = await query;
  return (data ?? []).map(mapSnapshotRow);
}

export function resolveExecutiveAlertsScope(
  filters: ExecutiveAlertsFilters = {}
): ExecutiveAlertsScope {
  return resolveExecutiveMetricsScope(filters);
}

/**
 * Shared alert-source fan-out.
 * Metrics domains load once via loadExecutiveMetricsSources; alert-only
 * extras (FI alerts, KPI breaches, insights, activity titles) load in parallel.
 */
export async function loadExecutiveAlertSources(
  supabase: AuthClient,
  filters: ExecutiveAlertsFilters = {}
): Promise<ExecutiveAlertSourceBundle> {
  const scope = resolveExecutiveAlertsScope(filters);
  const schoolId = resolveSchoolScopeId(scope);
  const loadedAt = new Date().toISOString();

  const [metricsSources, kpiSnapshots, financialAlerts, insights, activity] =
    await Promise.all([
      settled(loadExecutiveMetricsSources(supabase, scope)),
      settled(loadLatestKpiSnapshots(supabase, scope)).then((r) => r ?? []),
      settled(getFinancialAlerts(supabase, schoolId, 30)).then(
        (r) => (r ?? []) as FinancialAlertLike[]
      ),
      settled(getExecutiveInsights(supabase, schoolId, 20)).then(
        (r) => (r ?? []) as ExecutiveInsightLike[]
      ),
      // Prefer activity count path from metrics; load titles for overnight/alerts.
      settled(
        getActivityFeed(supabase, {
          organizationId: scope.organizationId ?? undefined,
          limit: 40,
        })
      ).then((r) => (r ?? []) as ActivityAlertLike[]),
    ]);

  const aggregate = metricsSources
    ? assembleExecutiveAggregateMetrics(metricsSources)
    : null;

  return {
    loadedAt: metricsSources?.loadedAt ?? loadedAt,
    scope,
    schoolId,
    metricsSources,
    aggregate,
    kpiSnapshots,
    activity,
    financialAlerts,
    missionControl: (metricsSources?.missionControl?.feed ??
      []) as MissionControlItemLike[],
    compliance: (metricsSources?.compliance as ComplianceStatsLike | null) ?? null,
    workforce: (metricsSources?.workforce as WorkforceAnalyticsLike | null) ?? null,
    admissions: (metricsSources?.admissions as AdmissionsMetricsLike | null) ?? null,
    operationalLoop:
      (metricsSources?.operationalLoop as OperationalLoopSummaryLike | null) ?? null,
    insights,
  };
}
