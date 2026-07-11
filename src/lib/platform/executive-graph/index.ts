/** Executive Intelligence Graph — Sprint 004 Phase 1 public API */

export type {
  BuildExecutiveGraphInput,
  ExecutiveGraph,
  ExecutiveGraphConfidence,
  ExecutiveGraphEdge,
  ExecutiveGraphEdgeType,
  ExecutiveGraphEvidence,
  ExecutiveGraphInsightBucket,
  ExecutiveGraphInsights,
  ExecutiveGraphNode,
  ExecutiveGraphNodeType,
  ExecutiveGraphRuleResult,
  ExecutiveGraphScope,
  ExecutiveGraphTimelineEvent,
  ExplainNodeResult,
} from "@/lib/platform/executive-graph/types";

export {
  EXECUTIVE_GRAPH_EDGE_TYPES,
  EXECUTIVE_GRAPH_NODE_TYPES,
} from "@/lib/platform/executive-graph/types";

export { buildExecutiveGraph } from "@/lib/platform/executive-graph/builder";
export { explainNode } from "@/lib/platform/executive-graph/explain";
export {
  createNode,
  getNodeByKey,
  nodeId,
  upsertNode,
} from "@/lib/platform/executive-graph/node";
export {
  confidenceRank,
  createEdge,
  maxConfidence,
  resetEdgeSeqForTests,
} from "@/lib/platform/executive-graph/edge";
export { applyCausalRules, resolveLogicalNodeId } from "@/lib/platform/executive-graph/causality";
export {
  evaluateExecutiveGraphRules,
  ruleAdmissionsToEnrollment,
  ruleAttendanceToStudentSuccess,
  ruleCashToTaxRisk,
  ruleCollectionsToCash,
  ruleEnrollmentToRevenue,
  rulePayrollToCompliance,
  ruleRevenueToCash,
} from "@/lib/platform/executive-graph/rules";
export { buildExecutiveGraphInsights } from "@/lib/platform/executive-graph/insights";
export { buildExecutiveGraphTimeline } from "@/lib/platform/executive-graph/timeline";
