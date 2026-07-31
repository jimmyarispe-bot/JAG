/**
 * Process-level AcademyOS boot — exactly once per Node runtime.
 * Called from Next.js instrumentation; safe to call again (idempotent).
 *
 * `composition/bootstrap` binds the starter on import (avoids require cycles).
 */

import type { AcademyStartupResult } from "@/applications/academyos/composition/bootstrap";
import type { AcademyHealthReport } from "@/applications/academyos/composition/startup-health";
import type { AcademyContainer } from "@/applications/academyos/composition/types";

let startup: AcademyStartupResult | null = null;
let starter: (() => AcademyStartupResult) | null = null;

/** Called by composition/bootstrap when that module loads. */
export function bindAcademyOSStarter(fn: () => AcademyStartupResult): void {
  starter = fn;
}

/** Record a startup produced by startAcademyOS (including tests). */
export function recordAcademyOSStartup(result: AcademyStartupResult): void {
  startup = result;
}

/**
 * Ensure AcademyOS has been started in this process.
 * Never re-runs composition when already booted.
 */
export function ensureAcademyOSBooted(): AcademyStartupResult {
  if (startup?.container.ready) {
    return startup;
  }
  if (!starter) {
    throw new Error(
      "AcademyOS starter not bound. Import @/applications/academyos/composition/bootstrap before ensureAcademyOSBooted()."
    );
  }
  startup = starter();
  return startup;
}

export function getAcademyOSStartup(): AcademyStartupResult | null {
  return startup;
}

export function getAcademyOSHealth(): AcademyHealthReport | null {
  return startup?.health ?? null;
}

export function getAcademyOSContainer(): AcademyContainer | null {
  return startup?.container ?? null;
}

/** Test helper — clears process boot state (keeps starter binding). */
export function resetAcademyOSBootForTests(): void {
  startup = null;
}
