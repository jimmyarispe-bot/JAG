/**
 * Sprint 212 — Onboarding workspace loader for Command Center.
 */

import {
  ExecutiveOnboardingService,
  ONBOARDING_STEPS,
  ProgressTracker,
  type OnboardingObservation,
  type OnboardingSession,
  type OnboardingTask,
  type ProgressSnapshot,
  type WelcomeContent,
} from "@/lib/platform/onboarding";
import type { JagPlatformSession } from "@/lib/jag-platform/session";
import { JAG_INDUSTRIES } from "@/lib/jag-business/industries";

export type JagOnboardingWorkspace = {
  readonly session: OnboardingSession;
  readonly progress: ProgressSnapshot;
  readonly welcome: WelcomeContent;
  readonly steps: typeof ONBOARDING_STEPS;
  readonly capabilities: readonly {
    id: string;
    label: string;
    description: string;
  }[];
  readonly industries: readonly { id: string; name: string }[];
  readonly tasks: readonly OnboardingTask[];
  readonly observations: readonly OnboardingObservation[];
  readonly dropOffPoints: Readonly<Record<string, number>>;
  readonly totalEstimatedMinutes: number;
};

export function loadOnboardingWorkspace(
  platformSession: JagPlatformSession
): JagOnboardingWorkspace {
  const session = ExecutiveOnboardingService.getOrCreateSession({
    ownerUserId: platformSession.userId,
    ownerEmail: platformSession.email,
    displayName: platformSession.displayName,
  });

  const progress = ProgressTracker.compute(session);

  return {
    session,
    progress,
    welcome: ExecutiveOnboardingService.welcome(),
    steps: ONBOARDING_STEPS,
    capabilities: ExecutiveOnboardingService.listDiscoverableCapabilities(),
    industries: JAG_INDUSTRIES.map((i) => ({ id: i.id, name: i.name })),
    tasks: ExecutiveOnboardingService.inboxTasks(session.organizationId),
    observations: ExecutiveOnboardingService.observations(session.id, 20),
    dropOffPoints: ExecutiveOnboardingService.dropOffPoints(),
    totalEstimatedMinutes: ProgressTracker.totalEstimatedMinutes(),
  };
}
