/**
 * Sprint 003 — Rule-based Founder Morning Brief from live Executive KPIs.
 * Deterministic TypeScript only — no AI / LLM.
 */
import type { ExecutiveKPIs, ExecutiveKpiAlert } from "@/lib/executive/kpis";

export type MorningBriefPriority = "GREEN" | "YELLOW" | "RED";

export interface FounderMorningBriefGenerated {
  title: string;
  summary: string;
  priority: MorningBriefPriority;
  alerts: string[];
  recommendedActions: string[];
}

const TITLE = "Today's Executive Brief";

const TEACHER_ATTENDANCE_WARN = 95;
const STUDENT_ATTENDANCE_WARN = 90;

const PRIORITY_RANK: Record<MorningBriefPriority, number> = {
  GREEN: 0,
  YELLOW: 1,
  RED: 2,
};

function maxPriority(
  a: MorningBriefPriority,
  b: MorningBriefPriority
): MorningBriefPriority {
  return PRIORITY_RANK[a] >= PRIORITY_RANK[b] ? a : b;
}

function bumpPriority(current: MorningBriefPriority): MorningBriefPriority {
  if (current === "GREEN") return "YELLOW";
  if (current === "YELLOW") return "RED";
  return "RED";
}

function uniqueActions(actions: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const action of actions) {
    const key = action.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(action.trim());
  }
  return out;
}

function formatAlertLine(alert: ExecutiveKpiAlert): string {
  return `${alert.title}: ${alert.body}`;
}

/**
 * Generate a deterministic executive morning brief from live KPIs.
 * Pure function — no I/O, no AI.
 */
export function generateFounderMorningBrief(
  kpis: ExecutiveKPIs
): FounderMorningBriefGenerated {
  let priority: MorningBriefPriority = "GREEN";
  const summaryParts: string[] = [];
  const alerts: string[] = [];
  const actions: string[] = [];

  // --- Enrollment ---
  if (kpis.enrollment === 0) {
    priority = maxPriority(priority, "RED");
    summaryParts.push("Enrollment is at zero — no active course enrollments are recorded.");
    alerts.push("Enrollment is 0.");
    actions.push("Review enrollment and admissions pipeline.");
  } else {
    summaryParts.push("Enrollment is stable.");
  }

  // --- Revenue ---
  if (kpis.revenue === 0) {
    priority = maxPriority(priority, "YELLOW");
    summaryParts.push("Revenue collection is behind expectations.");
    alerts.push("No payments collected this month.");
    actions.push("Review unpaid invoices.");
  } else {
    summaryParts.push("Revenue collection is on track for the month.");
  }

  // --- Outstanding balances ---
  if (kpis.outstanding > 0) {
    summaryParts.push("Outstanding tuition balances require collection follow-up.");
    actions.push("Review unpaid invoices.");
  }

  // --- Teacher attendance (only when sessions observed today) ---
  if (
    kpis.teacherAttendanceDetail.total > 0 &&
    kpis.teacherAttendance < TEACHER_ATTENDANCE_WARN
  ) {
    priority = maxPriority(priority, "YELLOW");
    summaryParts.push(
      `Teacher attendance submission is at ${kpis.teacherAttendance}%, below the ${TEACHER_ATTENDANCE_WARN}% target.`
    );
    alerts.push(
      `Teacher attendance ${kpis.teacherAttendance}% (below ${TEACHER_ATTENDANCE_WARN}%).`
    );
    actions.push("Verify attendance submissions.");
  }

  // --- Student attendance (only when records observed today) ---
  if (
    kpis.studentAttendanceDetail.total > 0 &&
    kpis.studentAttendance < STUDENT_ATTENDANCE_WARN
  ) {
    priority = maxPriority(priority, "YELLOW");
    summaryParts.push(
      `Student attendance is at ${kpis.studentAttendance}%, below the ${STUDENT_ATTENDANCE_WARN}% target.`
    );
    alerts.push(
      `Student attendance ${kpis.studentAttendance}% (below ${STUDENT_ATTENDANCE_WARN}%).`
    );
    actions.push("Verify attendance submissions.");
  }

  // --- Upcoming classes ---
  if (kpis.upcomingClasses.length === 0) {
    priority = maxPriority(priority, "YELLOW");
    summaryParts.push("No upcoming instructional sessions are scheduled.");
    alerts.push("No upcoming classes scheduled.");
    actions.push("Review scheduling.");
  }

  // --- Live KPI alerts ---
  const criticalAlerts = kpis.alerts.filter((a) => a.severity === "critical");
  const hasAlerts = kpis.alerts.length > 0;

  for (const alert of kpis.alerts) {
    alerts.push(formatAlertLine(alert));
  }

  if (criticalAlerts.length > 0) {
    priority = "RED";
    summaryParts.push(
      `${criticalAlerts.length} critical alert${criticalAlerts.length === 1 ? "" : "s"} require immediate attention.`
    );
    for (const alert of criticalAlerts) {
      if (alert.type === "overdue_payroll") actions.push("Resolve overdue payroll.");
      if (alert.type === "overdue_invoices") actions.push("Review unpaid invoices.");
      if (alert.type === "enrollment_below_threshold") {
        actions.push("Review enrollment and admissions pipeline.");
      }
      if (alert.type === "attendance_below_threshold") {
        actions.push("Verify attendance submissions.");
      }
      if (alert.type === "missing_staffing") actions.push("Address open staffing gaps.");
      if (alert.type === "failed_integrations") {
        actions.push("Investigate failed integrations.");
      }
    }
  } else if (hasAlerts) {
    // Any non-critical alerts increase priority one step.
    priority = bumpPriority(priority);
    summaryParts.push(
      `${kpis.alerts.length} executive alert${kpis.alerts.length === 1 ? "" : "s"} need${kpis.alerts.length === 1 ? "s" : ""} review.`
    );
  }

  if (summaryParts.length === 0) {
    summaryParts.push("No critical issues. Operations appear within expected ranges.");
  }

  if (priority === "GREEN" && actions.length === 0) {
    actions.push("Continue monitoring key metrics.");
  }

  return {
    title: TITLE,
    summary: summaryParts.join(" "),
    priority,
    alerts,
    recommendedActions: uniqueActions(actions),
  };
}

/**
 * Format generated brief for the existing Morning Brief summary paragraph
 * (priority + narrative) without changing UI layout.
 */
export function formatMorningBriefForDisplay(
  brief: FounderMorningBriefGenerated
): string {
  return `Priority: ${brief.priority}. ${brief.summary}`;
}

/**
 * Map recommended action strings into Mission Control aiBrief action shape.
 */
export function mapMorningBriefActionsForUi(
  brief: FounderMorningBriefGenerated
): Array<{ id: string; title: string; action: string; href: string | null }> {
  return brief.recommendedActions.map((action, index) => ({
    id: `kpi-brief-action-${index}`,
    title: action,
    action,
    href: null,
  }));
}
