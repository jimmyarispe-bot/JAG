import type {
  EventHandlerResult,
  EventSubscriberHandler,
  PlatformEventEnvelope,
} from "@/lib/platform/events/types";

export type EventHandler = EventSubscriberHandler;

export type EventHandlerDefinition = {
  key: string;
  handle: EventHandler;
};

export function mapHandlerResult(
  subscriberKey: string,
  dispatchMode: "sync" | "async",
  error?: string
): EventHandlerResult {
  return {
    subscriberKey,
    success: !error,
    dispatchMode,
    error,
  };
}

export async function runEventHandler(
  handler: EventHandler,
  envelope: PlatformEventEnvelope,
  subscriberKey: string,
  dispatchMode: "sync" | "async"
): Promise<EventHandlerResult> {
  try {
    await handler(envelope);
    return mapHandlerResult(subscriberKey, dispatchMode);
  } catch (error) {
    return mapHandlerResult(
      subscriberKey,
      dispatchMode,
      error instanceof Error ? error.message : String(error)
    );
  }
}
