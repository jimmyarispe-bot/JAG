import type {
  ExecutiveMetric,
  ExecutiveMetricConfidence,
  ExecutiveMetricDomain,
  ExecutiveMetricStatus,
  ExecutiveMetricTrend,
  ExecutiveMetricTrendDirection,
} from "@/lib/platform/executive-metrics/types";

export interface MetricDraft {
  id: string;
  name: string;
  domain: ExecutiveMetricDomain;
  source: string;
  /** Raw value — null/undefined become Unknown confidence and null value (never coerced to 0). */
  value: number | null | undefined;
  unit?: string;
  lastUpdated?: string;
  confidence?: ExecutiveMetricConfidence;
  status?: ExecutiveMetricStatus;
  trend?: Partial<ExecutiveMetricTrend> | null;
  /** When true, treat 0 as a real observation (counts). Default false for rates/ratios. */
  zeroIsValid?: boolean;
}

const UNKNOWN_TREND: ExecutiveMetricTrend = { direction: "unknown", pct: null };

/** Missing / non-finite values must never become 0. */
export function normalizeMetricValue(
  value: number | null | undefined,
  options?: { zeroIsValid?: boolean }
): number | null {
  if (value == null) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  if (value === 0 && options?.zeroIsValid === false) {
    // Explicit 0 for rates can be valid; callers set zeroIsValid. Default allows 0.
  }
  return value;
}

export function resolveConfidence(
  value: number | null,
  explicit?: ExecutiveMetricConfidence
): ExecutiveMetricConfidence {
  if (explicit) return explicit;
  if (value == null) return "Unknown";
  return "High";
}

export function resolveStatus(
  value: number | null,
  explicit?: ExecutiveMetricStatus
): ExecutiveMetricStatus {
  if (explicit) return explicit;
  if (value == null) return "unknown";
  return "healthy";
}

export function resolveTrend(
  trend?: Partial<ExecutiveMetricTrend> | null,
  value: number | null = null
): ExecutiveMetricTrend {
  if (value == null && (!trend || trend.direction == null)) {
    return UNKNOWN_TREND;
  }
  if (!trend) return UNKNOWN_TREND;

  const pct =
    trend.pct == null || !Number.isFinite(trend.pct) ? null : Number(trend.pct);
  let direction: ExecutiveMetricTrendDirection =
    trend.direction ?? (pct == null ? "unknown" : pct > 0 ? "up" : pct < 0 ? "down" : "flat");

  if (direction !== "unknown" && pct == null && trend.direction == null) {
    direction = "unknown";
  }

  return { direction, pct };
}

/** Build a canonical metric. Missing values → value null + confidence Unknown (never 0). */
export function buildMetric(draft: MetricDraft, nowIso?: string): ExecutiveMetric {
  const value = normalizeMetricValue(draft.value, { zeroIsValid: draft.zeroIsValid ?? true });
  const lastUpdated = draft.lastUpdated ?? nowIso ?? new Date().toISOString();
  const confidence = resolveConfidence(value, draft.confidence);
  const status = resolveStatus(value, draft.status);
  const trend = resolveTrend(draft.trend, value);

  return {
    id: draft.id,
    name: draft.name,
    value,
    status: value == null ? "unknown" : status,
    trend: value == null ? UNKNOWN_TREND : trend,
    lastUpdated,
    source: draft.source,
    confidence: value == null ? "Unknown" : confidence,
    domain: draft.domain,
    ...(draft.unit ? { unit: draft.unit } : {}),
  };
}

/** Status helpers for threshold-style metrics (higher is better). */
export function statusFromHigherIsBetter(
  value: number | null,
  healthyAt: number,
  watchAt: number,
  atRiskAt: number
): ExecutiveMetricStatus {
  if (value == null) return "unknown";
  if (value >= healthyAt) return "healthy";
  if (value >= watchAt) return "watch";
  if (value >= atRiskAt) return "at_risk";
  return "critical";
}

/** Status helpers for threshold-style metrics (lower is better). */
export function statusFromLowerIsBetter(
  value: number | null,
  healthyAt: number,
  watchAt: number,
  atRiskAt: number
): ExecutiveMetricStatus {
  if (value == null) return "unknown";
  if (value <= healthyAt) return "healthy";
  if (value <= watchAt) return "watch";
  if (value <= atRiskAt) return "at_risk";
  return "critical";
}

export function trendFromPct(pct: number | null | undefined): ExecutiveMetricTrend {
  if (pct == null || !Number.isFinite(pct)) return UNKNOWN_TREND;
  if (pct > 0) return { direction: "up", pct };
  if (pct < 0) return { direction: "down", pct };
  return { direction: "flat", pct: 0 };
}
