import type { PlatformEventEnvelope } from "@/lib/platform/events/types";

export function serializeEventEnvelope(envelope: PlatformEventEnvelope): string {
  return JSON.stringify(envelope);
}

export function deserializeEventEnvelope(raw: string): PlatformEventEnvelope {
  const parsed = JSON.parse(raw) as PlatformEventEnvelope;
  if (!parsed?.eventId || !parsed?.eventType) {
    throw new Error("Invalid event envelope payload");
  }
  return parsed;
}

export function cloneEventEnvelope(
  envelope: PlatformEventEnvelope
): PlatformEventEnvelope {
  return deserializeEventEnvelope(serializeEventEnvelope(envelope));
}
