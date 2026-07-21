import type { StudioWorkflowDefinition } from "@/lib/platform/workflows/types";
import { STUDIO_NODE_TYPES } from "@/lib/platform/workflows/types";

export type StudioValidationIssue = {
  severity: "error" | "warning";
  code: string;
  message: string;
  nodeId?: string;
};

export type StudioValidationResult = {
  valid: boolean;
  issues: StudioValidationIssue[];
};

export function validateStudioWorkflow(
  workflow: StudioWorkflowDefinition
): StudioValidationResult {
  const issues: StudioValidationIssue[] = [];
  const nodeIds = new Set(workflow.nodes.map((n) => n.id));

  if (!workflow.nodes.length) {
    issues.push({
      severity: "error",
      code: "empty_graph",
      message: "Workflow has no nodes",
    });
  }

  if (!nodeIds.has(workflow.entryNodeId)) {
    issues.push({
      severity: "error",
      code: "bad_entry",
      message: `Entry node ${workflow.entryNodeId} not found`,
      nodeId: workflow.entryNodeId,
    });
  }

  const triggers = workflow.nodes.filter((n) => n.type === "trigger");
  if (triggers.length === 0) {
    issues.push({
      severity: "error",
      code: "missing_trigger",
      message: "Workflow requires at least one Trigger node",
    });
  }

  const entry = workflow.nodes.find((n) => n.id === workflow.entryNodeId);
  if (entry && entry.type !== "trigger") {
    issues.push({
      severity: "warning",
      code: "entry_not_trigger",
      message: "Entry node should usually be a Trigger",
      nodeId: entry.id,
    });
  }

  for (const node of workflow.nodes) {
    if (!STUDIO_NODE_TYPES.includes(node.type)) {
      issues.push({
        severity: "error",
        code: "unknown_type",
        message: `Unknown node type ${node.type}`,
        nodeId: node.id,
      });
    }
    if (node.type === "approval" && node.config.requireHuman !== true) {
      issues.push({
        severity: "error",
        code: "approval_must_be_human",
        message: "Approval nodes must require human decision",
        nodeId: node.id,
      });
    }
    if (node.type === "ai_step" && node.config.softReadOnly !== true) {
      issues.push({
        severity: "error",
        code: "ai_must_soft_read",
        message: "AI Step must be soft-read only",
        nodeId: node.id,
      });
    }
    if (
      node.type === "integration" &&
      node.config.mode !== "soft_read" &&
      node.config.mode !== "sync"
    ) {
      issues.push({
        severity: "error",
        code: "bad_integration_mode",
        message: "Integration mode must be soft_read or sync",
        nodeId: node.id,
      });
    }
  }

  for (const edge of workflow.edges) {
    if (!nodeIds.has(edge.from)) {
      issues.push({
        severity: "error",
        code: "bad_edge_from",
        message: `Edge ${edge.id} from unknown node ${edge.from}`,
      });
    }
    if (!nodeIds.has(edge.to)) {
      issues.push({
        severity: "error",
        code: "bad_edge_to",
        message: `Edge ${edge.id} to unknown node ${edge.to}`,
      });
    }
  }

  // Reachability from entry
  const adj = new Map<string, string[]>();
  for (const e of workflow.edges) {
    const list = adj.get(e.from) ?? [];
    list.push(e.to);
    adj.set(e.from, list);
  }
  const seen = new Set<string>();
  const stack = [workflow.entryNodeId];
  while (stack.length) {
    const id = stack.pop()!;
    if (seen.has(id)) continue;
    seen.add(id);
    for (const next of adj.get(id) ?? []) stack.push(next);
  }
  for (const node of workflow.nodes) {
    if (!seen.has(node.id)) {
      issues.push({
        severity: "warning",
        code: "unreachable",
        message: `Node ${node.label} (${node.id}) is unreachable from entry`,
        nodeId: node.id,
      });
    }
  }

  return {
    valid: !issues.some((i) => i.severity === "error"),
    issues,
  };
}
