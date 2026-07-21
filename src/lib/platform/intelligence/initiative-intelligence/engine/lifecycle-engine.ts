/**
 * Initiative lifecycle transitions — timestamped and attributable.
 */

import type {
  Initiative,
  InitiativeLifecycleState,
  InitiativeOwnershipRole,
  LifecycleTransition,
} from "@/lib/platform/intelligence/initiative-intelligence/types";

const ALLOWED: Record<InitiativeLifecycleState, InitiativeLifecycleState[]> = {
  proposed: ["approved", "cancelled", "archived"],
  approved: ["planned", "cancelled", "on_hold"],
  planned: ["active", "on_hold", "cancelled"],
  active: ["at_risk", "on_hold", "completed", "cancelled"],
  on_hold: ["active", "planned", "cancelled", "archived"],
  at_risk: ["active", "on_hold", "completed", "cancelled"],
  completed: ["archived"],
  cancelled: ["archived", "proposed"],
  archived: [],
};

export class LifecycleEngine {
  constructor(
    private readonly createId: (prefix: string) => string,
    private readonly now: () => Date
  ) {}

  canTransition(from: InitiativeLifecycleState, to: InitiativeLifecycleState): boolean {
    return ALLOWED[from].includes(to);
  }

  transition(
    initiative: Initiative,
    to: InitiativeLifecycleState,
    actorRole: InitiativeOwnershipRole | "system" = "system",
    rationale?: string
  ): Initiative {
    if (initiative.state === to) return initiative;
    if (!this.canTransition(initiative.state, to)) {
      throw new Error(`Invalid lifecycle transition: ${initiative.state} → ${to}`);
    }
    const entry: LifecycleTransition = {
      id: this.createId("transition"),
      from: initiative.state,
      to,
      at: this.now().toISOString(),
      byRole: actorRole,
      rationale,
    };
    return {
      ...initiative,
      state: to,
      transitions: [...initiative.transitions, entry],
      updatedAt: entry.at,
    };
  }

  seedTransition(
    to: InitiativeLifecycleState,
    actorRole: InitiativeOwnershipRole | "system" = "system"
  ): LifecycleTransition {
    return {
      id: this.createId("transition"),
      from: null,
      to,
      at: this.now().toISOString(),
      byRole: actorRole,
      rationale: "Initial state",
    };
  }
}
