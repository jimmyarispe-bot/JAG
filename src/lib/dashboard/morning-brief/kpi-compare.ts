import type { createAuthClient } from "@/lib/supabase/server-auth";
import type {
  ExecutiveAlertsScope,
} from "@/lib/platform/executive-alerts";
import type { KpiSnapshotRecord } from "@/lib/platform/kpi-snapshots";
import { todaySnapshotDate } from "@/lib/platform/kpi-snapshots";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

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
    status: (row.status as KpiSnapshotRecord["status"]) ?? "unknown",
    trendDirection: (row.trend_direction as KpiSnapshotRecord["trendDirection"]) ?? "unknown",
    trendPct: row.trend_pct,
    confidence: (row.confidence as KpiSnapshotRecord["confidence"]) ?? "Unknown",
    source: row.source ?? "kpi-snapshots",
    capturedAt: row.captured_at,
    snapshotDate: row.snapshot_date,
    captureMode: (row.capture_mode as KpiSnapshotRecord["captureMode"]) ?? "daily",
    domain: typeof meta.domain === "string" ? meta.domain : undefined,
    unit: typeof meta.unit === "string" ? meta.unit : undefined,
  };
}

async function loadSnapshotsForDate(
  supabase: AuthClient,
  scope: ExecutiveAlertsScope,
  snapshotDate: string
): Promise<KpiSnapshotRecord[]> {
  let query = supabase
    .from("executive_kpi_snapshots")
    .select(
      "organization_id, region_id, school_id, campus_id, program, kpi_key, metric_name, actual_value, status, trend_direction, trend_pct, confidence, source, captured_at, snapshot_date, capture_mode, metadata"
    )
    .eq("snapshot_date", snapshotDate);

  if (scope.organizationId) query = query.eq("organization_id", scope.organizationId);
  if (scope.regionId) query = query.eq("region_id", scope.regionId);
  if (scope.schoolId) query = query.eq("school_id", scope.schoolId);
  if (scope.campusId) query = query.eq("campus_id", scope.campusId);
  if (scope.program) query = query.eq("program", scope.program);

  const { data } = await query;
  return (data ?? []).map(mapSnapshotRow);
}

export interface KpiSnapshotPair {
  currentDate: string | null;
  priorDate: string | null;
  current: KpiSnapshotRecord[];
  prior: KpiSnapshotRecord[];
}

/**
 * Load latest + previous snapshot dates for KPI comparison.
 * Does not invent metrics — reads executive_kpi_snapshots only.
 */
export async function loadKpiSnapshotPair(
  supabase: AuthClient,
  scope: ExecutiveAlertsScope,
  now: Date = new Date()
): Promise<KpiSnapshotPair> {
  let datesQuery = supabase
    .from("executive_kpi_snapshots")
    .select("snapshot_date")
    .order("snapshot_date", { ascending: false })
    .limit(14);

  if (scope.organizationId) datesQuery = datesQuery.eq("organization_id", scope.organizationId);
  if (scope.schoolId) datesQuery = datesQuery.eq("school_id", scope.schoolId);
  else if (scope.campusId) datesQuery = datesQuery.eq("campus_id", scope.campusId);

  const { data: dateRows } = await datesQuery;
  const uniqueDates = [...new Set((dateRows ?? []).map((r) => r.snapshot_date as string))];

  const currentDate = uniqueDates[0] ?? todaySnapshotDate(now);
  const priorDate = uniqueDates[1] ?? null;

  const [current, prior] = await Promise.all([
    uniqueDates[0] ? loadSnapshotsForDate(supabase, scope, currentDate) : Promise.resolve([]),
    priorDate ? loadSnapshotsForDate(supabase, scope, priorDate) : Promise.resolve([]),
  ]);

  return { currentDate: uniqueDates[0] ?? null, priorDate, current, prior };
}

export function previousCalendarDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d - 1));
  return dt.toISOString().slice(0, 10);
}
