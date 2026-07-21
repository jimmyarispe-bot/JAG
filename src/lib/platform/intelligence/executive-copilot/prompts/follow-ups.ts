import type {
  CopilotFollowUp,
  CopilotIntent,
} from "@/lib/platform/intelligence/executive-copilot/types";

export function buildFollowUps(
  intent: CopilotIntent,
  createId: (prefix: string) => string
): CopilotFollowUp[] {
  const catalog: Record<CopilotIntent, Array<{ prompt: string; intent: CopilotIntent }>> = {
    explain: [
      { prompt: "What changed since last week's briefing?", intent: "summarize" },
      { prompt: "Investigate the top risk in more depth", intent: "investigate" },
    ],
    summarize: [
      { prompt: "What are the three biggest risks over the next 90 days?", intent: "forecast" },
      { prompt: "Which recommendation has the highest expected ROI?", intent: "recommend" },
    ],
    compare: [
      { prompt: "What happens if we choose the second option?", intent: "forecast" },
      { prompt: "Prepare an execution plan for the top option", intent: "plan" },
    ],
    investigate: [
      { prompt: "Compare the top two recommendations", intent: "compare" },
      { prompt: "What did we decide last time this happened?", intent: "recall" },
    ],
    forecast: [
      { prompt: "What happens if we delay hiring by 60 days?", intent: "forecast" },
      { prompt: "Recommend the highest-ROI response", intent: "recommend" },
    ],
    recommend: [
      { prompt: "Prepare for tomorrow's board meeting", intent: "plan" },
      { prompt: "Show approval requirements for this recommendation", intent: "plan" },
    ],
    recall: [
      { prompt: "How has this risk evolved?", intent: "investigate" },
      { prompt: "Summarize current briefing vs that decision", intent: "summarize" },
    ],
    plan: [
      { prompt: "Which recommendation has the highest expected ROI?", intent: "recommend" },
      { prompt: "What are the three biggest risks over the next 90 days?", intent: "forecast" },
    ],
  };

  return (catalog[intent] ?? catalog.explain).map((item) => ({
    id: createId("follow"),
    prompt: item.prompt,
    intent: item.intent,
  }));
}
