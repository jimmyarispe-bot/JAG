import {
  buildAutomationDecisionMergeKey,
  DecisionService,
} from "@/lib/platform/decisions";
import type { DecisionPriority, PlatformDecision } from "@/lib/platform/decisions";
import { getFactValue } from "@/lib/platform/automation/operating/conditions";
import type {
  AutomationAction,
  AutomationRule,
  OperationalFacts,
} from "@/lib/platform/automation/operating/types";
import { NotificationService } from "@/lib/platform/notifications";

export type ActionExecutionContext = {
  rule: AutomationRule;
  facts: OperationalFacts;
  subjectKey: string;
  actorUserId?: string | null;
  now: string;
  /** Decision id established by a prior create_decision in this subject run. */
  lastDecisionId: string | null;
};

export type ActionExecutionResult = {
  actionType: AutomationAction["type"];
  ok: boolean;
  decisionId: string | null;
  notificationId: string | null;
  createdDecision: boolean;
  detail: string;
};

function resolveDecisionId(
  explicit: string | undefined,
  ctx: ActionExecutionContext
): string {
  const id = explicit ?? ctx.lastDecisionId;
  if (!id) {
    throw new Error("Action requires a decisionId (create_decision first or pass id)");
  }
  return id;
}

function resolveSubjectKeyPath(
  facts: OperationalFacts,
  path: string | undefined,
  fallback: string
): string {
  if (!path) return fallback;
  const value = getFactValue(facts, path);
  return value == null ? fallback : String(value);
}

export function executeAction(
  action: AutomationAction,
  ctx: ActionExecutionContext
): ActionExecutionResult {
  switch (action.type) {
    case "create_decision": {
      const subjectKey = resolveSubjectKeyPath(
        ctx.facts,
        action.params.subjectKeyPath,
        ctx.subjectKey
      );
      const mergeKey = buildAutomationDecisionMergeKey({
        organizationId: ctx.facts.organizationId,
        ruleId: ctx.rule.id,
        subjectKey,
      });
      const priority: DecisionPriority = action.params.priority ?? "medium";
      const title = action.params.title;
      const description =
        action.params.description ??
        `Automation rule "${ctx.rule.name}" matched subject ${subjectKey}.`;

      const { decision, created } = DecisionService.create({
        mergeKey,
        title,
        description,
        organizationId: ctx.facts.organizationId,
        applicationId: ctx.facts.applicationId ?? null,
        priority,
        ownerRole: action.params.ownerRole,
        actorUserId: ctx.actorUserId,
        now: ctx.now,
        dueInDays: action.params.dueInDays,
        reason: `Created by automation rule ${ctx.rule.id}`,
        historyAction: "created_by_automation",
        signalIds: [`automation:${ctx.rule.id}`],
      });

      return {
        actionType: action.type,
        ok: true,
        decisionId: decision.id,
        notificationId: null,
        createdDecision: created,
        detail: created
          ? `Created decision ${decision.id}`
          : `Reused existing decision ${decision.id}`,
      };
    }

    case "assign_decision": {
      const decisionId = resolveDecisionId(action.params.decisionId, ctx);
      const existing = DecisionService.getById(decisionId);
      if (!existing) {
        throw new Error(`Decision not found: ${decisionId}`);
      }
      const sameOwner =
        existing.owner?.role === action.params.ownerRole &&
        (action.params.ownerUserId === undefined ||
          existing.owner?.userId === (action.params.ownerUserId ?? null)) &&
        existing.status !== "open";
      if (sameOwner) {
        return {
          actionType: action.type,
          ok: true,
          decisionId: existing.id,
          notificationId: null,
          createdDecision: false,
          detail: `Already assigned ${existing.id} to ${action.params.ownerRole}`,
        };
      }
      const decision = DecisionService.assign({
        decisionId,
        ownerRole: action.params.ownerRole,
        ownerUserId: action.params.ownerUserId,
        ownerDisplayName: action.params.ownerDisplayName,
        actorUserId: ctx.actorUserId,
        now: ctx.now,
        notify: action.params.notify,
        reason: `Assigned by automation rule ${ctx.rule.id}`,
      });
      return {
        actionType: action.type,
        ok: true,
        decisionId: decision.id,
        notificationId: null,
        createdDecision: false,
        detail: `Assigned decision ${decision.id} to ${action.params.ownerRole}`,
      };
    }

    case "create_notification": {
      const decisionId = resolveDecisionId(action.params.decisionId, ctx);
      const decision = DecisionService.getById(decisionId);
      if (!decision) {
        throw new Error(`Decision not found for notification: ${decisionId}`);
      }
      const note = NotificationService.dispatchAssignment({
        decisionId,
        recipientId: action.params.recipientId,
        organizationId: decision.organizationId,
        applicationId: decision.applicationId,
        priority: action.params.priority ?? decision.priority,
        title: action.params.title,
        body:
          action.params.body ??
          `Automation "${ctx.rule.name}" requires your attention.`,
        type: "automation_alert",
        actorUserId: ctx.actorUserId,
        now: ctx.now,
      });
      return {
        actionType: action.type,
        ok: true,
        decisionId,
        notificationId: note.id,
        createdDecision: false,
        detail: `Created notification ${note.id}`,
      };
    }

    case "escalate_priority": {
      const decisionId = resolveDecisionId(action.params.decisionId, ctx);
      const decision = DecisionService.escalatePriority({
        decisionId,
        priority: action.params.priority,
        actorUserId: ctx.actorUserId,
        now: ctx.now,
        reason: `Escalated by automation rule ${ctx.rule.id}`,
      });
      return {
        actionType: action.type,
        ok: true,
        decisionId: decision.id,
        notificationId: null,
        createdDecision: false,
        detail: `Priority set to ${decision.priority}`,
      };
    }

    case "mark_resolved": {
      const decisionId = resolveDecisionId(action.params.decisionId, ctx);
      const decision = closeOrResolve(decisionId, "completed", ctx, action.params.reason);
      return {
        actionType: action.type,
        ok: true,
        decisionId: decision.id,
        notificationId: null,
        createdDecision: false,
        detail: `Marked resolved ${decision.id}`,
      };
    }

    case "close_decision": {
      const decisionId = resolveDecisionId(action.params.decisionId, ctx);
      const decision = closeOrResolve(decisionId, "dismissed", ctx, action.params.reason);
      return {
        actionType: action.type,
        ok: true,
        decisionId: decision.id,
        notificationId: null,
        createdDecision: false,
        detail: `Closed decision ${decision.id}`,
      };
    }
  }
}

function closeOrResolve(
  decisionId: string,
  toStatus: "completed" | "dismissed",
  ctx: ActionExecutionContext,
  reason?: string | null
): PlatformDecision {
  const existing = DecisionService.getById(decisionId);
  if (!existing) {
    throw new Error(`Decision not found: ${decisionId}`);
  }
  if (existing.status === "completed" || existing.status === "dismissed") {
    return existing;
  }

  // Walk through legal transitions when needed.
  let current = existing;
  if (current.status === "open") {
    current = DecisionService.assign({
      decisionId: current.id,
      ownerRole: current.owner?.role ?? "founder",
      ownerUserId: current.owner?.userId,
      ownerDisplayName: current.owner?.displayName,
      actorUserId: ctx.actorUserId,
      now: ctx.now,
      notify: false,
      reason: "Auto-assign before resolve/close",
    });
  }
  if (current.status === "assigned") {
    current = DecisionService.transition({
      decisionId: current.id,
      toStatus: "in_progress",
      actorUserId: ctx.actorUserId,
      now: ctx.now,
      reason: "Auto-start before resolve/close",
    });
  }
  if (current.status === "waiting") {
    current = DecisionService.transition({
      decisionId: current.id,
      toStatus: "in_progress",
      actorUserId: ctx.actorUserId,
      now: ctx.now,
      reason: "Resume before resolve/close",
    });
  }
  return DecisionService.transition({
    decisionId: current.id,
    toStatus,
    actorUserId: ctx.actorUserId,
    now: ctx.now,
    reason: reason ?? `Closed by automation rule ${ctx.rule.id}`,
  });
}
