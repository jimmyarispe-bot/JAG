import type {
  StudioEdge,
  StudioNode,
  StudioWorkflowDefinition,
  StudioWorkflowStatus,
} from "@/lib/platform/workflows/types";
import { WORKFLOW_STUDIO_VERSION } from "@/lib/platform/workflows/types";

let seq = 0;
export function resetStudioIdSeqForTests() {
  seq = 0;
}

function nid(prefix: string) {
  return `${prefix}-${++seq}`;
}

export function n(
  type: StudioNode["type"],
  label: string,
  config: StudioNode["config"],
  id?: string
): StudioNode {
  return {
    id: id ?? nid(type),
    type,
    label,
    config,
  } as StudioNode;
}

export function e(
  from: string,
  to: string,
  branch?: StudioEdge["branch"],
  label?: string
): StudioEdge {
  return {
    id: `e-${from}-${to}${branch ? `-${branch}` : ""}`,
    from,
    to,
    branch,
    label,
  };
}

export function defineWorkflow(input: {
  id: string;
  key: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  status?: StudioWorkflowStatus;
  nodes: StudioNode[];
  edges: StudioEdge[];
  entryNodeId: string;
}): StudioWorkflowDefinition {
  return {
    ...input,
    version: WORKFLOW_STUDIO_VERSION,
    status: input.status ?? "published",
  };
}

