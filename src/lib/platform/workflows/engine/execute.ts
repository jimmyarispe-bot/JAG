/**
 * RC-7 visual workflow executor — walks the studio graph.
 * Default dryRun=true. Approvals block until human decision is supplied.
 */

import { handleNode, evaluateCondition } from "@/lib/platform/workflows/nodes/handlers";
import { validateStudioWorkflow } from "@/lib/platform/workflows/engine/validate";
import type {
  StudioEdge,
  StudioNode,
  StudioNodeResult,
  StudioRunResult,
  StudioWorkflowDefinition,
} from "@/lib/platform/workflows/types";
import { WORKFLOW_STUDIO_VERSION } from "@/lib/platform/workflows/types";

export type ExecuteStudioWorkflowInput = {
  workflow: StudioWorkflowDefinition;
  organizationId: string;
  runId?: string;
  /** Defaults to true — safe for CI / studio preview. */
  dryRun?: boolean;
  vars?: Record<string, unknown>;
  /** Map approval node id → decision */
  approvals?: Record<string, "approved" | "rejected" | "pending">;
  now?: () => Date;
};

function outgoing(
  edges: StudioEdge[],
  fromId: string,
  branch?: StudioEdge["branch"]
): StudioEdge[] {
  return edges.filter((e) => {
    if (e.from !== fromId) return false;
    if (!branch) return !e.branch || e.branch === "default" || e.branch === "true";
    return e.branch === branch || (!e.branch && branch === "default");
  });
}

function pickNext(
  node: StudioNode,
  result: StudioNodeResult,
  edges: StudioEdge[],
  pass?: boolean
): string | null {
  if (result.status === "waiting" || result.status === "failed" || result.status === "blocked") {
    return null;
  }

  if (node.type === "condition") {
    const branch: StudioEdge["branch"] = pass ? "true" : "false";
    const branched = outgoing(edges, node.id, branch);
    if (branched[0]) return branched[0].to;
    const fallback = outgoing(edges, node.id, "default");
    return fallback[0]?.to ?? null;
  }

  if (node.type === "approval") {
    const decision = (result.output?.decision as string) ?? "pending";
    const branch: StudioEdge["branch"] =
      decision === "approved" ? "approved" : decision === "rejected" ? "rejected" : "default";
    const branched = outgoing(edges, node.id, branch);
    if (branched[0]) return branched[0].to;
  }

  const next = outgoing(edges, node.id);
  return next[0]?.to ?? null;
}

export function executeStudioWorkflow(
  input: ExecuteStudioWorkflowInput
): StudioRunResult {
  const now = input.now ?? (() => new Date());
  const startedAt = now().toISOString();
  const dryRun = input.dryRun !== false;
  const runId = input.runId ?? `run-${input.workflow.key}-${Date.now()}`;

  const validation = validateStudioWorkflow(input.workflow);
  if (!validation.valid) {
    return {
      runId,
      workflowId: input.workflow.id,
      workflowKey: input.workflow.key,
      organizationId: input.organizationId,
      status: "failed",
      dryRun,
      startedAt,
      finishedAt: now().toISOString(),
      steps: [
        {
          nodeId: "validation",
          type: "trigger",
          label: "Validation",
          status: "failed",
          message: validation.issues
            .filter((i) => i.severity === "error")
            .map((i) => i.message)
            .join("; "),
        },
      ],
      context: { validation, studioVersion: WORKFLOW_STUDIO_VERSION },
      contributingDomains: ["workflow-studio"],
      governance: {
        mayAutoExecute: false,
        approvalsRequireHuman: true,
        integrationVendorApisForbidden: true,
      },
    };
  }

  const byId = new Map(input.workflow.nodes.map((n) => [n.id, n]));
  const ctx = {
    organizationId: input.organizationId,
    dryRun,
    vars: { ...(input.vars ?? {}) },
    approvals: { ...(input.approvals ?? {}) },
  };

  const steps: StudioNodeResult[] = [];
  let currentId: string | null = input.workflow.entryNodeId;
  let status: StudioRunResult["status"] = "running";
  const visited = new Set<string>();
  const maxSteps = Math.max(50, input.workflow.nodes.length * 3);

  while (currentId && steps.length < maxSteps) {
    if (visited.has(currentId) && byId.get(currentId)?.type !== "delay") {
      steps.push({
        nodeId: currentId,
        type: byId.get(currentId)?.type ?? "action",
        label: byId.get(currentId)?.label ?? currentId,
        status: "failed",
        message: "Cycle detected — aborting run",
      });
      status = "failed";
      break;
    }
    visited.add(currentId);

    const node = byId.get(currentId);
    if (!node) {
      status = "failed";
      steps.push({
        nodeId: currentId,
        type: "action",
        label: currentId,
        status: "failed",
        message: "Node missing from definition",
      });
      break;
    }

    let pass: boolean | undefined;
    let result: StudioNodeResult;
    if (node.type === "condition") {
      const evaluated = evaluateCondition(node, ctx);
      pass = evaluated.pass;
      result = evaluated.result;
    } else {
      result = handleNode(node, ctx);
    }
    steps.push(result);

    if (result.status === "waiting") {
      status =
        node.type === "approval"
          ? "waiting_approval"
          : node.type === "delay"
            ? "waiting_delay"
            : "running";
      break;
    }
    if (result.status === "failed" || result.status === "blocked") {
      status = result.status === "blocked" ? "cancelled" : "failed";
      break;
    }

    currentId = pickNext(node, result, input.workflow.edges, pass);
    if (!currentId) {
      status = "completed";
      break;
    }
  }

  if (status === "running" && !currentId) status = "completed";
  if (status === "running" && steps.length >= maxSteps) {
    status = "failed";
    steps.push({
      nodeId: "limit",
      type: "action",
      label: "Step limit",
      status: "failed",
      message: "Exceeded max steps",
    });
  }

  return {
    runId,
    workflowId: input.workflow.id,
    workflowKey: input.workflow.key,
    organizationId: input.organizationId,
    status,
    dryRun,
    startedAt,
    finishedAt: now().toISOString(),
    steps,
    context: {
      vars: ctx.vars,
      studioVersion: WORKFLOW_STUDIO_VERSION,
      validationWarnings: validation.issues.filter((i) => i.severity === "warning"),
    },
    contributingDomains: ["workflow-studio"],
    governance: {
      mayAutoExecute: false,
      approvalsRequireHuman: true,
      integrationVendorApisForbidden: true,
    },
  };
}
