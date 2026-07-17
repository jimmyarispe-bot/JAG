import { beforeEach, describe, expect, it } from "vitest";
import "@/lib/platform/events";
import {
  clearEventAuditBuffer,
  createPlatformEventBus,
  discoverEventDefinitions,
  resetEventEnvelopeSequence,
  resetPlatformEventBusRuntime,
} from "@/lib/platform/events";

describe("Sprint 024 — analytics and registry discovery", () => {
  beforeEach(() => {
    resetPlatformEventBusRuntime();
    clearEventAuditBuffer();
    resetEventEnvelopeSequence();
  });

  it("tracks publish metrics and discovers category events", async () => {
    const bus = createPlatformEventBus();
    bus.subscribe(async () => undefined, {
      eventTypes: ["connector.sync.completed"],
    });

    await bus.publish({
      eventType: "connector.sync.completed",
      entityType: "connector_instance",
      entityId: "c1",
      organizationId: "org-1",
      metadata: { category: "connector" },
    });

    const metrics = bus.metrics();
    expect(metrics.published).toBe(1);
    expect(metrics.subscriberInvocations).toBeGreaterThanOrEqual(1);

    const connectors = discoverEventDefinitions({ category: "connector" });
    expect(connectors.some((d) => d.eventType === "connector.sync.completed")).toBe(
      true
    );
  });
});
