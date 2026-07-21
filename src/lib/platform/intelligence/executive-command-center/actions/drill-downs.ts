/**
 * Standardized drill-down actions for Command Center cards (Sprint 068).
 */

import {
  DRILL_DOWN_ACTIONS,
  type DrillDownAction,
  type WidgetKind,
} from "@/lib/platform/intelligence/executive-command-center/types";

export const DEFAULT_DRILL_DOWNS: DrillDownAction[] = [...DRILL_DOWN_ACTIONS];

/** Optional leading actions per widget; every card still exposes the full standard set. */
const LEADING_BY_WIDGET: Partial<Record<WidgetKind, DrillDownAction[]>> = {
  briefing: ["open_investigation", "view_evidence"],
  risks: ["open_investigation", "forecast"],
  opportunities: ["create_initiative", "compare"],
  decisions: ["compare", "create_initiative"],
  forecasts: ["forecast", "compare"],
  signals: ["open_investigation", "forecast"],
  approvals: ["assign", "view_evidence"],
  plans: ["assign", "create_initiative"],
  memory: ["view_evidence", "open_investigation"],
  copilot: ["open_investigation", "view_evidence"],
  health: ["open_investigation", "forecast"],
  active_initiatives: ["open_investigation", "assign", "create_initiative"],
  at_risk_initiatives: ["open_investigation", "forecast", "assign"],
  upcoming_milestones: ["assign", "view_evidence"],
  budget_variance: ["compare", "view_evidence", "forecast"],
  completed_initiatives: ["view_evidence", "compare"],
  portfolio_health: ["open_investigation", "compare", "forecast"],
  priority_matrix: ["compare", "create_initiative", "assign"],
  capacity_utilization: ["assign", "forecast", "compare"],
  budget_allocation: ["compare", "view_evidence", "forecast"],
  cross_initiative_risks: ["open_investigation", "forecast", "assign"],
  portfolio_changes: ["view_evidence", "assign", "create_initiative"],
  active_simulations: ["compare", "view_evidence", "forecast"],
  scenario_comparison: ["compare", "view_evidence"],
  highest_impact_opportunities: ["forecast", "create_initiative", "compare"],
  constraint_alerts: ["open_investigation", "view_evidence"],
  recommended_scenario: ["compare", "view_evidence", "assign"],
  ecosystem_health: ["open_investigation", "compare", "forecast"],
  cross_organization_risks: ["open_investigation", "forecast", "view_evidence"],
  shared_opportunities: ["create_initiative", "compare", "assign"],
  geographic_coverage: ["compare", "view_evidence"],
  federated_portfolio: ["compare", "forecast", "view_evidence"],
  organization_network: ["compare", "view_evidence", "open_investigation"],
  recent_meetings: ["view_evidence", "open_investigation"],
  calendar_summary: ["view_evidence", "compare"],
  communication_pulse: ["open_investigation", "view_evidence"],
  shared_documents: ["view_evidence", "compare"],
  collaboration_activity: ["open_investigation", "view_evidence", "assign"],
  executive_narratives: ["open_investigation", "view_evidence", "compare"],
  unified_communication_dashboard: ["open_investigation", "view_evidence", "compare"],
  communication_health: ["open_investigation", "view_evidence", "forecast"],
  response_time: ["open_investigation", "compare", "forecast"],
  active_teams: ["compare", "view_evidence", "assign"],
  meeting_load: ["forecast", "compare", "open_investigation"],
  collaboration_heatmap: ["compare", "view_evidence", "open_investigation"],
  cash_position: ["forecast", "open_investigation", "view_evidence"],
  revenue: ["forecast", "compare", "view_evidence"],
  burn_rate: ["forecast", "open_investigation", "compare"],
  receivables: ["open_investigation", "assign", "view_evidence"],
  payables: ["open_investigation", "assign", "compare"],
  subscriptions: ["forecast", "compare", "view_evidence"],
  revenue_forecast: ["forecast", "compare", "view_evidence"],
  expense_anomalies: ["open_investigation", "view_evidence", "compare"],
  profitability: ["forecast", "compare", "view_evidence"],
  ebitda: ["forecast", "compare", "view_evidence"],
  crm_pipeline: ["open_investigation", "compare", "create_initiative"],
  sales_forecast: ["forecast", "compare", "view_evidence"],
  pipeline_health: ["open_investigation", "forecast", "compare"],
  customer_concentration: ["open_investigation", "compare", "view_evidence"],
  executive_relationship_graph: ["compare", "view_evidence", "open_investigation"],
  revenue_attribution: ["forecast", "compare", "view_evidence"],
  workforce: ["assign", "compare", "view_evidence"],
  student_enrollment: ["forecast", "view_evidence", "compare"],
  student_health: ["open_investigation", "forecast", "view_evidence"],
  teacher_workload: ["compare", "assign", "view_evidence"],
  academic_performance: ["forecast", "compare", "view_evidence"],
  education_attendance: ["forecast", "open_investigation", "compare"],
  scholarship_analytics: ["forecast", "view_evidence", "compare"],
  organizational_graph: ["compare", "view_evidence", "open_investigation"],
  program_funding: ["forecast", "open_investigation", "view_evidence"],
  hr_turnover: ["open_investigation", "compare", "view_evidence"],
  hr_hiring: ["create_initiative", "assign", "compare"],
  hr_capacity: ["forecast", "assign", "compare"],
  hr_payroll: ["forecast", "compare", "view_evidence"],
  hr_compensation: ["compare", "view_evidence", "forecast"],
  hr_succession: ["assign", "create_initiative", "view_evidence"],
  // RC-6 — Mission Control
  mission_control_summary: ["open_investigation", "view_evidence", "compare"],
  organization_timeline: ["view_evidence", "open_investigation"],
  alert_center: ["open_investigation", "assign", "view_evidence"],
  approval_center: ["assign", "view_evidence"],
  investigation_workspace: ["open_investigation", "view_evidence", "compare"],
  ai_workspace: ["open_investigation", "view_evidence", "forecast"],
  digital_twin_controls: ["forecast", "compare", "view_evidence"],
  scenario_simulator: ["compare", "forecast", "view_evidence"],
  risk_center: ["open_investigation", "forecast", "assign"],
  initiative_monitor: ["open_investigation", "assign", "create_initiative"],
  organization_graph_viewer: ["compare", "view_evidence", "open_investigation"],
};

export function actionsForWidget(kind: WidgetKind): DrillDownAction[] {
  const leading = LEADING_BY_WIDGET[kind] ?? [];
  const seen = new Set<DrillDownAction>();
  const ordered: DrillDownAction[] = [];
  for (const action of [...leading, ...DEFAULT_DRILL_DOWNS]) {
    if (seen.has(action)) continue;
    seen.add(action);
    ordered.push(action);
  }
  return ordered;
}

export function drillDownLabel(action: DrillDownAction): string {
  switch (action) {
    case "open_investigation":
      return "Open Investigation";
    case "view_evidence":
      return "View Evidence";
    case "compare":
      return "Compare";
    case "forecast":
      return "Forecast";
    case "assign":
      return "Assign";
    case "create_initiative":
      return "Create Initiative";
    default:
      return action;
  }
}
