/**
 * Client-safe preference presentation helpers (no I/O, no server imports).
 */

import type { JagLearnUserPreferences } from "./types";

/** True when the first-login welcome should be shown. */
export function shouldShowFirstLoginWelcome(
  prefs: JagLearnUserPreferences
): boolean {
  if (prefs.firstLoginCompleted) return false;
  if (prefs.onboardingSkippedAt) return false;
  if (prefs.onboardingCompletedAt) return false;
  return true;
}
