/**
 * Sprint 212 — Onboarding state machine (step transitions + pause/resume).
 */

import { nextStepId, previousStepId } from "./steps";
import type {
  OnboardingSession,
  OnboardingStatus,
  OnboardingStepId,
} from "./types";
import { ONBOARDING_STEP_IDS } from "./types";

export type TransitionResult =
  | { readonly ok: true; readonly session: OnboardingSession }
  | { readonly ok: false; readonly error: string };

function withUpdated(
  session: OnboardingSession,
  patch: Partial<OnboardingSession>
): OnboardingSession {
  return {
    ...session,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
}

export const OnboardingStateMachine = {
  canEnter(step: OnboardingStepId, session: OnboardingSession): boolean {
    if (session.status === "completed") return step === "generate_workspace";
    const idx = ONBOARDING_STEP_IDS.indexOf(step);
    const currentIdx = ONBOARDING_STEP_IDS.indexOf(session.currentStep);
    if (idx <= currentIdx) return true;
    // May advance one step ahead if prior steps completed.
    const prior = ONBOARDING_STEP_IDS.slice(0, idx);
    return prior.every((id) => session.completedSteps.includes(id));
  },

  enterStep(session: OnboardingSession, step: OnboardingStepId): TransitionResult {
    if (!this.canEnter(step, session)) {
      return { ok: false, error: `Cannot enter step "${step}" yet.` };
    }
    if (session.status === "completed") {
      return { ok: false, error: "Onboarding already completed." };
    }
    return {
      ok: true,
      session: withUpdated(session, {
        currentStep: step,
        status: session.status === "paused" ? "in_progress" : session.status === "not_started" ? "in_progress" : session.status,
      }),
    };
  },

  completeStep(
    session: OnboardingSession,
    step: OnboardingStepId
  ): TransitionResult {
    if (session.currentStep !== step && !session.completedSteps.includes(step)) {
      // Allow completing current or already-visited steps.
      if (session.currentStep !== step) {
        return { ok: false, error: `Active step is ${session.currentStep}.` };
      }
    }
    const completed = session.completedSteps.includes(step)
      ? session.completedSteps
      : [...session.completedSteps, step];
    const next = nextStepId(step);
    return {
      ok: true,
      session: withUpdated(session, {
        completedSteps: completed,
        currentStep: next ?? step,
        status: "in_progress",
        lastError: null,
      }),
    };
  },

  goBack(session: OnboardingSession): TransitionResult {
    const prev = previousStepId(session.currentStep);
    if (!prev) return { ok: false, error: "Already at the first step." };
    return {
      ok: true,
      session: withUpdated(session, { currentStep: prev, status: "in_progress" }),
    };
  },

  pause(session: OnboardingSession): TransitionResult {
    if (session.status === "completed") {
      return { ok: false, error: "Cannot pause a completed session." };
    }
    return {
      ok: true,
      session: withUpdated(session, { status: "paused" satisfies OnboardingStatus }),
    };
  },

  resume(session: OnboardingSession): TransitionResult {
    if (session.status === "completed") {
      return { ok: false, error: "Onboarding already completed." };
    }
    return {
      ok: true,
      session: withUpdated(session, { status: "in_progress" }),
    };
  },

  markCompleted(session: OnboardingSession): OnboardingSession {
    return withUpdated(session, {
      status: "completed",
      completedAt: new Date().toISOString(),
      currentStep: "generate_workspace",
      completedSteps: ONBOARDING_STEP_IDS.slice(),
      estimatedMinutesRemaining: 0,
      readinessScore: Math.max(session.readinessScore, 95),
      lastError: null,
    });
  },

  markFailed(session: OnboardingSession, error: string): OnboardingSession {
    return withUpdated(session, {
      status: "failed",
      lastError: error,
    });
  },
};
