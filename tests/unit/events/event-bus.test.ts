import { beforeEach, describe, expect, it } from "vitest";
import "@/lib/platform/events";
import {
  clearEventAuditBuffer,
  createPlatformEventBus,
  resetEventEnvelopeSequence,
  resetPlatformEventBusRuntime,
} from "@/lib/platform/events";

describe("Sprint 024 — Platform Event Bus", () => {
  beforeEach(() => {
    resetPlatformEventBusRuntime();
    clearEventAuditBuffer();
    resetEventEnvelopeSequence();
  });

  it("publishes and delivers to prioritized subscribers", async () => {
    const bus = createPlatformEventBus();
    const order: string[] = [];

    bus.priority(5, async () => {
      order.push("low");
    }, { eventTypes: ["platform.entity.created"] });

    bus.priority(20, async () => {
      order.push("high");
    }, { eventTypes: ["platform.entity.created"] });

    await bus.publish({
      eventType: "platform.entity.created",
      entityType: "entity",
      entityId: "e1",
      organizationId: "org-1",
      requestId: "req-1",
    });

    expect(order).toEqual(["high", "low"]);
    expect(bus.metrics().published).toBe(1);
  });

  it("supports once and filters", async () => {
    const bus = createPlatformEventBus();
    let hits = 0;

    bus.once(async () => {
      hits += 1;
    }, { eventTypes: ["platform.entity.updated"] });

    bus.filters(
      [(e) => e.organizationId === "org-a"],
      async () => {
        hits += 10;
      },
      { eventTypes: ["platform.entity.updated"] }
    );

    await bus.publish({
      eventType: "platform.entity.updated",
      entityType: "entity",
      entityId: "e1",
      organizationId: "org-b",
    });
    await bus.publish({
      eventType: "platform.entity.updated",
      entityType: "entity",
      entityId: "e2",
      organizationId: "org-a",
    });

    // once fired on first publish; filter only on org-a (second)
    expect(hits).toBe(11);
  });

  it("publishMany and schedule/cancel/flushDue", async () => {
    const bus = createPlatformEventBus({
      now: (() => {
        let t = Date.parse("2026-01-01T00:00:00.000Z");
        return () => {
          const d = new Date(t);
          t += 60_000;
          return d;
        };
      })(),
    });

    let count = 0;
    bus.subscribe(async () => {
      count += 1;
    }, { eventTypes: ["platform.entity.created"] });

    await bus.publishMany([
      {
        eventType: "platform.entity.created",
        entityType: "entity",
        entityId: "a",
        organizationId: "org-1",
      },
      {
        eventType: "platform.entity.created",
        entityType: "entity",
        entityId: "b",
        organizationId: "org-1",
      },
    ]);
    expect(count).toBe(2);

    const scheduled = bus.schedule(
      {
        eventType: "platform.entity.created",
        entityType: "entity",
        entityId: "c",
        organizationId: "org-1",
      },
      "2026-01-01T00:00:00.000Z"
    );
    expect(bus.cancel(scheduled.scheduleId)).toBe(true);

    bus.schedule(
      {
        eventType: "platform.entity.created",
        entityType: "entity",
        entityId: "d",
        organizationId: "org-1",
      },
      "2026-01-01T00:00:00.000Z"
    );
    await bus.flushDue();
    expect(count).toBe(3);
  });
});
