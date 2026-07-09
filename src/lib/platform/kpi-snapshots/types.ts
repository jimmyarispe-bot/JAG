import type {
  ExecutiveMetricConfidence,
  ExecutiveMetricStatus,
  ExecutiveMetricTrendDirection,
  ExecutiveMetricsFilters,
} from "@/lib/platform/executive-metrics";

export type KpiSnapshotCaptureMode = "daily" | "manual" | "backfill";

export interface KpiSnapshotScope {
  organizationId: string | null;
  regionId: string | null;
  schoolId: string | null;
  campusId: string | null;
  program: string | null;
}

export interface KpiSnapshotRecord {
  organizationId: string | null;
  regionId: string | null;
  schoolId: string | null;
  campusId: string | null;
  program: string | null;
  metricId: string;
  metricName: string;
  metricValue: number | null;
  status: ExecutiveMetricStatus;
  trendDirection: ExecutiveMetricTrendDirection;
  trendPct: number | null;
  confidence: ExecutiveMetricConfidence;
  source: string;
  capturedAt: string;
  snapshotDate: string;
  captureMode: KpiSnapshotCaptureMode;
  domain?: string;
  unit?: string;
}

/** Row shape written to executive_kpi_snapshots. */
export interface ExecutiveKpiSnapshotInsertRow {
  organization_id: string | null;
  region_id: string | null;
  school_id: string | null;
  campus_id: string | null;
  program: string | null;
  kpi_key: string;
  metric_name: string;
  actual_value: number | null;
  status: string;
  trend_direction: string;
  trend_pct: number | null;
  confidence: string;
  source: string;
  captured_at: string;
  snapshot_date: string;
  capture_mode: KpiSnapshotCaptureMode;
  prior_period_value: number | null;
  target_value: number | null;
  metadata: Record<string, unknown>;
}

export interface CaptureSnapshotOptions {
  filters?: ExecutiveMetricsFilters;
  /** YYYY-MM-DD; defaults to today (UTC). */
  snapshotDate?: string;
  mode?: KpiSnapshotCaptureMode;
  /** Skip metrics already stored for this scope + period. Default true. */
  skipDuplicates?: boolean;
  actorUserId?: string | null;
  /** Optional activity write on successful insert. Default true. */
  recordActivityEvent?: boolean;
}

export interface BackfillSnapshotsOptions extends Omit<CaptureSnapshotOptions, "snapshotDate" | "mode"> {
  /** Inclusive start date YYYY-MM-DD */
  fromDate: string;
  /** Inclusive end date YYYY-MM-DD */
  toDate: string;
}

export interface CaptureSnapshotResult {
  mode: KpiSnapshotCaptureMode;
  snapshotDate: string;
  scope: KpiSnapshotScope;
  attempted: number;
  inserted: number;
  skippedDuplicates: number;
  skippedUnknownOnly?: number;
  rows: KpiSnapshotRecord[];
  errors: string[];
}

export interface BackfillSnapshotsResult {
  fromDate: string;
  toDate: string;
  days: CaptureSnapshotResult[];
  totals: {
    attempted: number;
    inserted: number;
    skippedDuplicates: number;
  };
}
