import type { CopilotV2Intent } from "@/lib/platform/executive-copilot/types";

/**
 * RC-5 intents. Kept distinct from Sprint 067 phrasing where possible
 * so the conversational orchestrator can dual-route safely.
 */
export function detectCopilotV2Intent(question: string): CopilotV2Intent {
  const q = question.toLowerCase();

  if (/revenue.*(declin|fall|drop)|why is revenue|pipeline.*(weak|declin)/i.test(q)) {
    return "revenue_decline";
  }
  if (
    /department.*(disconnect|silo|isolated)|which departments|disconnected/i.test(q)
  ) {
    return "disconnected_departments";
  }
  if (
    /initiative|everything affecting|impacting initiative|summarize.*affecting/i.test(q)
  ) {
    return "initiative_impact";
  }
  if (/decision maker|key decision makers|who are the key decision/i.test(q)) {
    return "decision_makers";
  }
  if (
    /organizational risk|risks this month|show.*risks|org(anizational)? risks/i.test(q)
  ) {
    return "organizational_risks";
  }
  if (/board package|board prep\b|prepare.*board package/i.test(q)) {
    return "board_prep";
  }
  if (/digital twin|twin (scenario|simulat|runway)/i.test(q)) {
    return "digital_twin";
  }
  if (/\btimeline\b|chronolog|over time in the (org|graph)/i.test(q)) {
    return "timeline";
  }
  if (/institutional memory|lesson learned|memory reasoning/i.test(q)) {
    return "memory";
  }
  if (/\broot cause\b|what caused revenue/i.test(q)) {
    return "root_cause";
  }
  if (/executive narrative|tell the (org|executive) story/i.test(q)) {
    return "narrative";
  }
  if (/across domains|cross.?domain|holistic|whole organization/i.test(q)) {
    return "cross_domain";
  }
  return "general_investigate";
}

/** Intents that should take the RC-5 soft-read path from Sprint 067 orchestrator. */
export const COPILOT_V2_ROUTED_INTENTS: ReadonlySet<CopilotV2Intent> = new Set([
  "revenue_decline",
  "disconnected_departments",
  "initiative_impact",
  "decision_makers",
  "organizational_risks",
  "board_prep",
  "digital_twin",
  "timeline",
  "memory",
  "root_cause",
  "narrative",
  "cross_domain",
]);

export function shouldRouteToCopilotV2(question: string): boolean {
  const intent = detectCopilotV2Intent(question);
  return COPILOT_V2_ROUTED_INTENTS.has(intent);
}
