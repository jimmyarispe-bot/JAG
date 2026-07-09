import type {
  ExecutiveAlert,
  ExecutiveAlertSeverity,
} from "@/lib/platform/executive-alerts";
import type {
  ExecutiveDecisionDraft,
  ExecutiveDecisionSeverity,
  ExecutiveDecisionType,
  ExecutiveDecisionsScope,
} from "@/lib/platform/executive-decisions/types";
import { normalizeDecisionSeverity } from "@/lib/platform/executive-decisions/score";
import type { JagWorkItem } from "@/lib/platform/jag-work/types";
import type { KpiSnapshotRecord } from "@/lib/platform/kpi-snapshots";

function scopeFields(scope: ExecutiveDecisionsScope) {
  return {
    organization: scope.organizationId,
    region: scope.regionId,
    campus: scope.campusId ?? scope.schoolId,
    program: scope.program ?? scope.programId,
  };
}

function alertSeverityToDecision(
  s: ExecutiveAlertSeverity
): ExecutiveDecisionSeverity {
  return s;
}

function decisionTypeFromAlertCategory(
  category: ExecutiveAlert["category"]
): ExecutiveDecisionType {
  switch (category) {
    case "Financial":
      return "Financial";
    case "Compliance":
    case "Security":
      return "Compliance";
    case "Staffing":
      return "Staffing";
    case "Admissions":
      return "Admissions";
    case "Operations":
      return "Operations";
    case "Enrollment":
      return "Operations";
    case "Executive":
      return "Strategic";
    default:
      return "Review";
  }
}

/** Critical / High executive alerts that require a human decision. */
export function adaptExecutiveAlerts(
  alerts: ExecutiveAlert[],
  scope: ExecutiveDecisionsScope
): ExecutiveDecisionDraft[] {
  const scoped = scopeFields(scope);
  return alerts
    .filter((a) => a.status !== "dismissed")
    .filter((a) => a.severity === "Critical" || a.severity === "High")
    .map((a) => {
      const decisionType = decisionTypeFromAlertCategory(a.category);
      return {
        signalKey: a.signalKey,
        title: a.title,
        summary: a.description,
        decisionType,
        severity: alertSeverityToDecision(a.severity),
        confidence: a.confidence,
        ...scoped,
        organization: a.organization ?? scoped.organization,
        region: a.region ?? scoped.region,
        campus: a.campus ?? scoped.campus,
        program: a.program ?? scoped.program,
        status: a.status === "acknowledged" ? ("Acknowledged" as const) : ("Open" as const),
        recommendedAction: a.recommendedAction,
        blocking: a.severity === "Critical",
        relatedAlerts: [a.id],
        relatedActivities: a.activityReferences,
        relatedWorkflow: a.workflowReference,
        relatedMissionControlItem: a.missionControlReference,
        relatedJagWorkItem: a.jagWorkReference,
        createdAt: a.createdAt,
        source: {
          source: "executive_alerts" as const,
          sourceId: a.id,
          label: a.category,
        },
        relatedEntityType: a.relatedEntity?.type ?? null,
        relatedEntityId: a.relatedEntity?.id ?? null,
        financialImpact: a.category === "Financial",
        studentImpact: a.category === "Enrollment" || a.category === "Admissions",
        complianceRisk: a.category === "Compliance" || a.category === "Security",
      };
    });
}

export interface MissionControlDecisionLike {
  id: string;
  title: string;
  body?: string | null;
  severity?: string | null;
  module?: string | null;
  item_type?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  school_id?: string | null;
  assigned_role?: string | null;
  assigned_user_id?: string | null;
  href?: string | null;
  created_at?: string | null;
  is_resolved?: boolean;
  metadata?: Record<string, unknown> | null;
}

function decisionTypeFromMcModule(
  module: string | null | undefined,
  itemType: string | null | undefined
): ExecutiveDecisionType {
  const m = (module ?? "").toLowerCase();
  const t = (itemType ?? "").toLowerCase();
  if (t.includes("escalat")) return "Escalation";
  if (t.includes("approv")) return "Approval";
  if (t.includes("exception")) return "Exception";
  if (m === "finance" || m === "financial_intelligence") return "Financial";
  if (m === "compliance" || m === "identity") return "Compliance";
  if (m === "hr" || m === "workforce") return "Staffing";
  if (m === "admissions") return "Admissions";
  if (m === "executive" || m === "edi") return "Strategic";
  return "Operations";
}

/**
 * Mission Control open items that need executive attention.
 * Prefer MC identity when merging with other producers.
 */
export function adaptMissionControlDecisions(
  items: MissionControlDecisionLike[],
  scope: ExecutiveDecisionsScope
): ExecutiveDecisionDraft[] {
  const scoped = scopeFields(scope);
  return items
    .filter((i) => !i.is_resolved)
    .filter((i) => {
      const s = (i.severity ?? "").toLowerCase();
      // Decision queue focuses on items that need executive action.
      return s === "critical" || s === "high";
    })
    .map((i) => {
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
      const alertIds = Array.isArray(meta.alert_ids)
        ? meta.alert_ids.filter((x): x is string => typeof x === "string")
        : typeof meta.alert_id === "string"
          ? [meta.alert_id]
          : [];
      const activityIds = Array.isArray(meta.activity_ids)
        ? meta.activity_ids.filter((x): x is string => typeof x === "string")
        : typeof meta.activity_id === "string"
          ? [meta.activity_id]
          : [];

      const severity = normalizeDecisionSeverity(
        i.severity === "normal" ? "medium" : i.severity
      );

      return {
        signalKey:
          i.entity_type && i.entity_id
            ? `mc.${i.entity_type}`
            : i.item_type
              ? `mc.${i.item_type}`
              : `mc.item.${i.id}`,
        title: i.title,
        summary: i.body?.trim() || i.title,
        decisionType: decisionTypeFromMcModule(i.module, i.item_type),
        severity,
        confidence: "High" as const,
        ...scoped,
        campus: i.school_id ?? scoped.campus,
        recommendedAction: i.href
          ? `Resolve in Mission Control: ${i.href}`
          : "Review and resolve in Mission Control.",
        recommendedOwner: i.assigned_role ?? i.assigned_user_id ?? null,
        blocking: severity === "Critical",
        relatedAlerts: alertIds,
        relatedActivities: activityIds,
        relatedWorkflow: workflowRef,
        relatedMissionControlItem: i.id,
        relatedJagWorkItem: jagRef,
        createdAt: i.created_at ?? new Date().toISOString(),
        source: {
          source: "mission_control" as const,
          sourceId: i.id,
          label: i.module ?? "mission_control",
        },
        relatedEntityType: i.entity_type ?? null,
        relatedEntityId: i.entity_id ?? null,
        financialImpact: (i.module ?? "").toLowerCase().includes("finance"),
        studentImpact: ["sis", "students", "admissions"].includes(
          (i.module ?? "").toLowerCase()
        ),
        complianceRisk: ["compliance", "identity"].includes(
          (i.module ?? "").toLowerCase()
        ),
      };
    });
}

function decisionTypeFromJagWork(item: JagWorkItem): ExecutiveDecisionType {
  const perspectives = item.perspectives ?? [];
  if (perspectives.includes("strategic_decisions")) return "Strategic";
  if (perspectives.includes("needs_human_decision")) {
    if (item.workType.includes("compliance")) return "Compliance";
    if (item.workType.includes("finance") || item.source === "finance") return "Financial";
    if (item.source === "hr") return "Staffing";
    if (item.source === "admissions") return "Admissions";
    return "Approval";
  }
  if (item.workType.includes("compliance")) return "Compliance";
  if (item.source === "executive") return "Strategic";
  if (item.source === "finance") return "Financial";
  if (item.source === "hr") return "Staffing";
  if (item.source === "admissions") return "Admissions";
  return "Review";
}

function jagStatusToDecision(
  status: JagWorkItem["status"]
): ExecutiveDecisionDraft["status"] {
  switch (status) {
    case "completed":
      return "Completed";
    case "blocked":
      return "Waiting";
    case "awaiting_review":
      return "Waiting";
    case "in_progress":
      return "Acknowledged";
    default:
      return "Open";
  }
}

/**
 * JAG Work items from executive decision perspectives.
 * Canonical work model — not a second queue.
 */
export function adaptJagWorkDecisions(
  items: JagWorkItem[],
  scope: ExecutiveDecisionsScope
): ExecutiveDecisionDraft[] {
  const scoped = scopeFields(scope);
  const decisionPerspectives = new Set([
    "needs_human_decision",
    "strategic_decisions",
    "awaiting_review",
    "board_ready",
  ]);

  return items
    .filter((i) => i.status !== "completed")
    .filter((i) => i.perspectives.some((p) => decisionPerspectives.has(p)))
    .map((i) => {
      const severity = normalizeDecisionSeverity(i.priority);
      return {
        signalKey: i.entityType
          ? `jag.${i.entityType}`
          : `jag.${i.workType}`,
        title: i.title,
        summary: i.description ?? i.recommendedNextAction,
        decisionType: decisionTypeFromJagWork(i),
        severity,
        confidence: "High" as const,
        ...scoped,
        status: jagStatusToDecision(i.status),
        recommendedAction: i.recommendedNextAction,
        recommendedOwner: i.ownerLabel ?? i.ownerUserId ?? null,
        dueDate: i.dueDate ?? null,
        blocking:
          i.blockingDependencies.length > 0 ||
          i.status === "blocked" ||
          i.priority === "critical",
        relatedJagWorkItem: i.id,
        relatedEntityType: i.entityType ?? null,
        relatedEntityId: i.entityId ?? null,
        createdAt: new Date().toISOString(),
        source: {
          source: "jag_work" as const,
          sourceId: i.id,
          label: i.workType,
        },
        financialImpact: i.source === "finance",
        studentImpact: Boolean(i.studentId) || i.source === "students" || i.source === "admissions",
        complianceRisk: i.source === "compliance" || i.workType.includes("compliance"),
      };
    });
}

export interface WorkflowApprovalDecisionLike {
  id: string;
  instance_id: string;
  transition_key: string;
  gate_key: string;
  status: string;
  requested_by?: string | null;
  created_at?: string | null;
  metadata?: Record<string, unknown> | null;
  /** Joined / enriched fields when available. */
  workflow_key?: string | null;
  domain?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  school_id?: string | null;
  task_name?: string | null;
  due_at?: string | null;
}

function decisionTypeFromWorkflow(
  row: WorkflowApprovalDecisionLike
): ExecutiveDecisionType {
  const domain = (row.domain ?? "").toLowerCase();
  const gate = (row.gate_key ?? "").toLowerCase();
  if (gate.includes("escalat")) return "Escalation";
  if (domain === "finance") return "Financial";
  if (domain === "compliance") return "Compliance";
  if (domain === "hr") return "Staffing";
  if (domain === "admissions") return "Admissions";
  if (domain === "sis") return "Operations";
  return "Approval";
}

/** Pending Workflow Engine approvals — existing engine, not a new one. */
export function adaptWorkflowApprovals(
  approvals: WorkflowApprovalDecisionLike[],
  scope: ExecutiveDecisionsScope
): ExecutiveDecisionDraft[] {
  const scoped = scopeFields(scope);
  return approvals
    .filter((a) => a.status === "pending")
    .map((a) => {
      const meta = a.metadata ?? {};
      const mcId =
        typeof meta.mission_control_item_id === "string"
          ? meta.mission_control_item_id
          : null;
      const jagId =
        typeof meta.jag_work_id === "string" ? meta.jag_work_id : null;

      return {
        signalKey: `workflow.${a.gate_key}`,
        title: a.task_name?.trim() || `Approval required: ${a.gate_key}`,
        summary: `Workflow approval pending for transition ${a.transition_key} (gate ${a.gate_key}).`,
        decisionType: decisionTypeFromWorkflow(a),
        severity: "High" as const,
        confidence: "High" as const,
        ...scoped,
        campus: a.school_id ?? scoped.campus,
        status: "Waiting" as const,
        recommendedAction: "Approve, reject, or escalate via Workflow Engine.",
        recommendedOwner:
          Array.isArray(meta.assigned_roles) && meta.assigned_roles.length
            ? String(meta.assigned_roles[0])
            : a.requested_by ?? null,
        dueDate: a.due_at ?? null,
        blocking: true,
        relatedWorkflow: a.instance_id,
        relatedMissionControlItem: mcId,
        relatedJagWorkItem: jagId,
        createdAt: a.created_at ?? new Date().toISOString(),
        source: {
          source: "workflow" as const,
          sourceId: a.id,
          label: a.workflow_key ?? a.gate_key,
        },
        relatedEntityType: a.entity_type ?? null,
        relatedEntityId: a.entity_id ?? null,
        financialImpact: (a.domain ?? "").toLowerCase() === "finance",
        studentImpact: ["sis", "admissions"].includes((a.domain ?? "").toLowerCase()),
        complianceRisk: (a.domain ?? "").toLowerCase() === "compliance",
      };
    });
}

export interface ActivityDecisionLike {
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
  metadata?: Record<string, unknown> | null;
}

const ACTIVITY_DECISION_TYPES = new Set([
  "executive.decision_deferred",
  "executive.decision_escalated",
  "edi.decision_recorded",
  "admissions.decision_recorded",
]);

/** Activity events that represent decision lifecycle / pending human action. */
export function adaptActivityDecisions(
  events: ActivityDecisionLike[],
  scope: ExecutiveDecisionsScope
): ExecutiveDecisionDraft[] {
  const scoped = scopeFields(scope);
  return events
    .filter((e) => {
      const type = e.event_type ?? "";
      return (
        ACTIVITY_DECISION_TYPES.has(type) ||
        e.classification === "critical" ||
        type.includes("decision")
      );
    })
    .map((e) => {
      const type = e.event_type ?? "activity.decision";
      const meta = e.metadata ?? {};
      return {
        signalKey: type,
        title: e.summary?.trim() || `Decision activity: ${type}`,
        summary: e.summary?.trim() || `Activity Engine recorded ${type}.`,
        decisionType: type.includes("escalat")
          ? ("Escalation" as const)
          : type.includes("admissions")
            ? ("Admissions" as const)
            : ("Review" as const),
        severity: normalizeDecisionSeverity(e.classification ?? "medium"),
        confidence: "Medium" as const,
        ...scoped,
        organization: e.organization_id ?? scoped.organization,
        campus: e.school_id ?? scoped.campus,
        relatedActivities: [e.id],
        relatedWorkflow:
          typeof meta.workflow_instance_id === "string"
            ? meta.workflow_instance_id
            : null,
        relatedMissionControlItem:
          typeof meta.mission_control_item_id === "string"
            ? meta.mission_control_item_id
            : null,
        relatedJagWorkItem:
          typeof meta.jag_work_id === "string" ? meta.jag_work_id : null,
        createdAt: e.occurred_at ?? e.created_at ?? new Date().toISOString(),
        source: {
          source: "activity" as const,
          sourceId: e.id,
          label: type,
        },
        relatedEntityType: e.entity_type ?? null,
        relatedEntityId: e.entity_id ?? null,
      };
    });
}

/** KPI critical / at_risk snapshots that imply an executive decision. */
export function adaptKpiSnapshotDecisions(
  snapshots: KpiSnapshotRecord[],
  scope: ExecutiveDecisionsScope
): ExecutiveDecisionDraft[] {
  const scoped = scopeFields(scope);
  return snapshots
    .filter((s) => s.status === "critical" || s.status === "at_risk")
    .map((s) => {
      const domain = (s.domain ?? "").toLowerCase();
      const decisionType: ExecutiveDecisionType =
        domain === "finance"
          ? "Financial"
          : domain === "compliance"
            ? "Compliance"
            : domain === "staffing"
              ? "Staffing"
              : domain === "admissions"
                ? "Admissions"
                : domain === "enrollment"
                  ? "Operations"
                  : "Review";

      return {
        signalKey: `kpi.${s.metricId}`,
        title: `Decide on ${s.metricName}`,
        summary:
          s.metricValue == null
            ? `${s.metricName} is ${s.status}.`
            : `${s.metricName} is ${s.metricValue} (${s.status}).`,
        decisionType,
        severity: s.status === "critical" ? "Critical" : "High",
        confidence: s.confidence,
        ...scoped,
        organization: s.organizationId ?? scoped.organization,
        region: s.regionId ?? scoped.region,
        campus: s.campusId ?? s.schoolId ?? scoped.campus,
        program: s.program ?? scoped.program,
        recommendedAction: `Set owner and remediation plan for KPI ${s.metricId}.`,
        blocking: s.status === "critical",
        createdAt: s.capturedAt,
        source: {
          source: "kpi_snapshots" as const,
          sourceId: `${s.snapshotDate}:${s.metricId}`,
          label: s.source,
        },
        financialImpact: domain === "finance",
        studentImpact: domain === "enrollment" || domain === "admissions" || domain === "attendance",
        complianceRisk: domain === "compliance",
      };
    });
}
