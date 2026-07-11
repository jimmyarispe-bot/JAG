/**
 * Executive Intelligence Graph — buildExecutiveGraph().
 * Consumes ONLY preloaded KPIs, trends, health, alerts, decisions, MC, activity.
 * Zero database queries / zero duplicate calculations.
 */

import { applyCausalRules } from "@/lib/platform/executive-graph/causality";
import { createEdge } from "@/lib/platform/executive-graph/edge";
import { buildExecutiveGraphInsights } from "@/lib/platform/executive-graph/insights";
import { createNode, upsertNode } from "@/lib/platform/executive-graph/node";
import { evaluateExecutiveGraphRules } from "@/lib/platform/executive-graph/rules";
import { buildExecutiveGraphTimeline } from "@/lib/platform/executive-graph/timeline";
import type {
  BuildExecutiveGraphInput,
  ExecutiveGraph,
  ExecutiveGraphScope,
} from "@/lib/platform/executive-graph/types";

function resolveScope(input: BuildExecutiveGraphInput): ExecutiveGraphScope {
  return {
    organizationId: input.scope?.organizationId ?? null,
    regionId: input.scope?.regionId ?? null,
    schoolId: input.scope?.schoolId ?? null,
    campusId: input.scope?.campusId ?? null,
    program: input.scope?.program ?? null,
  };
}

/**
 * Build the in-memory Executive Intelligence Graph from preloaded services.
 */
export function buildExecutiveGraph(input: BuildExecutiveGraphInput): ExecutiveGraph {
  const builtAt = input.builtAt ?? new Date().toISOString();
  const scope = resolveScope(input);
  const nodeMap = new Map(
    [] as Array<[string, ReturnType<typeof createNode>]>
  );

  // --- Scope hierarchy nodes ---
  if (scope.organizationId) {
    upsertNode(
      nodeMap,
      createNode({
        type: "Organization",
        key: scope.organizationId,
        label: "Organization",
        metadata: { organizationId: scope.organizationId },
        createdAt: builtAt,
      })
    );
  }
  if (scope.regionId) {
    upsertNode(
      nodeMap,
      createNode({
        type: "Region",
        key: scope.regionId,
        label: "Region",
        metadata: { regionId: scope.regionId },
        createdAt: builtAt,
      })
    );
  }
  if (scope.schoolId) {
    upsertNode(
      nodeMap,
      createNode({
        type: "School",
        key: scope.schoolId,
        label: "School",
        metadata: { schoolId: scope.schoolId },
        createdAt: builtAt,
      })
    );
  }
  if (scope.campusId) {
    upsertNode(
      nodeMap,
      createNode({
        type: "Campus",
        key: scope.campusId,
        label: "Campus",
        metadata: { campusId: scope.campusId },
        createdAt: builtAt,
      })
    );
  }

  // --- KPI nodes ---
  const kpiDefs: Array<{ key: string; label: string; value: number }> = [
    { key: "enrollment", label: "Active Enrollment", value: input.kpis.enrollment },
    { key: "admissions", label: "Admissions Pipeline", value: input.kpis.admissions },
    { key: "revenue", label: "Monthly Revenue", value: input.kpis.revenue },
    { key: "outstanding", label: "Tuition Outstanding", value: input.kpis.outstanding },
    { key: "staff", label: "Staff Count", value: input.kpis.staff },
    {
      key: "teacher_attendance",
      label: "Teacher Attendance",
      value: input.kpis.teacherAttendance,
    },
    {
      key: "student_attendance",
      label: "Student Attendance",
      value: input.kpis.studentAttendance,
    },
  ];
  for (const k of kpiDefs) {
    upsertNode(
      nodeMap,
      createNode({
        type: "KPI",
        key: k.key,
        label: k.label,
        value: k.value,
        metadata: { logicalKey: `kpi.${k.key}` },
        createdAt: builtAt,
      })
    );
  }

  // --- Trend nodes ---
  for (const t of input.trends.metrics) {
    upsertNode(
      nodeMap,
      createNode({
        type: "Trend",
        key: t.metric,
        label: `${t.label} Trend`,
        value: t.deltaPercent ?? t.delta,
        status: t.status,
        metadata: {
          direction: t.trendDirection,
          sentence: t.sentence,
          current: t.current,
          previous: t.previous,
        },
        createdAt: builtAt,
      })
    );
  }

  // --- Health score node ---
  upsertNode(
    nodeMap,
    createNode({
      type: "HealthScore",
      key: "score",
      label: "Executive Health Score",
      value: input.health.score,
      status: input.health.status,
      metadata: {
        grade: input.health.grade,
        strengths: input.health.strengths,
        risks: input.health.risks,
        logicalKey: "health.score",
      },
      createdAt: builtAt,
    })
  );

  // --- Financial / collections / cash structural nodes ---
  upsertNode(
    nodeMap,
    createNode({
      type: "Financial",
      key: "revenue",
      label: "Monthly Revenue",
      value: input.kpis.revenue,
      metadata: { logicalKey: "financial.revenue" },
      createdAt: builtAt,
    })
  );
  upsertNode(
    nodeMap,
    createNode({
      type: "Financial",
      key: "collections",
      label: "Collections",
      value: input.kpis.outstanding,
      metadata: { logicalKey: "financial.collections", outstanding: input.kpis.outstanding },
      createdAt: builtAt,
    })
  );
  upsertNode(
    nodeMap,
    createNode({
      type: "Financial",
      key: "cash",
      label: "Cash Position",
      metadata: { logicalKey: "financial.cash" },
      createdAt: builtAt,
    })
  );

  // --- Platform alerts ---
  for (const alert of input.alerts ?? []) {
    upsertNode(
      nodeMap,
      createNode({
        type: "Alert",
        key: alert.id,
        label: alert.title,
        status: alert.severity,
        metadata: {
          body: alert.description,
          category: alert.category,
          signalKey: alert.signalKey,
          activityReferences: alert.activityReferences,
        },
        createdAt: alert.createdAt,
      })
    );
  }

  // --- KPI threshold alerts ---
  for (const alert of input.kpis.alerts) {
    upsertNode(
      nodeMap,
      createNode({
        type: "Alert",
        key: alert.id,
        label: alert.title,
        status: alert.severity,
        value: alert.count,
        metadata: { body: alert.body, type: alert.type, source: "kpi" },
        createdAt: builtAt,
      })
    );
  }

  // --- Decisions ---
  for (const decision of input.decisions ?? []) {
    upsertNode(
      nodeMap,
      createNode({
        type: "Decision",
        key: decision.id,
        label: decision.title,
        status: decision.status,
        metadata: {
          summary: decision.summary,
          decisionType: decision.decisionType,
          relatedAlerts: decision.relatedAlerts,
        },
        createdAt: decision.createdAt,
      })
    );
  }

  // --- Mission Control ---
  for (const item of input.missionControl ?? []) {
    upsertNode(
      nodeMap,
      createNode({
        type: "MissionControl",
        key: item.id,
        label: item.title,
        status: item.severity,
        metadata: { description: item.description, href: item.href, source: item.source },
        createdAt: item.createdAt ?? builtAt,
      })
    );
  }

  // --- Activity ---
  for (const event of input.activity ?? []) {
    upsertNode(
      nodeMap,
      createNode({
        type: "Activity",
        key: event.id,
        label: event.summary?.trim() || event.event_type || "Activity",
        status: event.classification ?? null,
        metadata: {
          module_key: event.module_key,
          event_type: event.event_type,
          entity_type: event.entity_type,
          entity_id: event.entity_id,
        },
        createdAt: event.occurred_at ?? event.created_at ?? builtAt,
      })
    );
  }

  // --- Causal rules → edges ---
  const rulesFired = evaluateExecutiveGraphRules({
    kpis: input.kpis,
    trends: input.trends,
    health: input.health,
    builtAt,
  });
  const { edges: causalEdges } = applyCausalRules(nodeMap, rulesFired, builtAt);
  const edges = [...causalEdges];

  // Link decisions → related alerts (SUPPORTS / DEPENDS_ON)
  for (const decision of input.decisions ?? []) {
    const decisionNode = nodeMap.get(`Decision:${decision.id}`);
    if (!decisionNode) continue;
    for (const alertId of decision.relatedAlerts ?? []) {
      const alertNode = nodeMap.get(`Alert:${alertId}`);
      if (!alertNode) continue;
      edges.push(
        createEdge({
          type: "DEPENDS_ON",
          sourceId: decisionNode.id,
          targetId: alertNode.id,
          confidence: "High",
          ruleId: "eig.decision_depends_on_alert",
          reason: "Decision depends on related executive alert.",
          evidence: [{ label: decision.title, sourceId: decision.id, sourceKind: "decision" }],
          activityReferences: decision.relatedActivities ?? [],
          at: builtAt,
        })
      );
    }
  }

  // Link alerts → activity references
  for (const alert of input.alerts ?? []) {
    const alertNode = nodeMap.get(`Alert:${alert.id}`);
    if (!alertNode) continue;
    for (const activityId of alert.activityReferences ?? []) {
      const activityNode = nodeMap.get(`Activity:${activityId}`);
      if (!activityNode) continue;
      edges.push(
        createEdge({
          type: "GENERATES",
          sourceId: activityNode.id,
          targetId: alertNode.id,
          confidence: "Medium",
          ruleId: "eig.activity_generates_alert",
          reason: "Activity event generated or corroborates alert.",
          evidence: [{ label: alert.title, sourceId: alert.id, sourceKind: "alert" }],
          activityReferences: [activityId],
          at: builtAt,
        })
      );
    }
  }

  // BELONGS_TO school hierarchy
  if (scope.schoolId && scope.organizationId) {
    const school = nodeMap.get(`School:${scope.schoolId}`);
    const org = nodeMap.get(`Organization:${scope.organizationId}`);
    if (school && org) {
      edges.push(
        createEdge({
          type: "BELONGS_TO",
          sourceId: school.id,
          targetId: org.id,
          confidence: "High",
          ruleId: "eig.school_belongs_to_org",
          reason: "School belongs to organization.",
          at: builtAt,
        })
      );
    }
  }

  const nodes = [...nodeMap.values()];
  const insights = buildExecutiveGraphInsights({
    nodes,
    edges,
    trends: input.trends,
    health: input.health,
  });
  const timeline = buildExecutiveGraphTimeline({
    builtAt,
    trends: input.trends,
    health: input.health,
    alerts: input.alerts,
    decisions: input.decisions,
    missionControl: input.missionControl,
    activity: input.activity,
  });

  return {
    builtAt,
    scope,
    nodes,
    edges,
    insights,
    timeline,
    rulesFired,
  };
}
