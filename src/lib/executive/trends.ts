/**
 * Sprint 003 — Executive Trend Engine.
 * Compares live ExecutiveKPIs to the most recent KPI snapshot (no history recalculation).
 */
import type { ExecutiveKPIs } from "@/lib/executive/kpis";
import type { KpiSnapshotRecord } from "@/lib/platform/kpi-snapshots";

export type TrendDirection = "UP" | "DOWN" | "FLAT";
export type TrendStatus = "IMPROVING" | "DECLINING" | "UNCHANGED";

export type ExecutiveTrendMetricKey =
  | "enrollment"
  | "admissions"
  | "revenue"
  | "outstanding"
  | "staff"
  | "teacherAttendance"
  | "studentAttendance"
  | "alerts";

export interface ExecutiveMetricTrend {
  metric: ExecutiveTrendMetricKey;
  label: string;
  current: number;
  previous: number | null;
  trendDirection: TrendDirection;
  delta: number | null;
  deltaPercent: number | null;
  status: TrendStatus;
  /** Human-readable line for Morning Brief (null when unchanged / no prior). */
  sentence: string | null;
}

export interface ExecutiveTrends {
  metrics: ExecutiveMetricTrend[];
  topImprovements: ExecutiveMetricTrend[];
  topDeclines: ExecutiveMetricTrend[];
  sentences: string[];
}

/** Snapshot metric IDs to try (first match wins). */
const SNAPSHOT_KEYS: Record<ExecutiveTrendMetricKey, string[]> = {
  enrollment: ["enrollment.active_students", "enrollment.active_enrollments", "enrollment_growth"],
  admissions: ["admissions.pipeline_active"],
  revenue: ["finance.monthly_revenue", "finance.total_collected"],
  outstanding: ["finance.accounts_receivable"],
  staff: ["staffing.headcount_active"],
  teacherAttendance: ["attendance.teacher_submission_rate"],
  studentAttendance: ["attendance.rate", "attendance_rate"],
  alerts: [
    "executive.alert_count",
    "operations.mission_control_open",
    "finance.open_financial_risks",
  ],
};

/** Higher value is better → increase = IMPROVING. */
const HIGHER_IS_BETTER: Record<ExecutiveTrendMetricKey, boolean> = {
  enrollment: true,
  admissions: true,
  revenue: true,
  outstanding: false,
  staff: true,
  teacherAttendance: true,
  studentAttendance: true,
  alerts: false,
};

const LABELS: Record<ExecutiveTrendMetricKey, string> = {
  enrollment: "Enrollment",
  admissions: "Admissions",
  revenue: "Revenue",
  outstanding: "Outstanding tuition",
  staff: "Staff",
  teacherAttendance: "Teacher attendance",
  studentAttendance: "Student attendance",
  alerts: "Executive alerts",
};

const FLAT_EPSILON = 0.0001;

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function findSnapshotValue(
  snapshot: KpiSnapshotRecord[],
  keys: string[]
): number | null {
  const byId = new Map(snapshot.map((row) => [row.metricId, row.metricValue]));
  for (const key of keys) {
    const value = byId.get(key);
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return null;
}

function currentMetricValue(
  kpis: ExecutiveKPIs,
  metric: ExecutiveTrendMetricKey
): number {
  switch (metric) {
    case "enrollment":
      return kpis.enrollment;
    case "admissions":
      return kpis.admissions;
    case "revenue":
      return kpis.revenue;
    case "outstanding":
      return kpis.outstanding;
    case "staff":
      return kpis.staff;
    case "teacherAttendance":
      return kpis.teacherAttendance;
    case "studentAttendance":
      return kpis.studentAttendance;
    case "alerts":
      return kpis.alerts.length;
  }
}

function trendDirection(delta: number | null): TrendDirection {
  if (delta == null || Math.abs(delta) < FLAT_EPSILON) return "FLAT";
  if (delta > 0) return "UP";
  return "DOWN";
}

function trendStatus(
  metric: ExecutiveTrendMetricKey,
  direction: TrendDirection
): TrendStatus {
  if (direction === "FLAT") return "UNCHANGED";
  const higherIsBetter = HIGHER_IS_BETTER[metric];
  if (direction === "UP") return higherIsBetter ? "IMPROVING" : "DECLINING";
  return higherIsBetter ? "DECLINING" : "IMPROVING";
}

function buildSentence(trend: Omit<ExecutiveMetricTrend, "sentence">): string | null {
  if (trend.previous == null || trend.delta == null || trend.status === "UNCHANGED") {
    return null;
  }

  const absDelta = Math.abs(trend.delta);
  const absPct =
    trend.deltaPercent != null ? Math.abs(trend.deltaPercent) : null;

  switch (trend.metric) {
    case "enrollment": {
      const n = Math.round(absDelta);
      return trend.trendDirection === "UP"
        ? `Enrollment increased by ${n} student${n === 1 ? "" : "s"} since yesterday.`
        : `Enrollment decreased by ${n} student${n === 1 ? "" : "s"} since yesterday.`;
    }
    case "admissions": {
      const n = Math.round(absDelta);
      return trend.trendDirection === "UP"
        ? `Admissions pipeline increased by ${n} lead${n === 1 ? "" : "s"}.`
        : `Admissions pipeline decreased by ${n} lead${n === 1 ? "" : "s"}.`;
    }
    case "revenue": {
      if (absPct != null) {
        return trend.trendDirection === "UP"
          ? `Revenue increased ${absPct}%.`
          : `Revenue decreased ${absPct}%.`;
      }
      return trend.trendDirection === "UP"
        ? "Revenue increased."
        : "Revenue decreased.";
    }
    case "outstanding":
      return trend.trendDirection === "DOWN"
        ? "Outstanding tuition decreased."
        : "Outstanding tuition increased.";
    case "staff": {
      const n = Math.round(absDelta);
      return trend.trendDirection === "UP"
        ? `Staff count increased by ${n}.`
        : `Staff count decreased by ${n}.`;
    }
    case "teacherAttendance":
      return trend.status === "IMPROVING"
        ? "Teacher attendance improved."
        : "Teacher attendance declined.";
    case "studentAttendance":
      return trend.status === "IMPROVING"
        ? "Attendance improved."
        : "Attendance declined.";
    case "alerts": {
      const n = Math.round(absDelta);
      return trend.trendDirection === "UP"
        ? `Executive alerts increased by ${n}.`
        : `Executive alerts decreased by ${n}.`;
    }
  }
}

function buildMetricTrend(
  kpis: ExecutiveKPIs,
  snapshot: KpiSnapshotRecord[],
  metric: ExecutiveTrendMetricKey
): ExecutiveMetricTrend {
  const current = currentMetricValue(kpis, metric);
  const previous = findSnapshotValue(snapshot, SNAPSHOT_KEYS[metric]);

  let delta: number | null = null;
  let deltaPercent: number | null = null;

  if (previous != null) {
    delta = current - previous;
    if (Math.abs(previous) > FLAT_EPSILON) {
      deltaPercent = round1((delta / Math.abs(previous)) * 100);
    } else if (Math.abs(delta) < FLAT_EPSILON) {
      deltaPercent = 0;
    } else {
      deltaPercent = null;
    }
  }

  const direction = trendDirection(delta);
  const status = trendStatus(metric, direction);
  const base: Omit<ExecutiveMetricTrend, "sentence"> = {
    metric,
    label: LABELS[metric],
    current,
    previous,
    trendDirection: direction,
    delta: delta != null ? round1(delta) : null,
    deltaPercent,
    status,
  };

  return {
    ...base,
    sentence: buildSentence(base),
  };
}

function rankMagnitude(trend: ExecutiveMetricTrend): number {
  if (trend.deltaPercent != null) return Math.abs(trend.deltaPercent);
  if (trend.delta != null) return Math.abs(trend.delta);
  return 0;
}

/**
 * Calculate executive trends: live KPIs vs most recent snapshot rows.
 * Pure / deterministic — does not query Supabase or recalculate history.
 */
export function calculateExecutiveTrends(
  current: ExecutiveKPIs,
  previousSnapshot: KpiSnapshotRecord[]
): ExecutiveTrends {
  const keys: ExecutiveTrendMetricKey[] = [
    "enrollment",
    "admissions",
    "revenue",
    "outstanding",
    "staff",
    "teacherAttendance",
    "studentAttendance",
    "alerts",
  ];

  const metrics = keys.map((key) => buildMetricTrend(current, previousSnapshot, key));

  const topImprovements = metrics
    .filter((m) => m.status === "IMPROVING" && m.previous != null)
    .sort((a, b) => rankMagnitude(b) - rankMagnitude(a))
    .slice(0, 3);

  const topDeclines = metrics
    .filter((m) => m.status === "DECLINING" && m.previous != null)
    .sort((a, b) => rankMagnitude(b) - rankMagnitude(a))
    .slice(0, 3);

  const sentences = metrics
    .map((m) => m.sentence)
    .filter((s): s is string => Boolean(s));

  return {
    metrics,
    topImprovements,
    topDeclines,
    sentences,
  };
}

/** Append trend sentences to an existing Morning Brief summary string. */
export function appendTrendSentencesToBrief(
  summary: string,
  trends: ExecutiveTrends
): string {
  if (!trends.sentences.length) return summary;
  return `${summary} ${trends.sentences.join(" ")}`;
}
