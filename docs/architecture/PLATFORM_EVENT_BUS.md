# Platform Event Bus (Sprint 024)

| Field | Value |
|-------|--------|
| **Document** | Platform Event Bus & Messaging |
| **Module** | `@/lib/platform/events` |
| **Status** | Canonical platform capability |

---

## Purpose

Product-agnostic event-driven messaging for every application, intelligence engine, AI agent, connector, workflow, and marketplace extension.

```text
Application → publish() → Platform Event Bus → Subscribers
```

Applications must not couple directly when an event is appropriate.

---

## Structure

```text
events/
  core/           Event model, categories, createPlatformEventBus()
  publishers/     publish / publishMany / schedule / cancel
  subscribers/    subscribe / unsubscribe / once / priority / filters
  handlers/       Handler helpers
  registry/       Discovery, versioning, categories, deprecation
  schemas/        Category reference definitions
  serialization/  Envelope JSON codec
  persistence/    Event store (existing + extended filters)
  replay/         Org / app / type / time replay
  analytics/      Observability metrics
  security/       Org isolation, permission port, audit metadata
  dispatch/       Immediate / queued / retry / DLQ
```

---

## Quick start

```ts
import {
  createPlatformEventBus,
  resetPlatformEventBusRuntime,
} from "@/lib/platform/events";

const bus = createPlatformEventBus({ maxRetryAttempts: 2 });

bus.subscribe(
  async (envelope) => {
    /* react */
  },
  { eventTypes: ["connector.sync.completed"], priority: 10 }
);

await bus.publish({
  eventType: "connector.sync.completed",
  entityType: "connector_instance",
  entityId: "inst-1",
  organizationId: "org-1",
  requestId: "req-1",
  correlationId: "corr-1",
});
```

Legacy APIs remain: `publishEvent`, `subscribeToEvents`, `PlatformEventEnvelope`.

---

## Categories

`identity` · `organization` · `security` · `audit` · `workflow` · `billing` · `knowledge_graph` · `executive_graph` · `ai` · `marketplace` · `connector` · `application`

---

## Delivery

| Mode | Behavior |
|------|----------|
| immediate | Sync dispatch |
| queued | Async queue + flush |
| scheduled | `schedule` / `cancel` / `flushDue` |
| retry | Configurable attempts → dead-letter |

---

## Security

Every publish supports organization isolation, optional permission validation, audit metadata, correlation IDs, and request IDs.

---

## Tests

```bash
npx vitest run tests/unit/events tests/integration/platform-events.test.ts
```
