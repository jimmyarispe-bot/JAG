import type {
  ExecutiveDecision,
  ExecutiveDecisionHistoryEntry,
  ExecutiveDecisionStatus,
} from "@/lib/platform/executive-decisions/types";
import { scoreDecision } from "@/lib/platform/executive-decisions/score";

function appendHistory(
  decision: ExecutiveDecision,
  entry: ExecutiveDecisionHistoryEntry
): ExecutiveDecision {
  return {
    ...decision,
    history: [...decision.history, entry],
    updatedAt: entry.at,
  };
}

function rescore(decision: ExecutiveDecision): ExecutiveDecision {
  return {
    ...decision,
    priority: scoreDecision({
      severity: decision.severity,
      decisionType: decision.decisionType,
      confidence: decision.confidence,
      blocking: decision.blocking,
      financialImpact: decision.financialImpact,
      studentImpact: decision.studentImpact,
      complianceRisk: decision.complianceRisk,
      sourceCount: decision.sources.length,
      createdAt: decision.createdAt,
      dueDate: decision.dueDate,
    }),
  };
}

/**
 * In-memory lifecycle helpers for the composed decision queue.
 * Persistence remains on Mission Control / JAG Work / Workflow — not a second store.
 */

export function acknowledgeDecision(
  decision: ExecutiveDecision,
  input: { at?: string; actorUserId?: string | null; note?: string | null } = {}
): ExecutiveDecision {
  if (decision.status === "Completed" || decision.status === "Dismissed") {
    return decision;
  }
  const at = input.at ?? new Date().toISOString();
  return rescore(
    appendHistory(
      { ...decision, status: "Acknowledged" },
      {
        at,
        action: "acknowledged",
        actorUserId: input.actorUserId,
        note: input.note,
      }
    )
  );
}

export function delegateDecision(
  decision: ExecutiveDecision,
  input: {
    toOwner: string;
    dueDate?: string | null;
    at?: string;
    actorUserId?: string | null;
    note?: string | null;
  }
): ExecutiveDecision {
  const at = input.at ?? new Date().toISOString();
  return rescore(
    appendHistory(
      {
        ...decision,
        status: "Delegated",
        recommendedOwner: input.toOwner,
        dueDate: input.dueDate ?? decision.dueDate,
      },
      {
        at,
        action: "delegated",
        actorUserId: input.actorUserId,
        note: input.note,
        toOwner: input.toOwner,
        dueDate: input.dueDate ?? decision.dueDate,
      }
    )
  );
}

export function markDecisionWaiting(
  decision: ExecutiveDecision,
  input: { at?: string; actorUserId?: string | null; note?: string | null } = {}
): ExecutiveDecision {
  const at = input.at ?? new Date().toISOString();
  return rescore(
    appendHistory(
      { ...decision, status: "Waiting" },
      {
        at,
        action: "waiting",
        actorUserId: input.actorUserId,
        note: input.note,
      }
    )
  );
}

export function completeDecision(
  decision: ExecutiveDecision,
  input: { at?: string; actorUserId?: string | null; note?: string | null } = {}
): ExecutiveDecision {
  const at = input.at ?? new Date().toISOString();
  return rescore(
    appendHistory(
      { ...decision, status: "Completed" },
      {
        at,
        action: "completed",
        actorUserId: input.actorUserId,
        note: input.note,
      }
    )
  );
}

export function dismissDecision(
  decision: ExecutiveDecision,
  input: { at?: string; actorUserId?: string | null; note?: string | null } = {}
): ExecutiveDecision {
  const at = input.at ?? new Date().toISOString();
  return rescore(
    appendHistory(
      { ...decision, status: "Dismissed" },
      {
        at,
        action: "dismissed",
        actorUserId: input.actorUserId,
        note: input.note,
      }
    )
  );
}

export function scheduleFollowUp(
  decision: ExecutiveDecision,
  input: {
    dueDate: string;
    at?: string;
    actorUserId?: string | null;
    note?: string | null;
  }
): ExecutiveDecision {
  const at = input.at ?? new Date().toISOString();
  const status: ExecutiveDecisionStatus =
    decision.status === "Completed" || decision.status === "Dismissed"
      ? "Open"
      : decision.status === "Open"
        ? "Waiting"
        : decision.status;

  return rescore(
    appendHistory(
      {
        ...decision,
        status,
        dueDate: input.dueDate,
      },
      {
        at,
        action: "follow_up",
        actorUserId: input.actorUserId,
        note: input.note ?? "Follow-up scheduled",
        dueDate: input.dueDate,
      }
    )
  );
}

export function setDecisionDueDate(
  decision: ExecutiveDecision,
  dueDate: string | null,
  at: string = new Date().toISOString()
): ExecutiveDecision {
  return rescore(
    appendHistory(
      { ...decision, dueDate },
      {
        at,
        action: "follow_up",
        note: dueDate ? `Due date set to ${dueDate}` : "Due date cleared",
        dueDate,
      }
    )
  );
}
