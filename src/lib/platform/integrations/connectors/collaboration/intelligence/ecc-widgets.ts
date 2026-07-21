/**
 * Collaboration ECC widget data (Sprint 076 + RC-3.02).
 * Communication Health · Collaboration Heatmap · Meeting Load (+ response/teams).
 */

import {
  buildCommunicationGraph,
  type CommunicationGraph,
} from "@/lib/platform/integrations/connectors/collaboration/intelligence/communication-graph";
import type { CollaborationExecutiveAlert } from "@/lib/platform/integrations/connectors/collaboration/intelligence/executive-alerts";

export type CommunicationHealthWidget = {
  kind: "communication_health";
  title: string;
  score: number;
  siloCount: number;
  bottleneckCount: number;
  alertCount: number;
  explainability: string;
  alerts: CollaborationExecutiveAlert[];
};

export type ResponseTimeWidget = {
  kind: "response_time";
  title: string;
  avgResponseMinutes: number;
  channels: Array<{ label: string; avgMinutes: number; severity: string }>;
};

export type ActiveTeamsWidget = {
  kind: "active_teams";
  title: string;
  activeTeams: number;
  teams: Array<{ label: string; density: number; messageCount: number }>;
};

export type MeetingLoadWidget = {
  kind: "meeting_load";
  title: string;
  meetingLoadMinutes: number;
  meetingCount: number;
  meetingDensityScore: number;
  severity: "low" | "medium" | "high";
};

/** RC-3.02 — department × partner collaboration intensity. */
export type CollaborationHeatmapWidget = {
  kind: "collaboration_heatmap";
  title: string;
  cells: Array<{
    row: string;
    column: string;
    value: number;
    messageCount: number;
  }>;
  rows: string[];
  columns: string[];
};

export type CollaborationEccWidgets = {
  communicationHealth: CommunicationHealthWidget;
  responseTime: ResponseTimeWidget;
  activeTeams: ActiveTeamsWidget;
  meetingLoad: MeetingLoadWidget;
  collaborationHeatmap: CollaborationHeatmapWidget;
  graph: CommunicationGraph;
};

export function buildCollaborationEccWidgets(
  organizationId: string
): CollaborationEccWidgets | null {
  const graph = buildCommunicationGraph(organizationId);
  if (!graph) return null;

  const meetingCount = graph.nodes.filter((n) => n.kind === "Meeting").length;
  const meetingSeverity: MeetingLoadWidget["severity"] =
    graph.scores.meetingLoadMinutes >= 120
      ? "high"
      : graph.scores.meetingLoadMinutes >= 60
        ? "medium"
        : "low";

  const departments = [
    ...new Set(
      graph.departmentInteraction.flatMap((d) => [d.fromDepartment, d.toDepartment])
    ),
  ].sort();

  const cells = graph.departmentInteraction.map((d) => ({
    row: d.fromDepartment,
    column: d.toDepartment,
    value: d.strength,
    messageCount: d.messageCount,
  }));

  // Also project channel density into heatmap when department matrix is thin.
  if (cells.length === 0) {
    for (const dens of graph.collaborationDensity.slice(0, 8)) {
      cells.push({
        row: dens.label,
        column: "org",
        value: dens.density,
        messageCount: dens.messageCount,
      });
    }
  }

  const alertSummary =
    graph.executiveAlerts.find((a) => a.severity === "high") ??
    graph.executiveAlerts[0];

  return {
    graph,
    communicationHealth: {
      kind: "communication_health",
      title: "Communication Health",
      score: graph.scores.communicationHealth,
      siloCount: graph.silos.length,
      bottleneckCount: graph.bottlenecks.length,
      alertCount: graph.executiveAlerts.length,
      explainability:
        alertSummary?.explainability ??
        graph.bottlenecks[0]?.explainability ??
        "Collaboration signals look balanced across connected platforms.",
      alerts: graph.executiveAlerts.slice(0, 8),
    },
    responseTime: {
      kind: "response_time",
      title: "Response Time",
      avgResponseMinutes: graph.scores.avgResponseMinutes,
      channels: graph.responseLatency.map((r) => ({
        label: r.label,
        avgMinutes: r.avgResponseLatencyMinutes,
        severity: r.severity,
      })),
    },
    activeTeams: {
      kind: "active_teams",
      title: "Active Teams",
      activeTeams: graph.scores.activeTeams,
      teams: graph.collaborationDensity
        .slice()
        .sort((a, b) => b.messageCount - a.messageCount)
        .slice(0, 6)
        .map((d) => ({
          label: d.label,
          density: d.density,
          messageCount: d.messageCount,
        })),
    },
    meetingLoad: {
      kind: "meeting_load",
      title: "Meeting Load",
      meetingLoadMinutes: graph.scores.meetingLoadMinutes,
      meetingCount,
      meetingDensityScore: graph.scores.meetingDensityScore,
      severity: meetingSeverity,
    },
    collaborationHeatmap: {
      kind: "collaboration_heatmap",
      title: "Collaboration Heatmap",
      cells,
      rows: departments.length
        ? departments
        : [...new Set(cells.map((c) => c.row))],
      columns: departments.length
        ? departments
        : [...new Set(cells.map((c) => c.column))],
    },
  };
}
