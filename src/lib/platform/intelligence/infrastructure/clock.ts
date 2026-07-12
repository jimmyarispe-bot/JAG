/**
 * Intelligence Platform Infrastructure — shared clock helpers (Sprint 027).
 */

import type { IntelligencePlatformClock } from "@/lib/platform/intelligence/infrastructure/contracts";

let seq = 0;

export function createDefaultClock(
  overrides: Partial<IntelligencePlatformClock> = {}
): IntelligencePlatformClock {
  return {
    now: overrides.now ?? (() => new Date()),
    createId:
      overrides.createId ??
      ((prefix: string) => {
        seq += 1;
        return `${prefix}-${Date.now().toString(36)}-${seq.toString(36)}`;
      }),
  };
}

/** Test helper — reset id sequence. */
export function resetPlatformIdSeqForTests(): void {
  seq = 0;
}
