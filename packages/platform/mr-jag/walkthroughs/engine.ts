/**
 * Walkthrough Engine — highlight, auto-advance, pause/resume/restart/skip.
 */

import {
  getWalkthrough,
  getWalkthroughProgress,
  listWalkthroughs,
  setWalkthroughProgress,
} from "../store";
import type { WalkthroughDefinition, WalkthroughProgress } from "../types";

export type WalkthroughSession = {
  readonly definition: WalkthroughDefinition;
  readonly progress: WalkthroughProgress;
  readonly currentStep: WalkthroughDefinition["steps"][number] | null;
  /** CSS selectors / targets to highlight for the current step */
  readonly highlightControls: readonly string[];
};

function session(
  definition: WalkthroughDefinition,
  progress: WalkthroughProgress
): WalkthroughSession {
  const currentStep = progress.completed
    ? null
    : (definition.steps[progress.currentStepIndex] ?? null);
  const highlight =
    currentStep?.targetSelector != null && currentStep.targetSelector.length > 0
      ? Object.freeze([currentStep.targetSelector])
      : Object.freeze([]);
  return {
    definition,
    progress,
    currentStep,
    highlightControls: highlight,
  };
}

function baseProgress(input: {
  walkthroughId: string;
  userId: string;
  organizationId: string;
}): WalkthroughProgress {
  const now = new Date().toISOString();
  return {
    walkthroughId: input.walkthroughId,
    userId: input.userId,
    organizationId: input.organizationId,
    currentStepIndex: 0,
    completed: false,
    resumedAt: null,
    completedAt: null,
    updatedAt: now,
    status: "active",
    autoAdvance: false,
  };
}

export class MrJagWalkthroughEngine {
  start(input: {
    walkthroughId: string;
    userId: string;
    organizationId: string;
    autoAdvance?: boolean;
  }): WalkthroughSession | { error: string } {
    const definition = getWalkthrough(input.walkthroughId);
    if (!definition) return { error: "Walkthrough not found." };
    const now = new Date().toISOString();
    const existing = getWalkthroughProgress(
      input.organizationId,
      input.userId,
      input.walkthroughId
    );
    const progress =
      existing && !existing.completed && existing.status !== "skipped"
        ? setWalkthroughProgress({
            ...existing,
            status: "active",
            resumedAt: now,
            updatedAt: now,
            autoAdvance: input.autoAdvance ?? existing.autoAdvance ?? false,
          })
        : setWalkthroughProgress({
            ...baseProgress(input),
            autoAdvance: input.autoAdvance ?? false,
          });
    return session(definition, progress);
  }

  advance(input: {
    walkthroughId: string;
    userId: string;
    organizationId: string;
  }): WalkthroughSession | { error: string } {
    const definition = getWalkthrough(input.walkthroughId);
    if (!definition) return { error: "Walkthrough not found." };
    const current =
      getWalkthroughProgress(
        input.organizationId,
        input.userId,
        input.walkthroughId
      ) ?? baseProgress(input);

    if (current.status === "paused") {
      return { error: "Walkthrough is paused. Resume before advancing." };
    }
    if (current.status === "skipped" || current.completed) {
      return session(definition, current);
    }

    const nextIndex = current.currentStepIndex + 1;
    const done = nextIndex >= definition.steps.length;
    const now = new Date().toISOString();
    const progress = setWalkthroughProgress({
      ...current,
      currentStepIndex: done
        ? Math.max(0, definition.steps.length - 1)
        : nextIndex,
      completed: done,
      completedAt: done ? now : null,
      status: done ? "completed" : "active",
      updatedAt: now,
    });
    return session(definition, progress);
  }

  /** Advance when auto-advance is enabled and not paused. */
  advanceAutomatically(input: {
    walkthroughId: string;
    userId: string;
    organizationId: string;
  }): WalkthroughSession | { error: string } {
    const current = getWalkthroughProgress(
      input.organizationId,
      input.userId,
      input.walkthroughId
    );
    if (!current?.autoAdvance) {
      return { error: "Auto-advance is not enabled for this session." };
    }
    return this.advance(input);
  }

  setAutoAdvance(input: {
    walkthroughId: string;
    userId: string;
    organizationId: string;
    enabled: boolean;
  }): WalkthroughSession | { error: string } {
    const definition = getWalkthrough(input.walkthroughId);
    if (!definition) return { error: "Walkthrough not found." };
    const current =
      getWalkthroughProgress(
        input.organizationId,
        input.userId,
        input.walkthroughId
      ) ?? baseProgress(input);
    const progress = setWalkthroughProgress({
      ...current,
      autoAdvance: input.enabled,
      updatedAt: new Date().toISOString(),
    });
    return session(definition, progress);
  }

  pause(input: {
    walkthroughId: string;
    userId: string;
    organizationId: string;
  }): WalkthroughSession | { error: string } {
    const definition = getWalkthrough(input.walkthroughId);
    if (!definition) return { error: "Walkthrough not found." };
    const current =
      getWalkthroughProgress(
        input.organizationId,
        input.userId,
        input.walkthroughId
      ) ?? baseProgress(input);
    if (current.completed) return session(definition, current);
    const progress = setWalkthroughProgress({
      ...current,
      status: "paused",
      updatedAt: new Date().toISOString(),
    });
    return session(definition, progress);
  }

  resume(input: {
    walkthroughId: string;
    userId: string;
    organizationId: string;
  }): WalkthroughSession | { error: string } {
    const definition = getWalkthrough(input.walkthroughId);
    if (!definition) return { error: "Walkthrough not found." };
    const existing = getWalkthroughProgress(
      input.organizationId,
      input.userId,
      input.walkthroughId
    );
    if (!existing || existing.completed || existing.status === "skipped") {
      return this.start(input);
    }
    const now = new Date().toISOString();
    const progress = setWalkthroughProgress({
      ...existing,
      status: "active",
      resumedAt: now,
      updatedAt: now,
    });
    return session(definition, progress);
  }

  restart(input: {
    walkthroughId: string;
    userId: string;
    organizationId: string;
  }): WalkthroughSession | { error: string } {
    const definition = getWalkthrough(input.walkthroughId);
    if (!definition) return { error: "Walkthrough not found." };
    const progress = setWalkthroughProgress(baseProgress(input));
    return session(definition, progress);
  }

  skip(input: {
    walkthroughId: string;
    userId: string;
    organizationId: string;
  }): WalkthroughSession | { error: string } {
    const definition = getWalkthrough(input.walkthroughId);
    if (!definition) return { error: "Walkthrough not found." };
    const current =
      getWalkthroughProgress(
        input.organizationId,
        input.userId,
        input.walkthroughId
      ) ?? baseProgress(input);
    const now = new Date().toISOString();
    const progress = setWalkthroughProgress({
      ...current,
      status: "skipped",
      completed: false,
      completedAt: null,
      updatedAt: now,
    });
    return session(definition, progress);
  }

  markComplete(input: {
    walkthroughId: string;
    userId: string;
    organizationId: string;
  }): WalkthroughSession | { error: string } {
    const definition = getWalkthrough(input.walkthroughId);
    if (!definition) return { error: "Walkthrough not found." };
    const current =
      getWalkthroughProgress(
        input.organizationId,
        input.userId,
        input.walkthroughId
      ) ?? baseProgress(input);
    const now = new Date().toISOString();
    const progress = setWalkthroughProgress({
      ...current,
      currentStepIndex: Math.max(0, definition.steps.length - 1),
      completed: true,
      completedAt: now,
      status: "completed",
      updatedAt: now,
    });
    return session(definition, progress);
  }

  /** Context-aware: resolve walkthroughs for a page + optional persona filter. */
  forContext(input: {
    pageId: string;
    persona?: string | null;
  }): readonly WalkthroughDefinition[] {
    return Object.freeze(
      listWalkthroughs().filter((w) => {
        if (w.pageId !== input.pageId) return false;
        if (!input.persona) return true;
        return w.personas.some(
          (p) => p.toLowerCase() === input.persona!.toLowerCase()
        );
      })
    );
  }
}

export function createMrJagWalkthroughEngine(): MrJagWalkthroughEngine {
  return new MrJagWalkthroughEngine();
}
