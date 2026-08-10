"use server";

import { getJagPlatformSession } from "@/lib/jag-platform/server-session";
import { answerLearningCoach, searchLearningHelp } from "./coach";
import { withResolvedJagLearnTutorialVideo } from "./media/resolve";
import {
  advanceTutorialStep,
  assertOwnProgressAccess,
  completeLearningOnboarding,
  completeTutorial,
  getAccessibleTutorial,
  getTutorialProgressForUser,
  loadLearningHome,
  loadLearningPreferences,
  skipLearningOnboarding,
  startLearningOnboarding,
  startOrResumeTutorial,
} from "./service";
import {
  advanceJagWalkthrough,
  getJagWalkthrough,
  pauseJagWalkthrough,
  previousJagWalkthrough,
  resumeJagWalkthrough,
  skipJagWalkthrough,
  startJagWalkthroughSession,
} from "./walkthrough";

/** Authorization org comes from the signed session only. */
function sessionOrg(sessionOrganizationId: string | null): string | null {
  return sessionOrganizationId;
}

export async function getLearningHomeAction(input?: {
  organizationId?: string | null;
}) {
  const session = await getJagPlatformSession();
  if (!session) return { ok: false as const, error: "unauthorized" };
  void input?.organizationId;
  const model = await loadLearningHome(session, sessionOrg(session.organizationId));
  return { ok: true as const, model };
}

export async function getLearningPreferencesAction() {
  const session = await getJagPlatformSession();
  if (!session) return { ok: false as const, error: "unauthorized" };
  try {
    const preferences = await loadLearningPreferences(session);
    return { ok: true as const, preferences };
  } catch {
    return { ok: false as const, error: "persistence_unavailable" };
  }
}

export async function startLearningOnboardingAction() {
  const session = await getJagPlatformSession();
  if (!session) return { ok: false as const, error: "unauthorized" };
  try {
    const preferences = await startLearningOnboarding(session);
    return { ok: true as const, preferences };
  } catch {
    return { ok: false as const, error: "persistence_unavailable" };
  }
}

export async function skipLearningOnboardingAction() {
  const session = await getJagPlatformSession();
  if (!session) return { ok: false as const, error: "unauthorized" };
  try {
    const preferences = await skipLearningOnboarding(session);
    return { ok: true as const, preferences };
  } catch {
    return { ok: false as const, error: "persistence_unavailable" };
  }
}

export async function completeLearningOnboardingAction() {
  const session = await getJagPlatformSession();
  if (!session) return { ok: false as const, error: "unauthorized" };
  try {
    const preferences = await completeLearningOnboarding(session);
    return { ok: true as const, preferences };
  } catch {
    return { ok: false as const, error: "persistence_unavailable" };
  }
}

export async function getTutorialAction(input: {
  slug: string;
  organizationId?: string | null;
}) {
  const session = await getJagPlatformSession();
  if (!session) return { ok: false as const, error: "unauthorized" };
  void input.organizationId;
  const tutorial = await getAccessibleTutorial(
    session,
    input.slug,
    sessionOrg(session.organizationId)
  );
  if (!tutorial) return { ok: false as const, error: "forbidden" };
  const progress = await getTutorialProgressForUser(session, tutorial.id);
  const tutorialWithPlayback = await withResolvedJagLearnTutorialVideo(tutorial);
  return { ok: true as const, tutorial: tutorialWithPlayback, progress };
}

export async function startTutorialAction(input: {
  slug: string;
  organizationId?: string | null;
}) {
  const session = await getJagPlatformSession();
  if (!session) return { ok: false as const, error: "unauthorized" };
  try {
    void input.organizationId;
    const result = await startOrResumeTutorial(
      session,
      input.slug,
      sessionOrg(session.organizationId)
    );
    return { ok: true as const, ...result };
  } catch {
    return { ok: false as const, error: "forbidden" };
  }
}

export async function advanceTutorialAction(input: {
  slug: string;
  direction: "next" | "previous";
  organizationId?: string | null;
}) {
  const session = await getJagPlatformSession();
  if (!session) return { ok: false as const, error: "unauthorized" };
  try {
    void input.organizationId;
    const result = await advanceTutorialStep(
      session,
      input.slug,
      sessionOrg(session.organizationId),
      input.direction
    );
    return { ok: true as const, ...result };
  } catch {
    return { ok: false as const, error: "forbidden" };
  }
}

export async function completeTutorialAction(input: {
  slug: string;
  organizationId?: string | null;
}) {
  const session = await getJagPlatformSession();
  if (!session) return { ok: false as const, error: "unauthorized" };
  try {
    void input.organizationId;
    const result = await completeTutorial(
      session,
      input.slug,
      sessionOrg(session.organizationId)
    );
    return { ok: true as const, ...result };
  } catch {
    return { ok: false as const, error: "forbidden" };
  }
}

/** Rejects client-supplied userId spoofing. */
export async function getOwnProgressAction(input?: {
  userId?: string | null;
}) {
  const session = await getJagPlatformSession();
  if (!session) return { ok: false as const, error: "unauthorized" };
  try {
    await assertOwnProgressAccess(session, input?.userId);
  } catch {
    return { ok: false as const, error: "forbidden" };
  }
  const { getLearningPersistence } = await import("./store");
  const progress = await getLearningPersistence().listProgress(session.userId);
  return { ok: true as const, progress };
}

export async function askLearningCoachAction(input: {
  question: string;
  pathname?: string | null;
  organizationId?: string | null;
  /** Ignored — persona/role must come from session. */
  persona?: string | null;
  role?: string | null;
  userId?: string | null;
}) {
  const session = await getJagPlatformSession();
  if (!session) return { ok: false as const, error: "unauthorized" };
  // Explicitly ignore client identity spoof fields.
  void input.persona;
  void input.role;
  void input.userId;
  const answer = await answerLearningCoach({
    session,
    question: input.question,
    activeOrganizationId: session.organizationId,
    pathname: input.pathname ?? null,
  });
  return { ok: true as const, answer };
}

export async function searchLearningHelpAction(input: {
  query: string;
  organizationId?: string | null;
}) {
  const session = await getJagPlatformSession();
  if (!session) return { ok: false as const, error: "unauthorized" };
  const results = searchLearningHelp({
    session,
    query: input.query,
    activeOrganizationId: session.organizationId,
  });
  return { ok: true as const, ...results };
}

export async function walkthroughControlAction(input: {
  walkthroughId: string;
  action: "start" | "next" | "previous" | "pause" | "resume" | "skip";
  currentStepIndex?: number;
}) {
  const session = await getJagPlatformSession();
  if (!session) return { ok: false as const, error: "unauthorized" };
  const def = getJagWalkthrough(input.walkthroughId);
  if (!def) return { ok: false as const, error: "not_found" };
  const base = {
    walkthroughId: input.walkthroughId,
    userId: session.userId,
    organizationId: session.organizationId ?? "jag-learn",
  };
  let result;
  switch (input.action) {
    case "start":
      result = startJagWalkthroughSession(base);
      break;
    case "next":
      result = advanceJagWalkthrough(base);
      break;
    case "previous":
      result = previousJagWalkthrough({
        ...base,
        currentStepIndex: input.currentStepIndex ?? 0,
      });
      break;
    case "pause":
      result = pauseJagWalkthrough(base);
      break;
    case "resume":
      result = resumeJagWalkthrough(base);
      break;
    case "skip":
      result = skipJagWalkthrough(base);
      break;
    default:
      return { ok: false as const, error: "bad_action" };
  }
  if ("error" in result) return { ok: false as const, error: result.error };
  return {
    ok: true as const,
    currentStepIndex: result.progress.currentStepIndex,
    completed: result.progress.completed,
    status: result.progress.status,
    highlightControls: result.highlightControls,
    currentStep: result.currentStep,
  };
}
