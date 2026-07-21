/**
 * RC-7 node handlers — soft-read / dry-run safe execution.
 * Integration never calls vendor APIs; AI never mutates; approvals block for humans.
 */

import { answerExecutiveCopilotV2 } from "@/lib/platform/executive-copilot";
import {
  rebuildUnifiedKnowledgeGraph,
  softReadOrganizationalGraph,
} from "@/lib/platform/knowledge-graph";
import { getFinanceExecutiveFeed } from "@/lib/platform/integrations/connectors/finance";
import { getCrmExecutiveFeed } from "@/lib/platform/integrations/connectors/crm";
import { getHrExecutiveFeed } from "@/lib/platform/integrations/connectors/hr";
import { getEducationExecutiveFeed } from "@/lib/platform/integrations/connectors/education";
import type {
  StudioNode,
  StudioNodeResult,
} from "@/lib/platform/workflows/types";

export type StudioExecutionContext = {
  organizationId: string;
  dryRun: boolean;
  vars: Record<string, unknown>;
  approvals: Record<string, "approved" | "rejected" | "pending">;
};

function ok(
  node: StudioNode,
  message: string,
  output?: Record<string, unknown>,
  status: StudioNodeResult["status"] = "ok"
): StudioNodeResult {
  return {
    nodeId: node.id,
    type: node.type,
    label: node.label,
    status,
    output,
    message,
  };
}

export function evaluateCondition(
  node: Extract<StudioNode, { type: "condition" }>,
  ctx: StudioExecutionContext
): { pass: boolean; result: StudioNodeResult } {
  const { field, operator, value } = node.config;
  const actual = ctx.vars[field];
  let pass = false;

  switch (operator) {
    case "equals":
      pass = actual === value;
      break;
    case "not_equals":
      pass = actual !== value;
      break;
    case "greater_than":
      pass = Number(actual) > Number(value);
      break;
    case "less_than":
      pass = Number(actual) < Number(value);
      break;
    case "contains":
      pass = String(actual ?? "").includes(String(value ?? ""));
      break;
    case "exists":
      pass = actual !== undefined && actual !== null && actual !== "";
      break;
    case "in":
      pass = Array.isArray(value) && value.includes(actual);
      break;
    default:
      pass = false;
  }

  return {
    pass,
    result: ok(
      node,
      `Condition ${field} ${operator} ${JSON.stringify(value)} → ${pass}`,
      { field, operator, value, actual, pass }
    ),
  };
}

export function handleNode(
  node: StudioNode,
  ctx: StudioExecutionContext
): StudioNodeResult {
  switch (node.type) {
    case "trigger":
      return ok(node, `Trigger fired (${node.config.triggerType}${node.config.eventKey ? `: ${node.config.eventKey}` : ""})`, {
        triggerType: node.config.triggerType,
        eventKey: node.config.eventKey,
      });

    case "condition":
      return evaluateCondition(node, ctx).result;

    case "action": {
      if (ctx.dryRun) {
        return ok(node, `Dry-run action ${node.config.actionType}`, {
          actionType: node.config.actionType,
          target: node.config.target,
          dryRun: true,
        });
      }
      ctx.vars[`action:${node.id}`] = {
        actionType: node.config.actionType,
        at: new Date().toISOString(),
        payload: node.config.payload ?? {},
      };
      return ok(node, `Action recorded: ${node.config.actionType}`, {
        actionType: node.config.actionType,
        target: node.config.target,
      });
    }

    case "approval": {
      const decision = ctx.approvals[node.id] ?? "pending";
      if (decision === "pending") {
        return ok(
          node,
          `Waiting human approval from ${node.config.role}: ${node.config.rationale}`,
          { role: node.config.role, requireHuman: true, decision },
          "waiting"
        );
      }
      return ok(
        node,
        `Approval ${decision} by role ${node.config.role}`,
        { role: node.config.role, decision },
        decision === "approved" ? "ok" : "blocked"
      );
    }

    case "delay":
      if (ctx.dryRun || ctx.vars[`delay_complete:${node.id}`]) {
        return ok(node, `Delay ${node.config.durationHours}h satisfied (simulated)`, {
          durationHours: node.config.durationHours,
          simulated: true,
        });
      }
      return ok(
        node,
        `Waiting delay of ${node.config.durationHours} hour(s)`,
        { durationHours: node.config.durationHours },
        "waiting"
      );

    case "notification":
      return ok(
        node,
        `${ctx.dryRun ? "Dry-run notify" : "Notification queued"} via ${node.config.channel} → ${node.config.audience}`,
        {
          channel: node.config.channel,
          template: node.config.template,
          audience: node.config.audience,
          dryRun: ctx.dryRun,
        }
      );

    case "integration": {
      if (node.config.mode === "soft_read") {
        const provider = node.config.provider.toLowerCase();
        let feed: unknown = null;
        if (provider.includes("finance") || provider.includes("stripe") || provider.includes("quickbooks")) {
          feed = getFinanceExecutiveFeed(ctx.organizationId);
        } else if (provider.includes("crm") || provider.includes("hubspot") || provider.includes("salesforce")) {
          feed = getCrmExecutiveFeed(ctx.organizationId);
        } else if (provider.includes("hr") || provider.includes("gusto") || provider.includes("bamboo")) {
          feed = getHrExecutiveFeed(ctx.organizationId);
        } else if (
          provider.includes("education") ||
          provider.includes("canvas") ||
          provider.includes("powerschool")
        ) {
          feed = getEducationExecutiveFeed(ctx.organizationId);
        } else {
          feed = softReadOrganizationalGraph(ctx.organizationId);
        }
        return ok(node, `Integration soft-read ${node.config.provider}`, {
          provider: node.config.provider,
          mode: "soft_read",
          present: Boolean(feed),
        });
      }
      // sync mode — never call vendor APIs; record intent / dry-run only unless explicitly allowed via vars
      if (ctx.dryRun || !ctx.vars.allowIntegrationSync) {
        return ok(node, `Integration sync planned for ${node.config.provider} (no vendor API call)`, {
          provider: node.config.provider,
          mode: "sync",
          dryRun: true,
        });
      }
      return ok(node, `Integration sync requested via platform connector for ${node.config.provider}`, {
        provider: node.config.provider,
        mode: "sync",
        objectHint: node.config.objectHint,
      });
    }

    case "ai_step": {
      const answer = answerExecutiveCopilotV2({
        organizationId: ctx.organizationId,
        question: node.config.question,
      });
      ctx.vars[`ai:${node.id}`] = {
        intent: answer.intent,
        confidence: answer.confidence,
        answer: answer.answer,
      };
      return ok(node, `AI soft-read: ${answer.answer.slice(0, 180)}`, {
        intent: answer.intent,
        confidence: answer.confidence,
        softReadOnly: true,
      });
    }

    case "graph_update": {
      if (ctx.dryRun) {
        const soft = softReadOrganizationalGraph(ctx.organizationId);
        return ok(node, `Graph update dry-run — current ${soft?.counts.nodes ?? 0} nodes`, {
          mode: node.config.mode,
          dryRun: true,
          nodeCount: soft?.counts.nodes ?? 0,
        });
      }
      const graph = rebuildUnifiedKnowledgeGraph(ctx.organizationId);
      return ok(node, `Knowledge graph rebuilt (${graph?.nodes.length ?? 0} nodes)`, {
        mode: node.config.mode,
        nodeCount: graph?.nodes.length ?? 0,
        edgeCount: graph?.edges.length ?? 0,
      });
    }

    default:
      return ok(node, "Unknown node type", {}, "failed");
  }
}
