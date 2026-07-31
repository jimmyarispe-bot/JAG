import type { DecisionStatus } from "@/lib/platform/decisions/types";

/**
 * Allowed transitions (Sprint 066).
 *
 * Open → Assigned → In Progress → Waiting → Completed
 * Open → Dismissed
 * Assigned → Dismissed
 * In Progress → Dismissed
 * Waiting → In Progress | Completed | Dismissed
 */
const ALLOWED: Record<DecisionStatus, readonly DecisionStatus[]> = {
  open: ["assigned", "in_progress", "waiting", "dismissed"],
  assigned: ["in_progress", "waiting", "dismissed", "open"],
  in_progress: ["waiting", "completed", "dismissed"],
  waiting: ["in_progress", "completed", "dismissed"],
  completed: [],
  dismissed: [],
};

export function canTransition(
  from: DecisionStatus,
  to: DecisionStatus
): boolean {
  if (from === to) return false;
  return ALLOWED[from].includes(to);
}

export function assertTransition(from: DecisionStatus, to: DecisionStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid decision transition: ${from} → ${to}`);
  }
}

export function historyActionForTransition(
  to: DecisionStatus
): "assigned" | "started" | "completed" | "dismissed" | "waiting" {
  switch (to) {
    case "assigned":
      return "assigned";
    case "in_progress":
      return "started";
    case "completed":
      return "completed";
    case "dismissed":
      return "dismissed";
    case "waiting":
      return "waiting";
    default:
      return "started";
  }
}
