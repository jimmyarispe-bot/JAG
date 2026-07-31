import type { AcademyClock } from "@/applications/academyos/composition/types";

/** Deterministic clock for tests. */
export function createTestClock(fixedIso = "2026-08-01T12:00:00.000Z"): AcademyClock & {
  set(iso: string): void;
} {
  let current = fixedIso;
  return {
    now: () => current,
    set(iso: string) {
      current = iso;
    },
  };
}
