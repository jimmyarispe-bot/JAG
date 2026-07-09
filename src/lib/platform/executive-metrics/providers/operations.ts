import {
  buildMetric,
  statusFromHigherIsBetter,
  statusFromLowerIsBetter,
} from "@/lib/platform/executive-metrics/metric";
import type { ExecutiveMetric } from "@/lib/platform/executive-metrics/types";
import type { ExecutiveMetricsSourceBundle } from "@/lib/platform/executive-metrics/sources";

/** Operations domain — Mission Control, Scheduling, Operational Loop, Activity Engine. */
export function provideOperationsMetrics(sources: ExecutiveMetricsSourceBundle): ExecutiveMetric[] {
  const now = sources.loadedAt;
  const mc = sources.missionControl;
  const cc = sources.commandCenter;
  const scheduling = sources.scheduling;
  const loop = sources.operationalLoop;

  const openItems = mc?.openItems ?? cc?.missionControlOpen ?? null;
  const overdue = mc?.criticalCount ?? mc?.overdueTasks ?? cc?.missionControlCritical ?? null;
  const failedAutomations = mc?.failedAutomations ?? null;
  const openConflicts = scheduling?.openConflicts ?? null;
  const utilization = scheduling?.teacherUtilization ?? null;
  const failedTransitions = loop?.failedTransitions24h ?? null;
  const activityCount = sources.activityRecentCount;
  const upcomingCount = sources.founderOps?.upcomingClasses?.length ?? null;

  return [
    buildMetric({
      id: "operations.mission_control_open",
      name: "Mission Control Open Items",
      domain: "operations",
      source: "mission-control / command-center",
      value: openItems,
      unit: "count",
      zeroIsValid: true,
      confidence: openItems == null ? undefined : "High",
      status: statusFromLowerIsBetter(openItems, 5, 15, 30),
      lastUpdated: now,
    }),
    buildMetric({
      id: "operations.mission_control_overdue",
      name: "Mission Control Overdue",
      domain: "operations",
      source: "mission-control / command-center",
      value: overdue,
      unit: "count",
      zeroIsValid: true,
      confidence: overdue == null ? undefined : "High",
      status: statusFromLowerIsBetter(overdue, 0, 3, 8),
      lastUpdated: now,
    }),
    buildMetric({
      id: "operations.failed_automations",
      name: "Failed Automations",
      domain: "operations",
      source: "mission-control",
      value: failedAutomations,
      unit: "count",
      zeroIsValid: true,
      confidence: mc ? "High" : undefined,
      status: statusFromLowerIsBetter(failedAutomations, 0, 2, 5),
      lastUpdated: now,
    }),
    buildMetric({
      id: "operations.scheduling_conflicts",
      name: "Open Scheduling Conflicts",
      domain: "operations",
      source: "scheduling.queries",
      value: openConflicts,
      unit: "count",
      zeroIsValid: true,
      confidence: scheduling ? "High" : undefined,
      status: statusFromLowerIsBetter(openConflicts, 0, 2, 5),
      lastUpdated: now,
    }),
    buildMetric({
      id: "operations.teacher_utilization",
      name: "Teacher Utilization",
      domain: "operations",
      source: "scheduling.queries",
      value:
        scheduling == null || scheduling.sessionsThisWeek === 0 ? null : utilization,
      unit: "percent",
      zeroIsValid: true,
      confidence:
        scheduling == null || scheduling.sessionsThisWeek === 0 ? undefined : "Medium",
      status: statusFromHigherIsBetter(
        scheduling == null || scheduling.sessionsThisWeek === 0 ? null : utilization,
        70,
        50,
        30
      ),
      lastUpdated: now,
    }),
    buildMetric({
      id: "operations.loop_failed_transitions_24h",
      name: "Operational Loop Failures (24h)",
      domain: "operations",
      source: "operational-loop",
      value: failedTransitions,
      unit: "count",
      zeroIsValid: true,
      confidence: loop ? "High" : undefined,
      status: statusFromLowerIsBetter(failedTransitions, 0, 1, 3),
      lastUpdated: now,
    }),
    buildMetric({
      id: "operations.activity_feed_recent",
      name: "Recent Activity Events",
      domain: "operations",
      source: "activity-engine",
      value: activityCount,
      unit: "count",
      zeroIsValid: true,
      confidence: activityCount == null ? undefined : "Medium",
      lastUpdated: now,
    }),
    buildMetric({
      id: "operations.upcoming_classes",
      name: "Upcoming Classes",
      domain: "operations",
      source: "founder-ops.upcoming-classes",
      value: upcomingCount,
      unit: "count",
      zeroIsValid: true,
      confidence: sources.founderOps ? "High" : undefined,
      lastUpdated: now,
    }),
  ];
}
