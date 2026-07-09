import type { createAuthClient } from "@/lib/supabase/server-auth";
import type { KpiRow } from "@/lib/executive/types";
import {
  getExecutiveAggregateMetrics,
  type ExecutiveAggregateMetrics,
} from "@/lib/platform/executive-metrics";
import { loadKpiSnapshotPair } from "@/lib/dashboard/morning-brief/kpi-compare";
import type { KpiSnapshotRecord } from "@/lib/platform/kpi-snapshots";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/** Map Sprint 002 metric ids / legacy kpi_key aliases to aggregate values. */
const KPI_TO_METRIC: Record<string, string> = {
  enrollment_growth: "enrollment.active_enrollments",
  attendance_rate: "attendance.rate",
  collection_rate: "finance.collection_rate",
  operating_margin: "finance.operating_margin",
  staff_retention: "staffing.retention_rate",
  avg_success_score: "executive.avg_success_score",
  reading_growth: "executive.academic_growth_pct",
};

function statusFromAggregate(
  status: string | undefined
): KpiRow["status"] {
  switch (status) {
    case "healthy":
      return "on_track";
    case "watch":
      return "warning";
    case "at_risk":
    case "critical":
      return "critical";
    default:
      return "unknown";
  }
}

function scoreKpiStatus(
  actual: number | null,
  target: number | null,
  warning: number | null,
  critical: number | null,
  higherIsBetter: boolean
): KpiRow["status"] {
  if (actual == null || target == null) return "unknown";
  const warn = warning != null ? Number(warning) : target * 0.9;
  const crit = critical != null ? Number(critical) : target * 0.8;
  if (higherIsBetter) {
    if (actual >= target) return "on_track";
    if (actual >= warn) return "warning";
    if (actual >= crit) return "warning";
    return "critical";
  }
  if (actual <= target) return "on_track";
  if (actual <= warn) return "warning";
  return "critical";
}

/**
 * KPI Center — Sprint 002 Task 6.
 * Uses Executive Metrics Aggregation + KPI Snapshots (prior/trend).
 * Does not call getCommandCenterMetrics or duplicate finance/HR fan-outs.
 */
export async function getKpiCenter(
  supabase: AuthClient,
  schoolId?: string
): Promise<KpiRow[]> {
  const filters = { schoolId: schoolId ?? null };

  const [definitions, aggregate, kpiPair] = await Promise.all([
    supabase
      .from("executive_kpi_definitions")
      .select("*")
      .eq("is_active", true)
      .order("sort_order"),
    getExecutiveAggregateMetrics(supabase, filters),
    loadKpiSnapshotPair(supabase, {
      networkId: null,
      regionId: null,
      campusId: null,
      programId: null,
      program: null,
      organizationId: null,
      schoolId: schoolId ?? null,
    }),
  ]);

  const priorByKey = new Map(
    kpiPair.prior.map((r) => [r.metricId, r] as const)
  );
  const currentByKey = new Map(
    kpiPair.current.map((r) => [r.metricId, r] as const)
  );

  return (definitions.data ?? []).map((def) => {
    const metricId = KPI_TO_METRIC[def.kpi_key] ?? def.kpi_key;
    const metric = aggregate.byId[metricId];
    const snap = currentByKey.get(metricId) ?? currentByKey.get(def.kpi_key);
    const prior =
      priorByKey.get(metricId) ?? priorByKey.get(def.kpi_key) ?? null;

    const actual =
      snap?.metricValue ?? metric?.value ?? null;
    const target = def.target_value != null ? Number(def.target_value) : null;
    const priorValue = prior?.metricValue ?? null;

    let trendPct: number | null = null;
    if (actual != null && priorValue != null && priorValue !== 0) {
      trendPct = Math.round(((actual - priorValue) / Math.abs(priorValue)) * 1000) / 10;
    } else if (metric?.trend.pct != null) {
      trendPct = metric.trend.pct;
    }

    const status =
      snap != null
        ? statusFromAggregate(snap.status)
        : metric
          ? statusFromAggregate(metric.status)
          : scoreKpiStatus(
              actual,
              target,
              def.warning_threshold != null ? Number(def.warning_threshold) : null,
              def.critical_threshold != null ? Number(def.critical_threshold) : null,
              Boolean(def.higher_is_better)
            );

    return {
      kpi_key: def.kpi_key,
      display_name: def.display_name,
      category: def.category,
      unit: def.unit,
      actual_value: actual,
      target_value: target,
      prior_value: priorValue,
      trend_pct: trendPct,
      status,
    };
  });
}

export async function getKpiHistory(
  supabase: AuthClient,
  kpiKey: string,
  schoolId?: string,
  limit = 12
) {
  const metricId = KPI_TO_METRIC[kpiKey] ?? kpiKey;
  let query = supabase
    .from("executive_kpi_snapshots")
    .select("snapshot_date, actual_value, target_value, kpi_key")
    .or(`kpi_key.eq.${kpiKey},kpi_key.eq.${metricId}`)
    .order("snapshot_date", { ascending: false })
    .limit(limit);

  if (schoolId) query = query.eq("school_id", schoolId);
  const { data } = await query;
  return data ?? [];
}

/** Build KPI rows from a preloaded aggregate + snapshot pair (no extra queries). */
export function buildKpiRowsFromWorkspace(
  definitions: {
    kpi_key: string;
    display_name: string;
    category: string;
    unit: string;
    target_value: number | null;
    warning_threshold: number | null;
    critical_threshold: number | null;
    higher_is_better: boolean;
  }[],
  aggregate: ExecutiveAggregateMetrics | null,
  current: KpiSnapshotRecord[],
  prior: KpiSnapshotRecord[]
): KpiRow[] {
  const priorByKey = new Map(prior.map((r) => [r.metricId, r] as const));
  const currentByKey = new Map(current.map((r) => [r.metricId, r] as const));

  return definitions.map((def) => {
    const metricId = KPI_TO_METRIC[def.kpi_key] ?? def.kpi_key;
    const metric = aggregate?.byId[metricId];
    const snap = currentByKey.get(metricId) ?? currentByKey.get(def.kpi_key);
    const priorRow =
      priorByKey.get(metricId) ?? priorByKey.get(def.kpi_key) ?? null;
    const actual = snap?.metricValue ?? metric?.value ?? null;
    const priorValue = priorRow?.metricValue ?? null;
    let trendPct: number | null = null;
    if (actual != null && priorValue != null && priorValue !== 0) {
      trendPct =
        Math.round(((actual - priorValue) / Math.abs(priorValue)) * 1000) / 10;
    }
    return {
      kpi_key: def.kpi_key,
      display_name: def.display_name,
      category: def.category,
      unit: def.unit,
      actual_value: actual,
      target_value: def.target_value,
      prior_value: priorValue,
      trend_pct: trendPct,
      status: snap
        ? statusFromAggregate(snap.status)
        : metric
          ? statusFromAggregate(metric.status)
          : "unknown",
    };
  });
}
