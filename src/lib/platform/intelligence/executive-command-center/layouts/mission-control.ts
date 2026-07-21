import type { WorkspaceLayout } from "@/lib/platform/intelligence/executive-command-center/types";

/** RC-6 — Mission Control persona: ECC 2.0 panels first. */
export const missionControlLayout: WorkspaceLayout = {
  role: "mission_control",
  label: "Mission Control",
  description:
    "ECC 2.0 mission control — timeline, alerts, approvals, investigations, AI, twin, scenarios, risks, initiatives, portfolio, graph.",
  widgetOrder: [
    "mission_control_summary",
    "organization_timeline",
    "alert_center",
    "approval_center",
    "investigation_workspace",
    "ai_workspace",
    "digital_twin_controls",
    "scenario_simulator",
    "risk_center",
    "initiative_monitor",
    "portfolio_health",
    "organization_graph_viewer",
    "organizational_graph",
    "briefing",
    "health",
    "decisions",
    "copilot",
  ],
};
