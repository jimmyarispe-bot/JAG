/**
 * Universal promotion state machine — no industry-specific rules.
 */

import type { RuntimeLifecycleState } from "@/jag/runtime-lifecycle/contracts";

const ALLOWED: Readonly<
  Record<RuntimeLifecycleState, readonly RuntimeLifecycleState[]>
> = {
  draft: ["validated", "archived"],
  validated: ["approved", "draft", "archived"],
  approved: ["published", "validated", "archived"],
  published: ["archived"],
  archived: [],
};

export function canTransition(
  from: RuntimeLifecycleState,
  to: RuntimeLifecycleState
): boolean {
  if (from === to) return false;
  return ALLOWED[from].includes(to);
}

export function assertTransition(
  from: RuntimeLifecycleState,
  to: RuntimeLifecycleState
): { ok: true } | { ok: false; code: string; message: string } {
  if (!canTransition(from, to)) {
    return {
      ok: false,
      code: "illegal_transition",
      message: `Cannot promote from "${from}" to "${to}"`,
    };
  }
  return { ok: true };
}

export function allowedTransitions(
  from: RuntimeLifecycleState
): readonly RuntimeLifecycleState[] {
  return ALLOWED[from];
}
