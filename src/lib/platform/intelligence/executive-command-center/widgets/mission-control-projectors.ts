/**
 * RC-6 — Mission Control widget projectors (soft-read ECC 2.0 panels).
 */

import { actionsForWidget } from "@/lib/platform/intelligence/executive-command-center/actions/drill-downs";
import type {
  WidgetKind,
  WorkspaceWidget,
} from "@/lib/platform/intelligence/executive-command-center/types";
import type { MissionControlWorkspace } from "@/lib/platform/executive-command-center";
import type { MissionControlPanelId } from "@/lib/platform/executive-command-center";

export type MissionControlProjectorInput = {
  missionControl?: MissionControlWorkspace | null;
  createId: (prefix: string) => string;
  nowIso: string;
};

function projectPanel(
  kind: WidgetKind,
  panelId: MissionControlPanelId,
  sourceDomain: string,
  input: MissionControlProjectorInput
): WorkspaceWidget {
  const panel = input.missionControl?.panels[panelId];
  const cards = (panel?.cards ?? []).map((c) => ({
    id: c.id,
    title: c.title,
    summary: c.summary,
    severity: c.severity,
    score: c.score,
    domains: c.domains ?? [],
    sourceDomain,
    meta: c.meta,
  }));

  return {
    id: input.createId(`widget-${kind}`),
    kind,
    title: panel?.title ?? kind,
    subtitle: panel?.subtitle,
    sourceDomain,
    priority: 0,
    cards,
    emptyMessage: panel?.emptyMessage ?? "Mission Control panel empty.",
    actions: actionsForWidget(kind),
    refreshedAt: input.nowIso,
  };
}

export function projectMissionControlSummary(
  input: MissionControlProjectorInput
): WorkspaceWidget {
  const mc = input.missionControl;
  const cards = mc
    ? [
        {
          id: input.createId("card-mc-summary"),
          title: `Mission Control ${mc.version}`,
          summary: mc.missionSummary,
          score: mc.healthScore.value,
          domains: mc.contributingDomains.slice(0, 6),
          sourceDomain: "executive-command-center-v2",
        },
        {
          id: input.createId("card-mc-health"),
          title: `Health · ${mc.healthScore.label}`,
          summary: `${mc.panelOrder.length} mission panels online`,
          score: mc.healthScore.value,
          domains: ["executive-command-center-v2"],
          sourceDomain: "executive-command-center-v2",
        },
      ]
    : [];

  return {
    id: input.createId("widget-mission_control_summary"),
    kind: "mission_control_summary",
    title: "Mission Control",
    subtitle: "ECC 2.0 operating picture",
    sourceDomain: "executive-command-center-v2",
    priority: 0,
    cards,
    emptyMessage: "Mission Control unavailable — provide organization scope.",
    actions: actionsForWidget("mission_control_summary"),
    refreshedAt: input.nowIso,
  };
}

export function projectOrganizationTimeline(input: MissionControlProjectorInput) {
  return projectPanel(
    "organization_timeline",
    "organization_timeline",
    "executive-command-center-v2",
    input
  );
}

export function projectAlertCenter(input: MissionControlProjectorInput) {
  return projectPanel("alert_center", "alert_center", "executive-command-center-v2", input);
}

export function projectApprovalCenter(input: MissionControlProjectorInput) {
  return projectPanel(
    "approval_center",
    "approval_center",
    "executive-command-center-v2",
    input
  );
}

export function projectInvestigationWorkspace(input: MissionControlProjectorInput) {
  return projectPanel(
    "investigation_workspace",
    "investigation_workspace",
    "executive-command-center-v2",
    input
  );
}

export function projectAiWorkspace(input: MissionControlProjectorInput) {
  return projectPanel("ai_workspace", "ai_workspace", "executive-command-center-v2", input);
}

export function projectDigitalTwinControls(input: MissionControlProjectorInput) {
  return projectPanel(
    "digital_twin_controls",
    "digital_twin_controls",
    "executive-command-center-v2",
    input
  );
}

export function projectScenarioSimulator(input: MissionControlProjectorInput) {
  return projectPanel(
    "scenario_simulator",
    "scenario_simulator",
    "executive-command-center-v2",
    input
  );
}

export function projectRiskCenter(input: MissionControlProjectorInput) {
  return projectPanel("risk_center", "risk_center", "executive-command-center-v2", input);
}

export function projectInitiativeMonitor(input: MissionControlProjectorInput) {
  return projectPanel(
    "initiative_monitor",
    "initiative_monitor",
    "executive-command-center-v2",
    input
  );
}

export function projectOrganizationGraphViewer(input: MissionControlProjectorInput) {
  return projectPanel(
    "organization_graph_viewer",
    "organization_graph_viewer",
    "executive-command-center-v2",
    input
  );
}
