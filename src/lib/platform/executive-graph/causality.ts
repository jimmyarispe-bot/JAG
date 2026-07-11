/**
 * Executive Intelligence Graph — apply fired rules as typed edges.
 */

import { createEdge } from "@/lib/platform/executive-graph/edge";
import { createNode, nodeId, upsertNode } from "@/lib/platform/executive-graph/node";
import type {
  ExecutiveGraphEdge,
  ExecutiveGraphNode,
  ExecutiveGraphNodeType,
  ExecutiveGraphRuleResult,
} from "@/lib/platform/executive-graph/types";

/** Map logical keys used by rules onto node type + key. */
const KEY_NODE: Record<string, { type: ExecutiveGraphNodeType; key: string; label: string }> = {
  "kpi.admissions": { type: "KPI", key: "admissions", label: "Admissions Pipeline" },
  "kpi.enrollment": { type: "KPI", key: "enrollment", label: "Active Enrollment" },
  "kpi.student_attendance": {
    type: "KPI",
    key: "student_attendance",
    label: "Student Attendance",
  },
  "kpi.teacher_attendance": {
    type: "KPI",
    key: "teacher_attendance",
    label: "Teacher Attendance",
  },
  "financial.revenue": { type: "Financial", key: "revenue", label: "Monthly Revenue" },
  "financial.cash": { type: "Financial", key: "cash", label: "Cash Position" },
  "financial.collections": {
    type: "Financial",
    key: "collections",
    label: "Collections",
  },
  "tax.liability_risk": { type: "Tax", key: "liability_risk", label: "Tax Liability Risk" },
  "compliance.risk": { type: "Compliance", key: "risk", label: "Compliance Risk" },
  "lifecycle.student_success": {
    type: "Lifecycle",
    key: "student_success",
    label: "Student Success",
  },
  "alert.overdue_payroll": {
    type: "Alert",
    key: "overdue_payroll",
    label: "Overdue Payroll",
  },
  "health.score": { type: "HealthScore", key: "score", label: "Executive Health Score" },
};

function ensureKeyNode(
  map: Map<string, ExecutiveGraphNode>,
  logicalKey: string,
  at: string
): ExecutiveGraphNode {
  if (logicalKey.startsWith("health.contributor.")) {
    const domain = logicalKey.replace("health.contributor.", "");
    return upsertNode(
      map,
      createNode({
        type: "KPI",
        key: `health_contributor_${domain}`,
        label: `Health · ${domain}`,
        metadata: { logicalKey, domain },
        createdAt: at,
      })
    );
  }

  const def = KEY_NODE[logicalKey];
  if (def) {
    return upsertNode(
      map,
      createNode({
        type: def.type,
        key: def.key,
        label: def.label,
        metadata: { logicalKey },
        createdAt: at,
      })
    );
  }

  return upsertNode(
    map,
    createNode({
      type: "KPI",
      key: logicalKey.replace(/[^a-z0-9_]+/gi, "_"),
      label: logicalKey,
      metadata: { logicalKey },
      createdAt: at,
    })
  );
}

/**
 * Materialize edges (and any missing endpoint nodes) from fired rule results.
 */
export function applyCausalRules(
  nodeMap: Map<string, ExecutiveGraphNode>,
  rules: ExecutiveGraphRuleResult[],
  builtAt: string
): { edges: ExecutiveGraphEdge[]; nodesTouched: string[] } {
  const edges: ExecutiveGraphEdge[] = [];
  const nodesTouched: string[] = [];

  for (const rule of rules) {
    if (!rule.fired) continue;

    const source = ensureKeyNode(nodeMap, rule.sourceKey, builtAt);
    const target = ensureKeyNode(nodeMap, rule.targetKey, builtAt);
    nodesTouched.push(source.id, target.id);

    edges.push(
      createEdge({
        type: rule.edgeType,
        sourceId: source.id,
        targetId: target.id,
        confidence: rule.confidence,
        direction: rule.edgeType === "DECLINES"
  ? "negative"
  : rule.edgeType === "MEASURES"
    ? "neutral"
    : "positive",
        ruleId: rule.ruleId,
        evidence: rule.supportingEvidence,
        reason: rule.reason,
        at: builtAt,
        weight:
          rule.confidence === "High" ? 1 : rule.confidence === "Medium" ? 0.7 : 0.4,
      })
    );
  }

  return { edges, nodesTouched: [...new Set(nodesTouched)] };
}

export function resolveLogicalNodeId(logicalKey: string): string {
  if (logicalKey.startsWith("health.contributor.")) {
    const domain = logicalKey.replace("health.contributor.", "");
    return nodeId("KPI", `health_contributor_${domain}`);
  }
  const def = KEY_NODE[logicalKey];
  if (def) return nodeId(def.type, def.key);
  return nodeId("KPI", logicalKey.replace(/[^a-z0-9_]+/gi, "_"));
}
