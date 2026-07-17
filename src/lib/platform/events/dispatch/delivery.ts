import { getEventBusAnalytics } from "@/lib/platform/events/analytics";
import { enqueueDeadLetter } from "@/lib/platform/events/dispatch/dead-letter";
import type {
  EventHandlerResult,
  PlatformEventEnvelope,
} from "@/lib/platform/events/types";

export type DeliveryRetryOptions = {
  maxAttempts?: number;
  /** Invoked before each retry after the first failure. */
  onRetry?: (attempt: number, error: string) => void;
};

/**
 * Invoke a subscriber with retry; exhausted failures go to the dead-letter queue.
 */
export async function invokeWithRetry(
  envelope: PlatformEventEnvelope,
  subscriberKey: string,
  handler: (envelope: PlatformEventEnvelope) => void | Promise<void>,
  dispatchMode: "sync" | "async",
  options: DeliveryRetryOptions = {}
): Promise<EventHandlerResult> {
  const maxAttempts = Math.max(1, options.maxAttempts ?? 1);
  let lastError = "";

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await handler(envelope);
      getEventBusAnalytics().recordSubscriber(true);
      return { subscriberKey, success: true, dispatchMode };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      getEventBusAnalytics().recordSubscriber(false);
      if (attempt < maxAttempts) {
        getEventBusAnalytics().recordRetry();
        options.onRetry?.(attempt, lastError);
      }
    }
  }

  enqueueDeadLetter({
    envelope,
    subscriberKey,
    error: lastError || "Unknown subscriber failure",
    attempts: maxAttempts,
  });

  return {
    subscriberKey,
    success: false,
    dispatchMode,
    error: lastError || "Unknown subscriber failure",
  };
}
