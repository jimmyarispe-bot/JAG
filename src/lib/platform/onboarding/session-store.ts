/**
 * Sprint 212 — In-memory onboarding session store (resume support).
 */

import type { OnboardingSession } from "./types";

const byId = new Map<string, OnboardingSession>();
const byOwner = new Map<string, string>();

export function saveOnboardingSession(session: OnboardingSession): OnboardingSession {
  byId.set(session.id, session);
  byOwner.set(session.ownerUserId, session.id);
  return session;
}

export function getOnboardingSession(id: string): OnboardingSession | null {
  return byId.get(id) ?? null;
}

export function getOnboardingSessionForOwner(
  ownerUserId: string
): OnboardingSession | null {
  const id = byOwner.get(ownerUserId);
  if (!id) return null;
  return byId.get(id) ?? null;
}

export function listOnboardingSessions(): readonly OnboardingSession[] {
  return Array.from(byId.values());
}

/** Restore a previously persisted session (e.g. client snapshot after cold start). */
export function restoreOnboardingSession(
  session: OnboardingSession
): OnboardingSession {
  return saveOnboardingSession(session);
}

export function resetOnboardingSessionsForTests(): void {
  byId.clear();
  byOwner.clear();
}
