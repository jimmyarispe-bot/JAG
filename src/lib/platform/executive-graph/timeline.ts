/**
 * Executive Intelligence Graph — chronological timeline from preloaded signals.
 */

import type { ExecutiveTrends } from "@/lib/executive/trends";
import type { ExecutiveHealthScore } from "@/lib/executive/health-score";
import type { ExecutiveAlert } from "@/lib/platform/executive-alerts";
import type { ExecutiveDecision } from "@/lib/platform/executive-decisions";
import type { MissionControlPriorityItem } from "@/lib/platform/automation/mission-control-compose";
import type { ActivityAlertLike } from "@/lib/platform/executive-alerts/adapters";
import { nodeId } from "@/lib/platform/executive-graph/node";
import type { ExecutiveGraphTimelineEvent } from "@/lib/platform/executive-graph/types";

export function buildExecutiveGraphTimeline(input: {
  builtAt: string;
  trends: ExecutiveTrends;
  health: ExecutiveHealthScore;
  alerts?: ExecutiveAlert[];
  decisions?: ExecutiveDecision[];
  missionControl?: MissionControlPriorityItem[];
  activity?: ActivityAlertLike[];
}): ExecutiveGraphTimelineEvent[] {
  const events: ExecutiveGraphTimelineEvent[] = [];

  for (const row of input.activity ?? []) {
    const at = row.occurred_at ?? row.created_at ?? input.builtAt;
    events.push({
      id: `activity:${row.id}`,
      at,
      kind: "activity",
      title: row.summary?.trim() || row.event_type || "Activity",
      summary: row.summary?.trim() || row.event_type || "Activity event",
      nodeId: nodeId("Activity", row.id),
      severity: row.classification ?? null,
      activityReferences: [row.id],
    });
  }

  for (const t of input.trends.metrics) {
    if (t.status === "UNCHANGED" || !t.sentence) continue;
    events.push({
      id: `trend:${t.metric}`,
      at: input.builtAt,
      kind: "trend",
      title: `${t.label} ${t.status.toLowerCase()}`,
      summary: t.sentence,
      nodeId: nodeId("Trend", t.metric),
      severity: t.status === "DECLINING" ? "high" : "info",
      activityReferences: [],
    });
  }

  events.push({
    id: "health:score",
    at: input.builtAt,
    kind: "health",
    title: `Health ${input.health.score}/100 (${input.health.grade})`,
    summary: `Organization health is ${input.health.status}.`,
    nodeId: nodeId("HealthScore", "score"),
    severity:
      input.health.status === "Critical"
        ? "critical"
        : input.health.status === "Needs Attention"
          ? "high"
          : "info",
    activityReferences: [],
  });

  for (const alert of input.alerts ?? []) {
    events.push({
      id: `alert:${alert.id}`,
      at: alert.createdAt || input.builtAt,
      kind: "alert",
      title: alert.title,
      summary: alert.description,
      nodeId: nodeId("Alert", alert.id),
      severity: alert.severity,
      activityReferences: alert.activityReferences ?? [],
    });
  }

  for (const decision of input.decisions ?? []) {
    events.push({
      id: `decision:${decision.id}`,
      at: decision.updatedAt || decision.createdAt || input.builtAt,
      kind: "decision",
      title: decision.title,
      summary: decision.summary,
      nodeId: nodeId("Decision", decision.id),
      severity: decision.severity,
      activityReferences: decision.relatedActivities ?? [],
    });
  }

  for (const item of input.missionControl ?? []) {
    events.push({
      id: `mc:${item.id}`,
      at: item.createdAt || input.builtAt,
      kind: "mission_control",
      title: item.title,
      summary: item.description,
      nodeId: nodeId("MissionControl", item.id),
      severity: item.severity,
      activityReferences: [],
    });
  }

  return events.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
}
