import { beforeEach, describe, expect, it } from "vitest";
import "@/lib/platform/events";
import {
  EventSecurityError,
  clearEventAuditBuffer,
  createPlatformEventBus,
  resetEventEnvelopeSequence,
  resetPlatformEventBusRuntime,
} from "@/lib/platform/events";

describe("Sprint 024 — event security", () => {
  beforeEach(() => {
    resetPlatformEventBusRuntime();
    clearEventAuditBuffer();
    resetEventEnvelopeSequence();
  });

  it("enforces organization requirement and subscriber isolation", async () => {
    const bus = createPlatformEventBus({
      security: { requireOrganizationId: true },
    });

    await expect(
      bus.publish({
        eventType: "platform.entity.created",
        entityType: "entity",
        entityId: "x",
      })
    ).rejects.toBeInstanceOf(EventSecurityError);

    let hits = 0;
    bus.subscribe(
      async () => {
        hits += 1;
      },
      {
        eventTypes: ["platform.entity.created"],
        organizationIds: ["org-allowed"],
      }
    );

    await bus.publish({
      eventType: "platform.entity.created",
      entityType: "entity",
      entityId: "y",
      organizationId: "org-other",
    });
    expect(hits).toBe(0);

    await bus.publish({
      eventType: "platform.entity.created",
      entityType: "entity",
      entityId: "z",
      organizationId: "org-allowed",
      correlationId: "corr-1",
      requestId: "req-1",
    });
    expect(hits).toBe(1);
  });
});
