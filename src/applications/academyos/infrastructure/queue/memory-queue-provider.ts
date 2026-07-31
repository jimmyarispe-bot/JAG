import type {
  QueueMessage,
  QueueProvider,
} from "@/applications/academyos/infrastructure/queue/types";

export function createMemoryQueueProvider(): QueueProvider {
  const messages = new Map<string, QueueMessage>();
  const deadLetters = new Map<string, { message: QueueMessage; reason: string }>();
  let seq = 0;

  return {
    id: "memory",
    async enqueue(input) {
      seq += 1;
      const availableAt = new Date(
        Date.now() + (input.delaySeconds ?? 0) * 1000
      ).toISOString();
      const message: QueueMessage = {
        id: `q_${seq}`,
        topic: input.topic,
        payload: { ...input.payload },
        attempts: 0,
        availableAt,
      };
      messages.set(message.id, message);
      return { ...message, payload: { ...message.payload } };
    },
    async retry(input) {
      const existing = messages.get(input.messageId);
      if (!existing) return null;
      const next: QueueMessage = {
        ...existing,
        attempts: existing.attempts + 1,
        availableAt: new Date(
          Date.now() + (input.delaySeconds ?? 5) * 1000
        ).toISOString(),
      };
      messages.set(next.id, next);
      return { ...next, payload: { ...next.payload } };
    },
    async deadLetter(messageId, reason) {
      const existing = messages.get(messageId);
      if (!existing) return false;
      deadLetters.set(messageId, { message: existing, reason });
      messages.delete(messageId);
      return true;
    },
    async drain(topic) {
      const rows = [...messages.values()].filter((m) => m.topic === topic);
      for (const row of rows) messages.delete(row.id);
      return rows.map((m) => ({ ...m, payload: { ...m.payload } }));
    },
  };
}
