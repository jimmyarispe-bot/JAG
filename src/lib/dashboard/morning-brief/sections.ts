import type { ExecutiveAggregateMetrics, ExecutiveMetric } from "@/lib/platform/executive-metrics";
import type { ExecutiveAlert } from "@/lib/platform/executive-alerts";
import type { ExecutiveDecision } from "@/lib/platform/executive-decisions";
import type { KpiSnapshotRecord } from "@/lib/platform/kpi-snapshots";
import type {
  MorningBriefFinancialPulse,
  MorningBriefKpiChange,
  MorningBriefKpiChanges,
  MorningBriefNetworkHealth,
  MorningBriefNetworkHealthNode,
  MorningBriefOvernightActivityItem,
  MorningBriefWhatChangedItem,
  NetworkHealthTone,
} from "@/lib/dashboard/morning-brief/types";
import type { PlatformActivityEvent } from "@/lib/platform/activity/types";
import type { MissionControlPriorityItem } from "@/lib/platform/automation/mission-control-compose";

function metricValue(
  aggregate: ExecutiveAggregateMetrics | null,
  id: string
): number | null {
  return aggregate?.byId[id]?.value ?? null;
}

function metric(
  aggregate: ExecutiveAggregateMetrics | null,
  id: string
): ExecutiveMetric | null {
  return aggregate?.byId[id] ?? null;
}

function formatNumber(value: number | null, unit?: string): string {
  if (value == null) return "unavailable";
  if (unit === "currency") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  }
  if (unit === "percent") return `${value}%`;
  return String(value);
}

/**
 * Deterministic executive summary (4–8 sentences). No AI.
 */
export function buildExecutiveSummaryNarrative(input: {
  productName: string;
  workspaceLabel: string;
  aggregate: ExecutiveAggregateMetrics | null;
  alerts: ExecutiveAlert[];
  decisions: ExecutiveDecision[];
  missionControlCriticalCount: number;
  financialPulse: MorningBriefFinancialPulse;
}): string {
  const sentences: string[] = [];
  const enrollment = metric(input.aggregate, "enrollment.active_enrollments");
  const attendance = metric(input.aggregate, "attendance.rate");
  const collection = metric(input.aggregate, "finance.collection_rate");
  const criticalAlerts = input.alerts.filter((a) => a.severity === "Critical").length;
  const openDecisions = input.decisions.filter(
    (d) => d.status === "Open" || d.status === "Waiting" || d.status === "Acknowledged"
  ).length;

  sentences.push(
    `${input.workspaceLabel} morning brief for ${input.productName} is ready.`
  );

  if (enrollment?.value != null) {
    sentences.push(
      `Active enrollment stands at ${formatNumber(enrollment.value, enrollment.unit)} (${enrollment.status}).`
    );
  } else {
    sentences.push("Enrollment metrics are not yet available for this scope.");
  }

  if (attendance?.value != null) {
    sentences.push(
      `Attendance is ${formatNumber(attendance.value, "percent")}, marked ${attendance.status}.`
    );
  }

  if (input.financialPulse.estimatedCash != null || collection?.value != null) {
    const cash = formatNumber(input.financialPulse.estimatedCash, "currency");
    const coll =
      collection?.value != null
        ? formatNumber(collection.value, "percent")
        : "unavailable";
    sentences.push(
      `Financial pulse shows estimated cash at ${cash} with collection rate ${coll} (confidence: ${input.financialPulse.confidence}).`
    );
  } else {
    sentences.push("Financial pulse data is incomplete for this morning's scope.");
  }

  if (criticalAlerts > 0 || input.missionControlCriticalCount > 0) {
    sentences.push(
      `Attention: ${criticalAlerts} critical executive alert${criticalAlerts === 1 ? "" : "s"} and ${input.missionControlCriticalCount} critical Mission Control item${input.missionControlCriticalCount === 1 ? "" : "s"} require review.`
    );
  } else {
    sentences.push("No critical executive alerts or Mission Control items are open.");
  }

  if (openDecisions > 0) {
    const top = input.decisions[0];
    sentences.push(
      `${openDecisions} executive decision${openDecisions === 1 ? "" : "s"} await action${top ? `, led by “${top.title}”` : ""}.`
    );
  } else {
    sentences.push("No open executive decisions are waiting this morning.");
  }

  const highAlerts = input.alerts.filter((a) => a.severity === "High").length;
  if (highAlerts > 0) {
    sentences.push(
      `${highAlerts} high-severity alert${highAlerts === 1 ? "" : "s"} remain on the watch list.`
    );
  }

  // Clamp to 4–8 sentences.
  const trimmed = sentences.filter(Boolean).slice(0, 8);
  while (trimmed.length < 4) {
    trimmed.push("Continue monitoring platform signals as overnight activity settles.");
  }
  return trimmed.join(" ");
}

export function buildFinancialPulse(
  aggregate: ExecutiveAggregateMetrics | null
): MorningBriefFinancialPulse {
  const cash = metric(aggregate, "finance.cash_position");
  const ar = metric(aggregate, "finance.accounts_receivable");
  const risks = metric(aggregate, "finance.open_financial_risks");
  const payroll = metric(aggregate, "staffing.payroll_ytd");
  const collected = metric(aggregate, "finance.total_collected");

  // "Collections yesterday" is not a dedicated metric yet — use null rather than inventing.
  // Surfaces may show total collected as context only when yesterday is unknown.
  return {
    estimatedCash: cash?.value ?? null,
    collectionsYesterday: null,
    receivablesDue: ar?.value ?? null,
    payrollDue: payroll?.value ?? null,
    financialRisk: risks?.value ?? null,
    confidence: cash ? "estimated" : collected ? "Low" : "Unknown",
    methodologyNote:
      "Estimated cash and payroll figures are operational heuristics until Financial Intelligence GL Phase 0. Collections yesterday requires a daily payment rollup (not yet snapshotted).",
  };
}

function toneFromMetricStatus(status: string | null | undefined): NetworkHealthTone {
  switch (status) {
    case "healthy":
      return "Green";
    case "watch":
      return "Yellow";
    case "at_risk":
    case "critical":
      return "Red";
    default:
      return "Unknown";
  }
}

function worstTone(tones: NetworkHealthTone[]): NetworkHealthTone {
  const rank: Record<NetworkHealthTone, number> = {
    Red: 4,
    Yellow: 3,
    Green: 2,
    Unknown: 1,
  };
  return tones.reduce((a, b) => (rank[b] > rank[a] ? b : a), "Unknown" as NetworkHealthTone);
}

function domainTone(
  aggregate: ExecutiveAggregateMetrics | null,
  domain: ExecutiveMetric["domain"]
): { tone: NetworkHealthTone; drivers: string[]; score: number | null } {
  const metrics = aggregate?.domains[domain] ?? [];
  if (!metrics.length) return { tone: "Unknown", drivers: [], score: null };
  const tones = metrics.map((m) => toneFromMetricStatus(m.status));
  const tone = worstTone(tones);
  const drivers = metrics
    .filter((m) => m.status === "critical" || m.status === "at_risk" || m.status === "watch")
    .slice(0, 3)
    .map((m) => m.name);
  const known = metrics.filter((m) => m.status !== "unknown");
  const score =
    known.length === 0
      ? null
      : Math.round(
          (known.filter((m) => m.status === "healthy").length / known.length) * 100
        );
  return { tone, drivers, score };
}

export function buildNetworkHealth(
  aggregate: ExecutiveAggregateMetrics | null
): MorningBriefNetworkHealth {
  const scope = aggregate?.scope;
  const nodes: MorningBriefNetworkHealthNode[] = [];

  const org = domainTone(aggregate, "executive");
  nodes.push({
    level: "Organization",
    id: scope?.organizationId ?? null,
    label: "Organization",
    tone: org.tone,
    score: org.score,
    drivers: org.drivers,
  });

  const regionOps = domainTone(aggregate, "operations");
  nodes.push({
    level: "Region",
    id: scope?.regionId ?? null,
    label: scope?.regionId ? "Region" : "Region (unscoped)",
    tone: scope?.regionId ? regionOps.tone : "Unknown",
    score: scope?.regionId ? regionOps.score : null,
    drivers: scope?.regionId ? regionOps.drivers : [],
  });

  const campusBlend = worstTone([
    domainTone(aggregate, "enrollment").tone,
    domainTone(aggregate, "attendance").tone,
    domainTone(aggregate, "operations").tone,
  ]);
  const campusDrivers = [
    ...domainTone(aggregate, "enrollment").drivers,
    ...domainTone(aggregate, "operations").drivers,
  ].slice(0, 3);
  nodes.push({
    level: "Campus",
    id: scope?.campusId ?? scope?.schoolId ?? null,
    label: "Campus",
    tone: campusBlend,
    score: domainTone(aggregate, "enrollment").score,
    drivers: campusDrivers,
  });

  const program = domainTone(aggregate, "admissions");
  nodes.push({
    level: "Program",
    id: scope?.programId ?? scope?.program ?? null,
    label: scope?.program ?? "Program",
    tone: scope?.program || scope?.programId ? program.tone : "Unknown",
    score: scope?.program || scope?.programId ? program.score : null,
    drivers: scope?.program || scope?.programId ? program.drivers : [],
  });

  return {
    nodes,
    overall: worstTone(nodes.map((n) => n.tone)),
  };
}

const NOISE_ACTIVITY_TYPES = new Set([
  "platform.tag_applied",
  "platform.tag_removed",
  "platform.note_created",
  "platform.relationship_created",
]);

/** Meaningful overnight activity only — exclude high-chatter platform tags/notes. */
export function buildOvernightActivity(
  events: PlatformActivityEvent[],
  sinceIso: string,
  limit = 8
): MorningBriefOvernightActivityItem[] {
  const since = new Date(sinceIso).getTime();
  return events
    .filter((e) => new Date(e.occurred_at).getTime() >= since)
    .filter((e) => !NOISE_ACTIVITY_TYPES.has(e.event_type))
    .filter(
      (e) =>
        e.severity === "critical" ||
        e.severity === "warning" ||
        e.classification === "operational" ||
        e.classification === "audit" ||
        e.event_type.startsWith("admissions.") ||
        e.event_type.startsWith("executive.") ||
        e.event_type.startsWith("fi.") ||
        e.event_type.startsWith("edi.")
    )
    .slice(0, limit)
    .map((e) => ({
      id: e.id,
      title: e.title || e.summary || e.event_type,
      summary: e.summary || e.body || e.event_type,
      moduleKey: e.module_key,
      eventType: e.event_type,
      severity: e.severity,
      occurredAt: e.occurred_at,
      href: null,
    }));
}

export function selectMissionControlCritical(
  priorities: Record<"critical" | "high" | "medium" | "low", MissionControlPriorityItem[]>
): MissionControlPriorityItem[] {
  return (priorities.critical ?? []).slice(0, 8);
}

export function compareKpiSnapshots(
  current: KpiSnapshotRecord[],
  prior: KpiSnapshotRecord[],
  currentDate: string | null,
  priorDate: string | null,
  limit = 5
): MorningBriefKpiChanges {
  const priorById = new Map(prior.map((p) => [p.metricId, p]));
  const changes: MorningBriefKpiChange[] = [];

  for (const row of current) {
    const prev = priorById.get(row.metricId);
    const currentValue = row.metricValue;
    const priorValue = prev?.metricValue ?? null;
    let delta: number | null = null;
    let deltaPct: number | null = null;
    let direction: MorningBriefKpiChange["direction"] = "unknown";

    if (currentValue != null && priorValue != null) {
      delta = currentValue - priorValue;
      deltaPct = priorValue === 0 ? null : Math.round((delta / Math.abs(priorValue)) * 1000) / 10;
      direction = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
    }

    changes.push({
      metricId: row.metricId,
      metricName: row.metricName,
      currentValue,
      priorValue,
      delta,
      deltaPct,
      direction,
      unit: row.unit,
    });
  }

  const withDelta = changes.filter((c) => c.delta != null);
  const largestIncreases = [...withDelta]
    .filter((c) => (c.delta ?? 0) > 0)
    .sort((a, b) => (b.delta ?? 0) - (a.delta ?? 0))
    .slice(0, limit);
  const largestDecreases = [...withDelta]
    .filter((c) => (c.delta ?? 0) < 0)
    .sort((a, b) => (a.delta ?? 0) - (b.delta ?? 0))
    .slice(0, limit);

  return {
    largestIncreases,
    largestDecreases,
    comparedSnapshotDate: priorDate,
    currentSnapshotDate: currentDate,
  };
}

export function buildWhatChangedSinceYesterday(
  current: KpiSnapshotRecord[],
  prior: KpiSnapshotRecord[],
  limit = 10
): MorningBriefWhatChangedItem[] {
  const priorById = new Map(prior.map((p) => [p.metricId, p]));
  const items: MorningBriefWhatChangedItem[] = [];

  for (const row of current) {
    const prev = priorById.get(row.metricId);
    if (!prev) continue;
    const delta =
      row.metricValue != null && prev.metricValue != null
        ? row.metricValue - prev.metricValue
        : null;
    const statusChanged = row.status !== prev.status;
    if (delta === 0 && !statusChanged) continue;
    if (delta == null && !statusChanged) continue;

    const direction: MorningBriefWhatChangedItem["direction"] =
      delta == null ? "unknown" : delta > 0 ? "up" : delta < 0 ? "down" : "flat";

    const parts: string[] = [];
    if (delta != null && delta !== 0) {
      parts.push(
        `${row.metricName} moved ${delta > 0 ? "+" : ""}${delta}${row.unit === "percent" ? " pts" : ""}`
      );
    }
    if (statusChanged) {
      parts.push(`status ${prev.status} → ${row.status}`);
    }

    items.push({
      metricId: row.metricId,
      metricName: row.metricName,
      summary: parts.join("; ") || row.metricName,
      delta,
      direction,
      statusChanged,
      priorStatus: prev.status,
      currentStatus: row.status,
    });
  }

  return items
    .sort((a, b) => Math.abs(b.delta ?? 0) - Math.abs(a.delta ?? 0))
    .slice(0, limit);
}

/** Map decision queue items into legacy JagWorkItem shape for existing UI. */
export function decisionsToLegacyJagWork(
  decisions: ExecutiveDecision[]
): import("@/lib/platform/jag-work").JagWorkItem[] {
  return decisions.map((d) => ({
    id: d.relatedJagWorkItem ?? d.id,
    title: d.title,
    description: d.summary,
    workType: d.decisionType.toLowerCase(),
    perspectives: ["needs_human_decision"],
    priority:
      d.severity === "Critical"
        ? "critical"
        : d.severity === "High"
          ? "high"
          : d.severity === "Low"
            ? "low"
            : "medium",
    ownerLabel: d.recommendedOwner ?? undefined,
    dueDate: d.dueDate,
    status:
      d.status === "Completed"
        ? "completed"
        : d.status === "Waiting"
          ? "awaiting_review"
          : d.blocking
            ? "blocked"
            : "in_progress",
    requiredKnowledgeKeys: [],
    requiredEvidenceTypes: [],
    recommendedNextAction: d.recommendedAction ?? "Review decision",
    blockingDependencies: d.blocking ? ["Blocking decision"] : [],
    completionCriteria: [],
    href: "/dashboard/executive?work=needs_human_decision",
    entityType: d.relatedEntityType ?? undefined,
    entityId: d.relatedEntityId ?? undefined,
    source: "executive",
  }));
}
