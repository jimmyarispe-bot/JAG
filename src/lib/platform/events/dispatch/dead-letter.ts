import { getEventBusAnalytics } from "@/lib/platform/events/analytics";
import type {
  DeadLetterRecord,
  PlatformEventEnvelope,
} from "@/lib/platform/events/types";

const DEAD_LETTERS: DeadLetterRecord[] = [];
let sequence = 0;

export function enqueueDeadLetter(input: {
  envelope: PlatformEventEnvelope;
  subscriberKey: string;
  error: string;
  attempts: number;
}): DeadLetterRecord {
  sequence += 1;
  const record: DeadLetterRecord = {
    id: `dlq_${Date.now()}_${sequence}`,
    envelope: input.envelope,
    subscriberKey: input.subscriberKey,
    error: input.error,
    attempts: input.attempts,
    enqueuedAt: new Date().toISOString(),
  };
  DEAD_LETTERS.push(record);
  getEventBusAnalytics().recordDeadLetter();
  return record;
}

export function listDeadLetters(): readonly DeadLetterRecord[] {
  return DEAD_LETTERS;
}

export function clearDeadLetters(): void {
  DEAD_LETTERS.length = 0;
}

export function deadLetterCount(): number {
  return DEAD_LETTERS.length;
}
