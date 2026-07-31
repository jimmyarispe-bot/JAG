import type { ExecutiveMetric } from "@/lib/platform/executive-metrics/types";
import type {
  FounderHealthBand,
  FounderMetric,
  FounderMetricKey,
} from "@/lib/platform/founder/types";

export const FOUNDER_METRIC_CATALOG: ReadonlyArray<{
  key: FounderMetricKey;
  label: string;
  executiveMetricId: string | null;
  unit?: string;
}> = [
  {
    key: "active_students",
    label: "Active students",
    executiveMetricId: "enrollment.active_students",
  },
  {
    key: "active_staff",
    label: "Active staff",
    executiveMetricId: "staffing.active_staff",
  },
  {
    key: "new_applications",
    label: "New applications",
    executiveMetricId: "admissions.new_applications",
  },
  {
    key: "enrollment_trend",
    label: "Enrollment trend",
    executiveMetricId: "enrollment.active_students",
    unit: "%",
  },
  {
    key: "attendance",
    label: "Attendance",
    executiveMetricId: "attendance.rate",
    unit: "%",
  },
  {
    key: "tuition_collected",
    label: "Tuition collected",
    executiveMetricId: "finance.collected",
    unit: "USD",
  },
  {
    key: "outstanding_balances",
    label: "Outstanding balances",
    executiveMetricId: "finance.outstanding",
    unit: "USD",
  },
  {
    key: "open_risks",
    label: "Open risks",
    executiveMetricId: null,
  },
  {
    key: "pending_approvals",
    label: "Pending approvals",
    executiveMetricId: null,
  },
  {
    key: "system_health",
    label: "System health",
    executiveMetricId: "operations.system_health",
    unit: "score",
  },
];

export function scoreToHealthBand(score: number | null | undefined): FounderHealthBand {
  if (score == null || Number.isNaN(score)) return "unknown";
  if (score >= 90) return "excellent";
  if (score >= 75) return "healthy";
  if (score >= 50) return "watch";
  return "critical";
}

export function metricStatusToBand(
  status: FounderMetric["status"]
): FounderHealthBand {
  switch (status) {
    case "healthy":
      return "healthy";
    case "watch":
      return "watch";
    case "at_risk":
      return "watch";
    case "critical":
      return "critical";
    default:
      return "unknown";
  }
}

function findExecutiveMetric(
  metrics: ExecutiveMetric[],
  id: string
): ExecutiveMetric | undefined {
  return metrics.find((m) => m.id === id);
}

/**
 * Map executive aggregate metrics → Founder metric model.
 * Values come from services; open_risks / pending_approvals injected by caller.
 */
export function buildFounderMetrics(input: {
  executiveMetrics?: ExecutiveMetric[];
  openRiskCount?: number | null;
  pendingApprovalCount?: number | null;
  systemHealthScore?: number | null;
}): FounderMetric[] {
  const exec = input.executiveMetrics ?? [];

  return FOUNDER_METRIC_CATALOG.map((entry) => {
    if (entry.key === "open_risks") {
      return {
        key: entry.key,
        label: entry.label,
        value: input.openRiskCount ?? null,
        status:
          (input.openRiskCount ?? 0) >= 5
            ? "critical"
            : (input.openRiskCount ?? 0) >= 1
              ? "watch"
              : "healthy",
        trendDirection: "unknown",
        source: "founder.risk",
        executiveMetricId: null,
      };
    }

    if (entry.key === "pending_approvals") {
      return {
        key: entry.key,
        label: entry.label,
        value: input.pendingApprovalCount ?? null,
        status:
          (input.pendingApprovalCount ?? 0) >= 10
            ? "at_risk"
            : (input.pendingApprovalCount ?? 0) >= 1
              ? "watch"
              : "healthy",
        trendDirection: "unknown",
        source: "founder.approvals",
        executiveMetricId: null,
      };
    }

    if (entry.key === "system_health" && input.systemHealthScore != null) {
      const band = scoreToHealthBand(input.systemHealthScore);
      return {
        key: entry.key,
        label: entry.label,
        value: input.systemHealthScore,
        unit: entry.unit,
        status:
          band === "critical"
            ? "critical"
            : band === "watch"
              ? "watch"
              : band === "unknown"
                ? "unknown"
                : "healthy",
        trendDirection: "unknown",
        source: "founder.health",
        executiveMetricId: entry.executiveMetricId,
      };
    }

    if (entry.key === "enrollment_trend") {
      const base = entry.executiveMetricId
        ? findExecutiveMetric(exec, entry.executiveMetricId)
        : undefined;
      return {
        key: entry.key,
        label: entry.label,
        value: base?.trend.pct ?? null,
        unit: entry.unit,
        status: base?.status ?? "unknown",
        trendDirection: base?.trend.direction ?? "unknown",
        source: base?.source ?? "executive-metrics",
        executiveMetricId: entry.executiveMetricId,
      };
    }

    const matched = entry.executiveMetricId
      ? findExecutiveMetric(exec, entry.executiveMetricId)
      : undefined;

    // Soft fallback: first metric in related domain prefix
    const soft =
      matched ??
      (entry.executiveMetricId
        ? exec.find((m) =>
            m.id.startsWith(entry.executiveMetricId!.split(".")[0] + ".")
          )
        : undefined);

    return {
      key: entry.key,
      label: entry.label,
      value: soft?.value ?? null,
      unit: entry.unit ?? soft?.unit,
      status: soft?.status ?? "unknown",
      trendDirection: soft?.trend.direction ?? "unknown",
      source: soft?.source ?? "executive-metrics",
      executiveMetricId: entry.executiveMetricId,
    };
  });
}

export function aggregateOverallHealth(metrics: FounderMetric[]): {
  score: number | null;
  band: FounderHealthBand;
} {
  const system = metrics.find((m) => m.key === "system_health");
  if (system?.value != null) {
    return { score: system.value, band: scoreToHealthBand(system.value) };
  }

  const ranked: Record<FounderMetric["status"], number> = {
    healthy: 85,
    watch: 65,
    at_risk: 45,
    critical: 25,
    unknown: 0,
  };
  const scored = metrics.filter((m) => m.status !== "unknown");
  if (!scored.length) return { score: null, band: "unknown" };
  const avg =
    scored.reduce((sum, m) => sum + ranked[m.status], 0) / scored.length;
  return { score: Math.round(avg), band: scoreToHealthBand(avg) };
}
