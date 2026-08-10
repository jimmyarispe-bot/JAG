/**
 * JAG Learning Center application service — session-bound.
 */

import type { JagPlatformSession } from "@/lib/jag-platform/session";
import {
  canAccessJagLearningCenter,
  canAccessTutorial,
  filterAccessibleTutorials,
  recommendTutorials,
} from "./authorization";
import { JAG_LEARN_TUTORIALS, getCatalogTutorialBySlug } from "./catalog";
import { getLearningPersistence } from "./store";
import { shouldShowFirstLoginWelcome } from "./preferences-helpers";
import type {
  JagLearnTutorial,
  JagLearnUserPreferences,
  JagLearnUserProgress,
  LearningHomeModel,
} from "./types";

export type { LearningHomeModel };
export { shouldShowFirstLoginWelcome };

function assertLearningAccess(session: JagPlatformSession): void {
  if (!canAccessJagLearningCenter(session)) {
    throw new Error("Learning Center is not available for this account.");
  }
}

export async function loadLearningPreferences(
  session: JagPlatformSession
): Promise<JagLearnUserPreferences> {
  assertLearningAccess(session);
  const store = getLearningPersistence();
  return store.ensurePreferences(session.userId);
}

export async function startLearningOnboarding(
  session: JagPlatformSession
): Promise<JagLearnUserPreferences> {
  assertLearningAccess(session);
  const store = getLearningPersistence();
  const now = new Date().toISOString();
  return store.updatePreferences(session.userId, {
    firstLoginCompleted: true,
    onboardingStartedAt: now,
  });
}

export async function skipLearningOnboarding(
  session: JagPlatformSession
): Promise<JagLearnUserPreferences> {
  assertLearningAccess(session);
  const store = getLearningPersistence();
  const now = new Date().toISOString();
  return store.updatePreferences(session.userId, {
    firstLoginCompleted: true,
    onboardingSkippedAt: now,
  });
}

export async function completeLearningOnboarding(
  session: JagPlatformSession
): Promise<JagLearnUserPreferences> {
  assertLearningAccess(session);
  const store = getLearningPersistence();
  const now = new Date().toISOString();
  return store.updatePreferences(session.userId, {
    firstLoginCompleted: true,
    onboardingCompletedAt: now,
  });
}

export async function listAccessibleTutorials(
  session: JagPlatformSession,
  activeOrganizationId: string | null
): Promise<JagLearnTutorial[]> {
  assertLearningAccess(session);
  return filterAccessibleTutorials(
    session,
    JAG_LEARN_TUTORIALS,
    activeOrganizationId
  );
}

export async function getAccessibleTutorial(
  session: JagPlatformSession,
  slug: string,
  activeOrganizationId: string | null
): Promise<JagLearnTutorial | null> {
  assertLearningAccess(session);
  const tutorial = getCatalogTutorialBySlug(slug);
  if (!tutorial) return null;
  if (!canAccessTutorial(session, tutorial, activeOrganizationId)) return null;
  return tutorial;
}

export async function getTutorialProgressForUser(
  session: JagPlatformSession,
  tutorialId: string
): Promise<JagLearnUserProgress | null> {
  assertLearningAccess(session);
  return getLearningPersistence().getProgress(session.userId, tutorialId);
}

export async function startOrResumeTutorial(
  session: JagPlatformSession,
  slug: string,
  activeOrganizationId: string | null
): Promise<{ tutorial: JagLearnTutorial; progress: JagLearnUserProgress }> {
  const tutorial = await getAccessibleTutorial(
    session,
    slug,
    activeOrganizationId
  );
  if (!tutorial) {
    throw new Error("Tutorial not found or not authorized.");
  }
  const store = getLearningPersistence();
  const existing = await store.getProgress(session.userId, tutorial.id);
  if (existing?.status === "completed") {
    return { tutorial, progress: existing };
  }
  const now = new Date().toISOString();
  const progress = await store.upsertProgress({
    userId: session.userId,
    tutorialId: tutorial.id,
    status: "in_progress",
    progressPercent: existing?.progressPercent ?? 0,
    currentStep: existing?.currentStep ?? 0,
    startedAt: existing?.startedAt ?? now,
    completedAt: null,
  });
  return { tutorial, progress };
}

export async function advanceTutorialStep(
  session: JagPlatformSession,
  slug: string,
  activeOrganizationId: string | null,
  direction: "next" | "previous"
): Promise<{ tutorial: JagLearnTutorial; progress: JagLearnUserProgress }> {
  const tutorial = await getAccessibleTutorial(
    session,
    slug,
    activeOrganizationId
  );
  if (!tutorial) {
    throw new Error("Tutorial not found or not authorized.");
  }
  const store = getLearningPersistence();
  const existing =
    (await store.getProgress(session.userId, tutorial.id)) ??
    (await store.upsertProgress({
      userId: session.userId,
      tutorialId: tutorial.id,
      status: "in_progress",
      progressPercent: 0,
      currentStep: 0,
      startedAt: new Date().toISOString(),
    }));

  const maxStep = Math.max(0, tutorial.content.steps.length - 1);
  let step = existing.currentStep;
  if (direction === "next") step = Math.min(maxStep, step + 1);
  else step = Math.max(0, step - 1);

  const total = tutorial.content.steps.length || 1;
  const percent = Math.round(((step + 1) / total) * 100);
  const completed = direction === "next" && step >= maxStep;
  const now = new Date().toISOString();

  const progress = await store.upsertProgress({
    userId: session.userId,
    tutorialId: tutorial.id,
    status: completed ? "completed" : "in_progress",
    progressPercent: completed ? 100 : percent,
    currentStep: step,
    startedAt: existing.startedAt ?? now,
    completedAt: completed ? now : null,
  });
  return { tutorial, progress };
}

export async function completeTutorial(
  session: JagPlatformSession,
  slug: string,
  activeOrganizationId: string | null
): Promise<{ tutorial: JagLearnTutorial; progress: JagLearnUserProgress }> {
  const tutorial = await getAccessibleTutorial(
    session,
    slug,
    activeOrganizationId
  );
  if (!tutorial) {
    throw new Error("Tutorial not found or not authorized.");
  }
  const now = new Date().toISOString();
  const store = getLearningPersistence();
  const existing = await store.getProgress(session.userId, tutorial.id);
  const progress = await store.upsertProgress({
    userId: session.userId,
    tutorialId: tutorial.id,
    status: "completed",
    progressPercent: 100,
    currentStep: Math.max(0, tutorial.content.steps.length - 1),
    startedAt: existing?.startedAt ?? now,
    completedAt: now,
  });
  return { tutorial, progress };
}

export async function loadLearningHome(
  session: JagPlatformSession,
  activeOrganizationId: string | null
): Promise<LearningHomeModel> {
  assertLearningAccess(session);
  const store = getLearningPersistence();
  const preferences = await store.ensurePreferences(session.userId);
  const accessible = filterAccessibleTutorials(
    session,
    JAG_LEARN_TUTORIALS,
    activeOrganizationId
  );
  const allProgress = await store.listProgress(session.userId);
  const inProgress = allProgress
    .filter((p) => p.status === "in_progress")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];

  let continueLearning: LearningHomeModel["continueLearning"] = null;
  if (inProgress) {
    const tutorial = accessible.find((t) => t.id === inProgress.tutorialId);
    if (tutorial) {
      continueLearning = { tutorial, progress: inProgress };
    }
  }

  return {
    preferences,
    showFirstLoginWelcome: shouldShowFirstLoginWelcome(preferences),
    continueLearning,
    recommended: recommendTutorials(
      session,
      accessible,
      activeOrganizationId,
      4
    ),
    essentials: accessible.filter((t) => t.category === "essentials"),
    orientation: accessible.filter((t) => t.category === "orientation"),
  };
}

/** Reject attempts to read another user's progress. */
export async function assertOwnProgressAccess(
  session: JagPlatformSession,
  requestedUserId: string | null | undefined
): Promise<void> {
  assertLearningAccess(session);
  if (requestedUserId && requestedUserId !== session.userId) {
    throw new Error("Cannot access another user's learning progress.");
  }
}
