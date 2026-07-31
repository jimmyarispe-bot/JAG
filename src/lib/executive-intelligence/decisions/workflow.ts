/**
 * DecisionWorkflow — explicit status transitions only (operator-driven).
 */

import type { DecisionStatus } from "@/lib/executive-intelligence/decisions/types";

const TRANSITIONS: Readonly<Record<DecisionStatus, readonly DecisionStatus[]>> =
  {
    Detected: ["Needs Review", "Assigned", "Resolved", "Closed"],
    "Needs Review": ["Detected", "Assigned", "In Progress", "Resolved", "Closed"],
    Assigned: ["Needs Review", "In Progress", "Resolved"],
    "In Progress": ["Assigned", "Resolved", "Needs Review"],
    Resolved: ["Closed", "In Progress", "Needs Review"],
    Closed: ["Needs Review"],
  };

export type DecisionWorkflow = {
  canTransition(from: DecisionStatus, to: DecisionStatus): boolean;
  assertTransition(from: DecisionStatus, to: DecisionStatus): void;
  allowedNext(from: DecisionStatus): readonly DecisionStatus[];
  isOpen(status: DecisionStatus): boolean;
  isTerminal(status: DecisionStatus): boolean;
};

export function createDecisionWorkflow(): DecisionWorkflow {
  return {
    canTransition(from, to) {
      if (from === to) return true;
      return TRANSITIONS[from].includes(to);
    },
    assertTransition(from, to) {
      if (!this.canTransition(from, to)) {
        throw new Error(`Invalid decision transition: ${from} → ${to}`);
      }
    },
    allowedNext(from) {
      return TRANSITIONS[from];
    },
    isOpen(status) {
      return (
        status === "Detected" ||
        status === "Needs Review" ||
        status === "Assigned" ||
        status === "In Progress"
      );
    },
    isTerminal(status) {
      return status === "Closed";
    },
  };
}
