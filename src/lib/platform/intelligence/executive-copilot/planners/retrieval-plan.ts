/**
 * Which domains to retrieve for a question (Sprint 067).
 */

import type {
  CopilotDomainKey,
  CopilotIntent,
  DomainTraceEntry,
} from "@/lib/platform/intelligence/executive-copilot/types";

const INTENT_DOMAINS: Record<CopilotIntent, CopilotDomainKey[]> = {
  explain: ["synthesis", "briefing", "executive-memory", "decision-intelligence", "executive-predictive"],
  summarize: ["briefing", "synthesis", "decision-intelligence", "executive-predictive"],
  compare: ["decision-intelligence", "executive-predictive"],
  investigate: [
    "synthesis",
    "briefing",
    "executive-memory",
    "decision-intelligence",
    "executive-predictive",
  ],
  forecast: ["executive-predictive", "briefing", "decision-intelligence"],
  recommend: ["decision-intelligence", "executive-predictive", "executive-autonomous"],
  recall: ["executive-memory", "briefing"],
  plan: [
    "briefing",
    "decision-intelligence",
    "executive-predictive",
    "executive-autonomous",
    "executive-memory",
  ],
};

export function planRetrieval(intent: CopilotIntent): DomainTraceEntry[] {
  const domains = INTENT_DOMAINS[intent];
  return domains.map((domain) => ({
    domain,
    reason: `Intent "${intent}" requires ${domain}`,
    used: true,
  }));
}

export function detectIntent(question: string): CopilotIntent {
  const q = question.toLowerCase();
  if (/board meeting|prepare for|agenda|pending approval/i.test(q)) return "plan";
  if (/investigate|root cause|why.*(declin|fall|drop)/i.test(q)) return "investigate";
  if (/forecast|next \d+ days|what happens if|delay|90 days|scenario/i.test(q)) return "forecast";
  if (/recommend|highest.*(roi|impact)|which recommendation/i.test(q)) return "recommend";
  if (/compare|vs\.?|versus|compare.*(option|school|quarter)/i.test(q)) return "compare";
  if (/last year|what did we decide|why was .* started|how has .* evolved|recall/i.test(q)) {
    return "recall";
  }
  if (/summar|overview|what changed|brief/i.test(q)) return "summarize";
  if (/why|explain|what caused/i.test(q)) return "explain";
  return "explain";
}
