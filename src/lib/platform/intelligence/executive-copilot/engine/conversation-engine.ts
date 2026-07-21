/**
 * Conversation message assembly (Sprint 067).
 */

import type { CopilotMessage } from "@/lib/platform/intelligence/executive-copilot/types";
import type { CopilotIntent } from "@/lib/platform/intelligence/executive-copilot/types";

export class ConversationEngine {
  constructor(
    private readonly createId: (prefix: string) => string,
    private readonly now: () => Date
  ) {}

  appendTurn(input: {
    prior?: CopilotMessage[];
    question: string;
    answer: string;
    intent: CopilotIntent;
  }): CopilotMessage[] {
    const at = this.now().toISOString();
    return [
      ...(input.prior ?? []),
      {
        id: this.createId("msg-user"),
        role: "user",
        content: input.question,
        at,
        intent: input.intent,
      },
      {
        id: this.createId("msg-assistant"),
        role: "assistant",
        content: input.answer,
        at,
        intent: input.intent,
      },
    ];
  }
}
