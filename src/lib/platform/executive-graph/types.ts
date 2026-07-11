/**
 * Executive Intelligence Graph (EIG) — Sprint 004 Phase 1 foundation types.
 * In-memory only — no DB, no AI, no UI.
 */

import type { ExecutiveKPIs } from "@/lib/executive/kpis";
import type { ExecutiveTrends } from "@/lib/executive/trends";
import type { ExecutiveHealthScore } from "@/lib/executive/health-score";
import type { ExecutiveAlert } from "@/lib/platform/executive-alerts";
import type { ExecutiveDecision } from "@/lib/platform/executive-decisions";
import type { MissionControlPriorityItem } from "@/lib/platform/automation/mission-control-compose";
import type { ActivityAlertLike } from "@/lib/platform/executive-alerts/adapters";

export const EXECUTIVE_GRAPH_NODE_TYPES = [
  "Organization",
  "Region",
  "School",
  "Campus",
  "Department",
  "Program",
  "Employee",
  "Vendor",
  "Contractor",
  "Student",
  "Family",
  "Grant",
  "Contract",
  "Budget",
  "KPI",
  "Trend",
  "HealthScore",
  "Alert",
  "Decision",
  "Workflow",
  "MissionControl",
  "Activity",
  "Financial",
  "Tax",
  "Compliance",
  "Lifecycle",
] as const;

export type ExecutiveGraphNodeType = (typeof EXECUTIVE_GRAPH_NODE_TYPES)[number];

export const EXECUTIVE_GRAPH_EDGE_TYPES = [
  "CAUSES",
  "CONTRIBUTES_TO",
  "DEPENDS_ON",
  "BLOCKS",
  "SUPPORTS",
  "BELONGS_TO",
  "FUNDS",
  "REPORTS_TO",
  "PAYS",
  "COLLECTS",
  "USES",
  "OWNS",
  "GENERATES",
  "MEASURES",
  "IMPROVES",
  "DECLINES",
] as const;

export type ExecutiveGraphEdgeType = (typeof EXECUTIVE_GRAPH_EDGE_TYPES)[number];

export type ExecutiveGraphConfidence = "High" | "Medium" | "Low" | "Unknown";

export interface ExecutiveGraphEvidence {
  label: string;
  detail?: string;
  sourceId?: string;
  sourceKind?: string;
  value?: number | string | null;
}

export interface ExecutiveGraphNode {
  id: string;
  type: ExecutiveGraphNodeType;
  label: string;
  /** Stable logical key (e.g. kpi.enrollment, financial.cash). */
  key: string;
  value?: number | string | null;
  status?: string | null;
  metadata: Record<string, unknown>;
  createdAt?: string | null;
}

export interface ExecutiveGraphEdge {
  id: string;
  type: ExecutiveGraphEdgeType;
  sourceId: string;
  targetId: string;
  confidence: ExecutiveGraphConfidence;
  ruleId: string;
  evidence: ExecutiveGraphEvidence[];
  direction?: "positive" | "negative" | "neutral";
  activityReferences: string[];
  createdAt: string;
  updatedAt: string;
  weight?: number;
  reason?: string;
}

export interface ExecutiveGraphRuleResult {
  ruleId: string;
  reason: string;
  confidence: ExecutiveGraphConfidence;
  supportingEvidence: ExecutiveGraphEvidence[];
  edgeType: ExecutiveGraphEdgeType;
  sourceKey: string;
  targetKey: string;
  fired: boolean;
}

export interface ExecutiveGraphInsightBucket {
  id: string;
  title: string;
  summary: string;
  nodeIds: string[];
  confidence: ExecutiveGraphConfidence;
  score: number;
}

export interface ExecutiveGraphInsights {
  topPositiveDrivers: ExecutiveGraphInsightBucket[];
  topNegativeDrivers: ExecutiveGraphInsightBucket[];
  rootCauses: ExecutiveGraphInsightBucket[];
  emergingRisks: ExecutiveGraphInsightBucket[];
  strategicOpportunities: ExecutiveGraphInsightBucket[];
}

export interface ExecutiveGraphTimelineEvent {
  id: string;
  at: string;
  kind: "activity" | "trend" | "health" | "alert" | "decision" | "mission_control";
  title: string;
  summary: string;
  nodeId: string | null;
  severity: string | null;
  activityReferences: string[];
}

export interface ExecutiveGraphScope {
  organizationId: string | null;
  regionId: string | null;
  schoolId: string | null;
  campusId: string | null;
  program: string | null;
}

export interface ExecutiveGraph {
  builtAt: string;
  scope: ExecutiveGraphScope;
  nodes: ExecutiveGraphNode[];
  edges: ExecutiveGraphEdge[];
  insights: ExecutiveGraphInsights;
  timeline: ExecutiveGraphTimelineEvent[];
  rulesFired: ExecutiveGraphRuleResult[];
}

export interface BuildExecutiveGraphInput {
  builtAt?: string;
  scope?: Partial<ExecutiveGraphScope>;
  /** Live Sprint 003 KPIs (required). */
  kpis: ExecutiveKPIs;
  /** Pre-computed trends (required — no recalculation inside builder). */
  trends: ExecutiveTrends;
  /** Pre-computed health score (required). */
  health: ExecutiveHealthScore;
  /** Platform executive alerts (optional). */
  alerts?: ExecutiveAlert[];
  /** Decision queue items (optional). */
  decisions?: ExecutiveDecision[];
  /** Mission Control critical/priority items (optional). */
  missionControl?: MissionControlPriorityItem[];
  /** Activity Engine events already loaded (optional). */
  activity?: ActivityAlertLike[];
}

export interface ExplainNodeResult {
  nodeId: string;
  node: ExecutiveGraphNode | null;
  immediateCauses: ExecutiveGraphNode[];
  immediateImpacts: ExecutiveGraphNode[];
  supportingEvidence: ExecutiveGraphEvidence[];
  confidence: ExecutiveGraphConfidence;
  explanation: string;
  edgesIn: ExecutiveGraphEdge[];
  edgesOut: ExecutiveGraphEdge[];
}
