import { beforeEach, describe, expect, it } from "vitest";
import "@/lib/platform/events";
import {
  clearEventAuditBuffer,
  createPlatformEventBus,
  deadLetterCount,
  resetEventEnvelopeSequence,
  resetPlatformEventBusRuntime,
  setEventDispatchMaxRetries,
} from "@/lib/platform/events";

describe("Sprint 024 — delivery retry and DLQ", () => {
  beforeEach(() => {
    resetPlatformEventBusRuntime();
    clearEventAuditBuffer();
    resetEventEnvelopeSequence();
  });

  it("retries then dead-letters exhausted failures", async () => {
    setEventDispatchMaxRetries(2);
    const bus = createPlatformEventBus({ maxRetryAttempts: 2 });
    let attempts = 0;

    bus.subscribe(async () => {
      attempts += 1;
      throw new Error("boom");
    }, { eventTypes: ["platform.rules.evaluated"] });

    const result = await bus.publish({
      eventType: "platform.rules.evaluated",
      entityType: "rule_evaluation",
      entityId: "r1",
      organizationId: "org-1",
    });

    expect(attempts).toBe(2);
    expect(result.syncResults[0]?.success).toBe(false);
    expect(deadLetterCount()).toBe(1);
    expect(bus.metrics().retries).toBeGreaterThanOrEqual(1);
    expect(bus.metrics().deadLetters).toBe(1);
  });
});
