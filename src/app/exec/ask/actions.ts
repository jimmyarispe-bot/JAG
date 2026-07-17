"use server";

import { execAskQuestion } from "@/lib/exec/load-ask";
import type { CopilotAskResult, SessionMemory } from "@/lib/platform/copilot";

export async function askJagAction(input: {
  question: string;
  session?: SessionMemory;
  recommendationId?: string;
}): Promise<CopilotAskResult> {
  return execAskQuestion(input);
}
