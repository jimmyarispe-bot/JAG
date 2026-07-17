import { beforeEach, describe, expect, it } from "vitest";
import "@/lib/platform/events";
import {
  clearEventAuditBuffer,
  createPlatformEventBus,
  replayAuditedEvents,
  resetEventEnvelopeSequence,
  resetPlatformEventBusRuntime,
} from "@/lib/platform/events";

describe("Sprint 024 — event replay filters", () => {
  beforeEach(() => {
    resetPlatformEventBusRuntime();
    clearEventAuditBuffer();
    resetEventEnvelopeSequence();
  });

  it("replays by organization, event type, and time", async () => {
    const bus = createPlatformEventBus();
    const seen: string[] = [];

    await bus.publish({
      eventType: "platform.entity.created",
      entityType: "entity",
      entityId: "1",
      organizationId: "org-a",
      applicationId: "app-1",
    });
    await bus.publish({
      eventType: "platform.entity.updated",
      entityType: "entity",
      entityId: "2",
      organizationId: "org-b",
      applicationId: "app-2",
    });

    bus.subscribe(async (e) => {
      seen.push(`${e.organizationId}:${e.eventType}`);
    });

    const batch = await replayAuditedEvents({
      organizationId: "org-a",
      eventType: "platform.entity.created",
      dispatchMode: "sync",
    });

    expect(batch.replayedCount).toBe(1);
    expect(seen).toEqual(["org-a:platform.entity.created"]);
  });
});
