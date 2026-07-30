/**
 * Sprint 212 — Progress + readiness scoring for executive onboarding.
 */

import {
  getStepDefinition,
  ONBOARDING_STEPS,
  TOTAL_ONBOARDING_MINUTES,
} from "./steps";
import type { OnboardingSession, OnboardingStepId } from "./types";
import { ONBOARDING_STEP_IDS } from "./types";

export type ProgressSnapshot = {
  readonly percentComplete: number;
  readonly completedCount: number;
  readonly remainingCount: number;
  readonly completedSteps: readonly OnboardingStepId[];
  readonly remainingSteps: readonly OnboardingStepId[];
  readonly estimatedMinutesRemaining: number;
  readonly readinessScore: number;
  readonly currentStepTitle: string;
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export const ProgressTracker = {
  compute(session: OnboardingSession): ProgressSnapshot {
    const completed = new Set(session.completedSteps);
    if (session.status === "completed") {
      ONBOARDING_STEP_IDS.forEach((id) => completed.add(id));
    }

    const completedSteps = ONBOARDING_STEP_IDS.filter((id) => completed.has(id));
    const remainingSteps = ONBOARDING_STEP_IDS.filter((id) => !completed.has(id));
    const percentComplete = Math.round(
      (completedSteps.length / ONBOARDING_STEP_IDS.length) * 100
    );

    const estimatedMinutesRemaining = remainingSteps.reduce(
      (sum, id) => sum + getStepDefinition(id).estimatedMinutes,
      0
    );

    const readinessScore = this.scoreReadiness(session, completed);

    return {
      percentComplete,
      completedCount: completedSteps.length,
      remainingCount: remainingSteps.length,
      completedSteps,
      remainingSteps,
      estimatedMinutesRemaining,
      readinessScore,
      currentStepTitle: getStepDefinition(session.currentStep).title,
    };
  },

  scoreReadiness(
    session: OnboardingSession,
    completed: ReadonlySet<OnboardingStepId> = new Set(session.completedSteps)
  ): number {
    let score = 10; // base for starting

    if (completed.has("welcome")) score += 5;
    if (session.organization.organizationName.trim()) score += 10;
    if (session.organization.subdomain.trim()) score += 8;
    if (session.organization.industry.trim()) score += 5;
    if (session.brand.primaryColor && session.brand.accentColor) score += 10;
    if (session.executives.length > 0) score += 10;
    if (session.mission.mission.trim()) score += 8;
    if (session.mission.goals.length > 0) score += 7;
    if (session.enabledCapabilityIds.length >= 3) score += 12;
    if (session.connectors.some((c) => c.selected || c.connected)) score += 10;
    if (completed.has("review")) score += 5;
    if (session.status === "completed" || completed.has("generate_workspace")) {
      score += 10;
    }

    return clamp(score, 0, 100);
  },

  totalEstimatedMinutes(): number {
    return TOTAL_ONBOARDING_MINUTES;
  },

  catalog() {
    return ONBOARDING_STEPS;
  },
};
