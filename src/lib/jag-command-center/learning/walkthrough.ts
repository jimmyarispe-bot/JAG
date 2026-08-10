/**
 * JAG walkthrough adapter — reuses Mr. JAG WalkthroughEngine for step/highlight
 * semantics, with JAG-native pageIds (jag.*) — never AcademyOS aos.*.
 * Durable completion is tracked via jag_learn_user_progress.
 */

import {
  createMrJagWalkthroughEngine,
  registerMrJagContent,
  type WalkthroughDefinition,
} from "@mr-jag";
import { JAG_LEARN_WALKTHROUGHS, getWalkthroughById } from "./catalog";
import type { JagLearnWalkthrough } from "./types";

let registered = false;

function toMrJagDefinition(w: JagLearnWalkthrough): WalkthroughDefinition {
  return {
    id: w.id,
    title: w.title,
    pageId: w.pageId,
    productId: "jag",
    personas: Object.freeze([
      "Founder",
      "Executive",
      "School Leader",
      "Teacher",
      "Support",
    ]),
    estimatedMinutes: Math.max(1, w.steps.length),
    steps: Object.freeze(
      w.steps.map((s, order) =>
        Object.freeze({
          id: s.id,
          order,
          title: s.title,
          body: s.body,
          targetSelector: s.targetSelector,
          pageId: w.pageId,
        })
      )
    ),
  };
}

export function ensureJagWalkthroughsRegistered(): void {
  if (registered) return;
  registerMrJagContent({
    tutorials: [],
    paths: [],
    walkthroughs: JAG_LEARN_WALKTHROUGHS.map(toMrJagDefinition),
  });
  registered = true;
}

export function resetJagWalkthroughRegistrationForTests(): void {
  registered = false;
}

export function getJagWalkthrough(
  walkthroughId: string
): JagLearnWalkthrough | null {
  return getWalkthroughById(walkthroughId);
}

export function startJagWalkthroughSession(input: {
  walkthroughId: string;
  userId: string;
  organizationId: string;
}) {
  ensureJagWalkthroughsRegistered();
  const engine = createMrJagWalkthroughEngine();
  return engine.start({
    walkthroughId: input.walkthroughId,
    userId: input.userId,
    organizationId: input.organizationId || "jag-learn",
  });
}

export function advanceJagWalkthrough(input: {
  walkthroughId: string;
  userId: string;
  organizationId: string;
}) {
  ensureJagWalkthroughsRegistered();
  return createMrJagWalkthroughEngine().advance({
    walkthroughId: input.walkthroughId,
    userId: input.userId,
    organizationId: input.organizationId || "jag-learn",
  });
}

/**
 * Previous is not first-class on MrJagWalkthroughEngine — restart and advance
 * to step-1. Durable step index remains in jag_learn_user_progress.
 */
export function previousJagWalkthrough(input: {
  walkthroughId: string;
  userId: string;
  organizationId: string;
  currentStepIndex: number;
}) {
  ensureJagWalkthroughsRegistered();
  const engine = createMrJagWalkthroughEngine();
  const org = input.organizationId || "jag-learn";
  const restarted = engine.restart({
    walkthroughId: input.walkthroughId,
    userId: input.userId,
    organizationId: org,
  });
  if ("error" in restarted) return restarted;
  const target = Math.max(0, input.currentStepIndex - 1);
  let session = restarted;
  for (let i = 0; i < target; i++) {
    const next = engine.advance({
      walkthroughId: input.walkthroughId,
      userId: input.userId,
      organizationId: org,
    });
    if ("error" in next) return next;
    session = next;
  }
  return session;
}

export function pauseJagWalkthrough(input: {
  walkthroughId: string;
  userId: string;
  organizationId: string;
}) {
  ensureJagWalkthroughsRegistered();
  return createMrJagWalkthroughEngine().pause({
    walkthroughId: input.walkthroughId,
    userId: input.userId,
    organizationId: input.organizationId || "jag-learn",
  });
}

export function resumeJagWalkthrough(input: {
  walkthroughId: string;
  userId: string;
  organizationId: string;
}) {
  ensureJagWalkthroughsRegistered();
  return createMrJagWalkthroughEngine().resume({
    walkthroughId: input.walkthroughId,
    userId: input.userId,
    organizationId: input.organizationId || "jag-learn",
  });
}

export function skipJagWalkthrough(input: {
  walkthroughId: string;
  userId: string;
  organizationId: string;
}) {
  ensureJagWalkthroughsRegistered();
  return createMrJagWalkthroughEngine().skip({
    walkthroughId: input.walkthroughId,
    userId: input.userId,
    organizationId: input.organizationId || "jag-learn",
  });
}
