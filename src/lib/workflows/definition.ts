import type {
  WorkflowDefinitionJson,
  WorkflowEdge,
  WorkflowNode,
} from "./types";

export function emptyDefinition(triggerKey: string): WorkflowDefinitionJson {
  const triggerId = "node-trigger";
  const endId = "node-end";
  return {
    version: "1.0",
    entryNodeId: triggerId,
    nodes: [
      {
        id: triggerId,
        type: "trigger",
        label: "Trigger",
        position: { x: 80, y: 120 },
        config: { triggerKey },
      },
      {
        id: endId,
        type: "end",
        label: "End",
        position: { x: 480, y: 120 },
        config: {},
      },
    ],
    edges: [{ id: "e-trigger-end", from: triggerId, to: endId, branch: "default" }],
    conditionGroups: [],
  };
}

export function createNode(
  type: WorkflowNode["type"],
  label: string,
  config: Record<string, unknown> = {},
  id?: string
): WorkflowNode {
  return {
    id: id ?? `node-${type}-${Math.random().toString(36).slice(2, 9)}`,
    type,
    label,
    position: { x: 200, y: 120 },
    config,
  };
}

export function createEdge(
  from: string,
  to: string,
  branch: WorkflowEdge["branch"] = "default"
): WorkflowEdge {
  return {
    id: `e-${from}-${to}-${branch}`,
    from,
    to,
    branch,
  };
}

export function nextNodes(
  definition: WorkflowDefinitionJson,
  fromId: string,
  branch: string = "default"
): WorkflowNode[] {
  const edges = definition.edges.filter((e) => {
    if (e.from !== fromId) return false;
    if (!e.branch || e.branch === "default") return branch === "default" || branch === "true";
    return e.branch === branch;
  });
  // Prefer exact branch match; fall back to default
  let matched = edges.filter((e) => e.branch === branch);
  if (!matched.length) {
    matched = edges.filter((e) => !e.branch || e.branch === "default");
  }
  return matched
    .map((e) => definition.nodes.find((n) => n.id === e.to))
    .filter((n): n is WorkflowNode => Boolean(n));
}

export function validateDefinition(
  definition: WorkflowDefinitionJson
): { ok: true } | { ok: false; error: string } {
  if (!definition?.nodes?.length) return { ok: false, error: "Workflow must have nodes" };
  if (!definition.entryNodeId) return { ok: false, error: "entryNodeId is required" };
  if (!definition.nodes.some((n) => n.id === definition.entryNodeId)) {
    return { ok: false, error: "entryNodeId must reference a node" };
  }
  if (!definition.nodes.some((n) => n.type === "trigger")) {
    return { ok: false, error: "Workflow must include a trigger node" };
  }
  return { ok: true };
}
