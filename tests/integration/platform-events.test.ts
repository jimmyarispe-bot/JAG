import { beforeEach, describe, expect, it, vi } from "vitest";
import "@/lib/platform/events";
import {
  PLATFORM_EVENT_CATALOG,
  PLATFORM_REFERENCE_EVENT_DEFINITIONS,
  buildEventEnvelope,
  clearAsyncEventQueue,
  clearEventAuditBuffer,
  clearEventSubscribers,
  getActiveEventDefinitions,
  getEventAuditEntries,
  getEventDefinitionsByDomain,
  getEventRegistrySnapshot,
  isEventRegistryRegistered,
  previewEventSubscribers,
  publishEvent,
  registerEventSubscriber,
  replayAuditedEvents,
  replayEventById,
  resetEventEnvelopeSequence,
  subscribeToEvents,
  unsubscribeFromEvents,
  validateEventRegistry,
} from "@/lib/platform/events";

describe("Platform event registry validation", () => {
  it("passes build-time integrity checks", () => {
    const result = validateEventRegistry();
    expect(result.ok).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("registers reference definitions on side-effect import", () => {
    expect(isEventRegistryRegistered()).toBe(true);
    expect(getActiveEventDefinitions().length).toBeGreaterThanOrEqual(5);
  });
});

describe("Platform event catalog", () => {
  it("defines reference events across domains", () => {
    const domains = new Set(PLATFORM_REFERENCE_EVENT_DEFINITIONS.map((d) => d.domain));
    expect(domains.has("platform")).toBe(true);
    expect(domains.has("operations")).toBe(true);
    expect(getEventDefinitionsByDomain("platform")).toHaveLength(4);
    expect(PLATFORM_EVENT_CATALOG.length).toBeGreaterThanOrEqual(5);
  });

  it("returns a complete registry snapshot", () => {
    const snapshot = getEventRegistrySnapshot();
    expect(snapshot.definitions.length).toBeGreaterThanOrEqual(5);
    expect(snapshot.domains.length).toBeGreaterThanOrEqual(2);
    expect(snapshot.registeredAt).toBeTruthy();
  });
});

describe("Platform event envelope", () => {
  beforeEach(() => {
    resetEventEnvelopeSequence();
  });

  it("builds a complete envelope with required fields", () => {
    const envelope = buildEventEnvelope({
      eventType: "platform.entity.created",
      entityType: "student",
      entityId: "stu_1",
      organizationId: "org_1",
      schoolId: "school_1",
      actorId: "user_1",
      payload: { name: "Test" },
      correlationId: "corr_test",
      causationId: "cause_test",
      definitionVersion: 1,
      dispatchMode: "sync",
      scope: "internal",
    });

    expect(envelope.eventId).toBeTruthy();
    expect(envelope.eventType).toBe("platform.entity.created");
    expect(envelope.entityType).toBe("student");
    expect(envelope.entityId).toBe("stu_1");
    expect(envelope.organizationId).toBe("org_1");
    expect(envelope.schoolId).toBe("school_1");
    expect(envelope.actorId).toBe("user_1");
    expect(envelope.timestamp).toBeTruthy();
    expect(envelope.payload.name).toBe("Test");
    expect(envelope.metadata.deliveryMode).toBe("sync");
    expect(envelope.metadata.scope).toBe("internal");
    expect(envelope.version).toBe(1);
    expect(envelope.correlationId).toBe("corr_test");
    expect(envelope.causationId).toBe("cause_test");
  });
});

describe("Platform event publisher and subscriber API", () => {
  beforeEach(() => {
    clearEventSubscribers();
    clearEventAuditBuffer();
    clearAsyncEventQueue();
    resetEventEnvelopeSequence();
  });

  it("publishes sync events to matching subscribers", async () => {
    const handler = vi.fn();
    subscribeToEvents({
      subscriberKey: "test_sync_consumer",
      eventTypes: ["platform.entity.created"],
      dispatchModes: ["sync"],
      handler,
    });

    const result = await publishEvent({
      eventType: "platform.entity.created",
      entityType: "student",
      entityId: "stu_1",
      organizationId: "org_1",
      schoolId: "school_1",
      actorId: "user_1",
      payload: { action: "create" },
    });

    expect(result.dispatched).toBe(true);
    expect(result.dispatchMode).toBe("sync");
    expect(result.syncResults).toHaveLength(1);
    expect(result.syncResults[0]?.success).toBe(true);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0]?.[0]?.eventType).toBe("platform.entity.created");
  });

  it("publishes async events through the same public API", async () => {
    const handler = vi.fn();
    subscribeToEvents({
      subscriberKey: "test_async_consumer",
      eventTypes: ["platform.workflow.transitioned"],
      dispatchModes: ["async"],
      handler,
    });

    const result = await publishEvent({
      eventType: "platform.workflow.transitioned",
      entityType: "workflow_instance",
      entityId: "wf_1",
      organizationId: "org_1",
    });

    expect(result.dispatchMode).toBe("async");
    expect(result.asyncQueued).toBe(true);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("supports external_webhook scope without delivery", async () => {
    const handler = vi.fn();
    subscribeToEvents({
      subscriberKey: "webhook_stub_consumer",
      eventTypes: ["platform.entity.updated"],
      scopes: ["external_webhook"],
      handler,
    });

    const result = await publishEvent({
      eventType: "platform.entity.updated",
      entityType: "student",
      entityId: "stu_2",
      scope: "external_webhook",
      metadata: { externalWebhookTarget: "https://example.com/hook" },
    });

    expect(result.scope).toBe("external_webhook");
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0]?.[0]?.metadata.externalWebhookTarget).toBe(
      "https://example.com/hook"
    );
  });

  it("records event audit entries", async () => {
    subscribeToEvents({
      subscriberKey: "audit_consumer",
      eventTypes: ["platform.entity.created"],
      handler: vi.fn(),
    });

    const result = await publishEvent({
      eventType: "platform.entity.created",
      entityType: "student",
      entityId: "stu_3",
    });

    const entries = getEventAuditEntries({ eventId: result.eventId });
    expect(entries).toHaveLength(1);
    expect(entries[0]?.envelope.eventId).toBe(result.eventId);
  });

  it("replays audited events to subscribers", async () => {
    const handler = vi.fn();
    subscribeToEvents({
      subscriberKey: "replay_consumer",
      eventTypes: ["platform.entity.created"],
      handler,
    });

    const published = await publishEvent({
      eventType: "platform.entity.created",
      entityType: "student",
      entityId: "stu_4",
    });

    handler.mockClear();

    const replayed = await replayEventById(published.eventId);
    expect(replayed?.replayed).toBe(true);
    expect(handler).toHaveBeenCalledTimes(1);

    const batch = await replayAuditedEvents();
    expect(batch.replayedCount).toBeGreaterThan(0);
  });

  it("previews subscriber routing without dispatching", () => {
    subscribeToEvents({
      subscriberKey: "preview_consumer",
      eventTypes: ["platform.decision.executed"],
      handler: vi.fn(),
    });

    const envelope = buildEventEnvelope({
      eventType: "platform.decision.executed",
      entityType: "decision",
      entityId: "dec_1",
      definitionVersion: 1,
      dispatchMode: "sync",
      scope: "internal",
    });

    const keys = previewEventSubscribers(envelope, "sync", "internal");
    expect(keys).toContain("preview_consumer");
  });

  it("unsubscribes consumers", () => {
    registerEventSubscriber("temp_consumer", vi.fn());
    expect(unsubscribeFromEvents("temp_consumer")).toBe(true);
    expect(unsubscribeFromEvents("temp_consumer")).toBe(false);
  });

  it("rejects unknown event types", async () => {
    await expect(
      publishEvent({
        eventType: "unknown.event",
        entityType: "student",
        entityId: "stu_5",
      })
    ).rejects.toThrow('Unknown event type "unknown.event"');
  });
});
