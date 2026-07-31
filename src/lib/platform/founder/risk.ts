import type { PlatformApplicationKey } from "@/lib/platform/applications/types";
import type {
  FounderAlert,
  FounderAlertCategory,
  FounderAlertDomain,
  FounderMetric,
} from "@/lib/platform/founder/types";

const RISK_CATEGORIES: FounderAlertCategory[] = ["critical", "high", "medium"];

/** Map executive / platform severities → Founder alert categories. */
export function toFounderAlertCategory(
  severity: string | null | undefined
): FounderAlertCategory {
  const s = (severity ?? "").toLowerCase();
  if (s === "critical") return "critical";
  if (s === "high") return "high";
  if (s === "medium") return "medium";
  if (s === "low" || s === "info" || s === "informational") return "informational";
  return "informational";
}

export function inferAlertDomain(
  source: string | null | undefined,
  category?: string | null
): FounderAlertDomain {
  const token = `${source ?? ""} ${category ?? ""}`.toLowerCase();
  if (token.includes("security") || token.includes("compliance")) return "security";
  if (token.includes("admission")) return "admissions";
  if (token.includes("finance") || token.includes("tuition")) return "finance";
  if (token.includes("staff") || token.includes("hr")) return "staffing";
  if (token.includes("enroll")) return "enrollment";
  if (token.includes("tech") || token.includes("integration")) return "technology";
  if (token.includes("platform") || token.includes("system")) return "platform";
  return "operations";
}

export type ExecutiveAlertLike = {
  id: string;
  title: string;
  message?: string | null;
  summary?: string | null;
  severity: string;
  category?: string | null;
  organization?: string | null;
  organizationId?: string | null;
  recommendedAction?: string | null;
  createdAt: string;
  status?: string | null;
};

export function adaptExecutiveAlertsToFounder(
  alerts: ExecutiveAlertLike[],
  applicationKey: PlatformApplicationKey | null = "academyos"
): FounderAlert[] {
  return alerts.map((a) => ({
    id: a.id,
    title: a.title,
    message: a.message?.trim() || a.summary?.trim() || a.title,
    category: toFounderAlertCategory(a.severity),
    domain: inferAlertDomain(a.category, a.title),
    organizationId: a.organizationId ?? a.organization ?? null,
    applicationKey,
    href: null,
    createdAt: a.createdAt,
    unread: a.status !== "acknowledged" && a.status !== "dismissed",
  }));
}

/** Build informational/watch alerts from metric statuses (no AI). */
export function alertsFromMetrics(
  metrics: FounderMetric[],
  organizationId: string | null
): FounderAlert[] {
  const now = new Date().toISOString();
  const out: FounderAlert[] = [];
  for (const m of metrics) {
    if (m.status !== "critical" && m.status !== "at_risk") continue;
    out.push({
      id: `metric:${m.key}:${organizationId ?? "platform"}`,
      title: m.label,
      message: `${m.label} status is ${m.status}${m.value != null ? ` (value ${m.value})` : ""}.`,
      category: m.status === "critical" ? "critical" : "high",
      domain: inferAlertDomain(m.key, m.label),
      organizationId,
      applicationKey: "academyos",
      href: null,
      createdAt: now,
      unread: true,
    });
  }
  return out;
}

/** Count open executive risks (excludes informational). */
export function countOpenRisks(alerts: FounderAlert[]): number {
  return alerts.filter(
    (a) => a.unread && RISK_CATEGORIES.includes(a.category)
  ).length;
}

/**
 * Derive risk highlights from metrics without inventing predictive signals.
 */
export function deriveRiskHighlights(metrics: FounderMetric[]): string[] {
  const highlights: string[] = [];
  for (const m of metrics) {
    if (m.status === "critical") {
      highlights.push(`${m.label} is critical${m.value != null ? ` (${m.value})` : ""}.`);
    } else if (m.status === "at_risk") {
      highlights.push(`${m.label} is at risk${m.value != null ? ` (${m.value})` : ""}.`);
    }
  }
  return highlights.slice(0, 8);
}

export function pendingApprovalsFromMetrics(metrics: FounderMetric[]): number {
  const m = metrics.find((x) => x.key === "pending_approvals");
  return typeof m?.value === "number" ? m.value : 0;
}
