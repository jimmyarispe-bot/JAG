import type {
  ExecutiveAlertCategory,
  ExecutiveAlertDraft,
  ExecutiveAlertsScope,
  ExecutiveAlertSeverity,
} from "@/lib/platform/executive-alerts/types";
import {
  normalizeSeverity,
  severityFromMetricStatus,
} from "@/lib/platform/executive-alerts/score";
import type { ExecutiveAggregateMetrics, ExecutiveMetric } from "@/lib/platform/executive-metrics";
import type { KpiSnapshotRecord } from "@/lib/platform/kpi-snapshots";

function scopeFields(scope: ExecutiveAlertsScope) {
  return {
    organization: scope.organizationId,
    region: scope.regionId,
    campus: scope.campusId ?? scope.schoolId,
    program: scope.program ?? scope.programId,
  };
}

function categoryFromDomain(domain: string): ExecutiveAlertCategory {
  switch (domain) {
    case "finance":
      return "Financial";
    case "enrollment":
      return "Enrollment";
    case "admissions":
      return "Admissions";
    case "staffing":
      return "Staffing";
    case "compliance":
      return "Compliance";
    case "operations":
    case "attendance":
      return "Operations";
    case "executive":
      return "Executive";
    default:
      return "Executive";
  }
}

function recommendedForMetric(metric: ExecutiveMetric): string {
  return `Review ${metric.name} (${metric.id}) and address the underlying ${metric.domain} signal.`;
}

/** KPI snapshot breaches → drafts (critical / at_risk / watch). */
export function adaptKpiSnapshots(
  snapshots: KpiSnapshotRecord[],
  scope: ExecutiveAlertsScope
): ExecutiveAlertDraft[] {
  const scoped = scopeFields(scope);
  const drafts: ExecutiveAlertDraft[] = [];

  for (const row of snapshots) {
    const severity = severityFromMetricStatus(row.status);
    if (!severity) continue;

    drafts.push({
      signalKey: row.metricId,
      title: `${row.metricName} is ${row.status.replace("_", " ")}`,
      description:
        row.metricValue == null
          ? `${row.metricName} status is ${row.status} (value unknown).`
          : `${row.metricName} is ${row.metricValue} with status ${row.status}.`,
      category: categoryFromDomain(row.domain ?? "executive"),
      severity,
      confidence: row.confidence,
      ...scoped,
      organization: row.organizationId ?? scoped.organization,
      region: row.regionId ?? scoped.region,
      campus: row.campusId ?? row.schoolId ?? scoped.campus,
      program: row.program ?? scoped.program,
      relatedEntity: null,
      recommendedAction: `Investigate KPI ${row.metricId} and restore to target.`,
      createdAt: row.capturedAt,
      source: {
        source: "kpi_snapshots",
        sourceId: `${row.snapshotDate}:${row.metricId}`,
        label: row.source,
      },
    });
  }

  return drafts;
}

/** Live aggregate metrics with watch+ status → drafts. */
export function adaptExecutiveMetrics(
  aggregate: ExecutiveAggregateMetrics,
  scope: ExecutiveAlertsScope
): ExecutiveAlertDraft[] {
  const scoped = scopeFields(scope);
  const drafts: ExecutiveAlertDraft[] = [];

  for (const metric of aggregate.metrics) {
    const severity = severityFromMetricStatus(metric.status);
    if (!severity) continue;

    drafts.push({
      signalKey: metric.id,
      title: `${metric.name} requires attention`,
      description:
        metric.value == null
          ? `${metric.name} is ${metric.status}.`
          : `${metric.name} is ${metric.value}${metric.unit ? ` ${metric.unit}` : ""} (${metric.status}).`,
      category: categoryFromDomain(metric.domain),
      severity,
      confidence: metric.confidence,
      ...scoped,
      relatedEntity: null,
      recommendedAction: recommendedForMetric(metric),
      createdAt: metric.lastUpdated,
      source: {
        source: "executive_metrics",
        sourceId: metric.id,
        label: metric.source,
      },
    });
  }

  return drafts;
}

export interface ActivityAlertLike {
  id: string;
  event_type?: string | null;
  module_key?: string | null;
  summary?: string | null;
  classification?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  occurred_at?: string | null;
  created_at?: string | null;
  organization_id?: string | null;
  school_id?: string | null;
}

const ACTIVITY_ALERT_TYPES = new Set([
  "executive.alert_raised",
  "fi.alert_raised",
  "admissions.automation_failed",
  "operational_loop_transition_failed",
  "identity.security_alert",
  "compliance.obligation_overdue",
]);

function categoryFromActivity(event: ActivityAlertLike): ExecutiveAlertCategory {
  const domainModule = (event.module_key ?? "").toLowerCase();
  const type = (event.event_type ?? "").toLowerCase();
  if (domainModule === "finance" || type.startsWith("fi.")) return "Financial";
  if (domainModule === "admissions" || type.startsWith("admissions.")) return "Admissions";
  if (domainModule === "hr" || type.startsWith("hr.")) return "Staffing";
  if (domainModule === "compliance" || type.startsWith("compliance.")) return "Compliance";
  if (domainModule === "identity" || type.includes("security")) return "Security";
  if (domainModule === "sis" || type.includes("enrollment")) return "Enrollment";
  if (type.startsWith("executive.")) return "Executive";
  return "Operations";
}

function severityFromActivity(event: ActivityAlertLike): ExecutiveAlertSeverity {
  const c = (event.classification ?? "").toLowerCase();
  if (c === "critical" || c === "security") return "Critical";
  if (c === "audit" || c === "high") return "High";
  return normalizeSeverity(c || "medium");
}

/** Activity Engine events that already represent alert-class signals. */
export function adaptActivityEvents(
  events: ActivityAlertLike[],
  scope: ExecutiveAlertsScope
): ExecutiveAlertDraft[] {
  const scoped = scopeFields(scope);
  const drafts: ExecutiveAlertDraft[] = [];

  for (const event of events) {
    const type = event.event_type ?? "";
    if (!ACTIVITY_ALERT_TYPES.has(type) && event.classification !== "critical") {
      continue;
    }

    const signalKey = type || "activity.signal";
    drafts.push({
      signalKey,
      title: event.summary?.trim() || `Activity signal: ${type}`,
      description: event.summary?.trim() || `Activity Engine recorded ${type}.`,
      category: categoryFromActivity(event),
      severity: severityFromActivity(event),
      confidence: "Medium",
      ...scoped,
      organization: event.organization_id ?? scoped.organization,
      campus: event.school_id ?? scoped.campus,
      relatedEntity:
        event.entity_type && event.entity_id
          ? { type: event.entity_type, id: event.entity_id }
          : null,
      activityReferences: [event.id],
      createdAt: event.occurred_at ?? event.created_at ?? new Date().toISOString(),
      source: {
        source: "activity",
        sourceId: event.id,
        label: type,
      },
      entityType: event.entity_type,
      entityId: event.entity_id,
    });
  }

  return drafts;
}

export interface FinancialAlertLike {
  id: string;
  title: string;
  body?: string | null;
  alert_type?: string | null;
  severity?: string | null;
  school_id?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  mission_control_item_id?: string | null;
  created_at?: string | null;
  is_resolved?: boolean;
}

export function adaptFinancialAlerts(
  alerts: FinancialAlertLike[],
  scope: ExecutiveAlertsScope
): ExecutiveAlertDraft[] {
  const scoped = scopeFields(scope);
  return alerts
    .filter((a) => !a.is_resolved)
    .map((a) => {
      // Prefer domain entity; otherwise the FI alert row itself so MC sync can merge.
      const entityType = a.entity_type ?? "fi_financial_alerts";
      const entityId = a.entity_id ?? a.id;
      return {
        signalKey: a.alert_type ? `fi.${a.alert_type}` : `fi.alert.${a.id}`,
        title: a.title,
        description: a.body?.trim() || a.title,
        category: "Financial" as const,
        severity: normalizeSeverity(a.severity),
        confidence: "High" as const,
        ...scoped,
        campus: a.school_id ?? scoped.campus,
        relatedEntity: { type: entityType, id: entityId },
        missionControlReference: a.mission_control_item_id ?? null,
        recommendedAction:
          "Review Financial Intelligence alerts and cash/collection posture.",
        createdAt: a.created_at ?? new Date().toISOString(),
        source: {
          source: "financial_intelligence" as const,
          sourceId: a.id,
          label: a.alert_type ?? "fi_financial_alerts",
        },
        entityType,
        entityId,
      };
    });
}

export interface MissionControlItemLike {
  id: string;
  title: string;
  body?: string | null;
  severity?: string | null;
  /** Source platform module key (e.g. finance, admissions). */
  module?: string | null;
  item_type?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  school_id?: string | null;
  href?: string | null;
  created_at?: string | null;
  is_resolved?: boolean;
  metadata?: Record<string, unknown> | null;
}

function categoryFromMcModule(domainModule: string | null | undefined): ExecutiveAlertCategory {
  switch ((domainModule ?? "").toLowerCase()) {
    case "finance":
    case "financial_intelligence":
      return "Financial";
    case "admissions":
      return "Admissions";
    case "hr":
    case "workforce":
      return "Staffing";
    case "compliance":
      return "Compliance";
    case "identity":
    case "security":
      return "Security";
    case "sis":
    case "students":
      return "Enrollment";
    case "executive":
    case "edi":
      return "Executive";
    default:
      return "Operations";
  }
}

/**
 * Mission Control open items — canonical operator queue.
 * Orchestrator reads them; does not create a parallel queue.
 */
export function adaptMissionControlItems(
  items: MissionControlItemLike[],
  scope: ExecutiveAlertsScope
): ExecutiveAlertDraft[] {
  const scoped = scopeFields(scope);
  return items
    .filter((i) => !i.is_resolved)
    .map((i) => {
      const signalKey =
        i.entity_type && i.entity_id
          ? `mc.${i.entity_type}`
          : i.item_type
            ? `mc.${i.item_type}`
            : `mc.item`;

      const meta = i.metadata ?? {};
      const workflowRef =
        typeof meta.workflow_instance_id === "string"
          ? meta.workflow_instance_id
          : typeof meta.workflowReference === "string"
            ? meta.workflowReference
            : null;
      const jagRef =
        typeof meta.jag_work_id === "string"
          ? meta.jag_work_id
          : typeof meta.jagWorkReference === "string"
            ? meta.jagWorkReference
            : null;
      const activityIds = Array.isArray(meta.activity_ids)
        ? meta.activity_ids.filter((x): x is string => typeof x === "string")
        : typeof meta.activity_id === "string"
          ? [meta.activity_id]
          : [];

      return {
        signalKey,
        title: i.title,
        description: i.body?.trim() || i.title,
        category: categoryFromMcModule(i.module),
        severity: normalizeSeverity(i.severity),
        confidence: "High" as const,
        ...scoped,
        campus: i.school_id ?? scoped.campus,
        relatedEntity:
          i.entity_type && i.entity_id ? { type: i.entity_type, id: i.entity_id } : null,
        activityReferences: activityIds,
        workflowReference: workflowRef,
        jagWorkReference: jagRef,
        missionControlReference: i.id,
        recommendedAction: i.href
          ? `Open Mission Control item: ${i.href}`
          : "Review and resolve in Mission Control.",
        createdAt: i.created_at ?? new Date().toISOString(),
        source: {
          source: "mission_control" as const,
          sourceId: i.id,
          label: i.module ?? "mission_control",
        },
        entityType: i.entity_type,
        entityId: i.entity_id,
      };
    });
}

export interface ComplianceStatsLike {
  overdue?: number | null;
  criticalCount?: number | null;
  upcoming?: number | null;
  compliancePct?: number | null;
}

export function adaptComplianceSignals(
  stats: ComplianceStatsLike | null | undefined,
  scope: ExecutiveAlertsScope,
  observedAt: string
): ExecutiveAlertDraft[] {
  if (!stats) return [];
  const scoped = scopeFields(scope);
  const drafts: ExecutiveAlertDraft[] = [];

  if ((stats.criticalCount ?? 0) > 0) {
    drafts.push({
      signalKey: "compliance.critical_count",
      title: "Critical compliance items open",
      description: `${stats.criticalCount} critical compliance item(s) require attention.`,
      category: "Compliance",
      severity: "Critical",
      confidence: "High",
      ...scoped,
      relatedEntity: null,
      recommendedAction: "Review Enterprise Compliance Center and clear critical obligations.",
      createdAt: observedAt,
      source: {
        source: "compliance",
        sourceId: "compliance.critical_count",
        label: "compliance.queries",
      },
    });
  }

  if ((stats.overdue ?? 0) > 0) {
    drafts.push({
      signalKey: "compliance.overdue_obligations",
      title: "Overdue compliance obligations",
      description: `${stats.overdue} compliance obligation(s) are overdue.`,
      category: "Compliance",
      severity: (stats.overdue ?? 0) >= 5 ? "Critical" : "High",
      confidence: "High",
      ...scoped,
      relatedEntity: null,
      recommendedAction: "Clear overdue obligations and update evidence of completion.",
      createdAt: observedAt,
      source: {
        source: "compliance",
        sourceId: "compliance.overdue_obligations",
        label: "compliance.queries",
      },
    });
  }

  return drafts;
}

export interface WorkforceAnalyticsLike {
  vacancies?: number | null;
  turnoverRate?: number | null;
  expiringCertifications?: number | null;
  staffingLevels?: number | null;
}

export function adaptHrSignals(
  hr: WorkforceAnalyticsLike | null | undefined,
  scope: ExecutiveAlertsScope,
  observedAt: string
): ExecutiveAlertDraft[] {
  if (!hr) return [];
  const scoped = scopeFields(scope);
  const drafts: ExecutiveAlertDraft[] = [];

  if ((hr.vacancies ?? 0) >= 5) {
    drafts.push({
      signalKey: "staffing.vacancies",
      title: "Elevated open vacancies",
      description: `${hr.vacancies} open job posting(s) — staffing pressure is elevated.`,
      category: "Staffing",
      severity: (hr.vacancies ?? 0) >= 10 ? "Critical" : "High",
      confidence: "Medium",
      ...scoped,
      relatedEntity: null,
      recommendedAction: "Prioritize hiring pipeline and coverage plans.",
      createdAt: observedAt,
      source: {
        source: "hr",
        sourceId: "staffing.vacancies",
        label: "hr.analytics",
      },
    });
  }

  if ((hr.turnoverRate ?? 0) >= 20) {
    drafts.push({
      signalKey: "staffing.turnover_rate",
      title: "High staff turnover",
      description: `Turnover rate is ${hr.turnoverRate}%.`,
      category: "Staffing",
      severity: (hr.turnoverRate ?? 0) >= 30 ? "Critical" : "High",
      confidence: "Medium",
      ...scoped,
      relatedEntity: null,
      recommendedAction: "Review retention drivers and critical role coverage.",
      createdAt: observedAt,
      source: {
        source: "hr",
        sourceId: "staffing.turnover_rate",
        label: "hr.analytics",
      },
    });
  }

  if ((hr.expiringCertifications ?? 0) >= 3) {
    drafts.push({
      signalKey: "staffing.expiring_certifications",
      title: "Certifications expiring within 90 days",
      description: `${hr.expiringCertifications} active certification(s) expire within 90 days.`,
      category: "Staffing",
      severity: (hr.expiringCertifications ?? 0) >= 8 ? "High" : "Medium",
      confidence: "High",
      ...scoped,
      relatedEntity: null,
      recommendedAction: "Drive renewal workflow for expiring certifications.",
      createdAt: observedAt,
      source: {
        source: "hr",
        sourceId: "staffing.expiring_certifications",
        label: "hr.analytics",
      },
    });
  }

  return drafts;
}

export interface AdmissionsMetricsLike {
  acceptanceRate?: number | null;
  enrollmentConversionRate?: number | null;
  avgDaysInquiryToAcceptance?: number | null;
  activeLeads?: number | null;
  awaitingDecision?: number | null;
}

export function adaptAdmissionsSignals(
  adm: AdmissionsMetricsLike | null | undefined,
  scope: ExecutiveAlertsScope,
  observedAt: string
): ExecutiveAlertDraft[] {
  if (!adm) return [];
  const scoped = scopeFields(scope);
  const drafts: ExecutiveAlertDraft[] = [];

  if (adm.enrollmentConversionRate != null && adm.enrollmentConversionRate < 15) {
    drafts.push({
      signalKey: "admissions.enrollment_conversion_rate",
      title: "Low enrollment conversion",
      description: `Enrollment conversion is ${adm.enrollmentConversionRate}%.`,
      category: "Admissions",
      severity: adm.enrollmentConversionRate < 8 ? "Critical" : "High",
      confidence: "Medium",
      ...scoped,
      relatedEntity: null,
      recommendedAction: "Inspect funnel bottlenecks and decision SLA.",
      createdAt: observedAt,
      source: {
        source: "admissions",
        sourceId: "admissions.enrollment_conversion_rate",
        label: "admissions.executive-metrics",
      },
    });
  }

  if (adm.acceptanceRate != null && adm.acceptanceRate < 25) {
    drafts.push({
      signalKey: "admissions.acceptance_rate",
      title: "Low acceptance rate",
      description: `Acceptance rate is ${adm.acceptanceRate}%.`,
      category: "Admissions",
      severity: adm.acceptanceRate < 15 ? "High" : "Medium",
      confidence: "Medium",
      ...scoped,
      relatedEntity: null,
      recommendedAction: "Review decision criteria and pipeline quality.",
      createdAt: observedAt,
      source: {
        source: "admissions",
        sourceId: "admissions.acceptance_rate",
        label: "admissions.executive-metrics",
      },
    });
  }

  if ((adm.awaitingDecision ?? 0) >= 10) {
    drafts.push({
      signalKey: "admissions.awaiting_decision",
      title: "Decision backlog in admissions",
      description: `${adm.awaitingDecision} lead(s) awaiting decision.`,
      category: "Admissions",
      severity: (adm.awaitingDecision ?? 0) >= 25 ? "High" : "Medium",
      confidence: "High",
      ...scoped,
      relatedEntity: null,
      recommendedAction: "Clear decision queue via admissions workflow.",
      createdAt: observedAt,
      source: {
        source: "admissions",
        sourceId: "admissions.awaiting_decision",
        label: "admissions.executive-metrics",
      },
    });
  }

  return drafts;
}

export interface OperationalLoopSummaryLike {
  failedTransitions24h?: number | null;
  openGaps?: number | null;
}

export function adaptOperationalLoopSignals(
  loop: OperationalLoopSummaryLike | null | undefined,
  scope: ExecutiveAlertsScope,
  observedAt: string
): ExecutiveAlertDraft[] {
  if (!loop) return [];
  const scoped = scopeFields(scope);
  const drafts: ExecutiveAlertDraft[] = [];

  if ((loop.failedTransitions24h ?? 0) > 0) {
    drafts.push({
      signalKey: "operations.loop_failed_transitions_24h",
      title: "Operational loop transition failures",
      description: `${loop.failedTransitions24h} failed loop transition(s) in the last 24 hours.`,
      category: "Operations",
      severity: (loop.failedTransitions24h ?? 0) >= 3 ? "Critical" : "High",
      confidence: "High",
      ...scoped,
      relatedEntity: null,
      recommendedAction: "Inspect operational loop diagnostics and retry failed transitions.",
      createdAt: observedAt,
      source: {
        source: "operational_loop",
        sourceId: "operations.loop_failed_transitions_24h",
        label: "operational-loop",
      },
    });
  }

  if ((loop.openGaps ?? 0) >= 5) {
    drafts.push({
      signalKey: "operations.loop_open_gaps",
      title: "Operational loop coverage gaps",
      description: `${loop.openGaps} open loop gap(s) detected.`,
      category: "Operations",
      severity: (loop.openGaps ?? 0) >= 15 ? "High" : "Medium",
      confidence: "Medium",
      ...scoped,
      relatedEntity: null,
      recommendedAction: "Close loop gaps via SIS / scheduling remediation.",
      createdAt: observedAt,
      source: {
        source: "operational_loop",
        sourceId: "operations.loop_open_gaps",
        label: "operational-loop",
      },
    });
  }

  return drafts;
}

export interface ExecutiveInsightLike {
  id: string;
  title: string;
  body?: string | null;
  severity?: string | null;
  insight_type?: string | null;
  recommended_action?: string | null;
  href?: string | null;
  metric_key?: string | null;
  metric_value?: number | null;
  entity_type?: string | null;
  entity_id?: string | null;
  school_id?: string | null;
  created_at?: string | null;
  is_dismissed?: boolean;
}

/** Executive insights — provenance only; merged with metric/MC signals via signalKey. */
export function adaptExecutiveInsights(
  insights: ExecutiveInsightLike[],
  scope: ExecutiveAlertsScope
): ExecutiveAlertDraft[] {
  const scoped = scopeFields(scope);
  return insights
    .filter((i) => !i.is_dismissed)
    .filter((i) => {
      const s = (i.severity ?? "").toLowerCase();
      return s === "critical" || s === "warning" || s === "high" || s === "error";
    })
    .map((i) => ({
      signalKey: i.metric_key ?? `executive.insight.${i.insight_type ?? "general"}`,
      title: i.title,
      description: i.body?.trim() || i.title,
      category: categoryFromInsight(i),
      severity: normalizeSeverity(i.severity === "warning" ? "medium" : i.severity),
      confidence: "Medium" as const,
      ...scoped,
      campus: i.school_id ?? scoped.campus,
      relatedEntity:
        i.entity_type && i.entity_id ? { type: i.entity_type, id: i.entity_id } : null,
      recommendedAction:
        i.recommended_action ??
        (i.href ? `Review: ${i.href}` : "Review executive insight and take recommended action."),
      createdAt: i.created_at ?? new Date().toISOString(),
      source: {
        source: "executive_insights" as const,
        sourceId: i.id,
        label: i.insight_type ?? "executive_insights",
      },
      entityType: i.entity_type,
      entityId: i.entity_id,
    }));
}

function categoryFromInsight(i: ExecutiveInsightLike): ExecutiveAlertCategory {
  const key = (i.metric_key ?? "").toLowerCase();
  const title = (i.title ?? "").toLowerCase();
  if (key.includes("collection") || key.includes("cash") || title.includes("receivable")) {
    return "Financial";
  }
  if (key.includes("enrollment") || title.includes("enrollment")) return "Enrollment";
  if (key.includes("admission") || title.includes("admission")) return "Admissions";
  if (key.includes("staff") || title.includes("staff")) return "Staffing";
  if (key.includes("compliance") || title.includes("compliance")) return "Compliance";
  if (title.includes("mission control") || title.includes("overdue")) return "Operations";
  return "Executive";
}
