import type { ClockProvider } from "@/applications/academyos/infrastructure/clock/types";

export function createFixedClockProvider(
  iso = "2026-08-01T12:00:00.000Z"
): ClockProvider & { set(next: string): void } {
  let current = iso;
  return {
    now: () => current,
    nowMs: () => Date.parse(current),
    set(next) {
      current = next;
    },
  };
}
