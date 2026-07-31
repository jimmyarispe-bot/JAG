import type { ClockProvider } from "@/applications/academyos/infrastructure/clock/types";

export function createSystemClockProvider(): ClockProvider {
  return {
    now: () => new Date().toISOString(),
    nowMs: () => Date.now(),
  };
}
