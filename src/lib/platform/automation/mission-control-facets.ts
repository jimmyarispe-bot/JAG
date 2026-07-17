/**
 * Mission Control facet helpers (Phase B / H-A12).
 * Pure composition helpers — no product behavior changes.
 */

import type { getMissionControlFeed } from "@/lib/platform/automation/mission-control";
import type { PlatformActivityEvent } from "@/lib/platform/activity/types";
import type { resolveExecutiveJagWork } from "@/lib/platform/jag-work/resolve-executive-work";
import type { getLatestScorecard } from "@/lib/edi/scorecard";
import type { getExecutiveInsights } from "@/lib/executive/command-center";
import type { getLatestBriefings } from "@/lib/edi/briefings";
import type { OperationalLoopSummary } from "@/lib/platform/operational-loop/types";
import type {
  MissionControlAiBrief,
  MissionControlCommandCenter,
  MissionControlOeiDimension,
} from "@/lib/platform/automation/mission-control-types";

export function mapMcSeverity(severity: string): "critical" | "high" | "medium" | "low" {
  if (severity === "critical") return "critical";
  if (severity === "high") return "high";
  if (severity === "low") return "low";
  return "medium";
}

export function buildPriorities(
  feed: Awaited<ReturnType<typeof getMissionControlFeed>>,
  jagWorkItems: ReturnType<typeof resolveExecutiveJagWork>["allItems"]
): MissionControlCommandCenter["priorities"] {
  const buckets: MissionControlCommandCenter["priorities"] = {
    critical: [],
    high: [],
    medium: [],
    low: [],
  };

  for (const item of feed) {
    const severity = mapMcSeverity(item.severity ?? "normal");
    buckets[severity].push({
      id: item.id,
      title: item.title,
      description: item.body ?? "",
      severity,
      href: item.href,
      source: "mission_control",
      module: item.module,
      entityType: item.entity_type,
      entityId: item.entity_id,
      createdAt: item.created_at,
    });
  }

  for (const work of jagWorkItems) {
    const severity =
      work.priority === "critical"
        ? "critical"
        : work.priority === "high"
          ? "high"
          : work.priority === "low"
            ? "low"
            : "medium";
    buckets[severity].push({
      id: work.id,
      title: work.title,
      description: work.description ?? "",
      severity,
      href: work.href ?? null,
      source: "jag_work",
      entityType: work.entityType ?? null,
      entityId: work.entityId ?? null,
    });
  }

  for (const key of Object.keys(buckets) as Array<keyof typeof buckets>) {
    buckets[key].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }

  return buckets;
}

export function countAttention(feed: Awaited<ReturnType<typeof getMissionControlFeed>>) {
  let students = 0;
  let families = 0;
  let teachers = 0;
  let staffing = 0;
  let scheduling = 0;

  for (const item of feed) {
    if (
      item.module === "sis" ||
      item.item_type === "escalation" ||
      item.entity_type === "students" ||
      item.entity_type === "student"
    ) {
      students += 1;
    }
    if (item.module === "parent_portal" || item.entity_type === "families") families += 1;
    if (
      item.module === "teacher_portal" ||
      item.item_type === "teacher_compliance_alert"
    ) {
      teachers += 1;
    }
    if (item.module === "hr" || item.item_type === "hr_alert") staffing += 1;
    if (item.module === "scheduling" || item.item_type === "scheduling_alert") scheduling += 1;
  }

  return { students, families, teachers, staffing, scheduling };
}

export function buildOei(scorecard: Awaited<ReturnType<typeof getLatestScorecard>>): {
  index: number;
  dimensions: MissionControlOeiDimension[];
} {
  const dimensions: MissionControlOeiDimension[] = [
    { key: "learning", label: "Learning", score: scorecard.studentSuccess },
    { key: "operations", label: "Operations", score: scorecard.operationalEfficiency },
    { key: "finance", label: "Finance", score: scorecard.financialHealth },
    { key: "people", label: "People", score: Math.round((scorecard.teacherEffectiveness + scorecard.capacity) / 2) },
    { key: "family", label: "Family Experience", score: scorecard.parentEngagement },
    { key: "compliance", label: "Compliance", score: scorecard.compliance },
    { key: "growth", label: "Growth", score: scorecard.growth },
  ];
  const index = Math.round(dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length);
  return { index, dimensions };
}

export function buildActivityHref(event: PlatformActivityEvent): string | null {
  if (event.entity_type === "students" || event.student_id) {
    return `/dashboard/students/${event.student_id ?? event.entity_id}`;
  }
  if (event.entity_type === "admissions_leads" || event.entity_type === "admissions_lead") {
    return `/dashboard/admissions/leads/${event.entity_id}`;
  }
  if (event.entity_type === "instructional_sessions") {
    return `/dashboard/teacher/sessions/${event.entity_id}`;
  }
  if (event.entity_type === "families") {
    return `/dashboard/families/${event.entity_id}`;
  }
  if (event.entity_type === "employees") {
    return `/dashboard/hr/employees/${event.entity_id}`;
  }
  return null;
}

export function buildAiBrief(
  insights: Awaited<ReturnType<typeof getExecutiveInsights>>,
  briefings: Awaited<ReturnType<typeof getLatestBriefings>>,
  loopSummary: OperationalLoopSummary
): MissionControlAiBrief {
  const riskBrief = briefings.find((b) => b.briefing_type === "risks");
  const oppBrief = briefings.find((b) => b.briefing_type === "opportunities");

  const highestRisks = insights
    .filter((i) => i.severity === "critical" || i.severity === "high")
    .slice(0, 5)
    .map((i) => ({ id: i.id, title: i.title, body: i.body, href: i.href }));

  const opportunities = insights
    .filter((i) => i.insight_type === "opportunity" || i.insight_type === "growth")
    .slice(0, 5)
    .map((i) => ({ id: i.id, title: i.title, body: i.body, href: i.href }));

  const recommendedActions = insights
    .filter((i) => i.recommended_action)
    .slice(0, 6)
    .map((i) => ({
      id: i.id,
      title: i.title,
      action: i.recommended_action!,
      href: i.href,
    }));

  const projectedProblems: MissionControlAiBrief["projectedProblems"] = [
    {
      horizon: "7d",
      items: [
        ...(loopSummary.failedTransitions24h > 0
          ? [`${loopSummary.failedTransitions24h} operational loop transition failure(s) in 24h`]
          : []),
        ...(loopSummary.openGaps > 0
          ? [`${loopSummary.openGaps} student handoff gap(s) across active enrollments`]
          : []),
        ...highestRisks.slice(0, 2).map((r) => r.title),
      ],
    },
    {
      horizon: "30d",
      items: opportunities.slice(0, 3).map((o) => o.title),
    },
    {
      horizon: "90d",
      items: recommendedActions.slice(0, 3).map((a) => a.title),
    },
  ];

  return {
    executiveBrief:
      (riskBrief?.summary as string | null) ??
      (highestRisks[0] ? `${highestRisks[0].title}: ${highestRisks[0].body}` : null) ??
      (oppBrief?.summary as string | null) ??
      null,
    highestRisks,
    opportunities,
    recommendedActions,
    projectedProblems,
  };
}
