/**
 * Intent routing for executive natural-language questions.
 */

import type { CopilotIntent } from "../types";

const PATTERNS: Array<{ intent: CopilotIntent; tests: RegExp[] }> = [
  {
    intent: "daily_brief",
    tests: [/daily brief/i, /\bbriefing\b/i, /morning brief/i],
  },
  {
    intent: "prepare_board_meeting",
    tests: [/board meeting/i, /board pack/i, /prepare.*board/i],
  },
  {
    intent: "decision_simulator",
    tests: [
      /what happens if/i,
      /what if/i,
      /raise tuition/i,
      /delay hiring/i,
      /add (a )?new campus/i,
      /reduce expenses/i,
      /increase salaries/i,
      /cut costs/i,
    ],
  },
  {
    intent: "scenario_analysis",
    tests: [/scenario/i, /simulate/i, /stress test/i],
  },
  {
    intent: "compare_options",
    tests: [/compare/i, /versus|vs\.?/i, /\boptions\b/i, /trade-?off/i],
  },
  {
    intent: "show_evidence",
    tests: [/show evidence/i, /\bevidence\b/i, /prove it/i, /how do you know/i],
  },
  {
    intent: "explain_recommendation",
    tests: [/explain/i, /assumptions/i, /calculations/i, /how did (you|jag) (reach|decide)/i],
  },
  {
    intent: "why_not",
    tests: [/why not/i, /why shouldn't/i, /why wouldn't/i],
  },
  {
    intent: "why",
    tests: [/\bwhy\b/i, /what caused/i, /root cause/i],
  },
  {
    intent: "what_changed",
    tests: [/what changed/i, /since yesterday/i, /\bdelta\b/i, /movement/i],
  },
  {
    intent: "summarize_month",
    tests: [/summarize (this )?month/i, /monthly summary/i, /summary (for |of )?this month/i],
  },
  {
    intent: "summarize_week",
    tests: [/summarize (this )?week/i, /weekly summary/i, /summary (for |of )?this week/i],
  },
];

export function routeIntent(question: string, hint?: CopilotIntent): CopilotIntent {
  if (hint) return hint;
  const q = question.trim();
  if (!q) return "daily_brief";
  for (const row of PATTERNS) {
    if (row.tests.some((re) => re.test(q))) return row.intent;
  }
  return "ask_anything";
}

export function isSimulationIntent(intent: CopilotIntent): boolean {
  return intent === "decision_simulator" || intent === "scenario_analysis";
}
