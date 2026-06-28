import { dispatchAutomationTrigger } from "@/lib/platform/automation/execution/execute";
import { getTriggerDefinitionsByType } from "@/lib/platform/automation/registry/trigger-registry";
import type { PlatformEventEnvelope } from "@/lib/platform/events/types";

const AUTOMATION_EVENT_SUBSCRIBER_KEY = "platform_automation_event_router";

/** Bridge Platform Events to automation event triggers. */
export function createAutomationEventSubscriberHandler() {
  return async (envelope: PlatformEventEnvelope): Promise<void> => {
    const eventTriggers = getTriggerDefinitionsByType("event").filter(
      (trigger) => trigger.eventType === envelope.eventType
    );

    for (const trigger of eventTriggers) {
      await dispatchAutomationTrigger({
        triggerKey: trigger.triggerKey,
        triggerType: "event",
        organizationId: envelope.organizationId,
        schoolId: envelope.schoolId,
        actorId: envelope.actorId,
        entityType: envelope.entityType,
        entityId: envelope.entityId,
        facts: { eventType: envelope.eventType },
        payload: envelope.payload,
        metadata: { eventId: envelope.eventId, correlationId: envelope.correlationId },
      });
    }
  };
}

export function getAutomationEventSubscriberKey(): string {
  return AUTOMATION_EVENT_SUBSCRIBER_KEY;
}
