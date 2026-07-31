export type QueueMessage = {
  id: string;
  topic: string;
  payload: Record<string, unknown>;
  attempts: number;
  availableAt: string;
};

export type QueueProvider = {
  readonly id: "memory";
  enqueue(input: {
    topic: string;
    payload: Record<string, unknown>;
    delaySeconds?: number;
  }): Promise<QueueMessage>;
  /** Move failed message toward retry / dead-letter. */
  retry(input: {
    messageId: string;
    delaySeconds?: number;
  }): Promise<QueueMessage | null>;
  deadLetter(messageId: string, reason: string): Promise<boolean>;
  /** Test/ops helper — not for application workflow logic. */
  drain?(topic: string): Promise<QueueMessage[]>;
};
